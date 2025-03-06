<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['search'])) {
    $search = $_GET['search'];
    $type = $_GET['type'] ?? 'drug'; // Default to drug search
    
    try {
        $query = "";
        $params = [];
        
        switch ($type) {
            case 'drug':
                // Search by drug name, drugbank_id, and synonyms
                $query = "SELECT d.drug_name, d.drugbank_id FROM Drugs d 
                         WHERE d.drug_name LIKE ? OR d.drugbank_id LIKE ? OR d.synonyms LIKE ? 
                         LIMIT 10";
                $searchWildcard = "%$search%";
                $params = [$searchWildcard, $searchWildcard, $searchWildcard];
                break;
                
            case 'side_effect':
                $query = "SELECT DISTINCT se.se_name as name FROM SideEffects se 
                         WHERE se.se_name LIKE ? 
                         LIMIT 10";
                $params = ["%$search%"];
                break;
    
	    case 'indication':
	        // This query will get individual indications that match the search term
	        $query = "SELECT DISTINCT d.drug_name, d.indications FROM Drugs d 
	    	         WHERE d.indications LIKE ? AND d.indications IS NOT NULL
		         LIMIT 20";
	        $params = ["%$search%"];
	    
	        $stmt = $pdo->prepare($query);
	        $stmt->execute($params);
	        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
	    
	        // Process the results to extract matching indications
	        $suggestions = [];
	        foreach ($results as $row) {
	    	// Assuming indications are stored as semicolon-separated values
	  	    $indications = explode(';', $row['indications']);
		    foreach ($indications as $indication) {
		        $indication = trim($indication);
		        if (stripos($indication, $search) !== false) {
			// Add this specific indication to suggestions
			    $suggestions[] = ['text' => $indication];
			// Limit to 10 suggestions
			    if (count($suggestions) >= 10) {
			        break 2; // Break out of both loops
		  	    }
		        }
		    }
	        }
	    
	        // Skip the default behavior by returning early
	        echo json_encode([
		    "status" => "success", 
		    "suggestions" => $suggestions
	        ]);
	        return;
	        break;
                        
            case 'manufacturer':
                $query = "SELECT DISTINCT m.manufacturer_name as name FROM Manufacturer m 
                         WHERE m.manufacturer_name LIKE ? 
                         LIMIT 10";
                $params = ["%$search%"];
                break;
                
            default:
                throw new Exception("Invalid search type");
        }
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $suggestions = [];
        
        foreach ($results as $row) {
            $suggestions[] = [
                'text' => $row['drug_name'] ?? $row['name']
            ];
        }
        
        echo json_encode([
            "status" => "success", 
            "suggestions" => $suggestions
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            "status" => "error", 
            "message" => $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        "status" => "error", 
        "message" => "Invalid request"
    ]);
}
?>
