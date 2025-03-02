<?php
session_start();
require_once 'db.php';


// Registration
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'register') {
    error_log("Registration attempt with email: " . ($_POST['email'] ?? 'not set'));
    $email = $_POST['email'] ?? '';
    $username = $_POST['username'] ?? '';
    $password = password_hash($_POST['password'] ?? '', PASSWORD_DEFAULT);
    
    try {
        // Start transaction
        $pdo->beginTransaction();
        
        // Default role ID (e.g., 1 for "user")
        $defaultRoleId = 800001;
        
        // Insert user with default role
        $stmt = $pdo->prepare("INSERT INTO Users (idEmail, idRole, username, password_hash, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([$email, $defaultRoleId, $username, $password]);
        
        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "User registered successfully"]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        error_log("Registration error: " . $e->getMessage());
            
    }

}

// Login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    
    try {
        // Get user with their role
        $stmt = $pdo->prepare("SELECT u.*, r.role_name, r.role_description FROM Users u 
                              JOIN Roles r ON u.idRole = r.idRole 
                              WHERE u.idEmail = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['idEmail'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role_name'];
            
            echo json_encode([
                "status" => "success", 
                "message" => "Login successful",
                "user_id" => $user['idEmail'],
                "username" => $user['username'],
                "role" => $user['role_name']
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>