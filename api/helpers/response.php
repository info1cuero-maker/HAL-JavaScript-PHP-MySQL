<?php
/**
 * JSON Response helper
 */
class Response {
    /**
     * Send JSON response
     */
    public static function json($data, $status = 200) {
        // Clear any buffered output (warnings, errors, etc.)
        if (ob_get_level() > 0) {
            ob_clean();
        }
        
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    /**
     * Send error response
     */
    public static function error($message, $status = 400) {
        self::json(['error' => $message], $status);
    }
    
    /**
     * Send success response
     */
    public static function success($message, $data = null) {
        $response = ['message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        self::json($response);
    }
    
    /**
     * Get JSON request body
     */
    public static function getJsonBody() {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        return is_array($data) ? $data : [];
    }
}
?>
