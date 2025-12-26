<?php
class CategoryController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Get all categories with company counts
     */
    public function getAll() {
        $sql = "
            SELECT 
                cat.slug as id,
                cat.name_uk as nameUk,
                cat.name_ru as nameRu,
                cat.icon,
                COUNT(c.id) as count
            FROM categories cat
            LEFT JOIN companies c ON c.category = cat.slug AND c.is_active = 1
            GROUP BY cat.id
            ORDER BY cat.id
        ";
        
        $stmt = $this->db->query($sql);
        $categories = $stmt->fetchAll();
        
        foreach ($categories as &$cat) {
            $cat['count'] = (int)$cat['count'];
        }
        
        Response::json($categories);
    }
}
?>
