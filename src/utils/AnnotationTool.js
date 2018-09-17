
import {Annotate} from "./Annotate.js";
import {Utils} from "../utils.js";
import {CameraMode} from "../defines.js";
import {EventDispatcher} from "../EventDispatcher.js";
import {DBConnection} from "../../database/connection.js";

export class AnnotationTool extends EventDispatcher{
	constructor (viewer) {
		super();

		this.viewer = viewer;
		this.renderer = viewer.renderer;

		this.addEventListener('start_inserting_annotation', e => {
			this.viewer.dispatchEvent({
				type: 'cancel_insertions'
			});
		});

		this.scene = new THREE.Scene();
		this.scene.name = 'scene_annotation';
		this.light = new THREE.PointLight(0xffffff, 1.0);
		this.scene.add(this.light);

		this.viewer.inputHandler.registerInteractiveScene(this.scene);

		this.onRemove = (e) => { this.scene.remove(e.annotation);};
		this.onAdd = e => {this.scene.add(e.annotation);};

		for(let annotation of viewer.scene.annotations){
			this.onAdd({annotation: annotation});
		}

		viewer.addEventListener("update", this.update.bind(this));
		viewer.addEventListener("render.pass.perspective_overlay", this.render.bind(this));
		viewer.addEventListener("scene_changed", this.onSceneChange.bind(this));

		viewer.scene.addEventListener('annotation_added', this.onAdd);
		viewer.scene.addEventListener('annotation_removed', this.onRemove);
	}

	onSceneChange(e){
		if(e.oldScene){
			e.oldScene.removeEventListener('annotation_added', this.onAdd);
			e.oldScene.removeEventListener('annotation_removed', this.onRemove);
		}

		e.scene.addEventListener('annotation_added', this.onAdd);
		e.scene.addEventListener('annotation_removed', this.onRemove);
	}

	startInsertion (args = {}) {
		let domElement = this.viewer.renderer.domElement;

		let annotate = new Annotate();

		this.dispatchEvent({
			type: 'start_inserting_annotation',
			annotate: annotate
		});

		annotate.showDistances = (args.showDistances === null) ? true : args.showDistances;
		annotate.showArea = args.showArea || false;
		annotate.showAngles = args.showAngles || false;
		annotate.showCoordinates = args.showCoordinates || false;
		annotate.showHeight = args.showHeight || false;
		annotate.closed = args.closed || false;
		annotate.maxMarkers = args.maxMarkers || Infinity;
		annotate.name = args.name || 'Annotation';

		this.scene.add(annotate);

		let cancel = {
			removeLastMarker: annotate.maxMarkers > 3,
			callback: null
		};

		let insertionCallback = (e) => {
			if (e.button === THREE.MOUSE.LEFT) {
				annotate.addMarker(annotate.points[annotate.points.length - 1].position.clone());

				if (annotate.points.length >= annotate.maxMarkers) {
					cancel.callback();
				}

				this.viewer.inputHandler.startDragging(
					annotate.spheres[annotate.spheres.length - 1]);
			} else if (e.button === THREE.MOUSE.RIGHT) {
				cancel.callback();
			}
		};

		let pointDropCallback = (e) => {
			if (e.button === THREE.MOUSE.LEFT) {
				var position = annotate.spheres[annotate.spheres.length - 1].position;
				DBConnection.savePoint(position);
				cancel.callback();
			}
		};

		cancel.callback = e => {
			if (cancel.removeLastMarker) {
				annotate.removeMarker(annotate.points.length - 1);
			}
			domElement.removeEventListener('mouseup', insertionCallback, true);
			this.viewer.removeEventListener('cancel_insertions', cancel.callback);
			domElement.removeEventListener('mouseup', pointDropCallback, true);
		};

		if (annotate.maxMarkers > 1) {
			this.viewer.addEventListener('cancel_insertions', cancel.callback);
			domElement.addEventListener('mouseup', insertionCallback, true);
		}

		if (annotate.maxMarkers == 1) {
			domElement.addEventListener('mouseup', pointDropCallback, true);
		}

		annotate.addMarker(new THREE.Vector3(0, 0, 0));
		this.viewer.inputHandler.startDragging(
			annotate.spheres[annotate.spheres.length - 1]);

		this.viewer.scene.addAnnotation(annotate);

		return annotate;
	}

