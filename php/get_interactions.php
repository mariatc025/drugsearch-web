<?php
require_once 'db.php';

if (isset($_GET['id'])) {
    try {
        $stmt = $pdo->prepare("SELECT d.*, di.description as interaction_description FROM Drugs d JOIN DrugInteractions di ON d.idDrug = di.idDrug_2 WHERE di.idDrug_1 = ?");
        $stmt->execute([$_GET['id']]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>
