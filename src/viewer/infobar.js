import {DBConnection} from "../../database/connection.js";
import {ElementMaterial} from "../defines.js";
import {PointCloudOctreeNode} from "../PointCloudOctree.js";
import {Points} from "../Points";
import {LASExporter} from "../exporter/LASExporter.js";
import {CSVExporter} from "../exporter/CSVExporter.js";

export class Infobar {

  constructor(viewer) {
    let self = this;
    this.viewer = viewer;
    this.connection = new DBConnection();

    this.valueIsAccepted = function(value, type = '') {
      if ($.isNumeric(value)) {
        switch (type) {
          case 'rotation':
            return (value <= Math.PI && value >= Math.PI * -1);
          case '':
            return true;
        }
      }
    }

    this.calculateRotation = function(value) {
      return Math.abs(value) > Math.PI ? value - 2 * Math.PI : value
    }

    this.normalizeValue = function(value, type = '') {
      switch (type) {
        case 'rotation':
          return this.calculateRotation(value);
        default:
          return value;
      }
    }

    this.createVolumeInputListener = function(volumeBox, id, parameters, type) {
      $(id).on('focusout', function() {
        self.updateVolumeObject(self, volumeBox, parameters, type, this)
      });
    }

    this.removeVolumeInputListener = function(volumeBox, id, parameters, type) {
      $(id).on('focusout', function() {
        self.updateVolumeObject(self, volumeBox, parameters, type, this)
      });
    }

    this.convertToNumeric = function(value) {
      return value * 1
    }

    this.assignValue = function(obj, prop, value) {
      obj[prop[0]][prop[1]] = value;
    }

    this.updateVolumeObject = function(self, volumeBox, property, type, context) {
      let num = self.convertToNumeric(context.value);
      num = self.normalizeValue(num, type);
      if (self.valueIsAccepted(num, type)) {
        self.assignValue(volumeBox, property, num);
      };
      self.updateVolumeInfo(volumeBox);
    }

    this.updateMaterialColor = function(index) {
      this.viewer.setElementMaterial(index);
    }

    this.saveMaterial = function(volumeBox) {
      let material = $('#vlMaterialSelect').val();
      let index = this.getMaterialIndex(material);
      this.updateMaterialColor(index);
      volumeBox.material_id = index;
    }

    this.getMaterialIndex = function(material) {
      let index = material.toUpperCase();
      return ElementMaterial[index]
    }

    this.getMaterialName = function(index) {
      for (var key in ElementMaterial) {
        if (ElementMaterial.hasOwnProperty(key)) {
          if (ElementMaterial[key] === index) {
            return key.toLowerCase()
          }
        }
      }
    }

    this.getPointsInBox = function(volumeBox){
      let clipBox = new THREE.Box3();

      console.log(volumeBox);

      let curPoint = new THREE.Vector3().copy(volumeBox.position);
      //curPoint.z = -99999;
      let width = volumeBox.scale.x,
          length = volumeBox.scale.y,
          height = volumeBox.scale.z
      let maxDepth = Infinity;

      clipBox.expandByPoint(curPoint);
      clipBox.expandByPoint(curPoint.add(new THREE.Vector3(width, length, height)));

      let points = new Points();

      this.requests = [];

      for (let pointcloud of this.viewer.scene.pointclouds.filter(p => p.visible)) {
        console.log(pointcloud);
        let request = pointcloud.getBoxPointCloudIntersection(clipBox, maxDepth, {
          'onProgress': (event) => {

            console.log('working...', event.points);
            points.add(event.points);
            //

          },
          'onFinish': (event) => {
            console.log(points);

            /*
            let buffer = LASExporter.toLAS(points);

            let blob = new Blob([buffer], {type: "application/octet-binary"});
            $('#potree_download_points_link').attr('href', URL.createObjectURL(blob));

            */

            let string = CSVExporter.toString(points);

      			let blob = new Blob([string], {type: "text/string"});
            $('#potree_download_points_link').html('The file is ready. Download now.')
            $('#potree_download_points_link').attr('href', URL.createObjectURL(blob));

            console.log('finished');

          },
          'onCancel': () => {

          }
        });

        this.requests.push(request);
      }
    }

    this.eventFire = function(el, etype){
      if (el.fireEvent) {
        el.fireEvent('on' + etype);
      } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
      }
    }

