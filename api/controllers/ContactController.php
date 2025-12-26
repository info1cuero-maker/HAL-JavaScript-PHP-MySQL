<?php
class ContactController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Send contact message
     */
    public function send() {
        $data = Response::getJsonBody();
        
        // Validate
        if (empty($data['name']) || empty($data['email']) || empty($data['message'])) {
            Response::error('Name, email and message are required', 400);
        }
        
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email format', 400);
        }
        
        $stmt = $this->db->prepare("
            INSERT INTO contact_messages (name, email, message)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([
            $data['name'],
            $data['email'],
            $data['message']
        ]);
        
        Response::success('Message sent successfully');
    }
}
?>
