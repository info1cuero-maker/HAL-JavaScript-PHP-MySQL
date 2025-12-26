<?php
class BlogController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Get all blog posts
     */
    public function getAll() {
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? min(100, max(1, (int)$_GET['limit'])) : 20;
        $offset = ($page - 1) * $limit;
        
        $stmt = $this->db->prepare("
            SELECT * FROM blog_posts 
            ORDER BY published_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        $posts = $stmt->fetchAll();
        
        // Count total
        $stmt = $this->db->query("SELECT COUNT(*) as total FROM blog_posts");
        $total = $stmt->fetch()['total'];
        
        Response::json([
            'posts' => $posts,
            'total' => (int)$total
        ]);
    }
    
    /**
     * Get blog post by ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM blog_posts WHERE id = ?");
        $stmt->execute([$id]);
        $post = $stmt->fetch();
        
        if (!$post) {
            Response::error('Post not found', 404);
        }
        
        Response::json($post);
    }
}
?>
