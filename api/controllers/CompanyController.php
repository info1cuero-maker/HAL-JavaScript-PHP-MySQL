<?php
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
        $search = $_GET['search'] ?? null;
        $sort = $_GET['sort'] ?? 'recent';
        $isNew = isset($_GET['isNew']) ? filter_var($_GET['isNew'], FILTER_VALIDATE_BOOLEAN) : null;
        
        $offset = ($page - 1) * $limit;
        
        // Build query
        $where = ['c.is_active = 1'];
        $params = [];
        
        if ($category) {
            $where[] = 'c.category = ?';
            $params[] = $category;
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
            'popular' => 'c.review_count DESC, c.rating DESC',
            'rating' => 'c.rating DESC, c.review_count DESC',
            default => 'c.created_at DESC'
        };
        
        // Count total
        $count_sql = "SELECT COUNT(*) as total FROM companies c WHERE $where_clause";
        $stmt = $this->db->prepare($count_sql);
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        // Get companies
        $sql = "
            SELECT c.*, 
                   GROUP_CONCAT(ci.image_url ORDER BY ci.display_order) as images
            FROM companies c
            LEFT JOIN company_images ci ON c.id = ci.company_id
            WHERE $where_clause
            GROUP BY c.id
            ORDER BY $order_by
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $companies = $stmt->fetchAll();
        
        // Process images
        foreach ($companies as &$company) {
            $company['images'] = $company['images'] ? explode(',', $company['images']) : [];
            $company['is_new'] = (bool)$company['is_new'];
            $company['is_active'] = (bool)$company['is_active'];
            $company['rating'] = (float)$company['rating'];
            $company['review_count'] = (int)$company['review_count'];
        }
        
        Response::json([
            'companies' => $companies,
            'total' => (int)$total,
            'page' => $page,
            'pages' => (int)ceil($total / $limit)
        ]);
    }
    
    /**
     * Get company by ID
     */
    public function getById($id) {
        $sql = "
            SELECT c.*, 
                   GROUP_CONCAT(ci.image_url ORDER BY ci.display_order) as images
            FROM companies c
            LEFT JOIN company_images ci ON c.id = ci.company_id
            WHERE c.id = ?
            GROUP BY c.id
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        $company = $stmt->fetch();
        
        if (!$company) {
            Response::error('Company not found', 404);
        }
        
        // Process
        $company['images'] = $company['images'] ? explode(',', $company['images']) : [];
        $company['is_new'] = (bool)$company['is_new'];
        $company['is_active'] = (bool)$company['is_active'];
        $company['rating'] = (float)$company['rating'];
        $company['review_count'] = (int)$company['review_count'];
        
        // Track view
        $user = JWT::getCurrentUser($this->db);
        $stmt = $this->db->prepare("INSERT INTO company_views (company_id, user_id) VALUES (?, ?)");
        $stmt->execute([$id, $user ? $user['id'] : null]);
        
        Response::json($company);
    }
    
    /**
     * Create company
     */
    public function create() {
        $user = JWT::requireAuth($this->db);
        $data = Response::getJsonBody();
        
        // Validate required fields
        $required = ['name', 'name_ru', 'description', 'description_ru', 'category', 'city', 'address', 'phone', 'email', 'image'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                Response::error("Field '$field' is required", 400);
            }
        }
        
        $sql = "
            INSERT INTO companies 
            (name, name_ru, description, description_ru, category, city, address, lat, lng, phone, email, website, image, user_id, is_new)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $data['name'],
            $data['name_ru'],
            $data['description'],
            $data['description_ru'],
            $data['category'],
            $data['city'],
            $data['address'],
            $data['lat'] ?? null,
            $data['lng'] ?? null,
            $data['phone'],
            $data['email'],
            $data['website'] ?? null,
            $data['image'],
            $user['id']
        ]);
        
        $company_id = $this->db->lastInsertId();
        
        // Insert additional images
        if (!empty($data['images']) && is_array($data['images'])) {
            $img_stmt = $this->db->prepare("INSERT INTO company_images (company_id, image_url, display_order) VALUES (?, ?, ?)");
            foreach ($data['images'] as $index => $image_url) {
                $img_stmt->execute([$company_id, $image_url, $index]);
            }
        }
        
        $this->getById($company_id);
    }
    
    /**
     * Update company
     */
    public function update($id) {
        $user = JWT::requireAuth($this->db);
        
        // Check ownership
        $stmt = $this->db->prepare("SELECT * FROM companies WHERE id = ?");
        $stmt->execute([$id]);
        $company = $stmt->fetch();
        
        if (!$company) {
            Response::error('Company not found', 404);
        }
        
        if ($company['user_id'] != $user['id'] && $user['role'] !== 'admin') {
            Response::error('Not authorized', 403);
        }
        
        $data = Response::getJsonBody();
        
        // Build update query
        $fields = ['name', 'name_ru', 'description', 'description_ru', 'category', 'city', 'address', 'lat', 'lng', 'phone', 'email', 'website', 'image'];
        $updates = [];
        $params = [];
        
        foreach ($fields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (!empty($updates)) {
            $params[] = $id;
            $sql = "UPDATE companies SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
        }
        
        $this->getById($id);
    }
    
    /**
     * Delete company
     */
    public function delete($id) {
        $user = JWT::requireAuth($this->db);
        
        // Check ownership
        $stmt = $this->db->prepare("SELECT * FROM companies WHERE id = ?");
        $stmt->execute([$id]);
        $company = $stmt->fetch();
        
        if (!$company) {
            Response::error('Company not found', 404);
        }
        
        if ($company['user_id'] != $user['id'] && $user['role'] !== 'admin') {
            Response::error('Not authorized', 403);
        }
        
        $stmt = $this->db->prepare("DELETE FROM companies WHERE id = ?");
        $stmt->execute([$id]);
        
        Response::success('Company deleted');
    }
}
?>
