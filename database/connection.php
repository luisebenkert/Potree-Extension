<?php
$sql = $_GET['sql'];
$con = mysqli_connect('localhost','root','','potree');
if (!$con) {
    die('Could not connect: ' . mysqli_error($con));
}
mysqli_select_db($con,"ajax_demo");
$query = mysqli_query($con, $sql);
if($query) { echo json_encode('DB Operation Successful');}
else { echo json_encode('Something went wrong'); }

mysqli_close($con);
?>
