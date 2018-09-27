

import {Volume, BoxVolume} from "./Volume.js";
import {Utils} from "../utils.js";
import { EventDispatcher } from "../EventDispatcher.js";

export class VolumeTool extends EventDispatcher{
	constructor (viewer) {
		super();

		this.viewer = viewer;
		this.renderer = viewer.renderer;

		this.viewer.scene.addEventListener('display_saved_volume', e => {
			let item = this.startInsertion({
				clip: true,
				volume: {
					id: e.volume.id,
					scale: {
						x: e.volume.scale_x,
						y: e.volume.scale_y,
						z: e.volume.scale_z
					},
					position: {
						x: e.volume.position_x,
						y: e.volume.position_y,
						z: e.volume.position_z
					},
					rotation: {
						x: e.volume.rotation_x,
						y: e.volume.rotation_y,
						z: e.volume.rotation_z
					},
					material_id: e.volume.material_id
				}
			});
		});

		this.addEventListener('start_inserting_volume', e => {
			this.viewer.dispatchEvent({
				type: 'cancel_insertions'
			});
		});

		this.scene = new THREE.Scene();
		this.scene.name = 'scene_volume';

		this.viewer.inputHandler.registerInteractiveScene(this.scene);

		this.onRemove = e => {
			this.scene.remove(e.volume);
		};

		this.onAdd = e => {
			this.scene.add(e.volume);
		};

		for(let volume of viewer.scene.volumes){
			this.onAdd({volume: volume});
		}

		this.viewer.inputHandler.addEventListener('delete', e => {
			let volumes = e.selection.filter(e => (e instanceof Volume));
			volumes.forEach(e => this.viewer.scene.removeVolume(e));
		});

		viewer.addEventListener("update", this.update.bind(this));
		viewer.addEventListener("render.pass.scene", e => this.render(e));
		viewer.addEventListener("scene_changed", this.onSceneChange.bind(this));

		viewer.scene.addEventListener('volume_added', this.onAdd);
		viewer.scene.addEventListener('volume_removed', this.onRemove);
	}

	onSceneChange(e){
		if(e.oldScene){
			e.oldScene.removeEventListeners('volume_added', this.onAdd);
			e.oldScene.removeEventListeners('volume_removed', this.onRemove);
		}

		e.scene.addEventListener('volume_added', this.onAdd);
		e.scene.addEventListener('volume_removed', this.onRemove);
	}

	startInsertion (args = {}) {
		let volume;
		let startDrag = true;
		if(args.type){
			volume = new args.type();
		}else{
			volume = new BoxVolume();
		}

		if(args.volume){
			startDrag = false;
			volume.uuid = args.volume.id;
			volume.scale.x = args.volume.scale.x * 1;
			volume.scale.y = args.volume.scale.y * 1;
			volume.scale.z = args.volume.scale.z * 1;
			volume.rotation.x = args.volume.rotation.x * 1;
			volume.rotation.y = args.volume.rotation.y * 1;
			volume.rotation.z = args.volume.rotation.z * 1;
			volume.position.x = args.volume.position.x * 1;
			volume.position.y = args.volume.position.y * 1;
			volume.position.z = args.volume.position.z * 1;
			volume.material_id = args.volume.material_id * 1;
		}

		volume.clip = args.clip || false;
		volume.name = args.name || 'Volume';

		this.dispatchEvent({
			type: 'start_inserting_volume',
			volume: volume
		});

		this.viewer.scene.addVolume(volume);
		this.scene.add(volume);

		let cancel = {
			callback: null
		};

		let drag = e => {
			updateInfo(e);
			let camera = this.viewer.scene.getActiveCamera();
			let I = Utils.getMousePointCloudIntersection(
				e.drag.end,
				this.viewer.scene.getActiveCamera(),
				this.viewer,
				this.viewer.scene.pointclouds,
				{pickClipped: false});

			if (I) {
				volume.position.copy(I.location);  //exact middle of volume cube
				let wp = volume.getWorldPosition(new THREE.Vector3()).applyMatrix4(camera.matrixWorldInverse);
				// let pp = new THREE.Vector4(wp.x, wp.y, wp.z).applyMatrix4(camera.projectionMatrix);
				let w = Math.abs((wp.z / 5));
				volume.scale.set(w, w, w);
			}
		};

		let drop = e => {
			volume.removeEventListener('drag', drag);
			volume.removeEventListener('drop', drop);

			cancel.callback();
		};

		cancel.callback = e => {
			volume.removeEventListener('drag', drag);
			volume.removeEventListener('drop', drop);
			this.viewer.removeEventListener('cancel_insertions', cancel.callback);
		};

		let updateInfo = (e) => {
			this.viewer.onVolumeUpdated(e);
		}

		let select = (e) => {
			this.viewer.onVolumeSelected(e);
		}

		let deselect = (e) => {
			this.viewer.onVolumeDeselected(e);
		}

		volume.addEventListener('drag', drag);
		volume.addEventListener('drop', drop);
		volume.addEventListener('select', select);
		volume.addEventListener('deselect', deselect);
		volume.addEventListener('scale_changed', updateInfo);
		volume.addEventListener('position_changed', updateInfo);
		volume.addEventListener('orientation_changed', updateInfo);
		volume.addEventListener('clip_changed', updateInfo);

		this.viewer.addEventListener('cancel_insertions', cancel.callback);

		if(startDrag){
			this.viewer.inputHandler.startDragging(volume);
		}

		return volume;
	}

	update(){
		if (!this.viewer.scene) {
			return;
		}

		let camera = this.viewer.scene.getActiveCamera();
		let clientWidth = this.viewer.renderer.getSize().width;
		let clientHeight = this.viewer.renderer.getSize().height;

		let volumes = this.viewer.scene.volumes;
		for (let volume of volumes) {
			let label = volume.label;

			{

				let distance = label.position.distanceTo(camera.position);
				let pr = Utils.projectedRadius(1, camera, distance, clientWidth, clientHeight);

				let scale = (70 / pr);
				label.scale.set(scale, scale, scale);
			}

			let text = Utils.addCommas(volume.getVolume().toFixed(3)) + '\u00B3';
			label.setText(text);
		}
	}

	render(params){
		this.viewer.renderer.render(this.scene, this.viewer.scene.getActiveCamera(), params.renderTarget);
	}

}
