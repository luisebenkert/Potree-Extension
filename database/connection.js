export class DBConnection {

  constructor(caller) {
    let self = this;

    // set to true, to get Log Messages
    let showDebugging = false;

    this.caller = caller;

    this.savePoint = function(point) {
      if(showDebugging) console.log(`execute 'savePoint()'`);
      let sql = "";
      sql = `INSERT INTO point(position_x, position_y, position_z)
      VALUES (` + point.position.x +`, ` + point.position.y +`, `+ point.position.z + `)
      ON DUPLICATE KEY UPDATE
      position_x = ` + point.position.x + `, position_y = ` + point.position.y + `, position_z = ` + point.position.z;
      if(showDebugging) console.log(`sql: ` + sql);
      this.sendQuery('set', sql);
    }

    this.getAllVolumes = function() {
      if(showDebugging) console.log(`execute 'getAllVolumes()'`);
      let sql = `SELECT * FROM box`;
      if(showDebugging) console.log(`sql: ` + sql);
      this.sendQuery('get', sql, this.returnAllVolumes);
    }

    this.returnAllVolumes = function(result) {
      if(showDebugging) console.log(`execute 'returnAllVolumes()'`);
      let volumes = JSON.parse(result);
      self.caller.displayVolumes(volumes);
    }

    this.saveVolumeBox = function(volumeBox) {
      if(showDebugging) console.log(`execute 'saveVolumeBox()'`);
      let sql = `INSERT INTO box(id, type, position_x, position_y, position_z, scale_x, scale_y, scale_z, rotation_x, rotation_y, rotation_z, material_id)
      VALUES ('` + volumeBox.uuid +`', '` + volumeBox.type  +`', ` + volumeBox.position.x +`, ` + volumeBox.position.y +`, ` + volumeBox.position.z +`, ` + volumeBox.scale.x +`, ` + volumeBox.scale.y +`, ` + volumeBox.scale.z +`, ` + volumeBox.rotation.x +
      `, ` + volumeBox.rotation.y +`, ` + volumeBox.rotation.z +`, ` + volumeBox.material_id + `)
      ON DUPLICATE KEY UPDATE
      id = '` + volumeBox.uuid +`', type = '` + volumeBox.type +`', position_x = ` + volumeBox.position.x +`, position_y = ` + volumeBox.position.y +`, position_z = ` + volumeBox.position.z +`, scale_x = ` + volumeBox.scale.x +`, scale_y = ` + volumeBox.scale.y +`, scale_z = ` + volumeBox.scale.z +
      `, rotation_x = ` + volumeBox.rotation.x +`, rotation_y = ` + volumeBox.rotation.y +`, rotation_z = ` + volumeBox.rotation.z +`, material_id = ` + volumeBox.material_id;
      if(showDebugging) console.log(`sql: ` + sql);
      this.sendQuery('set', sql);
    }

    this.deleteVolumeBox = function(volumeBox) {
      if(showDebugging) console.log(`execute 'deleteVolumeBox()'`);
      let sql = `DELETE FROM box WHERE id = '` + volumeBox.uuid +`'`;
      if(showDebugging) console.log(`sql: ` + sql);
      this.sendQuery('set', sql);
    }

    this.sendQuery = function(type, sql, callback = null) {
      if(showDebugging) console.log(`execute 'sendQuery()'`);
      if (window.XMLHttpRequest) {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        var xmlhttp = new XMLHttpRequest();
      } else {
        // code for IE6, IE5
        var xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
      }
      xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          if (type === 'get' && callback != null) {
            callback(this.responseText);
          }
          else {
            switch (this.responseText) {
              case 'true': console.log('Success: \n' + sql); break;
              default: console.log('Something went wrong. SQL Query was not successful'); break;
            }
          }
        }
      };
      xmlhttp.open("GET", "../database/connection.php?sql=" + sql, true);
      xmlhttp.send();
    }
  }
}
