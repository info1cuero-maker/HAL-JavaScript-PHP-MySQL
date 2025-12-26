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
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $this->conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
        } catch(PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            Response::error('Database connection failed', 500);
        }

        return $this->conn;
    }
}
?>
