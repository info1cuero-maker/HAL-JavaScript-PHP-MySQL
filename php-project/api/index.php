<?php
/**
 * HAL API Router
 * Main entry point for all API requests
 */

require_once 'config/config.php';
require_once 'config/database.php';
require_once 'helpers/jwt.php';
require_once 'helpers/response.php';

// Get the request path
$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/api';

// Remove base path and query string
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace($base_path, '', $path);
$path = trim($path, '/');

$method = $_SERVER['REQUEST_METHOD'];

// Route mapping
$routes = [
    // Companies
    'GET companies' => 'controllers/CompanyController.php@getAll',
    'GET companies/(\d+)' => 'controllers/CompanyController.php@getById',
    'POST companies' => 'controllers/CompanyController.php@create',
    'PUT companies/(\d+)' => 'controllers/CompanyController.php@update',
    'DELETE companies/(\d+)' => 'controllers/CompanyController.php@delete',
    
    // Categories
    'GET categories' => 'controllers/CategoryController.php@getAll',
    
    // Auth
    'POST auth/register' => 'controllers/AuthController.php@register',
    'POST auth/login' => 'controllers/AuthController.php@login',
    'GET auth/me' => 'controllers/AuthController.php@me',
    
    // User Dashboard
    'GET users/me/dashboard' => 'controllers/UserController.php@dashboard',
    'GET users/me/companies' => 'controllers/UserController.php@myCompanies',
    'PUT users/me' => 'controllers/UserController.php@updateProfile',
    
    // Reviews
    'GET companies/(\d+)/reviews' => 'controllers/ReviewController.php@getByCompany',
    'POST companies/(\d+)/reviews' => 'controllers/ReviewController.php@create',
    
    // Blog
    'GET blog' => 'controllers/BlogController.php@getAll',
    'GET blog/(\d+)' => 'controllers/BlogController.php@getById',
    
    // Contact
    'POST contact' => 'controllers/ContactController.php@send',
    
    // Root
    'GET ' => 'controllers/HomeController.php@index'
];

// Find matching route
$matched = false;
$params = [];

foreach ($routes as $route => $handler) {
    list($route_method, $route_path) = explode(' ', $route, 2);
    
    if ($route_method !== $method) continue;
    
    // Convert route pattern to regex
    $pattern = '#^' . $route_path . '$#';
    
    if (preg_match($pattern, $path, $matches)) {
        $matched = true;
        array_shift($matches); // Remove full match
        $params = $matches;
        
        // Load controller and call method
        list($controller_file, $method_name) = explode('@', $handler);
        require_once $controller_file;
        
        // Get controller class name
        $controller_name = basename($controller_file, '.php');
        $controller = new $controller_name();
        
        // Call method with params
        call_user_func_array([$controller, $method_name], $params);
        break;
    }
}

if (!$matched) {
    Response::error('Endpoint not found', 404);
}
?>
