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
    // ==================== PUBLIC ROUTES ====================
    
    // Home
    'GET ' => 'controllers/HomeController.php@index',
    
    // Companies (public)
    'GET companies' => 'controllers/CompanyController.php@getAll',
    'GET companies/(\d+)' => 'controllers/CompanyController.php@getById',
    'POST companies' => 'controllers/CompanyController.php@create',
    
    // Categories (public)
    'GET categories' => 'controllers/CategoryController.php@getAll',
    'GET categories/(\w+)' => 'controllers/CategoryController.php@getById',
    
    // Cities (public)
    'GET cities' => 'controllers/CompanyController.php@getCities',
    
    // Blog categories (public)
    'GET blog/categories' => 'controllers/BlogController.php@getCategories',
    
    // Reviews (public)
    'GET companies/(\d+)/reviews' => 'controllers/ReviewController.php@getByCompany',
    'POST companies/(\d+)/reviews' => 'controllers/ReviewController.php@create',
    
    // Blog (public)
    'GET blog' => 'controllers/BlogController.php@getAll',
    'GET blog/(\d+)' => 'controllers/BlogController.php@getById',
    
    // Auth
    'POST auth/register' => 'controllers/AuthController.php@register',
    'POST auth/login' => 'controllers/AuthController.php@login',
    'GET auth/me' => 'controllers/AuthController.php@me',
    
    // User Dashboard
    'GET users/me/dashboard' => 'controllers/UserController.php@dashboard',
    'GET users/me/companies' => 'controllers/UserController.php@myCompanies',
    'PUT users/me' => 'controllers/UserController.php@updateProfile',
    
    // Contact
    'POST contact' => 'controllers/ContactController.php@send',
    
    // ==================== ADMIN ROUTES ====================
    
    // Dashboard
    'GET admin/dashboard' => 'controllers/AdminController.php@dashboard',
    
    // Categories management
    'GET admin/categories' => 'controllers/AdminController.php@getCategories',
    'POST admin/categories' => 'controllers/AdminController.php@createCategory',
    'PUT admin/categories/(\d+)' => 'controllers/AdminController.php@updateCategory',
    'DELETE admin/categories/(\d+)' => 'controllers/AdminController.php@deleteCategory',
    
    // Companies management
    'GET admin/companies' => 'controllers/AdminController.php@getCompanies',
    'GET admin/companies/(\d+)' => 'controllers/AdminController.php@getCompany',
    'POST admin/companies' => 'controllers/AdminController.php@createCompany',
    'PUT admin/companies/(\d+)' => 'controllers/AdminController.php@updateCompany',
    'DELETE admin/companies/(\d+)' => 'controllers/AdminController.php@deleteCompany',
    
    // Company images
    'POST admin/companies/(\d+)/images' => 'controllers/AdminController.php@uploadCompanyImage',
    'DELETE admin/images/(\d+)' => 'controllers/AdminController.php@deleteCompanyImage',
    'PUT admin/companies/(\d+)/images/(\d+)/main' => 'controllers/AdminController.php@setMainImage',
    
    // Blog categories management
    'GET admin/blog-categories' => 'controllers/AdminController.php@getBlogCategories',
    'POST admin/blog-categories' => 'controllers/AdminController.php@createBlogCategory',
    'PUT admin/blog-categories/(\d+)' => 'controllers/AdminController.php@updateBlogCategory',
    'DELETE admin/blog-categories/(\d+)' => 'controllers/AdminController.php@deleteBlogCategory',
    
    // Blog posts management
    'GET admin/blog' => 'controllers/AdminController.php@getBlogPosts',
    'POST admin/blog' => 'controllers/AdminController.php@createBlogPost',
    'PUT admin/blog/(\d+)' => 'controllers/AdminController.php@updateBlogPost',
    'DELETE admin/blog/(\d+)' => 'controllers/AdminController.php@deleteBlogPost',
    
    // Reviews moderation
    'GET admin/reviews' => 'controllers/AdminController.php@getReviews',
    'PUT admin/reviews/(\d+)/moderate' => 'controllers/AdminController.php@moderateReview',
    'DELETE admin/reviews/(\d+)' => 'controllers/AdminController.php@deleteReview',
    
    // Users management
    'GET admin/users' => 'controllers/AdminController.php@getUsers',
    'PUT admin/users/(\d+)/role' => 'controllers/AdminController.php@updateUserRole',
    'PUT admin/users/(\d+)/toggle-status' => 'controllers/AdminController.php@toggleUserStatus',
    
    // Settings
    'GET admin/settings' => 'controllers/AdminController.php@getSettings',
    'PUT admin/settings' => 'controllers/AdminController.php@updateSettings',
    
    // Messages
    'GET admin/messages' => 'controllers/AdminController.php@getMessages',
    'PUT admin/messages/(\d+)/read' => 'controllers/AdminController.php@markMessageRead',
    'DELETE admin/messages/(\d+)' => 'controllers/AdminController.php@deleteMessage',
    
    // Logs
    'GET admin/logs' => 'controllers/AdminController.php@getLogs',
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
