<?php
require_once 'db.php';

if (isset($_GET['id'])) {
    try {
        $stmt = $pdo->prepare("SELECT m.* FROM Manufacturer m 
                              JOIN Drug_has_Manufacturer dhm ON m.idManufacturer = dhm.idManufacturer 
                              WHERE dhm.idDrug = ?");
        $stmt->execute([$_GET['id']]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>
