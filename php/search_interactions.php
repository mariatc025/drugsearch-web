<?php
require_once 'db.php';

if (isset($_GET['drug_id'])) {
    $drug_id = $_GET['drug_id'];
    
    try {
        $stmt = $pdo->prepare("SELECT d.*, di.description as interaction_description FROM Drugs d 
                              JOIN DrugInteractions di ON d.idDrug = di.idDrug_2 
                              WHERE di.idDrug_1 = ?");
        $stmt->execute([$drug_id]);
        $interactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "interactions" => $interactions]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>