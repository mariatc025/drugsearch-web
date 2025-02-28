<?php
require_once 'db.php';

if (isset($_GET['id'])) {
    try {
        $stmt = $pdo->prepare("SELECT pubchem_cid FROM Drugs WHERE idDrug = ?");
        $stmt->execute([$_GET['id']]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result && $result['pubchem_cid']) {
            echo json_encode(["status" => "success", "pubchem_cid" => $result['pubchem_cid']]);
        } else {
            echo json_encode(["status" => "error", "message" => "No PubChem CID found"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>