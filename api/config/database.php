<?php
/**
 * Database connection class
 */
class Database {
    // Database credentials - CHANGE THESE FOR YOUR SERVER
    private $host = 'localhost';
    private $db_name = 'hal_db';
    private $username = 'root';
    private $password = '';
    private $conn;

    /**
     * Get database connection
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch(PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            // Clear any output buffer
            if (ob_get_level() > 0) {
                ob_clean();
            }
            http_response_code(500);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode(['error' => 'Database connection failed. Please check server configuration.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        return $this->conn;
    }
}
?>
