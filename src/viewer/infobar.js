export class Infobar{

	constructor(viewer){
		this.viewer = viewer;

		this.displayVolumeInfo = function(volumeBox){			
			$('#vlGeneralName').html(volumeBox.name);
			$('#vlGeneralID').html(volumeBox.uuid);
			$('#vlPositionX').html(volumeBox.position.x);
			$('#vlPositionY').html(volumeBox.position.y);
			$('#vlPositionZ').html(volumeBox.position.z);
			$('#vlDimensionX').html(volumeBox.scale.x);
			$('#vlDimensionY').html(volumeBox.scale.y);
			$('#vlDimensionZ').html(volumeBox.scale.z);

			//test
			//$('#vlDatabaseInfo').innerHTML = volumeBox.scale.z;
		}
	}

	createToolIcon(icon, title, callback){
		let element = $(`
			<img src="${icon}"
				style="width: 32px; height: 32px"
				class="button-icon"
				data-i18n="${title}" />
		`);
		element.click(callback);
		return element;
	}

	init(){
		//this.initAccordion();
		//this.initAppearance();
		$('#potree_version_number').html(Potree.version.major + "." + Potree.version.minor + Potree.version.suffix);
		$('.perfect_scrollbar').perfectScrollbar();
	}

  initInfoBox(){
    let infoBox = $('#infobarText');
  }


}
