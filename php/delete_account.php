<?php
session_start();
require_once 'db.php';

// Update Profile
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'updateProfile') {
    // Existing update profile code
}

// Delete Account
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'deleteAccount') {
    $email = $_POST['user_id'] ?? '';
    $password = $_POST['password'] ?? '';
    
    try {
        // First, verify the password
        $stmt = $pdo->prepare("SELECT password_hash FROM Users WHERE idEmail = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password_hash'])) {
            // Password is correct, proceed with account deletion
            $pdo->beginTransaction();
            
            // Delete all related records (you might need to adjust based on your database schema)
            $stmt = $pdo->prepare("DELETE FROM Users WHERE idEmail = ?");
            $stmt->execute([$email]);
            
            $pdo->commit();
            
            echo json_encode([
                "status" => "success", 
                "message" => "Account deleted successfully"
            ]);
        } else {
            echo json_encode([
                "status" => "error", 
                "message" => "Invalid password"
            ]);
        }
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        echo json_encode([
            "status" => "error", 
            "message" => $e->getMessage()
        ]);
        error_log("Account deletion error: " . $e->getMessage());
    }
}
?>