<?php
session_start();
require_once 'db.php';

// Registration
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'register') {
    $email = $_POST['email'] ?? '';
    $username = $_POST['username'] ?? '';
    $password = password_hash($_POST['password'] ?? '', PASSWORD_DEFAULT);
    
    try {
        $stmt = $pdo->prepare("INSERT INTO Users (idEmail, username, password_hash, created_at) VALUES (?, ?, ?, NOW())");
        $stmt->execute([$email, $username, $password]);
        echo json_encode(["status" => "success", "message" => "User registered successfully"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

// Login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM Users WHERE idEmail = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['idEmail'];
            $_SESSION['username'] = $user['username'];
            
            // Get user privileges
            $stmt = $pdo->prepare("SELECT p.privilege_name FROM Privileges p 
                                  JOIN User_has_Privileges uhp ON p.idPrivilege = uhp.idPrivilege 
                                  WHERE uhp.idEmail = ?");
            $stmt->execute([$email]);
            $privileges = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $_SESSION['privileges'] = $privileges;
            
            echo json_encode(["status" => "success", "message" => "Login successful"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>