<?php
/**
 * Blog Controller - Public API
 */
class BlogController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Get all blog posts with pagination
     */
    public function getAll() {
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? min(100, max(1, (int)$_GET['limit'])) : 20;
        $category = $_GET['category'] ?? null;
        $offset = ($page - 1) * $limit;
        
        $where = ["bp.status = 'published'"];
        $params = [];
        
        if ($category) {
            if (is_numeric($category)) {
                // Include subcategories
                $where[] = '(bp.category_id = ? OR bp.category_id IN (SELECT id FROM blog_categories WHERE parent_id = ?))';
                $params[] = $category;
                $params[] = $category;
            } else {
                // By slug
                $where[] = '(bp.category_id IN (SELECT id FROM blog_categories WHERE slug = ? OR parent_id = (SELECT id FROM blog_categories WHERE slug = ?)))';
                $params[] = $category;
                $params[] = $category;
            }
        }
        
        $where_clause = implode(' AND ', $where);
        
        // Count total
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM blog_posts bp WHERE $where_clause");
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        // Get posts
        $params[] = $limit;
        $params[] = $offset;
        $stmt = $this->db->prepare("
            SELECT bp.*, 
                   bc.name_uk as category_name_uk,
                   bc.name_ru as category_name_ru,
                   bc.slug as category_slug,
                   u.name as author
            FROM blog_posts bp 
            LEFT JOIN blog_categories bc ON bp.category_id = bc.id
            LEFT JOIN users u ON bp.author_id = u.id
            WHERE $where_clause
            ORDER BY bp.published_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($params);
        $posts = $stmt->fetchAll();
        
        // Process posts
        foreach ($posts as &$post) {
            // Default image if none
            if (empty($post['featured_image'])) {
                $post['image'] = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=400&fit=crop';
            } else {
                $post['image'] = $post['featured_image'];
            }
            $post['views_count'] = (int)$post['views_count'];
        }
        
        Response::json([
            'posts' => $posts,
            'total' => (int)$total,
            'page' => $page,
            'pages' => (int)ceil($total / $limit),
            'limit' => $limit
        ]);
    }
    
    /**
     * Get blog post by ID or slug
     */
    public function getById($idOrSlug) {
        $sql = is_numeric($idOrSlug)
            ? "SELECT bp.*, bc.name_uk as category_name_uk, bc.name_ru as category_name_ru, bc.slug as category_slug, u.name as author 
               FROM blog_posts bp 
               LEFT JOIN blog_categories bc ON bp.category_id = bc.id 
               LEFT JOIN users u ON bp.author_id = u.id 
               WHERE bp.id = ?"
            : "SELECT bp.*, bc.name_uk as category_name_uk, bc.name_ru as category_name_ru, bc.slug as category_slug, u.name as author 
               FROM blog_posts bp 
               LEFT JOIN blog_categories bc ON bp.category_id = bc.id 
               LEFT JOIN users u ON bp.author_id = u.id 
               WHERE bp.slug = ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$idOrSlug]);
        $post = $stmt->fetch();
        
        if (!$post) {
            Response::error('Post not found', 404);
        }
        
        // Default image
        if (empty($post['featured_image'])) {
            $post['image'] = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=600&fit=crop';
        } else {
            $post['image'] = $post['featured_image'];
        }
        
        // Update views
        $stmt = $this->db->prepare("UPDATE blog_posts SET views_count = views_count + 1 WHERE id = ?");
        $stmt->execute([$post['id']]);
        
        Response::json($post);
    }
    
    /**
     * Get blog categories with hierarchical structure
     */
    public function getCategories() {
        $hierarchical = !isset($_GET['flat']) || $_GET['flat'] !== 'true';
        
        $sql = "
            SELECT 
                bc.id,
                bc.slug,
                bc.parent_id,
                bc.name_uk as nameUk,
                bc.name_ru as nameRu,
                bc.sort_order,
                COUNT(bp.id) as count
            FROM blog_categories bc
            LEFT JOIN blog_posts bp ON bp.category_id = bc.id AND bp.status = 'published'
            WHERE bc.is_active = 1
            GROUP BY bc.id
            ORDER BY bc.sort_order, bc.name_uk
        ";
        
        $stmt = $this->db->query($sql);
        $allCategories = $stmt->fetchAll();
        
        foreach ($allCategories as &$cat) {
            $cat['count'] = (int)$cat['count'];
            $cat['id'] = (int)$cat['id'];
            $cat['parent_id'] = $cat['parent_id'] ? (int)$cat['parent_id'] : null;
        }
        
        if (!$hierarchical) {
            Response::json($allCategories);
            return;
        }
        
        // Build hierarchy
        $categoriesById = [];
        foreach ($allCategories as $cat) {
            $cat['children'] = [];
            $categoriesById[$cat['id']] = $cat;
        }
        
        $rootCategories = [];
        foreach ($categoriesById as &$cat) {
            if ($cat['parent_id'] && isset($categoriesById[$cat['parent_id']])) {
                $categoriesById[$cat['parent_id']]['children'][] = &$cat;
                $categoriesById[$cat['parent_id']]['count'] += $cat['count'];
            } else {
                $rootCategories[] = &$cat;
            }
        }
        
        Response::json($rootCategories);
    }
}
?>
