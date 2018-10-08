import {Points} from "./Points";

export class DownloadRequest {
  constructor(pointcloud, box, maxDepth, callback) {
    this.pointcloud = pointcloud;
    this.box = box;
    this.maxDepth = maxDepth || Number.MAX_VALUE;
    this.callback = callback;
    this.temporaryResult = new Points();
    this.pointsServed = 0;
    this.highestLevelServed = 0;
    this.priorityQueue = new BinaryHeap(function(x) { return 1 / x.weight });

    this.initialize();
  }

  nodeIntersectsBox(node, box) {

    let bbWorld = node.boundingBox.clone().applyMatrix4(this.pointcloud.matrixWorld);

    return bbWorld.intersectsBox(box);
  }

  initialize() {
    this.priorityQueue.push({
      node: this.pointcloud.pcoGeometry.root,
      weight: Infinity
    });
  }

  // traverse the node and add intersecting descendants to queue
  traverse(node) {
    let stack = [];
    for (let i = 0; i < 8; i++) {
      let child = node.children[i];
      if (child && this.nodeIntersectsBox(child, this.box)) {
        stack.push(child);
      }
    }

    while (stack.length > 0) {
      let node = stack.pop();
      let weight = node.boundingSphere.radius;

      this.priorityQueue.push({
        node: node,
        weight: weight
      });

      // add children that intersect the cutting plane
      if (node.level < this.maxDepth) {
        for (let i = 0; i < 8; i++) {
          let child = node.children[i];
          if (child && this.nodeIntersectsBox(child, this.box)) {
            stack.push(child);
          }
        }
      }
    }
  }

  update() {
    if (!this.updateGeneratorInstance) {
      this.updateGeneratorInstance = this.updateGenerator();
    }

    let result = this.updateGeneratorInstance.next();
    if (result.done) {
      this.updateGeneratorInstance = null;
    }
  }

  * updateGenerator() {
    // load nodes in queue
    // if hierarchy expands, also load nodes from expanded hierarchy
    // once loaded, add data to this.points and remove node from queue
    // only evaluate 1-50 nodes per frame to maintain responsiveness

    let start = performance.now();

    let maxNodesPerUpdate = 1;
    let intersectedNodes = [];

    for (let i = 0; i < Math.min(maxNodesPerUpdate, this.priorityQueue.size()); i++) {
      let element = this.priorityQueue.pop();
      let node = element.node;

      if (node.level > this.maxDepth) {
        continue;
      }

      if (node.loaded) {
        // add points to result
        intersectedNodes.push(node);
        exports.lru.touch(node);
        this.highestLevelServed = Math.max(node.getLevel(), this.highestLevelServed);

        let doTraverse = (node.level % node.pcoGeometry.hierarchyStepSize) === 0 && node.hasChildren;
        doTraverse = doTraverse || node.getLevel() === 0;
        if (doTraverse) {
          this.traverse(node);
        }
      } else {
        node.load();
        this.priorityQueue.push(element);
      }
    }

    if (intersectedNodes.length > 0) {

      for (let done of this.getPointsInsideBox(intersectedNodes, this.temporaryResult)) {
        if (!done) {
          //console.log("updateGenerator yields");
          yield false;
        }
      }
      if (this.temporaryResult.numPoints > 100) {
        this.pointsServed += this.temporaryResult.numPoints;
        this.callback.onProgress({
          request: this,
          points: this.temporaryResult
        });
        this.temporaryResult = new Points();
      }
    }

    if (this.priorityQueue.size() === 0) {
      // we're done! inform callback and remove from pending requests

      if (this.temporaryResult.numPoints > 0) {
        this.pointsServed += this.temporaryResult.numPoints;
        this.callback.onProgress({
          request: this,
          points: this.temporaryResult
        });
        this.temporaryResult = new Points();
      }

      this.callback.onFinish({
        request: this
      });

      let index = this.pointcloud.downloadRequests.indexOf(this);
      if (index >= 0) {
        this.pointcloud.downloadRequests.splice(index, 1);
      }
    }

    yield true;
  }


