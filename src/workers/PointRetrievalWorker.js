onmessage = function(e) {
  console.log('data');
  console.log(e.data[0]);
  console.log(e.data[0]['node']);

  self.close();
}

let getAllGeometryNodes = function(root) {
  var queue = [];
  var results = [];
  var nextNode;
  queue.push({
    "depth": 0,
    "node" : root
  });
  while (queue.length > 0) {
    nextNode = queue.shift();
    if (nextNode.node.children.length > 0 || nextNode.node.hasChildren) {
      for (var i = 0; i < 8; i ++) {
        if(nextNode.node.children[i] != undefined){
          queue.push({
            "depth": nextNode.depth + 1,
            "node" : nextNode.node.children[i]
          });
        }
      }
    }
    if(nextNode.node.constructor.name === 'PointCloudOctreeNode') {
      results.push(nextNode.node.geometryNode);
    }
    else if(nextNode.node.constructor.name === 'PointCloudOctreeGeometryNode'){
      results.push(nextNode.node);
    }
  }
  return results;
};

let getAllPoints = function(geometryNodes){
  let points = [];
  for (var i = 0; i < geometryNodes.length; i++) {
    let geometry = geometryNodes[i].geometry;
    if(geometry != null){
      if(geometry.attributes != null){
        let array = geometryNodes[i].geometry.attributes.position.array;
        for (var i = 0; i < array.count; i++) {
          if(-1 >= array[i] && array[i] <= 1) {
            if(-2 >= array[i+1] && array[i+1] <= -1) {
              if(4 >= array[i+2] && array[i+2] <= 5) {

              }
            }
          }
          points.push([array[i],array[i+1],array[i+2]]);
        }
      }
    }
  }
}


//let geometryNodes = this.getAllGeometryNodes(node);
//let result = this.getAllPoints(geometryNodes)
