<?php
session_start();
require_once 'db.php';

// Helper function to check admin privileges
function checkAdminAccess() {
    $userRole = $_SESSION['role'] ?? '';
    
    if ($userRole !== 'Admin') {
        echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
        exit;
    }
}

// Handle admin request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'adminRequest') {
    $user_id = $_POST['user_id'] ?? '';
    $reason = $_POST['reason'] ?? '';
    
    try {
        // Store the request in a table            
        $stmt = $pdo->prepare("INSERT INTO AdminRequests (idEmail, reason, request_date, status) 
                VALUES (?, ?, NOW(), 'pending') ON DUPLICATE KEY UPDATE 
                reason = ?, request_date = NOW(), status = 'pending'");
        $stmt->execute([$user_id, $reason, $reason]);
        echo json_encode(["status" => "success", "message" => "Admin request submitted"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// Get all admin requests
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'getRequests') {
    checkAdminAccess();
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM AdminRequests ORDER BY request_date DESC");
        $stmt->execute();
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["status" => "success", "requests" => $requests]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// Deny admin request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'denyRequest') {
    checkAdminAccess();
    
    $idEmail = $_POST['idEmail'] ?? '';
    
    try {
        $stmt = $pdo->prepare("UPDATE AdminRequests SET status = 'denied' WHERE idEmail = ?");
        $stmt->execute([$idEmail]);
        
        echo json_encode(["status" => "success", "message" => "Request denied successfully"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// Update user role and approve request in one transaction
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'updateRole') {
    checkAdminAccess();
    
    $idEmail = $_POST['idEmail'] ?? '';
    $new_role_id = $_POST['role_id'] ?? '';
    
    try {
        // Begin transaction to ensure both operations succeed or fail together
        $pdo->beginTransaction();
        
        // Update user role
        $stmt = $pdo->prepare("UPDATE Users SET idRole = ? WHERE idEmail = ?");
        $stmt->execute([$new_role_id, $idEmail]);
        
        // Update any pending request to 'approved'
        $stmt = $pdo->prepare("UPDATE AdminRequests SET status = 'approved' WHERE idEmail = ? AND status = 'pending'");
        $stmt->execute([$idEmail]);
        
        // Commit the transaction
        $pdo->commit();
        
        echo json_encode(["status" => "success", "message" => "User role updated successfully"]);
    } catch (PDOException $e) {
        // Rollback on error
        $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// Get all users
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'getUsers') {
    checkAdminAccess();
    
    try {
        $stmt = $pdo->prepare("SELECT u.idEmail, u.username, u.created_at, r.idRole, r.role_name 
                              FROM Users u JOIN Roles r ON u.idRole = r.idRole 
                              ORDER BY u.created_at DESC");
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["status" => "success", "users" => $users]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// Get all roles
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'getRoles') {
    checkAdminAccess();
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM Roles ORDER BY idRole");
        $stmt->execute();
        $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["status" => "success", "roles" => $roles]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}
?>