  * getAccepted(numPoints, node, matrix, points) {
    let checkpoint = performance.now();

    let accepted = new Uint32Array(numPoints);
    let acceptedPositions = new Float32Array(numPoints * 3);
    let numAccepted = 0;

    let pos = new THREE.Vector3();
    let svp = new THREE.Vector3();

    let view = new Float32Array(node.geometry.attributes.position.array);

    for (let i = 0; i < numPoints; i++) {

      pos.set(
        view[i * 3 + 0],
        view[i * 3 + 1],
        view[i * 3 + 2]);

      pos.applyMatrix4(matrix);

      if (this.box.containsPoint(pos)) {

        accepted[numAccepted] = i;
        points.boundingBox.expandByPoint(pos);


        acceptedPositions[3 * numAccepted + 0] = pos.x;
        acceptedPositions[3 * numAccepted + 1] = pos.y;
        acceptedPositions[3 * numAccepted + 2] = pos.z;

        numAccepted++;
      }

      if ((i % 1000) === 0) {
        let duration = performance.now() - checkpoint;
        if (duration > 4) {
          //console.log(`getAccepted yield after ${duration}ms`);
          yield false;
          checkpoint = performance.now();
        }
      }
    }

    accepted = accepted.subarray(0, numAccepted);
    acceptedPositions = acceptedPositions.subarray(0, numAccepted * 3);

    //let end = performance.now();
    //let duration = end - start;
    //console.log("accepted duration ", duration)

    //console.log(`getAccepted finished`);

    yield [accepted, acceptedPositions];
  }

  * getPointsInsideBox(nodes, target) {
    let checkpoint = performance.now();

    for (let node of nodes) {
      let numPoints = node.numPoints;
      let geometry = node.geometry;

      if (!numPoints) {
        continue;
      }

      { // skip if current node doesn't intersect current box
        let intersects = this.nodeIntersectsBox(node, this.box);

        if (!intersects) {
          continue;
        }
      }

      let points = new Points();

      let nodeMatrix = new THREE.Matrix4().makeTranslation(...node.boundingBox.min.toArray());

      let matrix = new THREE.Matrix4().multiplyMatrices(
        this.pointcloud.matrixWorld, nodeMatrix);

      let accepted = null;
      let acceptedPositions = null;
      for (let result of this.getAccepted(numPoints, node, matrix, points)) {
        if (!result) {
          let duration = performance.now() - checkpoint;
          //console.log(`getPointsInsideProfile yield after ${duration}ms`);
          yield false;
          checkpoint = performance.now();
        } else {
          [accepted, acceptedPositions] = result;
        }
      }

      let duration = performance.now() - checkpoint;
      if (duration > 4) {
        //console.log(`getPointsInsideProfile yield after ${duration}ms`);
        yield false;
        checkpoint = performance.now();
      }

      points.data.position = acceptedPositions;

      let relevantAttributes = Object.keys(geometry.attributes).filter(a => !["position", "indices"].includes(a));
      for (let attributeName of relevantAttributes) {

        let attribute = geometry.attributes[attributeName];
        let numElements = attribute.array.length / numPoints;

        if (numElements !== parseInt(numElements)) {
          debugger;
        }

        let Type = attribute.array.constructor;

        let filteredBuffer = new Type(numElements * accepted.length);

        let source = attribute.array;
        let target = filteredBuffer;

        for (let i = 0; i < accepted.length; i++) {

          let index = accepted[i];

          let start = index * numElements;
          let end = start + numElements;
          let sub = source.subarray(start, end);

          target.set(sub, i * numElements);
        }

        points.data[attributeName] = filteredBuffer;
      }

      points.numPoints = accepted.length;

      target.add(points);
    }

    //console.log(`getPointsInsideProfile finished`);
    yield true;
  }

  finishLevelThenCancel() {
    if (this.cancelRequested) {
      return;
    }

    this.maxDepth = this.highestLevelServed;
    this.cancelRequested = true;

    //console.log(`maxDepth: ${this.maxDepth}`);
  }

  cancel() {
    this.callback.onCancel();

    this.priorityQueue = new BinaryHeap(function(x) {
      return 1 / x.weight;
    });

    let index = this.pointcloud.profileRequests.indexOf(this);
    if (index >= 0) {
      this.pointcloud.profileRequests.splice(index, 1);
    }
  }
}
