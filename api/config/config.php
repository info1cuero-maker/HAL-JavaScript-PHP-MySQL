<?php
/**
 * Global configuration
 */

// Start output buffering to catch any errors
ob_start();

// Error handling - convert errors to exceptions
set_error_handler(function($severity, $message, $file, $line) {
    // Log error but don't output it
    error_log("PHP Error [$severity]: $message in $file on line $line");
    return true; // Don't execute PHP internal error handler
});

// Exception handler
set_exception_handler(function($e) {
    ob_clean(); // Clear any output
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
});

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// JWT Configuration
define('JWT_SECRET', 'hal-secret-key-change-in-production-12345');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRE_DAYS', 30);

// Timezone
date_default_timezone_set('UTC');

// Error reporting - log only, never display
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
?>
