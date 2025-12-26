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
        
        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }
        
        return $payload;
    }
    
    /**
     * Get current user from Authorization header
     */
    public static function getCurrentUser($db) {
        $headers = getallheaders();
        $auth_header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (!preg_match('/Bearer\s+(\S+)/', $auth_header, $matches)) {
            return null;
        }
        
        $token = $matches[1];
        $payload = self::decode($token);
        
        if (!$payload || !isset($payload['sub'])) {
            return null;
        }
        
        $stmt = $db->prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$payload['sub']]);
        return $stmt->fetch();
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
