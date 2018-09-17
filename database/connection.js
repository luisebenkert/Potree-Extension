export class DBConnection {

  static savePoint(point, data) {
    console.log('print something');
    let sql = "INSERT INTO testTable (x, y, z) values (" + point.x.toFixed(2) + "," + point.y.toFixed(2) + "," + point.z.toFixed(2) + ")";
    if (data != '') {
      sql = "INSERT INTO testTable (x, y, z, description) values (" + point.x.toFixed(2) + "," + point.y.toFixed(2) + "," + point.z.toFixed(2) + ",'" + data + "')";
    }
    console.log(sql);
    this.sendQuery(sql);
  }

  static sendQuery(sql) {
    if (window.XMLHttpRequest) {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        var xmlhttp = new XMLHttpRequest();
    } else {
        // code for IE6, IE5
        var xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
        }
    };
    xmlhttp.open("GET","../database/connection.php?sql=" + sql , true);
    xmlhttp.send();
  }
}
