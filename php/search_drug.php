<?php
// Modify search_drug.php with this updated version
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['search'])) {
    $search = $_GET['search'];
    $type = $_GET['type'] ?? 'drug'; // Default to drug search
    
    try {
        $query = "";
        $params = [];
        
        switch ($type) {
            case 'drug':
                // Enhanced query to search by name, ID, and synonyms
                $query = "SELECT DISTINCT d.* FROM Drugs d 
                         WHERE d.drug_name LIKE ? 
                         OR d.drugbank_id LIKE ? 
                         OR d.synonyms LIKE ?";
                $searchWildcard = "%$search%";
                $params = [$searchWildcard, $searchWildcard, $searchWildcard];
                break;
                
            case 'side_effect':
                $query = "SELECT DISTINCT d.* FROM Drugs d 
                         JOIN Drug_has_SideEffects dhs ON d.idDrug = dhs.idDrug 
                         JOIN SideEffects se ON dhs.idSide_effect = se.idSide_effect 
                         WHERE se.se_name LIKE ?";
                $params = ["%$search%"];
                break;
                
            case 'manufacturer':
                $query = "SELECT DISTINCT d.* FROM Drugs d 
                         JOIN Drug_has_Manufacturer dhm ON d.idDrug = dhm.idDrug 
                         JOIN Manufacturer m ON dhm.idManufacturer = m.idManufacturer 
                         WHERE m.manufacturer_name LIKE ?";
                $params = ["%$search%"];
                break;
                
            default:
                throw new Exception("Invalid search type");
        }
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // If searching by drug name and we found matching synonyms, add a note
        if ($type === 'drug') {
            foreach ($results as &$drug) {
                // Check if the search term matches a synonym rather than the main name
                if (stripos($drug['drug_name'], $search) === false && 
                    stripos($drug['drugbank_id'], $search) === false &&
                    stripos($drug['synonyms'], $search) !== false) {
                    
                    // Find the matching synonym
                    $synonyms = explode(';', $drug['synonyms']);
                    foreach ($synonyms as $synonym) {
                        $synonym = trim($synonym);
                        if (stripos($synonym, $search) !== false) {
                            $drug['matched_synonym'] = $synonym;
                            break;
                        }
                    }
                }
            }
        }
        
        echo json_encode(["status" => "success", "drugs" => $results]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>