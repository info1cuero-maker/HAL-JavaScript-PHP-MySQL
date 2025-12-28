<?php
/**
 * Admin Controller - CMS Management
 */
class AdminController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Require admin or analyst role
     */
    private function requireAdminAccess($allowAnalyst = true) {
        $user = JWT::requireAuth($this->db);
        $allowedRoles = $allowAnalyst ? ['admin', 'analyst'] : ['admin'];
        
        if (!in_array($user['role'], $allowedRoles)) {
            Response::error('Access denied. Admin privileges required.', 403);
        }
        return $user;
    }
    
    /**
     * Log admin action
     */
    private function logAction($userId, $action, $entityType, $entityId = null, $details = null) {
        $stmt = $this->db->prepare(
            "INSERT INTO admin_logs (user_id, action, entity_type, entity_id, details, ip_address) 
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $userId, 
            $action, 
            $entityType, 
            $entityId, 
            $details ? json_encode($details) : null,
            $_SERVER['REMOTE_ADDR'] ?? null
        ]);
    }
    
    // ==================== DASHBOARD ====================
    
    /**
     * Get admin dashboard statistics
     */
    public function dashboard() {
        $user = $this->requireAdminAccess();
        
        // Get counts
        $stats = [];
        
        // Companies
        $stmt = $this->db->query("SELECT COUNT(*) as total, SUM(is_active) as active FROM companies");
        $stats['companies'] = $stmt->fetch();
        
        // Users
        $stmt = $this->db->query("SELECT COUNT(*) as total FROM users");
        $stats['users'] = $stmt->fetch()['total'];
        
        // Reviews
        $stmt = $this->db->query("SELECT COUNT(*) as total, SUM(status='pending') as pending FROM reviews");
        $stats['reviews'] = $stmt->fetch();
        
        // Blog posts
        $stmt = $this->db->query("SELECT COUNT(*) as total, SUM(status='published') as published FROM blog_posts");
        $stats['blog'] = $stmt->fetch();
        
        // Contact messages
        $stmt = $this->db->query("SELECT COUNT(*) as total, SUM(NOT is_read) as unread FROM contact_messages");
        $stats['messages'] = $stmt->fetch();
        
        // Recent activity
        $stmt = $this->db->query("SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 10");
        $stats['recent_logs'] = $stmt->fetchAll();
        
        // Views today
        $stmt = $this->db->query("SELECT COUNT(*) as total FROM company_views WHERE DATE(viewed_at) = CURDATE()");
        $stats['views_today'] = $stmt->fetch()['total'];
        
        Response::json($stats);
    }
    
    // ==================== CATEGORIES ====================
    
    /**
     * Get all categories
     */
    public function getCategories() {
        $this->requireAdminAccess();
        
        $stmt = $this->db->query("
            SELECT c.*, 
                   p.name_uk as parent_name,
                   COUNT(co.id) as companies_count 
            FROM categories c 
            LEFT JOIN categories p ON c.parent_id = p.id
            LEFT JOIN companies co ON co.category_id = c.id 
            GROUP BY c.id 
            ORDER BY c.parent_id IS NULL DESC, c.sort_order, c.name_uk
        ");
        Response::json($stmt->fetchAll());
    }
    
    /**
     * Create category
     */
    public function createCategory() {
        $user = $this->requireAdminAccess(false);
        $data = Response::getJsonBody();
        
        $required = ['slug', 'name_uk', 'name_ru'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                Response::error("Field '$field' is required", 400);
            }
        }
        
        $stmt = $this->db->prepare("
            INSERT INTO categories (slug, name_uk, name_ru, description_uk, description_ru, icon, sort_order, parent_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['slug'],
            $data['name_uk'],
            $data['name_ru'],
            $data['description_uk'] ?? null,
            $data['description_ru'] ?? null,
            $data['icon'] ?? 'folder',
            $data['sort_order'] ?? 0,
            $data['parent_id'] ?? null
        ]);
        
        $id = $this->db->lastInsertId();
        $this->logAction($user['id'], 'create', 'category', $id, $data);
        
        Response::json(['id' => $id, 'message' => 'Category created']);
    }
    
    /**
     * Update category
     */
    public function updateCategory($id) {
        $user = $this->requireAdminAccess(false);
        $data = Response::getJsonBody();
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['slug', 'name_uk', 'name_ru', 'description_uk', 'description_ru', 'icon', 'sort_order', 'is_active', 'parent_id', 'meta_title_uk', 'meta_title_ru', 'meta_description_uk', 'meta_description_ru', 'meta_keywords_uk', 'meta_keywords_ru'];
        
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
        $stmt = $this->db->prepare("UPDATE categories SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);
        
        $this->logAction($user['id'], 'update', 'category', $id, $data);
        Response::success('Category updated');
    }
    
    /**
     * Delete category
     */
    public function deleteCategory($id) {
        $user = $this->requireAdminAccess(false);
        
        // Check if has companies
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM companies WHERE category_id = ?");
        $stmt->execute([$id]);
        if ($stmt->fetch()['count'] > 0) {
            Response::error('Cannot delete category with companies. Move companies first.', 400);
        }
        
        $stmt = $this->db->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        
        $this->logAction($user['id'], 'delete', 'category', $id);
        Response::success('Category deleted');
    }
    
    // ==================== COMPANIES ====================
    
    /**
     * Get all companies for admin
     */
    public function getCompanies() {
        $this->requireAdminAccess();
        
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? min(100, max(1, (int)$_GET['limit'])) : 20;
        $offset = ($page - 1) * $limit;
        $status = $_GET['status'] ?? null;
        $category = $_GET['category'] ?? null;
        
        $where = ['1=1'];
        $params = [];
        
        if ($status === 'active') {
            $where[] = 'c.is_active = 1';
        } elseif ($status === 'inactive') {
            $where[] = 'c.is_active = 0';
        }
        
        if ($category) {
            $where[] = 'c.category_id = ?';
            $params[] = $category;
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Count
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM companies c WHERE $whereClause");
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        // Get companies
        $params[] = $limit;
        $params[] = $offset;
        $stmt = $this->db->prepare("
            SELECT c.*, cat.name_uk as category_name, u.name as owner_name,
                   (SELECT filename FROM company_images WHERE company_id = c.id AND is_main = 1 LIMIT 1) as main_image
            FROM companies c
            LEFT JOIN categories cat ON cat.id = c.category_id
            LEFT JOIN users u ON u.id = c.user_id
            WHERE $whereClause
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($params);
        
        Response::json([
            'companies' => $stmt->fetchAll(),
            'total' => (int)$total,
            'page' => $page,
            'pages' => (int)ceil($total / $limit)
        ]);
    }
    
    /**
     * Get company details for admin
     */
    public function getCompany($id) {
        $this->requireAdminAccess();
        
        $stmt = $this->db->prepare("
            SELECT c.*, cat.name_uk as category_name, u.name as owner_name, u.email as owner_email
            FROM companies c
            LEFT JOIN categories cat ON cat.id = c.category_id
            LEFT JOIN users u ON u.id = c.user_id
            WHERE c.id = ?
        ");
        $stmt->execute([$id]);
        $company = $stmt->fetch();
        
        if (!$company) {
            Response::error('Company not found', 404);
        }
        
        // Get images
        $stmt = $this->db->prepare("SELECT * FROM company_images WHERE company_id = ? ORDER BY display_order");
        $stmt->execute([$id]);
        $company['images'] = $stmt->fetchAll();
        
        Response::json($company);
    }
    
    /**
     * Create company
     */
    public function createCompany() {
        $user = $this->requireAdminAccess(false);
        $data = Response::getJsonBody();
        
        $required = ['name', 'name_ru', 'description', 'description_ru', 'city', 'address', 'phone', 'email'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                Response::error("Field '$field' is required", 400);
            }
        }
        
        $stmt = $this->db->prepare("
            INSERT INTO companies (name, name_ru, description, description_ru, category_id, city, address, lat, lng, phone, email, website, is_new, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        ");
        $stmt->execute([
            $data['name'],
            $data['name_ru'],
            $data['description'],
            $data['description_ru'],
            $data['category_id'] ?? null,
            $data['city'],
            $data['address'],
            $data['lat'] ?? null,
            $data['lng'] ?? null,
            $data['phone'],
            $data['email'],
            $data['website'] ?? null,
            $data['user_id'] ?? $user['id']
        ]);
        
        $id = $this->db->lastInsertId();
        $this->logAction($user['id'], 'create', 'company', $id);
        
        Response::json(['id' => $id, 'message' => 'Company created']);
    }
    
    /**
     * Update company
     */
    public function updateCompany($id) {
        $user = $this->requireAdminAccess(false);
        $data = Response::getJsonBody();
        
        $allowedFields = ['name', 'name_ru', 'description', 'description_ru', 'category_id', 'city', 'address', 'lat', 'lng', 'phone', 'email', 'website', 'is_active', 'is_featured', 'is_new'];
        
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
        
        $this->logAction($user['id'], 'update', 'company', $id, $data);
        Response::success('Company updated');
    }
    
    /**
     * Delete company with optional media deletion
     */
    public function deleteCompany($id) {
        $user = $this->requireAdminAccess(false);
        $deleteMedia = isset($_GET['delete_media']) && $_GET['delete_media'] === 'true';
        
        // Get images before deletion
        if ($deleteMedia) {
            $stmt = $this->db->prepare("SELECT filename FROM company_images WHERE company_id = ?");
            $stmt->execute([$id]);
            $images = $stmt->fetchAll();
            
            // Delete files
            foreach ($images as $img) {
                $filepath = __DIR__ . '/../uploads/companies/' . $img['filename'];
                if (file_exists($filepath)) {
                    unlink($filepath);
                }
            }
        }
        
        $stmt = $this->db->prepare("DELETE FROM companies WHERE id = ?");
        $stmt->execute([$id]);
        
        $this->logAction($user['id'], 'delete', 'company', $id, ['delete_media' => $deleteMedia]);
        Response::success('Company deleted' . ($deleteMedia ? ' with media files' : ''));
    }
    
    // ==================== COMPANY IMAGES ====================
    
    /**
     * Upload company image (WebP only)
     */
    public function uploadCompanyImage($companyId) {
        $user = $this->requireAdminAccess(false);
        
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
     * Delete company image
     */
    public function deleteCompanyImage($imageId) {
        $user = $this->requireAdminAccess(false);
        
        $stmt = $this->db->prepare("SELECT * FROM company_images WHERE id = ?");
        $stmt->execute([$imageId]);
        $image = $stmt->fetch();
        
        if (!$image) {
            Response::error('Image not found', 404);
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
    
    /**
     * Set main image
     */
    public function setMainImage($companyId, $imageId) {
        $user = $this->requireAdminAccess(false);
        
        // Remove main from all
        $stmt = $this->db->prepare("UPDATE company_images SET is_main = 0 WHERE company_id = ?");
        $stmt->execute([$companyId]);
        
        // Set new main
        $stmt = $this->db->prepare("UPDATE company_images SET is_main = 1 WHERE id = ? AND company_id = ?");
        $stmt->execute([$imageId, $companyId]);
        
        Response::success('Main image updated');
    }
    
    // ==================== BLOG CATEGORIES ====================
    
    /**
     * Get blog categories
     */
    public function getBlogCategories() {
        $this->requireAdminAccess();
        
        $stmt = $this->db->query("
            SELECT bc.*, 
                   p.name_uk as parent_name,
                   COUNT(bp.id) as posts_count 
            FROM blog_categories bc 
            LEFT JOIN blog_categories p ON bc.parent_id = p.id
            LEFT JOIN blog_posts bp ON bp.category_id = bc.id 
            GROUP BY bc.id 
            ORDER BY bc.parent_id IS NULL DESC, bc.sort_order, bc.name_uk
        ");
        Response::json($stmt->fetchAll());
    }
    
    /**
     * Create blog category
     */
    public function createBlogCategory() {
        $user = $this->requireAdminAccess(false);
        $data = Response::getJsonBody();
        
        $stmt = $this->db->prepare("
            INSERT INTO blog_categories (slug, name_uk, name_ru, description_uk, description_ru, sort_order, parent_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['slug'],
            $data['name_uk'],
            $data['name_ru'],
            $data['description_uk'] ?? null,
            $data['description_ru'] ?? null,
            $data['sort_order'] ?? 0,
            $data['parent_id'] ?? null
        ]);
        
        $id = $this->db->lastInsertId();
        $this->logAction($user['id'], 'create', 'blog_category', $id);
        
        Response::json(['id' => $id]);
    }
    
    /**
     * Update blog category
     */
    public function updateBlogCategory($id) {
        $user = $this->requireAdminAccess(false);
        $data = Response::getJsonBody();
        
        $fields = [];
        $params = [];
        
        foreach (['slug', 'name_uk', 'name_ru', 'description_uk', 'description_ru', 'sort_order', 'is_active', 'parent_id'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        $params[] = $id;
        $stmt = $this->db->prepare("UPDATE blog_categories SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);
        
        $this->logAction($user['id'], 'update', 'blog_category', $id);
        Response::success('Blog category updated');
    }
    
    /**
     * Delete blog category
     */
    public function deleteBlogCategory($id) {
        $user = $this->requireAdminAccess(false);
        
        $stmt = $this->db->prepare("DELETE FROM blog_categories WHERE id = ?");
        $stmt->execute([$id]);
        
        $this->logAction($user['id'], 'delete', 'blog_category', $id);
        Response::success('Blog category deleted');
    }
    
    // ==================== BLOG POSTS ====================
    
    /**
     * Get blog posts
     */
    public function getBlogPosts() {
        $this->requireAdminAccess();
        
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? min(100, max(1, (int)$_GET['limit'])) : 20;
        $offset = ($page - 1) * $limit;
        $status = $_GET['status'] ?? null;
        
        $where = ['1=1'];
        $params = [];
        
        if ($status) {
            $where[] = 'bp.status = ?';
            $params[] = $status;
        }
        
        $whereClause = implode(' AND ', $where);
        
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM blog_posts bp WHERE $whereClause");
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        $params[] = $limit;
        $params[] = $offset;
        $stmt = $this->db->prepare("
            SELECT bp.*, bc.name_uk as category_name, u.name as author_name
            FROM blog_posts bp
            LEFT JOIN blog_categories bc ON bc.id = bp.category_id
            LEFT JOIN users u ON u.id = bp.author_id
            WHERE $whereClause
            ORDER BY bp.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($params);
        
        Response::json([
            'posts' => $stmt->fetchAll(),
            'total' => (int)$total,
            'page' => $page
        ]);
    }
    
    /**
     * Create blog post
     */
    public function createBlogPost() {
        $user = $this->requireAdminAccess(false);
        $data = Response::getJsonBody();
        
        $slug = $data['slug'] ?? $this->generateSlug($data['title_uk']);
        
        $stmt = $this->db->prepare("
            INSERT INTO blog_posts (category_id, title_uk, title_ru, slug, content_uk, content_ru, excerpt_uk, excerpt_ru, featured_image, author_id, status, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['category_id'] ?? null,
            $data['title_uk'],
            $data['title_ru'],
            $slug,
            $data['content_uk'],
            $data['content_ru'],
            $data['excerpt_uk'],
            $data['excerpt_ru'],
            $data['featured_image'] ?? null,
            $user['id'],
            $data['status'] ?? 'draft',
            $data['status'] === 'published' ? date('Y-m-d H:i:s') : null
        ]);
        
        $id = $this->db->lastInsertId();
        $this->logAction($user['id'], 'create', 'blog_post', $id);
        
        Response::json(['id' => $id]);
    }
    
    /**
     * Update blog post
     */
    public function updateBlogPost($id) {
        $user = $this->requireAdminAccess(false);
        $data = Response::getJsonBody();
        
        // If publishing for first time
        if ($data['status'] === 'published') {
            $stmt = $this->db->prepare("SELECT published_at FROM blog_posts WHERE id = ?");
            $stmt->execute([$id]);
            $post = $stmt->fetch();
            if (!$post['published_at']) {
                $data['published_at'] = date('Y-m-d H:i:s');
            }
        }
        
        $allowedFields = ['category_id', 'title_uk', 'title_ru', 'slug', 'content_uk', 'content_ru', 'excerpt_uk', 'excerpt_ru', 'featured_image', 'status', 'published_at'];
        
        $fields = [];
        $params = [];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        $params[] = $id;
        $stmt = $this->db->prepare("UPDATE blog_posts SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);
        
        $this->logAction($user['id'], 'update', 'blog_post', $id);
        Response::success('Blog post updated');
    }
    
    /**
     * Delete blog post
     */
    public function deleteBlogPost($id) {
        $user = $this->requireAdminAccess(false);
        
        $stmt = $this->db->prepare("DELETE FROM blog_posts WHERE id = ?");
        $stmt->execute([$id]);
        
        $this->logAction($user['id'], 'delete', 'blog_post', $id);
        Response::success('Blog post deleted');
    }
    
    // ==================== REVIEWS ====================
    
    /**
     * Get reviews for moderation
     */
    public function getReviews() {
        $this->requireAdminAccess();
        
        $status = $_GET['status'] ?? 'pending';
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = 20;
        $offset = ($page - 1) * $limit;
        
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM reviews WHERE status = ?");
        $stmt->execute([$status]);
        $total = $stmt->fetch()['total'];
        
        $stmt = $this->db->prepare("
            SELECT r.*, c.name as company_name, m.name as moderator_name
            FROM reviews r
            LEFT JOIN companies c ON c.id = r.company_id
            LEFT JOIN users m ON m.id = r.moderated_by
            WHERE r.status = ?
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$status, $limit, $offset]);
        
        Response::json([
            'reviews' => $stmt->fetchAll(),
            'total' => (int)$total,
            'page' => $page
        ]);
    }
    
    /**
     * Moderate review
     */
    public function moderateReview($id) {
        $user = $this->requireAdminAccess(false);
        $data = Response::getJsonBody();
        
        $status = $data['status'] ?? 'approved';
        if (!in_array($status, ['approved', 'rejected'])) {
            Response::error('Invalid status', 400);
        }
        
        $stmt = $this->db->prepare("
            UPDATE reviews 
            SET status = ?, moderated_by = ?, moderated_at = NOW(), moderation_note = ?
            WHERE id = ?
        ");
        $stmt->execute([$status, $user['id'], $data['note'] ?? null, $id]);
        
        // Update company rating if approved
        if ($status === 'approved') {
            $stmt = $this->db->prepare("SELECT company_id FROM reviews WHERE id = ?");
            $stmt->execute([$id]);
            $review = $stmt->fetch();
            $this->updateCompanyRating($review['company_id']);
        }
        
        $this->logAction($user['id'], 'moderate', 'review', $id, ['status' => $status]);
        Response::success('Review ' . $status);
    }
    
    /**
     * Delete review
     */
    public function deleteReview($id) {
        $user = $this->requireAdminAccess(false);
        
        $stmt = $this->db->prepare("SELECT company_id FROM reviews WHERE id = ?");
        $stmt->execute([$id]);
        $review = $stmt->fetch();
        
        $stmt = $this->db->prepare("DELETE FROM reviews WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($review) {
            $this->updateCompanyRating($review['company_id']);
        }
        
        $this->logAction($user['id'], 'delete', 'review', $id);
        Response::success('Review deleted');
    }
    
    /**
     * Update company rating after review changes
     */
    private function updateCompanyRating($companyId) {
        $stmt = $this->db->prepare("
            SELECT AVG(rating) as avg_rating, COUNT(*) as count 
            FROM reviews 
            WHERE company_id = ? AND status = 'approved'
        ");
        $stmt->execute([$companyId]);
        $result = $stmt->fetch();
        
        $stmt = $this->db->prepare("UPDATE companies SET rating = ?, review_count = ? WHERE id = ?");
        $stmt->execute([
            $result['avg_rating'] ? round($result['avg_rating'], 1) : 0,
            $result['count'],
            $companyId
        ]);
    }
    
    // ==================== USERS ====================
    
    /**
     * Get users list
     */
    public function getUsers() {
        $this->requireAdminAccess();
        
        $stmt = $this->db->query("
            SELECT id, name, email, phone, role, is_active, last_login, created_at,
                   (SELECT COUNT(*) FROM companies WHERE user_id = users.id) as companies_count
            FROM users
            ORDER BY created_at DESC
        ");
        Response::json($stmt->fetchAll());
    }
    
    /**
     * Update user role
     */
    public function updateUserRole($id) {
        $user = $this->requireAdminAccess(false);
        $data = Response::getJsonBody();
        
        if (!in_array($data['role'], ['user', 'analyst', 'admin'])) {
            Response::error('Invalid role', 400);
        }
        
        $stmt = $this->db->prepare("UPDATE users SET role = ? WHERE id = ?");
        $stmt->execute([$data['role'], $id]);
        
        $this->logAction($user['id'], 'update_role', 'user', $id, ['role' => $data['role']]);
        Response::success('User role updated');
    }
    
    /**
     * Toggle user active status
     */
    public function toggleUserStatus($id) {
        $user = $this->requireAdminAccess(false);
        
        $stmt = $this->db->prepare("UPDATE users SET is_active = NOT is_active WHERE id = ?");
        $stmt->execute([$id]);
        
        $this->logAction($user['id'], 'toggle_status', 'user', $id);
        Response::success('User status updated');
    }
    
    // ==================== SETTINGS ====================
    
    /**
     * Get site settings
     */
    public function getSettings() {
        $this->requireAdminAccess();
        
        $stmt = $this->db->query("SELECT * FROM site_settings ORDER BY id");
        $settings = [];
        foreach ($stmt->fetchAll() as $row) {
            $settings[$row['setting_key']] = [
                'value' => $row['setting_value'],
                'type' => $row['setting_type'],
                'description' => $row['description']
            ];
        }
        Response::json($settings);
    }
    
    /**
     * Update settings
     */
    public function updateSettings() {
        $user = $this->requireAdminAccess(false);
        $data = Response::getJsonBody();
        
        foreach ($data as $key => $value) {
            $stmt = $this->db->prepare("UPDATE site_settings SET setting_value = ? WHERE setting_key = ?");
            $stmt->execute([$value, $key]);
        }
        
        $this->logAction($user['id'], 'update', 'settings', null, $data);
        Response::success('Settings updated');
    }
    
    // ==================== MESSAGES ====================
    
    /**
     * Get contact messages
     */
    public function getMessages() {
        $this->requireAdminAccess();
        
        $stmt = $this->db->query("
            SELECT m.*, u.name as read_by_name
            FROM contact_messages m
            LEFT JOIN users u ON u.id = m.read_by
            ORDER BY m.created_at DESC
        ");
        Response::json($stmt->fetchAll());
    }
    
    /**
     * Mark message as read
     */
    public function markMessageRead($id) {
        $user = $this->requireAdminAccess();
        
        $stmt = $this->db->prepare("UPDATE contact_messages SET is_read = 1, read_by = ?, read_at = NOW() WHERE id = ?");
        $stmt->execute([$user['id'], $id]);
        
        Response::success('Message marked as read');
    }
    
    /**
     * Delete message
     */
    public function deleteMessage($id) {
        $user = $this->requireAdminAccess(false);
        
        $stmt = $this->db->prepare("DELETE FROM contact_messages WHERE id = ?");
        $stmt->execute([$id]);
        
        $this->logAction($user['id'], 'delete', 'message', $id);
        Response::success('Message deleted');
    }
    
    // ==================== LOGS ====================
    
    /**
     * Get admin logs
     */
    public function getLogs() {
        $this->requireAdminAccess();
        
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = 50;
        $offset = ($page - 1) * $limit;
        
        $stmt = $this->db->prepare("
            SELECT l.*, u.name as user_name
            FROM admin_logs l
            LEFT JOIN users u ON u.id = l.user_id
            ORDER BY l.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        
        Response::json($stmt->fetchAll());
    }
    
    // ==================== HELPERS ====================
    
    private function generateSlug($text) {
        $text = mb_strtolower($text, 'UTF-8');
        $text = preg_replace('/[^a-z0-9\s-]/u', '', $text);
        $text = preg_replace('/[\s-]+/', '-', $text);
        return trim($text, '-') . '-' . substr(uniqid(), -4);
    }
}
?>
