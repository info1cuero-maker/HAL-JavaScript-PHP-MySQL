<?php
/**
 * JSON Response helper
 */
class Response {
    /**
     * Send JSON response
     */
    public static function json($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
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
        return json_decode($json, true) ?? [];
    }
}
?>