	update(){
		let camera = this.viewer.scene.getActiveCamera();
		let domElement = this.renderer.domElement;
		let annotations = this.viewer.scene.annotations;

		let clientWidth = this.renderer.getSize().width;
		let clientHeight = this.renderer.getSize().height;

		this.light.position.copy(camera.position);

		// make size independant of distance
		for (let annotate of annotations) {
			annotate.lengthUnit = this.viewer.lengthUnit;
			annotate.update();

			// spheres
			for(let sphere of annotate.spheres){
				let distance = camera.position.distanceTo(sphere.getWorldPosition(new THREE.Vector3()));
				let pr = Utils.projectedRadius(1, camera, distance, clientWidth, clientHeight);
				let scale = (15 / pr);
				sphere.scale.set(scale, scale, scale);
			}

			// labels
			let labels = annotate.edgeLabels.concat(annotate.angleLabels);
			for(let label of labels){
				let distance = camera.position.distanceTo(label.getWorldPosition(new THREE.Vector3()));
				let pr = Utils.projectedRadius(1, camera, distance, clientWidth, clientHeight);
				let scale = (70 / pr);
				label.scale.set(scale, scale, scale);
			}

			// coordinate labels
			for (let j = 0; j < annotate.coordinateLabels.length; j++) {
				let label = annotate.coordinateLabels[j];
				let sphere = annotate.spheres[j];
				// annotate.points[j]

				let distance = camera.position.distanceTo(sphere.getWorldPosition(new THREE.Vector3()));

				let screenPos = sphere.getWorldPosition(new THREE.Vector3()).clone().project(camera);
				screenPos.x = Math.round((screenPos.x + 1) * clientWidth / 2);
				screenPos.y = Math.round((-screenPos.y + 1) * clientHeight / 2);
				screenPos.z = 0;
				screenPos.y -= 30;

				let labelPos = new THREE.Vector3(
					(screenPos.x / clientWidth) * 2 - 1,
					-(screenPos.y / clientHeight) * 2 + 1,
					0.5 );
				labelPos.unproject(camera);
				if(this.viewer.scene.cameraMode == CameraMode.PERSPECTIVE) {
					let direction = labelPos.sub(camera.position).normalize();
					labelPos = new THREE.Vector3().addVectors(
						camera.position, direction.multiplyScalar(distance));

				}
				label.position.copy(labelPos);
				let pr = Utils.projectedRadius(1, camera, distance, clientWidth, clientHeight);
				let scale = (70 / pr);
				label.scale.set(scale, scale, scale);
			}

			// height label
			if (annotate.showHeight) {
				let label = annotate.heightLabel;

				{
					let distance = label.position.distanceTo(camera.position);
					let pr = Utils.projectedRadius(1, camera, distance, clientWidth, clientHeight);
					let scale = (70 / pr);
					label.scale.set(scale, scale, scale);
				}

				{ // height edge
					let edge = annotate.heightEdge;
					let lowpoint = edge.geometry.vertices[0].clone().add(edge.position);
					let start = edge.geometry.vertices[2].clone().add(edge.position);
					let end = edge.geometry.vertices[3].clone().add(edge.position);

					let lowScreen = lowpoint.clone().project(camera);
					let startScreen = start.clone().project(camera);
					let endScreen = end.clone().project(camera);

					let toPixelCoordinates = v => {
						let r = v.clone().addScalar(1).divideScalar(2);
						r.x = r.x * clientWidth;
						r.y = r.y * clientHeight;
						r.z = 0;

						return r;
					};

					let lowEL = toPixelCoordinates(lowScreen);
					let startEL = toPixelCoordinates(startScreen);
					let endEL = toPixelCoordinates(endScreen);

					let lToS = lowEL.distanceTo(startEL);
					let sToE = startEL.distanceTo(endEL);

					edge.geometry.lineDistances = [0, lToS, lToS, lToS + sToE];
					edge.geometry.lineDistancesNeedUpdate = true;

					edge.material.dashSize = 10;
					edge.material.gapSize = 10;
				}
			}

			{ // area label
				let label = annotate.areaLabel;
				let distance = label.position.distanceTo(camera.position);
				let pr = Utils.projectedRadius(1, camera, distance, clientWidth, clientHeight);

				let scale = (70 / pr);
				label.scale.set(scale, scale, scale);
			}
		}
	}

	render(){
		this.viewer.renderer.render(this.scene, this.viewer.scene.getActiveCamera());
	}
};
