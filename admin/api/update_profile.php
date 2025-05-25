<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Permitir requisições OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verificar método da requisição
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Obter dados da requisição
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Verificar se os dados são válidos
if (!$data || !isset($data['user_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid data. User ID is required.']);
    exit;
}

// Configuração do Supabase
$supabaseUrl = 'https://jwiylwnwzifaenvdmnbq.supabase.co';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3aXlsd253emlmYWVudmRtbmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzIyMDQsImV4cCI6MjA2MzQ0ODIwNH0.dNhfG_rgcIYxY6d7zqQ7Yhr8MKp4ZwPZ4Ajm2oMumF4';

// Extrair dados do perfil
$userId = $data['user_id'];
$profileData = [];

// Mapear campos do perfil
$fields = [
    'name', 'email', 'phone', 'address', 'location', 'selected_plan',
    'car_brand', 'car_model', 'car_color', 'car_year', 'license_plate', 'car_photo'
];

foreach ($fields as $field) {
    if (isset($data[$field])) {
        $profileData[$field] = $data[$field];
    }
}

// Adicionar campos adicionais
if (isset($data['car_brand']) || isset($data['car_model'])) {
    $profileData['registration_complete'] = true;
}

$profileData['updated_at'] = date('c'); // ISO 8601 format

// Verificar se o perfil já existe
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/profiles?id=eq.' . urlencode($userId) . '&select=id');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'apikey: ' . $supabaseKey,
    'Authorization: Bearer ' . $supabaseKey
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$profileExists = false;
if ($httpCode === 200) {
    $result = json_decode($response, true);
    $profileExists = !empty($result);
}

// Atualizar ou inserir perfil
$ch = curl_init();

if ($profileExists) {
    // Atualizar perfil existente
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/profiles?id=eq.' . urlencode($userId));
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
} else {
    // Inserir novo perfil
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/profiles');
    curl_setopt($ch, CURLOPT_POST, true);
    $profileData['id'] = $userId;
    $profileData['created_at'] = date('c');
}

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'apikey: ' . $supabaseKey,
    'Authorization: Bearer ' . $supabaseKey,
    'Content-Type: application/json',
    'Prefer: return=minimal'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($profileData));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// Verificar resultado
if ($httpCode >= 200 && $httpCode < 300) {
    echo json_encode([
        'success' => true,
        'message' => $profileExists ? 'Profile updated successfully' : 'Profile created successfully'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to update profile',
        'details' => $error,
        'http_code' => $httpCode,
        'response' => $response
    ]);
}
?>
