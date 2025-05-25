<?php
// Supabase API credentials - Usando as mesmas credenciais do app cliente
define('SUPABASE_URL', 'https://jwiylwnwzifaenvdmnbq.supabase.co'); // Supabase URL do app cliente
define('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3aXlsd253emlmYWVudmRtbmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzIyMDQsImV4cCI6MjA2MzQ0ODIwNH0.dNhfG_rgcIYxY6d7zqQ7Yhr8MKp4ZwPZ4Ajm2oMumF4'); // Supabase anon key do app cliente
// Using anon key as service key since we don't have the actual service key
define('SUPABASE_SERVICE_KEY', SUPABASE_ANON_KEY); 

class SupabaseClient {
    private $supabaseUrl;
    private $supabaseKey;
    private $headers;
    
    public function __construct($useServiceKey = false) {
        $this->supabaseUrl = SUPABASE_URL;
        $this->supabaseKey = SUPABASE_ANON_KEY; // Always use anon key for now
        $this->headers = [
            'apikey: ' . $this->supabaseKey,
            'Authorization: Bearer ' . $this->supabaseKey,
            'Content-Type: application/json',
            'Prefer: return=representation'
        ];
    }
    
    // Método para verificar se o servidor está acessível
    public function testConnection() {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->supabaseUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5); // Timeout de 5 segundos
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $this->supabaseKey
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        return [
            'success' => ($httpCode >= 200 && $httpCode < 300),
            'http_code' => $httpCode,
            'error' => $error,
            'response' => $response
        ];
    }
    
    public function query($table, $method = 'GET', $data = null, $queryParams = '') {
        $url = $this->supabaseUrl . '/rest/v1/' . $table . $queryParams;
        $ch = curl_init();
        
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $this->headers);
        
        if ($method === 'POST' || $method === 'PATCH' || $method === 'PUT') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        } else if ($method === 'DELETE') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        } else if ($method === 'HEAD') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'HEAD');
            curl_setopt($ch, CURLOPT_NOBODY, true);
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return [
            'data' => json_decode($response, true),
            'status' => $httpCode
        ];
    }
    
    // Helper methods for common operations
    public function select($table, $queryParams = '') {
        return $this->query($table, 'GET', null, $queryParams);
    }
    
    public function insert($table, $data) {
        return $this->query($table, 'POST', $data);
    }
    
    public function update($table, $data, $queryParams) {
        return $this->query($table, 'PATCH', $data, $queryParams);
    }
    
    public function delete($table, $queryParams) {
        return $this->query($table, 'DELETE', null, $queryParams);
    }
    
    // Function to execute RPC functions
    public function rpc($functionName, $params = []) {
        $url = $this->supabaseUrl . '/rest/v1/rpc/' . $functionName;
        $ch = curl_init();
        
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $this->headers);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return [
            'data' => json_decode($response, true),
            'status' => $httpCode
        ];
    }
}
