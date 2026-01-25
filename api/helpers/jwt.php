<?php
/**
 * Simple JWT helper functions
 */

class JWT {
    /**
     * Encode payload to JWT
     */
    public static function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => JWT_ALGORITHM]);
        
        $payload['iat'] = time();
        $payload['exp'] = time() + (JWT_EXPIRE_DAYS * 24 * 60 * 60);
        $payload_json = json_encode($payload);
        
        $base64_header = self::base64UrlEncode($header);
        $base64_payload = self::base64UrlEncode($payload_json);
        
        $signature = hash_hmac('sha256', "$base64_header.$base64_payload", JWT_SECRET, true);
        $base64_signature = self::base64UrlEncode($signature);
        
        return "$base64_header.$base64_payload.$base64_signature";
    }
    
    /**
     * Decode JWT to payload
     */
    public static function decode($token) {
        if (empty($token)) {
            return null;
        }
        
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        
        list($base64_header, $base64_payload, $base64_signature) = $parts;
        
        // Verify signature
        $signature = self::base64UrlDecode($base64_signature);
        $expected_signature = hash_hmac('sha256', "$base64_header.$base64_payload", JWT_SECRET, true);
        
        if (!hash_equals($signature, $expected_signature)) {
            return null;
        }
        
        // Decode payload
        $payload = json_decode(self::base64UrlDecode($base64_payload), true);
        
        if (!is_array($payload)) {
            return null;
        }
        
        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }
        
        return $payload;
    }
    
    /**
     * Get Authorization header - works on Apache, Nginx, etc.
     */
    private static function getAuthorizationHeader() {
        $headers = null;
        
        // Try getallheaders() first (Apache)
        if (function_exists('getallheaders')) {
            $allHeaders = getallheaders();
            // Server-side case-insensitive header lookup
            foreach ($allHeaders as $name => $value) {
                if (strtolower($name) === 'authorization') {
                    return $value;
                }
            }
        }
        
        // Try $_SERVER (Nginx, PHP-FPM)
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            return $_SERVER['HTTP_AUTHORIZATION'];
        }
        
        if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
        
        // Apache mod_rewrite workaround
        if (isset($_SERVER['Authorization'])) {
            return $_SERVER['Authorization'];
        }
        
        return null;
    }
    
    /**
     * Get current user from Authorization header
     */
    public static function getCurrentUser($db) {
        $auth_header = self::getAuthorizationHeader();
        
        if (empty($auth_header)) {
            return null;
        }
        
        if (!preg_match('/Bearer\s+(\S+)/i', $auth_header, $matches)) {
            return null;
        }
        
        $token = $matches[1];
        $payload = self::decode($token);
        
        if (!$payload || !isset($payload['sub'])) {
            return null;
        }
        
        try {
            $stmt = $db->prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ? AND is_active = 1");
            $stmt->execute([$payload['sub']]);
            $user = $stmt->fetch();
            return $user ?: null;
        } catch (Exception $e) {
            error_log("JWT getCurrentUser error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Require authentication
     */
    public static function requireAuth($db) {
        $user = self::getCurrentUser($db);
        if (!$user) {
            Response::error('Unauthorized', 401);
        }
        return $user;
    }
    
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
?>
