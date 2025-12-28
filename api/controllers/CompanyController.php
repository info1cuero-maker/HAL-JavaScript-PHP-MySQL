<?php
/**
 * Company Controller - Public API
 */
class CompanyController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Get all companies with filtering and pagination
     */
    public function getAll() {
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? min(100, max(1, (int)$_GET['limit'])) : 20;
        $category = $_GET['category'] ?? null;
        $city = $_GET['city'] ?? null;
        $search = $_GET['search'] ?? null;
        $sort = $_GET['sort'] ?? 'recent';
        $isNew = isset($_GET['isNew']) ? filter_var($_GET['isNew'], FILTER_VALIDATE_BOOLEAN) : null;
        
        $offset = ($page - 1) * $limit;
        
        // Build query
        $where = ['c.is_active = 1'];
        $params = [];
        
        if ($category) {
            // Support both category_id and slug
            if (is_numeric($category)) {
                // Include subcategories if parent category
                $where[] = '(c.category_id = ? OR c.category_id IN (SELECT id FROM categories WHERE parent_id = ?))';
                $params[] = $category;
                $params[] = $category;
            } else {
                // By slug - get category id first, include subcategories
                $where[] = '(c.category_id IN (SELECT id FROM categories WHERE slug = ? OR parent_id = (SELECT id FROM categories WHERE slug = ?)))';
                $params[] = $category;
                $params[] = $category;
            }
        }
        
        if ($city) {
            $where[] = 'c.city LIKE ?';
            $params[] = "%$city%";
        }
        
        if ($isNew !== null) {
            $where[] = 'c.is_new = ?';
            $params[] = $isNew ? 1 : 0;
        }
        
        if ($search) {
            $where[] = '(c.name LIKE ? OR c.name_ru LIKE ? OR c.description LIKE ? OR c.description_ru LIKE ?)';
            $search_term = "%$search%";
            $params = array_merge($params, [$search_term, $search_term, $search_term, $search_term]);
        }
        
        $where_clause = implode(' AND ', $where);
        
        // Sort
        $order_by = match($sort) {
            'popular' => 'c.views_count DESC, c.rating DESC',
            'rating' => 'c.rating DESC, c.review_count DESC',
            default => 'c.created_at DESC'
        };
        
        // Count total
        $count_sql = "SELECT COUNT(*) as total FROM companies c WHERE $where_clause";
        $stmt = $this->db->prepare($count_sql);
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        // Get companies with main image
        $sql = "
            SELECT c.*, 
                   cat.name_uk as category_name,
                   cat.slug as category_slug,
                   (SELECT filename FROM company_images WHERE company_id = c.id AND is_main = 1 LIMIT 1) as image
            FROM companies c
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE $where_clause
            ORDER BY $order_by
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $companies = $stmt->fetchAll();
        
        // Process data
        foreach ($companies as &$company) {
            // Set default image if none
            if ($company['image']) {
                $company['image'] = '/uploads/companies/' . $company['image'];
            } else {
                $company['image'] = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=300&fit=crop';
            }
            $company['is_new'] = (bool)$company['is_new'];
            $company['is_active'] = (bool)$company['is_active'];
            $company['rating'] = (float)$company['rating'];
            $company['review_count'] = (int)$company['review_count'];
        }
        
        Response::json([
            'companies' => $companies,
            'total' => (int)$total,
            'page' => $page,
            'pages' => (int)ceil($total / $limit),
            'limit' => $limit
        ]);
    }
    
    /**
     * Get company by ID
     */
    public function getById($id) {
        $sql = "
            SELECT c.*, 
                   cat.name_uk as category_name,
                   cat.slug as category_slug,
                   u.name as owner_name
            FROM companies c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        $company = $stmt->fetch();
        
        if (!$company) {
            Response::error('Company not found', 404);
        }
        
        // Get images
        $stmt = $this->db->prepare("SELECT filename, is_main FROM company_images WHERE company_id = ? ORDER BY display_order");
        $stmt->execute([$id]);
        $images = $stmt->fetchAll();
        $company['images'] = array_map(fn($img) => '/uploads/companies/' . $img['filename'], $images);
        
        // Default image if none
        if (empty($company['images'])) {
            $company['images'] = ['https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=600&fit=crop'];
        }
        $company['image'] = $company['images'][0];
        
        // Process booleans
        $company['is_new'] = (bool)$company['is_new'];
        $company['is_active'] = (bool)$company['is_active'];
        $company['is_featured'] = (bool)$company['is_featured'];
        $company['rating'] = (float)$company['rating'];
        $company['review_count'] = (int)$company['review_count'];
        
        // Track view
        $user = JWT::getCurrentUser($this->db);
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $stmt = $this->db->prepare("INSERT INTO company_views (company_id, user_id, ip_address, user_agent) VALUES (?, ?, ?, ?)");
        $stmt->execute([$id, $user ? $user['id'] : null, $ip, $_SERVER['HTTP_USER_AGENT'] ?? null]);
        
        // Update views count
        $stmt = $this->db->prepare("UPDATE companies SET views_count = views_count + 1 WHERE id = ?");
        $stmt->execute([$id]);
        
        Response::json($company);
    }
    
    /**
     * Create company (for authenticated users)
     */
    public function create() {
        $user = JWT::requireAuth($this->db);
        $data = Response::getJsonBody();
        
        // Validate required fields
        $required = ['name', 'name_ru', 'description', 'description_ru', 'city', 'address', 'phone', 'email'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                Response::error("Field '$field' is required", 400);
            }
        }
        
        $sql = "
            INSERT INTO companies 
            (name, name_ru, description, description_ru, category_id, city, address, lat, lng, phone, email, website, user_id, is_new)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $data['name'],
            $data['name_ru'],
            $data['description'],
            $data['description_ru'],
            $data['category_id'] ?? null,
            $data['city'],
            $data['address'],
            $data['lat'] ?? null,
            $data['lng'] ?? null,
            $data['phone'],
            $data['email'],
            $data['website'] ?? null,
            $user['id']
        ]);
        
        $company_id = $this->db->lastInsertId();
        
        Response::json(['id' => $company_id, 'message' => 'Company created'], 201);
    }
    
    /**
     * Get cities list for filter
     */
    public function getCities() {
        $stmt = $this->db->query("
            SELECT DISTINCT city, COUNT(*) as count 
            FROM companies 
            WHERE is_active = 1 AND city IS NOT NULL AND city != ''
            GROUP BY city 
            ORDER BY count DESC, city ASC
            LIMIT 50
        ");
        
        Response::json($stmt->fetchAll());
    }
}
?>
