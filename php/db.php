<?php
$host = "localhost"; // Change if necessary
$dbname = "drugsearch";
$username = "drugsearch"; // Change if using a different user
$password = "dbw_drugsearch"; // Set MySQL password

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>