    this.getPoints = function(volumeBox) {
      let pc = this.viewer.scene.pointclouds[0];
      let rootNode = this.viewer.scene.pointclouds[0].root;
      this.getPointsInBox(volumeBox);
    }

    this.initVolumeInfo = function(volumeBox) {
      volumeBox.type = volumeBox.constructor.name;
      if (volumeBox.material_id === undefined) {
        volumeBox.material_id = this.getMaterialIndex('none');
      }
      this.createVolumeInputListener(volumeBox, '#vlPositionX', ['position', 'x']);
      this.createVolumeInputListener(volumeBox, '#vlPositionY', ['position', 'y']);
      this.createVolumeInputListener(volumeBox, '#vlPositionZ', ['position', 'z']);
      this.createVolumeInputListener(volumeBox, '#vlDimensionX', ['scale', 'x']);
      this.createVolumeInputListener(volumeBox, '#vlDimensionY', ['scale', 'y']);
      this.createVolumeInputListener(volumeBox, '#vlDimensionZ', ['scale', 'z']);
      this.createVolumeInputListener(volumeBox, '#vlRotationX', ['rotation', 'x'], 'rotation');
      this.createVolumeInputListener(volumeBox, '#vlRotationY', ['rotation', 'y'], 'rotation');
      this.createVolumeInputListener(volumeBox, '#vlRotationZ', ['rotation', 'z'], 'rotation');
      $('#btnSaveVolumeBox').click(function() {
        self.viewer.scene.saveVolumeBox(volumeBox)
      });
      $('#btnDeleteVolumeBox').click(function() {
        self.viewer.scene.deleteVolumeBox(volumeBox)
      });
      $('#btndownloadAllPoints').click(function() {
        self.getPoints(volumeBox);
      });
      $('#vlMaterialSelect').bind('change', function() {
        self.saveMaterial(volumeBox)
      });
      this.updateVolumeInfo(volumeBox);
    }

    this.cancelVolumeInfo = function(volumeBox) {
      this.removeVolumeInputListener(volumeBox, '#vlPositionX', ['position', 'x']);
      this.removeVolumeInputListener(volumeBox, '#vlPositionY', ['position', 'y']);
      this.removeVolumeInputListener(volumeBox, '#vlPositionZ', ['position', 'z']);
      this.removeVolumeInputListener(volumeBox, '#vlDimensionX', ['scale', 'x']);
      this.removeVolumeInputListener(volumeBox, '#vlDimensionY', ['scale', 'y']);
      this.removeVolumeInputListener(volumeBox, '#vlDimensionZ', ['scale', 'z']);
      this.removeVolumeInputListener(volumeBox, '#vlRotationX', ['rotation', 'x']);
      this.removeVolumeInputListener(volumeBox, '#vlRotationY', ['rotation', 'y']);
      this.removeVolumeInputListener(volumeBox, '#vlRotationZ', ['rotation', 'z']);
      $('#btnSaveVolumeBox').unbind('click');
      $('#btnDeleteVolumeBox').unbind('click');
      $('#vlMaterialSelect').unbind('change');
      $('#btndownloadAllPoints').unbind('click');
    }

    this.updateVolumeInfo = function(volumeBox) {
      $('#vlGeneralType').val(volumeBox.type);
      $('#vlGeneralID').val(volumeBox.uuid);
      $('#vlPositionX').val(volumeBox.position.x);
      $('#vlPositionY').val(volumeBox.position.y);
      $('#vlPositionZ').val(volumeBox.position.z);
      $('#vlDimensionX').val(volumeBox.scale.x);
      $('#vlDimensionY').val(volumeBox.scale.y);
      $('#vlDimensionZ').val(volumeBox.scale.z);
      $('#vlRotationX').val(volumeBox.rotation.x);
      $('#vlRotationY').val(volumeBox.rotation.y);
      $('#vlRotationZ').val(volumeBox.rotation.z);
      $('#vlMaterialSelect').val(this.getMaterialName(volumeBox.material_id));
    }
  }

  createToolIcon(icon, title, callback) {
    let element = $(`
			<img src="${icon}"
				style="width: 32px; height: 32px"
				class="button-icon"
				data-i18n="${title}" />
		`);
    element.click(callback);
    return element;
  }

  init() {
    //this.initAccordion();
    //this.initAppearance();
    $('#potree_version_number').html(Potree.version.major + "." + Potree.version.minor + Potree.version.suffix);
    $('.perfect_scrollbar').perfectScrollbar();
  }

}
