<?php
/**
 * Category Controller - Public API
 */
class CategoryController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Get all categories with hierarchical structure and company counts
     */
    public function getAll() {
        $includeEmpty = isset($_GET['includeEmpty']) && $_GET['includeEmpty'] === 'true';
        $hierarchical = !isset($_GET['flat']) || $_GET['flat'] !== 'true';
        
        // Get all categories
        $sql = "
            SELECT 
                cat.id,
                cat.slug,
                cat.parent_id,
                cat.name_uk as nameUk,
                cat.name_ru as nameRu,
                cat.description_uk as descriptionUk,
                cat.description_ru as descriptionRu,
                cat.icon,
                cat.sort_order,
                cat.is_active,
                COUNT(DISTINCT c.id) as count
            FROM categories cat
            LEFT JOIN companies c ON c.category_id = cat.id AND c.is_active = 1
            WHERE cat.is_active = 1
            GROUP BY cat.id
            ORDER BY cat.sort_order, cat.name_uk
        ";
        
        $stmt = $this->db->query($sql);
        $allCategories = $stmt->fetchAll();
        
        // Process counts and filter
        foreach ($allCategories as &$cat) {
            $cat['count'] = (int)$cat['count'];
            $cat['id'] = (int)$cat['id'];
            $cat['parent_id'] = $cat['parent_id'] ? (int)$cat['parent_id'] : null;
            $cat['is_active'] = (bool)$cat['is_active'];
        }
        
        // Filter empty if needed
        if (!$includeEmpty) {
            // Keep parent categories even if empty (they may have children with companies)
            $parentIds = array_filter(array_column($allCategories, 'parent_id'));
            $allCategories = array_filter($allCategories, function($cat) use ($parentIds) {
                return $cat['count'] > 0 || in_array($cat['id'], $parentIds);
            });
            $allCategories = array_values($allCategories);
        }
        
        if (!$hierarchical) {
            Response::json($allCategories);
            return;
        }
        
        // Build hierarchical structure
        $categoriesById = [];
        foreach ($allCategories as $cat) {
            $cat['children'] = [];
            $categoriesById[$cat['id']] = $cat;
        }
        
        $rootCategories = [];
        foreach ($categoriesById as &$cat) {
            if ($cat['parent_id'] && isset($categoriesById[$cat['parent_id']])) {
                $categoriesById[$cat['parent_id']]['children'][] = &$cat;
                // Add children count to parent
                $categoriesById[$cat['parent_id']]['count'] += $cat['count'];
            } else {
                $rootCategories[] = &$cat;
            }
        }
        
        Response::json($rootCategories);
    }
    
    /**
     * Get single category by ID or slug
     */
    public function getById($idOrSlug) {
        $sql = is_numeric($idOrSlug) 
            ? "SELECT * FROM categories WHERE id = ?"
            : "SELECT * FROM categories WHERE slug = ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$idOrSlug]);
        $category = $stmt->fetch();
        
        if (!$category) {
            Response::error('Category not found', 404);
        }
        
        // Get subcategories
        $stmt = $this->db->prepare("
            SELECT id, slug, name_uk, name_ru, icon,
                   (SELECT COUNT(*) FROM companies WHERE category_id = categories.id AND is_active = 1) as count
            FROM categories 
            WHERE parent_id = ? AND is_active = 1
            ORDER BY sort_order
        ");
        $stmt->execute([$category['id']]);
        $category['children'] = $stmt->fetchAll();
        
        // Get company count
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM companies WHERE category_id = ? AND is_active = 1");
        $stmt->execute([$category['id']]);
        $category['count'] = (int)$stmt->fetch()['count'];
        
        Response::json($category);
    }
}
?>
