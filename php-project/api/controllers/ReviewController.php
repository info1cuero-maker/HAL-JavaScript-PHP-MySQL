<?php
class ReviewController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Get reviews for a company
     */
    public function getByCompany($company_id) {
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? min(100, max(1, (int)$_GET['limit'])) : 20;
        $offset = ($page - 1) * $limit;
        
        // Get reviews
        $stmt = $this->db->prepare("
            SELECT * FROM reviews 
            WHERE company_id = ? 
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$company_id, $limit, $offset]);
        $reviews = $stmt->fetchAll();
        
        // Count total
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM reviews WHERE company_id = ?");
        $stmt->execute([$company_id]);
        $total = $stmt->fetch()['total'];
        
        Response::json([
            'reviews' => $reviews,
            'total' => (int)$total
        ]);
    }
    
    /**
     * Create review
     */
    public function create($company_id) {
        $user = JWT::requireAuth($this->db);
        $data = Response::getJsonBody();
        
        // Validate
        if (empty($data['rating']) || empty($data['comment'])) {
            Response::error('Rating and comment are required', 400);
        }
        
        $rating = (int)$data['rating'];
        if ($rating < 1 || $rating > 5) {
            Response::error('Rating must be between 1 and 5', 400);
        }
        
        // Check if company exists
        $stmt = $this->db->prepare("SELECT id FROM companies WHERE id = ?");
        $stmt->execute([$company_id]);
        if (!$stmt->fetch()) {
            Response::error('Company not found', 404);
        }
        
        // Check if user already reviewed
        $stmt = $this->db->prepare("SELECT id FROM reviews WHERE company_id = ? AND user_id = ?");
        $stmt->execute([$company_id, $user['id']]);
        if ($stmt->fetch()) {
            Response::error('You have already reviewed this company', 400);
        }
        
        // Create review
        $stmt = $this->db->prepare("
            INSERT INTO reviews (company_id, user_id, user_name, rating, comment, comment_ru)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $company_id,
            $user['id'],
            $user['name'],
            $rating,
            $data['comment'],
            $data['comment_ru'] ?? null
        ]);
        
        // Update company rating
        $stmt = $this->db->prepare("
            SELECT AVG(rating) as avg_rating, COUNT(*) as count 
            FROM reviews WHERE company_id = ?
        ");
        $stmt->execute([$company_id]);
        $result = $stmt->fetch();
        
        $stmt = $this->db->prepare("
            UPDATE companies 
            SET rating = ?, review_count = ? 
            WHERE id = ?
        ");
        $stmt->execute([
            round($result['avg_rating'], 1),
            $result['count'],
            $company_id
        ]);
        
        Response::success('Review added successfully');
    }
}
?>
