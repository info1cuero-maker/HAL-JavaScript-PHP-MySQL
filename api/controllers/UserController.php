<?php
class UserController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Get user dashboard with statistics and date filtering
     */
    public function dashboard() {
        $user = JWT::requireAuth($this->db);
        
        // Date range filter
        $dateFrom = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
        $dateTo = $_GET['to'] ?? date('Y-m-d');
        
        // Get user's companies
        $stmt = $this->db->prepare("
            SELECT c.*, 
                   (SELECT filename FROM company_images WHERE company_id = c.id AND is_main = 1 LIMIT 1) as main_image
            FROM companies
            c WHERE user_id = ?
        ");
        $stmt->execute([$user['id']]);
        $companies = $stmt->fetchAll();
        
        $stats = [];
        $total_views = 0;
        $total_reviews = 0;
        $dailyStats = [];
        
        foreach ($companies as $company) {
            // Get total views for date range
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as total FROM company_views 
                WHERE company_id = ? AND DATE(viewed_at) BETWEEN ? AND ?
            ");
            $stmt->execute([$company['id'], $dateFrom, $dateTo]);
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
            
            // Get reviews count for date range
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as total FROM reviews 
                WHERE company_id = ? AND DATE(created_at) BETWEEN ? AND ?
            ");
            $stmt->execute([$company['id'], $dateFrom, $dateTo]);
            $reviews_count = $stmt->fetch()['total'];
            
            // Get daily views for chart
            $stmt = $this->db->prepare("
                SELECT DATE(viewed_at) as date, COUNT(*) as views 
                FROM company_views 
                WHERE company_id = ? AND DATE(viewed_at) BETWEEN ? AND ?
                GROUP BY DATE(viewed_at)
                ORDER BY date
            ");
            $stmt->execute([$company['id'], $dateFrom, $dateTo]);
            $daily = $stmt->fetchAll();
            
            // Fill missing dates with 0
            $start = new DateTime($dateFrom);
            $end = new DateTime($dateTo);
            $interval = DateInterval::createFromDateString('1 day');
            $period = new DatePeriod($start, $interval, $end->modify('+1 day'));
            
            $dailyMap = [];
            foreach ($daily as $d) {
                $dailyMap[$d['date']] = (int)$d['views'];
            }
            
            foreach ($period as $dt) {
                $dateKey = $dt->format('Y-m-d');
                $dailyStats[] = [
                    'date' => $dateKey,
                    'views' => $dailyMap[$dateKey] ?? 0
                ];
            }
            
            $mainImage = $company['main_image'] 
                ? '/uploads/companies/' . $company['main_image'] 
                : null;
            
            $stats[] = [
                'companyId' => $company['id'],
                'companyName' => $company['name'],
                'city' => $company['city'],
                'phone' => $company['phone'],
                'mainImage' => $mainImage,
                'totalViews' => (int)$views,
                'viewsThisWeek' => (int)$views_week,
                'viewsThisMonth' => (int)$views_month,
                'totalReviews' => (int)$company['review_count'],
                'reviewsInPeriod' => (int)$reviews_count,
                'averageRating' => (float)$company['rating']
            ];
            
            $total_views += $views;
            $total_reviews += $company['review_count'];
        }
        
        Response::json([
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'phone' => $user['phone'] ?? null
            ],
            'overview' => [
                'totalCompanies' => count($companies),
                'totalViews' => $total_views,
                'totalReviews' => $total_reviews
            ],
            'companies' => $stats,
            'dailyStats' => $dailyStats,
            'dateRange' => [
                'from' => $dateFrom,
                'to' => $dateTo
            ]
        ]);
    }
    
    /**
     * Get user's reviews
     */
    public function myReviews() {
        $user = JWT::requireAuth($this->db);
        
        $stmt = $this->db->prepare("
            SELECT r.*, u.name as user_name, c.name as company_name
            FROM reviews r
            JOIN companies c ON r.company_id = c.id
            LEFT JOIN users u ON r.user_id = u.id
            WHERE c.user_id = ?
            ORDER BY r.created_at DESC
            LIMIT 100
        ");
        $stmt->execute([$user['id']]);
        
        Response::json($stmt->fetchAll());
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
    
    /**
     * Get user's company for editing
     */
    public function getMyCompany($id) {
        $user = JWT::requireAuth($this->db);
        
        $stmt = $this->db->prepare("
            SELECT c.*, cat.name_uk as category_name
            FROM companies c
            LEFT JOIN categories cat ON cat.id = c.category_id
            WHERE c.id = ? AND c.user_id = ?
        ");
        $stmt->execute([$id, $user['id']]);
        $company = $stmt->fetch();
        
        if (!$company) {
            Response::error('Company not found or access denied', 404);
        }
        
        // Get images
        $stmt = $this->db->prepare("SELECT * FROM company_images WHERE company_id = ? ORDER BY display_order");
        $stmt->execute([$id]);
        $company['images'] = $stmt->fetchAll();
        
        Response::json($company);
    }
    
    /**
     * Update user's own company
     */
    public function updateMyCompany($id) {
        $user = JWT::requireAuth($this->db);
        $data = Response::getJsonBody();
        
        // Check ownership
        $stmt = $this->db->prepare("SELECT user_id FROM companies WHERE id = ?");
        $stmt->execute([$id]);
        $company = $stmt->fetch();
        
        if (!$company || $company['user_id'] != $user['id']) {
            Response::error('Access denied', 403);
        }
        
        $allowedFields = ['name', 'name_ru', 'description', 'description_ru', 'city', 'address', 'phone', 'email', 'website'];
        
        $fields = [];
        $params = [];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            Response::error('No fields to update', 400);
        }
        
        $params[] = $id;
        $stmt = $this->db->prepare("UPDATE companies SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);
        
        Response::success('Company updated');
    }
    
    /**
     * Upload image to user's own company
     */
    public function uploadMyCompanyImage($companyId) {
        $user = JWT::requireAuth($this->db);
        
        // Check ownership
        $stmt = $this->db->prepare("SELECT user_id FROM companies WHERE id = ?");
        $stmt->execute([$companyId]);
        $company = $stmt->fetch();
        
        if (!$company || $company['user_id'] != $user['id']) {
            Response::error('Access denied', 403);
        }
        
        if (empty($_FILES['image'])) {
            Response::error('No image uploaded', 400);
        }
        
        $file = $_FILES['image'];
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        
        // Check WebP
        if ($mimeType !== 'image/webp') {
            Response::error('Only WebP images are allowed', 400);
        }
        
        // Check count (max 10)
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM company_images WHERE company_id = ?");
        $stmt->execute([$companyId]);
        if ($stmt->fetch()['count'] >= 10) {
            Response::error('Maximum 10 images per company', 400);
        }
        
        // Generate filename
        $filename = uniqid('company_') . '_' . time() . '.webp';
        $uploadDir = __DIR__ . '/../uploads/companies/';
        
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        if (!move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
            Response::error('Failed to upload image', 500);
        }
        
        // Check if first image (make it main)
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM company_images WHERE company_id = ?");
        $stmt->execute([$companyId]);
        $isMain = $stmt->fetch()['count'] === 0;
        
        $stmt = $this->db->prepare("
            INSERT INTO company_images (company_id, filename, original_name, file_size, is_main, display_order)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $companyId,
            $filename,
            $file['name'],
            $file['size'],
            $isMain ? 1 : 0,
            $isMain ? 0 : 99
        ]);
        
        Response::json([
            'id' => $this->db->lastInsertId(),
            'filename' => $filename,
            'message' => 'Image uploaded'
        ]);
    }
    
    /**
     * Delete image from user's own company
     */
    public function deleteMyCompanyImage($imageId) {
        $user = JWT::requireAuth($this->db);
        
        // Check ownership via image
        $stmt = $this->db->prepare("
            SELECT ci.*, c.user_id 
            FROM company_images ci
            JOIN companies c ON c.id = ci.company_id
            WHERE ci.id = ?
        ");
        $stmt->execute([$imageId]);
        $image = $stmt->fetch();
        
        if (!$image || $image['user_id'] != $user['id']) {
            Response::error('Access denied', 403);
        }
        
        // Delete file
        $filepath = __DIR__ . '/../uploads/companies/' . $image['filename'];
        if (file_exists($filepath)) {
            unlink($filepath);
        }
        
        $stmt = $this->db->prepare("DELETE FROM company_images WHERE id = ?");
        $stmt->execute([$imageId]);
        
        Response::success('Image deleted');
    }
}
