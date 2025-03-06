<?php
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = $_GET['user_id'] ?? '';
    
    if (empty($userId)) {
        echo json_encode(['status' => 'error', 'message' => 'Missing user ID']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT d.idDrug, d.drug_name 
            FROM SavedDrugs sd
            JOIN Drugs d ON sd.idDrug = d.idDrug
            WHERE sd.idEmail = ?
            ORDER BY sd.saved_at DESC
        ");
        $stmt->execute([$userId]);
        $savedDrugs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'status' => 'success', 
            'savedDrugs' => $savedDrugs
        ]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
?>