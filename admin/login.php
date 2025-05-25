<?php
session_start();
require_once 'config/database.php';

// Ativar exibição de erros para depuração
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// If already logged in, redirect to dashboard
if (isset($_SESSION['user']) && isset($_SESSION['access_token'])) {
    header('Location: index.php');
    exit;
}

$error = '';
$connection_status = '';

// Testar conexão com Supabase
$supabase = new SupabaseClient();
$test = $supabase->testConnection();
if (!$test['success']) {
    $connection_status = "Erro de conexão com Supabase: " . $test['error'];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        $error = 'Por favor, preencha todos os campos.';
    } else {
        // Use cURL to authenticate with Supabase
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, SUPABASE_URL . '/auth/v1/token?grant_type=password');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . SUPABASE_ANON_KEY,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'email' => $email,
            'password' => $password
        ]));
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        // Verificar se houve erro no curl
        if ($response === false) {
            $error = 'Erro de conexão: ' . curl_error($ch);
        }
        
        curl_close($ch);
        
        if ($httpCode === 200) {
            $data = json_decode($response, true);
            
            // Temporariamente permitir qualquer usuário autenticado
            // sem verificar se é admin
            $_SESSION['user'] = $data['user'];
            $_SESSION['access_token'] = $data['access_token'];
            header('Location: index.php');
            exit;
            
            /* Código original para verificar se é admin - desativado temporariamente
            // Check if user is admin
            $supabase = new SupabaseClient();
            $userRoles = $supabase->select('user_roles', '?user_id=eq.' . $data['user']['id']);
            
            $isAdmin = false;
            if ($userRoles['status'] === 200) {
                foreach ($userRoles['data'] as $role) {
                    if ($role['role'] === 'admin') {
                        $isAdmin = true;
                        break;
                    }
                }
            }
            
            if ($isAdmin) {
                $_SESSION['user'] = $data['user'];
                $_SESSION['access_token'] = $data['access_token'];
                header('Location: index.php');
                exit;
            } else {
                $error = 'Acesso restrito a administradores.';
            }
            */
        } else {
            $error = 'Email ou senha inválidos. Código: ' . $httpCode;
        }
    }
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Painel Administrativo</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="stylesheet" href="./assets/css/style.css">
    <style>
        /* Estilos básicos para garantir que a página seja utilizável */
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f7fa;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .login-container {
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 30px;
            width: 100%;
            max-width: 400px;
        }
        .login-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .login-header h1 {
            margin: 0;
            color: #333;
            font-size: 24px;
        }
        .login-header p {
            color: #666;
            margin-top: 10px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
        }
        .form-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        .btn-primary {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 12px;
            width: 100%;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        .btn-primary:hover {
            background-color: #2980b9;
        }
        .alert {
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
            color: white;
        }
        .alert-danger {
            background-color: #e74c3c;
        }
        .alert-warning {
            background-color: #f39c12;
        }
        .connection-info {
            margin-top: 20px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h1>Painel Administrativo</h1>
            <p>Faça login para acessar o painel</p>
        </div>
        
        <?php if (!empty($connection_status)): ?>
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i> <?php echo $connection_status; ?>
            </div>
        <?php endif; ?>
        
        <?php if (!empty($error)): ?>
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> <?php echo $error; ?>
            </div>
        <?php endif; ?>
        
        <form method="POST" class="login-form">
            <div class="form-group">
                <label for="email"><i class="fas fa-envelope"></i> Email</label>
                <input type="email" id="email" name="email" required value="<?php echo htmlspecialchars($email ?? ''); ?>">
            </div>
            
            <div class="form-group">
                <label for="password"><i class="fas fa-lock"></i> Senha</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="btn-primary">
                <i class="fas fa-sign-in-alt"></i> Entrar
            </button>
        </form>
        
        <div class="connection-info">
            <p>Credenciais de exemplo:</p>
            <p>Email: admin@gmail.com</p>
            <p>Senha: fansro123</p>
        </div>
    </div>
</body>
</html>
