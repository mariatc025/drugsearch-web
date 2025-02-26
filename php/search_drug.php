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
                $query = "SELECT * FROM Drugs WHERE drug_name LIKE ? OR drugbank_id LIKE ?";
                $params = ["%$search%", "%$search%"];
                break;
                
            case 'side_effect':
                $query = "SELECT d.* FROM Drugs d 
                         JOIN Drug_has_SideEffects dhs ON d.idDrug = dhs.idDrug 
                         JOIN SideEffects se ON dhs.idSide_effect = se.idSide_effect 
                         WHERE se.se_name LIKE ?";
                $params = ["%$search%"];
                break;
                
            case 'manufacturer':
                $query = "SELECT d.* FROM Drugs d 
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
        echo json_encode(["status" => "success", "drugs" => $results]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>