<?php
$sql = $_GET['sql'];
$con = mysqli_connect('localhost','root','','potree');
if (!$con) {
    die('Could not connect: ' . mysqli_error($con));
}
mysqli_select_db($con,"ajax_demo");
$result = mysqli_query($con, $sql);
if($result) {
  $array = [];
  while($row = mysqli_fetch_assoc($result))
     {
       array_push($array, $row);
     }
  echo json_encode($array);
}
else { echo json_encode('Something went wrong'); }

mysqli_close($con);
?>
