<?php
// Initialize session
session_start();

// Include database connection
require_once 'db.php';

// Set headers for JSON response
header('Content-Type: application/json');

// Validate request has an action
if (!isset($_POST['action'])) {
    echo json_encode(['status' => 'error', 'message' => 'No action specified']);
    exit;
}

$action = $_POST['action'];

// Handle profile update
if ($action === 'updateProfile') {
    // Check if all required fields are present
    if (!isset($_POST['user_id']) || !isset($_POST['username']) || 
        !isset($_POST['email']) || !isset($_POST['currentPassword'])) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        exit;
    }
    
    $userId = $_POST['user_id']; // This is the email used as ID
    $newUsername = $_POST['username'];
    $newEmail = $_POST['email'];
    $currentPassword = $_POST['currentPassword'];
    $newPassword = isset($_POST['newPassword']) ? $_POST['newPassword'] : '';
    
    try {
        // Verify current password - using the correct table and column names
        $stmt = $pdo->prepare("SELECT password_hash FROM Users WHERE idEmail = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            echo json_encode(['status' => 'error', 'message' => 'User not found']);
            exit;
        }
        
        if (!password_verify($currentPassword, $user['password_hash'])) {
            echo json_encode(['status' => 'error', 'message' => 'Current password is incorrect']);
            exit;
        }
        
        // Update username and email
        $stmt = $pdo->prepare("UPDATE Users SET username = ?, idEmail = ? WHERE idEmail = ?");
        $result = $stmt->execute([$newUsername, $newEmail, $userId]);
        
        if (!$result) {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update profile']);
            exit;
        }
        
        // Update password if provided
        if (!empty($newPassword)) {
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE Users SET password_hash = ? WHERE idEmail = ?");
            $stmt->execute([$hashedPassword, $newEmail]); // Use new email if it was changed
        }
        
        // Update session if needed
        if (isset($_SESSION['user_id']) && $_SESSION['user_id'] === $userId) {
            $_SESSION['username'] = $newUsername;
            $_SESSION['user_id'] = $newEmail;
        }
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Profile updated successfully',
            'user_id' => $newEmail,
            'username' => $newUsername
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

// If we got here, the action wasn't recognized
echo json_encode(['status' => 'error', 'message' => 'Invalid action: ' . $action]);
?>