<?php
class HomeController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    public function index() {
        Response::json([
            'message' => 'HAL API v1.0',
            'endpoints' => [
                'GET /api/companies' => 'Get all companies',
                'GET /api/companies/{id}' => 'Get company by ID',
                'GET /api/categories' => 'Get all categories',
                'POST /api/auth/register' => 'Register user',
                'POST /api/auth/login' => 'Login user',
                'GET /api/blog' => 'Get blog posts',
                'GET /api/pages/{slug}' => 'Get page SEO data'
            ]
        ]);
    }
    
    /**
     * Get page SEO data by slug
     */
    public function getPageSeo($slug) {
        $stmt = $this->db->prepare("SELECT * FROM pages WHERE slug = ? AND is_active = 1");
        $stmt->execute([$slug]);
        $page = $stmt->fetch();
        
        if (!$page) {
            // Return default SEO data
            Response::json([
                'slug' => $slug,
                'meta_title_uk' => 'HAL - Каталог компаній',
                'meta_title_ru' => 'HAL - Каталог компаний',
                'meta_description_uk' => 'Знайдіть найкращі компанії та послуги у вашому місті',
                'meta_description_ru' => 'Найдите лучшие компании и услуги в вашем городе',
                'meta_keywords_uk' => 'каталог, компанії, послуги',
                'meta_keywords_ru' => 'каталог, компании, услуги'
            ]);
            return;
        }
        
        Response::json($page);
    }
}
?>
