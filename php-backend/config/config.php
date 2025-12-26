<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

define('JWT_SECRET', 'hal-secret-key-change-in-production-12345');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRE_DAYS', 30);

date_default_timezone_set('UTC');
?>