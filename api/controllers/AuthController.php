<?php
class AuthController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Register new user
     */
    public function register() {
        $data = Response::getJsonBody();
        
        // Validate
        if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            Response::error('Name, email and password are required', 400);
        }
        
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email format', 400);
        }
        
        if (strlen($data['password']) < 6) {
            Response::error('Password must be at least 6 characters', 400);
        }
        
        // Check if email exists
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            Response::error('Email already registered', 400);
        }
        
        // Create user
        $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $stmt = $this->db->prepare("
            INSERT INTO users (name, email, password, phone, role)
            VALUES (?, ?, ?, ?, 'user')
        ");
        $stmt->execute([
            $data['name'],
            $data['email'],
            $password_hash,
            $data['phone'] ?? null
        ]);
        
        $user_id = $this->db->lastInsertId();
        
        // Get user
        $stmt = $this->db->prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();
        
        // Create token
        $token = JWT::encode(['sub' => $user['id']]);
        
        Response::json([
            'user' => $user,
            'token' => $token
        ], 201);
    }
    
    /**
     * Login user
     */
    public function login() {
        $data = Response::getJsonBody();
        
        if (empty($data['email']) || empty($data['password'])) {
            Response::error('Email and password are required', 400);
        }
        
        // Get user
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($data['password'], $user['password'])) {
            Response::error('Invalid email or password', 401);
        }
        
        // Create token
        $token = JWT::encode(['sub' => $user['id']]);
        
        // Remove password from response
        unset($user['password']);
        
        Response::json([
            'user' => $user,
            'token' => $token
        ]);
    }
    
    /**
     * Get current user
     */
    public function me() {
        $user = JWT::requireAuth($this->db);
        Response::json($user);
    }
}
?>
