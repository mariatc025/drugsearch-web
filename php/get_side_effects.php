<?php
require_once 'db.php';

if (isset($_GET['id'])) {
    try {
        $stmt = $pdo->prepare("SELECT se.*, dhs.frequency_percent, dhs.lower_bound, dhs.upper_bound 
                              FROM SideEffects se 
                              JOIN Drug_has_SideEffects dhs ON se.idSide_effect = dhs.idSide_effect 
                              WHERE dhs.idDrug = ?");
        $stmt->execute([$_GET['id']]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>
