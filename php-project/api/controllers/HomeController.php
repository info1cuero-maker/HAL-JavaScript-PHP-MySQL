<?php
class HomeController {
    public function index() {
        Response::json([
            'message' => 'HAL API v1.0',
            'endpoints' => [
                'GET /api/companies' => 'Get all companies',
                'GET /api/companies/{id}' => 'Get company by ID',
                'GET /api/categories' => 'Get all categories',
                'POST /api/auth/register' => 'Register user',
                'POST /api/auth/login' => 'Login user',
                'GET /api/blog' => 'Get blog posts'
            ]
        ]);
    }
}
?>
