<?php
class UserController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Get user dashboard with statistics
     */
    public function dashboard() {
        $user = JWT::requireAuth($this->db);
        
        // Get user's companies
        $stmt = $this->db->prepare("
            SELECT id, name, name_ru, rating, review_count, created_at
            FROM companies
            WHERE user_id = ?
        ");
        $stmt->execute([$user['id']]);
        $companies = $stmt->fetchAll();
        
        $stats = [];
        $total_views = 0;
        $total_reviews = 0;
        
        foreach ($companies as $company) {
            // Get views
            $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM company_views WHERE company_id = ?");
            $stmt->execute([$company['id']]);
            $views = $stmt->fetch()['total'];
            
            // Views this week
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as total FROM company_views 
                WHERE company_id = ? AND viewed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ");
            $stmt->execute([$company['id']]);
            $views_week = $stmt->fetch()['total'];
            
            // Views this month
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as total FROM company_views 
                WHERE company_id = ? AND viewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ");
            $stmt->execute([$company['id']]);
            $views_month = $stmt->fetch()['total'];
            
            $stats[] = [
                'companyId' => $company['id'],
                'companyName' => $company['name'],
                'totalViews' => (int)$views,
                'viewsThisWeek' => (int)$views_week,
                'viewsThisMonth' => (int)$views_month,
                'totalReviews' => (int)$company['review_count'],
                'averageRating' => (float)$company['rating']
            ];
            
            $total_views += $views;
            $total_reviews += $company['review_count'];
        }
        
        Response::json([
            'user' => $user,
            'overview' => [
                'totalCompanies' => count($companies),
                'totalViews' => $total_views,
                'totalReviews' => $total_reviews
            ],
            'companies' => $stats
        ]);
    }
    
    /**
     * Get user's companies
     */
    public function myCompanies() {
        $user = JWT::requireAuth($this->db);
        
        $stmt = $this->db->prepare("
            SELECT c.*, GROUP_CONCAT(ci.image_url ORDER BY ci.display_order) as images
            FROM companies c
            LEFT JOIN company_images ci ON c.id = ci.company_id
            WHERE c.user_id = ?
            GROUP BY c.id
            ORDER BY c.created_at DESC
        ");
        $stmt->execute([$user['id']]);
        $companies = $stmt->fetchAll();
        
        foreach ($companies as &$company) {
            $company['images'] = $company['images'] ? explode(',', $company['images']) : [];
            $company['is_new'] = (bool)$company['is_new'];
            $company['rating'] = (float)$company['rating'];
        }
        
        Response::json($companies);
    }
    
    /**
     * Update user profile
     */
    public function updateProfile() {
        $user = JWT::requireAuth($this->db);
        $data = Response::getJsonBody();
        
        $updates = [];
        $params = [];
        
        if (isset($data['name'])) {
            $updates[] = 'name = ?';
            $params[] = $data['name'];
        }
        
        if (isset($data['phone'])) {
            $updates[] = 'phone = ?';
            $params[] = $data['phone'];
        }
        
        if (!empty($updates)) {
            $params[] = $user['id'];
            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
        }
        
        // Return updated user
        $stmt = $this->db->prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        Response::json($stmt->fetch());
    }
}
?>
