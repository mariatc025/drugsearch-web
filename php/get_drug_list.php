<?php
// get_drug_list.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Cache-Control: public, max-age=300"); // 5-minute cache

require_once('db.php');

try {
    // Validate and sanitize input parameters
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $pageSize = isset($_GET['pageSize']) ? max(1, intval($_GET['pageSize'])) : 20;
    $letter = isset($_GET['letter']) ? strtoupper(substr($_GET['letter'], 0, 1)) : null;
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';

    // Base query with field aliases
    $baseQuery = "FROM Drugs WHERE 1=1";
    $params = [];
    $types = '';

    // Add search filter
    if (!empty($search)) {
        $baseQuery .= " AND drug_name LIKE ?";
        $params[] = "%$search%";
        $types .= 's';
    }

    // Add letter filter
    if ($letter && ctype_alpha($letter)) {
        $baseQuery .= " AND UPPER(SUBSTRING(drug_name, 1, 1)) = ?";
        $params[] = $letter;
        $types .= 's';
    }

    // Get total count
    $countStmt = $pdo->prepare("SELECT COUNT(*) " . $baseQuery);
    $countStmt->execute($params);
    $totalItems = $countStmt->fetchColumn();

    // Pagination calculation
    $totalPages = ceil($totalItems / $pageSize);
    $offset = ($page - 1) * $pageSize;

    // Main data query
    $dataQuery = "SELECT 
                    idDrug, 
                    drug_name, 
                    Classification_direct_parent AS category,
                    drugbank_id, 
                    description,
                    molecular_formula,
                    molecular_weight
                  " . $baseQuery . " 
                  ORDER BY drug_name ASC 
                  LIMIT ? OFFSET ?";

    // Add pagination parameters
    $params[] = $pageSize;
    $params[] = $offset;
    $types .= 'ii';

    // Prepare and execute statement
    $dataStmt = $pdo->prepare($dataQuery);
    $dataStmt->execute($params);

    // Format results
    $drugs = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

    // Return structured response
    echo json_encode([
        "status" => "success",
        "data" => [
            "drugs" => $drugs,
            "pagination" => [
                "totalItems" => $totalItems,
                "totalPages" => $totalPages,
                "currentPage" => $page,
                "pageSize" => $pageSize
            ],
            "currentLetter" => $letter
        ]
    ]);

} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "code" => "DATABASE_ERROR",
        "message" => "Failed to retrieve drug list"
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "code" => "INVALID_REQUEST",
        "message" => $e->getMessage()
    ]);
}
