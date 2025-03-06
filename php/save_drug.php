<?php
require_once 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'save_drug') {
        $userId = $_POST['user_id'] ?? '';
        $drugId = $_POST['drug_id'] ?? '';
        
        if (empty($userId) || empty($drugId)) {
            echo json_encode(['status' => 'error', 'message' => 'Missing user or drug information']);
            exit;
        }
        
        try {
            // Check if the drug is already saved
            $checkStmt = $pdo->prepare("SELECT * FROM SavedDrugs WHERE idEmail = ? AND idDrug = ?");
            $checkStmt->execute([$userId, $drugId]);
            
            if ($checkStmt->rowCount() > 0) {
                echo json_encode(['status' => 'error', 'message' => 'Drug already saved']);
                exit;
            }
            
            // Insert saved drug
            $stmt = $pdo->prepare("INSERT INTO SavedDrugs (idEmail, idDrug, saved_at) VALUES (?, ?, NOW())");
            $result = $stmt->execute([$userId, $drugId]);
            
            if ($result) {
                echo json_encode(['status' => 'success', 'message' => 'Drug saved successfully']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to save drug']);
            }
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    } elseif ($action === 'remove_saved_drug') {
        $userId = $_POST['user_id'] ?? '';
        $drugId = $_POST['drug_id'] ?? '';
        
        if (empty($userId) || empty($drugId)) {
            echo json_encode(['status' => 'error', 'message' => 'Missing user or drug information']);
            exit;
        }
        
        try {
            // Remove saved drug
            $stmt = $pdo->prepare("DELETE FROM SavedDrugs WHERE idEmail = ? AND idDrug = ?");
            $result = $stmt->execute([$userId, $drugId]);
            
            if ($result) {
                echo json_encode(['status' => 'success', 'message' => 'Drug removed from saved list']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to remove drug']);
            }
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }
}
?>