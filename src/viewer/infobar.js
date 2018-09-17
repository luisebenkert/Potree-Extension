export class Infobar{

	constructor(viewer){
		this.viewer = viewer;
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

	displayVolumeInfo(volumeBox){
		console.log(volumeBox);
		$('#vlGeneralName').innerHTML = volumeBox.name;
		$('#vlGeneralID').innerHTML = volumeBox.id;

		$('#vlPositionX').innerHTML = volumeBox.position.x;
		$('#vlPositionY').innerHTML = volumeBox.position.y;
		$('#vlPositionZ').innerHTML = volumeBox.position.z;

		$('#vlDimensionX').innerHTML = volumeBox.scale.x;
		$('#vlDimensionY').innerHTML = volumeBox.scale.y;
		$('#vlDimensionZ').innerHTML = volumeBox.scale.z;
		

		//$('#vlDatabaseInfo').innerHTML = volumeBox.scale.z;
	}
}
