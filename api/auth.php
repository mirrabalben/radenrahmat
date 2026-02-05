<?php
session_start();
header('Content-Type: application/json');

$USERS_FILE = '../data/users.json';

function getUsers() {
    global $USERS_FILE;
    if (!file_exists($USERS_FILE)) return [];
    return json_decode(file_get_contents($USERS_FILE), true);
}

function saveUsers($users) {
    global $USERS_FILE;
    file_put_contents($USERS_FILE, json_encode($users, JSON_PRETTY_PRINT));
}

$action = $_GET['action'] ?? '';

if ($action === 'login') {
    $input = json_decode(file_get_contents('php://input'), true);
    $user = $input['user'] ?? '';
    $pass = $input['pass'] ?? '';

    $users = getUsers();

    if (isset($users[$user]) && password_verify($pass, $users[$user])) {
        // Fix: Use simple session variable or extended role support
        $_SESSION['superadmin_logged_in'] = true;
        $_SESSION['current_user'] = $user;
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
    }
    exit;
}

if ($action === 'check') {
    $loggedIn = isset($_SESSION['superadmin_logged_in']) && $_SESSION['superadmin_logged_in'] === true;
    echo json_encode([
        'logged_in' => $loggedIn,
        'user' => $loggedIn ? ($_SESSION['current_user'] ?? 'unknown') : null
    ]);
    exit;
}

if ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

// Protected Actions
if (!isset($_SESSION['superadmin_logged_in'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($action === 'list_users') {
    // Only return usernames, not hashes
    $users = getUsers();
    echo json_encode(['success' => true, 'users' => array_keys($users)]);
    exit;
}

if ($action === 'update_pass') {
    $input = json_decode(file_get_contents('php://input'), true);
    $targetUser = $input['username'] ?? '';
    $newPass = $input['new_pass'] ?? '';

    if (!$targetUser || !$newPass) {
        echo json_encode(['success' => false, 'message' => 'Missing data']);
        exit;
    }

    $users = getUsers();

    // Check permissions: Only superadmin can change others, or user can change self
    $currentUser = $_SESSION['current_user'];
    if ($currentUser !== 'superadmin' && $currentUser !== $targetUser) {
        echo json_encode(['success' => false, 'message' => 'Permission denied']);
        exit;
    }

    $users[$targetUser] = password_hash($newPass, PASSWORD_BCRYPT);
    saveUsers($users);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'add_user') {
    $input = json_decode(file_get_contents('php://input'), true);
    $newUser = $input['username'] ?? '';
    $newPass = $input['password'] ?? '';

    if ($_SESSION['current_user'] !== 'superadmin') {
        echo json_encode(['success' => false, 'message' => 'Only Superadmin can add users']);
        exit;
    }

    $users = getUsers();
    if (isset($users[$newUser])) {
        echo json_encode(['success' => false, 'message' => 'User already exists']);
        exit;
    }

    $users[$newUser] = password_hash($newPass, PASSWORD_BCRYPT);
    saveUsers($users);
    echo json_encode(['success' => true]);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
?>
