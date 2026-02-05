<?php
session_start();
header('Content-Type: application/json');

// Security Check
if (!isset($_SESSION['superadmin_logged_in']) || $_SESSION['superadmin_logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$CONFIG_FILE = '../data/site_config.json';
$UPLOAD_DIR = '../uploads/';

$method = $_SERVER['REQUEST_METHOD'];

// READ CONFIG
if ($method === 'GET') {
    if (file_exists($CONFIG_FILE)) {
        echo file_get_contents($CONFIG_FILE);
    } else {
        echo json_encode(['global' => [], 'pages' => []]);
    }
    exit;
}

// UPDATE CONFIG
if ($method === 'POST' && !isset($_FILES['file'])) {
    $input = file_get_contents('php://input');
    // Validate JSON?
    $data = json_decode($input, true);
    if ($data) {
        // Pretty print for readability
        file_put_contents($CONFIG_FILE, json_encode($data, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    }
    exit;
}

// UPLOAD FILE
if ($method === 'POST' && isset($_FILES['file'])) {
    if (!file_exists($UPLOAD_DIR)) {
        mkdir($UPLOAD_DIR, 0777, true);
    }
    
    $file = $_FILES['file'];
    $fileName = time() . '_' . basename($file['name']);
    $targetPath = $UPLOAD_DIR . $fileName;
    
    // Check file type (basic image/video check)
    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm'];
    
    if (in_array($ext, $allowed)) {
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            // Return relative path for frontend usage
            echo json_encode(['success' => true, 'url' => '../uploads/' . $fileName]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid file type']);
    }
    exit;
}

// CREATE PAGE (Tiny CMS)
if ($method === 'POST' && $action === 'create_page') {
    $input = json_decode(file_get_contents('php://input'), true);
    $slug = $input['slug'] ?? '';
    $title = $input['title'] ?? '';
    $heroTitle = $input['heroTitle'] ?? '';

    if (!$slug || !$title) {
        echo json_encode(['success' => false, 'message' => 'Missing data']);
        exit;
    }

    $templatePath = '../templates/page_template.html';
    $targetPath = '../pages/' . $slug . '.html';

    if (!file_exists($templatePath)) {
        echo json_encode(['success' => false, 'message' => 'Template not found']);
        exit;
    }

    if (file_exists($targetPath)) {
        echo json_encode(['success' => false, 'message' => 'Page already exists']);
        exit;
    }

    $content = file_get_contents($templatePath);
    $content = str_replace('{{TITLE}}', $title, $content);
    $content = str_replace('{{HERO_TITLE}}', $heroTitle ?: $title, $content);

    if (file_put_contents($targetPath, $content)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to write file']);
    }
    exit;
}
?>
