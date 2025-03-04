<?php
require_once 'db.php';

try {
    // Get all kingdoms
    $kingdomQuery = "SELECT * FROM DrugKingdom ORDER BY drug_kingdom_name";
    $kingdomStmt = $pdo->query($kingdomQuery);
    $kingdoms = $kingdomStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $result = [];
    
    foreach ($kingdoms as $kingdom) {
        $kingdomData = [
            'idDrug_kingdom' => $kingdom['idDrug_kingdom'],
            'drug_kingdom_name' => $kingdom['drug_kingdom_name'],
            'superclasses' => []
        ];
        
        // Get superclasses for this kingdom
        $superclassQuery = "SELECT * FROM DrugSuperclass WHERE idDrug_kingdom = ? ORDER BY drug_superclass_name";
        $superclassStmt = $pdo->prepare($superclassQuery);
        $superclassStmt->execute([$kingdom['idDrug_kingdom']]);
        $superclasses = $superclassStmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($superclasses as $superclass) {
            $superclassData = [
                'idDrug_superclass' => $superclass['idDrug_superclass'],
                'drug_superclass_name' => $superclass['drug_superclass_name'],
                'classes' => []
            ];
            
            // Get classes for this superclass
            $classQuery = "SELECT * FROM DrugClass WHERE idDrug_superclass = ? ORDER BY drug_class_name";
            $classStmt = $pdo->prepare($classQuery);
            $classStmt->execute([$superclass['idDrug_superclass']]);
            $classes = $classStmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($classes as $class) {
                $classData = [
                    'idDrug_class' => $class['idDrug_class'],
                    'drug_class_name' => $class['drug_class_name'],
                    'drugs' => []
                ];
                
                // Get drugs for this class
                $drugQuery = "SELECT idDrug, drug_name FROM Drugs WHERE idDrug_class = ? ORDER BY drug_name";
                $drugStmt = $pdo->prepare($drugQuery);
                $drugStmt->execute([$class['idDrug_class']]);
                $drugs = $drugStmt->fetchAll(PDO::FETCH_ASSOC);
                
                $classData['drugs'] = $drugs;
                $superclassData['classes'][] = $classData;
            }
            
            $kingdomData['superclasses'][] = $superclassData;
        }
        
        $result[] = $kingdomData;
    }
    
    header('Content-Type: application/json');
    echo json_encode($result);
    
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>