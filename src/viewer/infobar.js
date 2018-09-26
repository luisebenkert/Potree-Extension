import {DBConnection} from "../../database/connection.js";

export class Infobar {

  constructor(viewer) {
    let self = this;
    this.viewer = viewer;
    this.connection = new DBConnection();

    this.saveVolumeBox = function(volumeBox) {
      this.saveMaterial(volumeBox);
      volumeBox.prop  = 67;
      this.connection.saveVolumeBox(volumeBox);
    }

    this.deleteVolumeBox = function(volumeBox) {
      if (confirm('Are you sure you want to permanentely delete this volume box?')) {
        this.viewer.scene.removeVolume(volumeBox);
        this.connection.deleteVolumeBox(volumeBox);
      }
    }

    this.valueIsAccepted = function(value, type = '') {
      if ($.isNumeric(value)) {
        switch (type) {
          case 'rotation': return (value <= Math.PI && value >= Math.PI * -1);
          case '': return true;
        }
      }
    }

    this.calculateRotation = function(value) {
      return Math.abs(value) > Math.PI ? value - 2 * Math.PI : value
    }

    this.normalizeValue = function(value, type = '') {
      switch (type) {
        case 'rotation': return this.calculateRotation(value);
        default: return value;
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

    this.getMaterialSelection = function(){
      let material = $('#vlMaterialSelect').val();
      console.log(material);
      let id = self.getMaterialID(material);
      return id;
    }

    this.saveMaterial = function(volumeBox){
      console.log('save');
      let id = self.getMaterialSelection();
      console.log(id);
      volumeBox.material = id;
    }

    this.getMaterialID = function(material) {
      switch (material) {
        case 'concrete': return 1;
        case 'glass': return 2;
        case 'metal': return 3;
        case 'plastic': return 4;
        case 'wood': return 5;
        case 'none': return 6;
      }
    }

    this.initVolumeInfo = function(volumeBox) {
      this.createVolumeInputListener(volumeBox, '#vlPositionX', ['position', 'x']);
      this.createVolumeInputListener(volumeBox, '#vlPositionY', ['position', 'y']);
      this.createVolumeInputListener(volumeBox, '#vlPositionZ', ['position', 'z']);
      this.createVolumeInputListener(volumeBox, '#vlDimensionX', ['scale', 'x']);
      this.createVolumeInputListener(volumeBox, '#vlDimensionY', ['scale', 'y']);
      this.createVolumeInputListener(volumeBox, '#vlDimensionZ', ['scale', 'z']);
      this.createVolumeInputListener(volumeBox, '#vlRotationX', ['rotation', 'x'], 'rotation');
      this.createVolumeInputListener(volumeBox, '#vlRotationY', ['rotation', 'y'], 'rotation');
      this.createVolumeInputListener(volumeBox, '#vlRotationZ', ['rotation', 'z'], 'rotation');
      $('#btnSaveVolumeBox').click(function(){self.saveVolumeBox(volumeBox);});
      $('#btnDeleteVolumeBox').click(function(){self.deleteVolumeBox(volumeBox);});
      $('#vlMaterialSelect').bind('change',function(){self.saveMaterial(volumeBox)});
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
      $('#vlMaterial').unbind('change');
    }

    this.updateVolumeInfo = function(volumeBox) {
      $('#vlGeneralType').val(volumeBox.name);
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
      $('#vlMaterial').val(volumeBox.material);
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