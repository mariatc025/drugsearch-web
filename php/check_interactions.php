<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

require_once('db.php');

try {
    // Validate input parameters
    if (empty($_POST)) {
        throw new Exception("No input data received");
    }

    $drugNames = [];
    foreach ($_POST as $key => $value) {
        if (preg_match('/^drug\d+$/', $key)) {
            $cleanName = trim($value);
            if (!empty($cleanName)) {
                $drugNames[] = $cleanName;
            }
        }
    }

    // Validate minimum drug count
    if (count($drugNames) < 2) {
        throw new Exception("At least two valid drug names required");
    }

    // Convert names to IDs with case-insensitive search
    $drugIds = [];
    $stmt = $pdo->prepare("
        SELECT idDrug 
        FROM Drugs 
        WHERE LOWER(TRIM(drug_name)) = LOWER(TRIM(?))
    ");

    foreach ($drugNames as $name) {
        $stmt->execute([$name]);
        $drugId = $stmt->fetchColumn();
        
        if (!$drugId) {
            // Get suggestions for similar names
            $suggestionStmt = $pdo->prepare("
                SELECT drug_name 
                FROM Drugs 
                WHERE drug_name LIKE CONCAT('%', ?, '%')
                LIMIT 5
            ");
            $suggestionStmt->execute([$name]);
            $suggestions = $suggestionStmt->fetchAll(PDO::FETCH_COLUMN);
            
            throw new Exception(sprintf(
                "Drug not found: '%s'. Similar names: %s",
                htmlspecialchars($name),
                $suggestions ? implode(', ', $suggestions) : 'None found'
            ));
        }
        $drugIds[] = $drugId;
    }

    // Check all pairwise combinations
    $interactions = [];
    $query = "
        SELECT 
            idDrug_1, 
            idDrug_2, 
            description 
        FROM DrugInteractions 
        WHERE (idDrug_1 = ? AND idDrug_2 = ?)
           OR (idDrug_1 = ? AND idDrug_2 = ?)
    ";

    $stmt = $pdo->prepare($query);
    
    for ($i = 0; $i < count($drugIds); $i++) {
        for ($j = $i + 1; $j < count($drugIds); $j++) {
            $drug1 = $drugIds[$i];
            $drug2 = $drugIds[$j];
            
            $stmt->execute([$drug1, $drug2, $drug2, $drug1]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($results as $row) {
                $interaction = [
                    'drug1_id' => $row['idDrug_1'],
                    'drug2_id' => $row['idDrug_2'],
                    'description' => $row['description']
                ];
                
                // Add original drug names for reference
                $interaction['drug1_name'] = array_search($row['idDrug_1'], array_combine($drugNames, $drugIds));
                $interaction['drug2_name'] = array_search($row['idDrug_2'], array_combine($drugNames, $drugIds));
                
                $interactions[] = $interaction;
            }
        }
    }

    echo json_encode([
        'status' => 'success',
        'count' => count($interactions),
        'interactions' => $interactions,
        'checked_drugs' => array_combine($drugIds, $drugNames)
    ]);

} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database operation failed',
        'code' => $e->getCode()
    ]);
    
} catch (Exception $e) {
    error_log("Application Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
