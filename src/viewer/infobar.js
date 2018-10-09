import {DBConnection} from "../../database/connection.js";
import {ElementMaterial} from "../defines.js";
import {LASExporter} from "../exporter/LASExporter.js";
import {CSVExporter} from "../exporter/CSVExporter.js";
import {Volume} from "../utils/Volume.js"

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

    this.getPoints = function(volumeBox) {
      if(volumeBox.pointsBlob != undefined || volumeBox.pointsBlob != null){
        console.log('already exists');
        //print file again
      }
      else {
        volumeBox.getPointsInBox(this.viewer.scene.pointclouds, this.downloadAllPoints);        
      }
    }

    this.downloadAllPoints = function(points, format = 'csv') {
      let blob;
      switch (format){
        case 'csv':
          let buffer = LASExporter.toLAS(points);
          blob = new Blob([buffer], {type: "application/octet-binary"});
          break;
        case 'las':
          let string = CSVExporter.toString(points);
          blob = new Blob([string], {type: "text/string"});
          break;
      }
      $('#potree_download_points_link').html('The file is ready. Click here to download.')
      $('#potree_download_points_link').attr('href', URL.createObjectURL(blob));
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
