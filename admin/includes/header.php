<?php
// Get current page for active menu highlighting
$currentPage = basename($_SERVER['PHP_SELF']);
$currentDir = basename(dirname($_SERVER['PHP_SELF']));

// Check if user is logged in
if (!isset($_SESSION['user']) && $currentPage !== 'login.php') {
    header('Location: ' . (strpos($_SERVER['PHP_SELF'], '/modules/') !== false ? '../../login.php' : 'login.php'));
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel Administrativo - Bolt</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="stylesheet" href="<?php echo strpos($_SERVER['PHP_SELF'], '/modules/') !== false ? '../../assets/css/style.css' : 'assets/css/style.css'; ?>">
</head>
<body>
    <div class="admin-container">
        <aside class="sidebar">
            <div class="sidebar-header">
                <h2>Bolt Admin</h2>
                <span class="sidebar-close" id="sidebar-close">&times;</span>
            </div>
            
            <div class="sidebar-user">
                <?php if (isset($_SESSION['user'])): ?>
                    <div class="user-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="user-info">
                        <p class="user-name"><?php echo $_SESSION['user']['email']; ?></p>
                        <p class="user-role">Administrador</p>
                    </div>
                <?php endif; ?>
            </div>
            
            <nav class="sidebar-nav">
                <ul>
                    <li>
                        <a href="<?php echo strpos($_SERVER['PHP_SELF'], '/modules/') !== false ? '../../index.php' : 'index.php'; ?>" class="<?php echo $currentPage === 'index.php' ? 'active' : ''; ?>">
                            <i class="fas fa-tachometer-alt"></i> Dashboard
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo strpos($_SERVER['PHP_SELF'], '/modules/') !== false ? '../../modules/schedules/index.php' : 'modules/schedules/index.php'; ?>" class="<?php echo $currentDir === 'schedules' ? 'active' : ''; ?>">
                            <i class="fas fa-calendar-alt"></i> Horários Disponíveis
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo strpos($_SERVER['PHP_SELF'], '/modules/') !== false ? '../../modules/appointments/index.php' : 'modules/appointments/index.php'; ?>" class="<?php echo $currentDir === 'appointments' ? 'active' : ''; ?>">
                            <i class="fas fa-calendar-check"></i> Agendamentos
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo strpos($_SERVER['PHP_SELF'], '/modules/') !== false ? '../../modules/mechanics/index.php' : 'modules/mechanics/index.php'; ?>" class="<?php echo $currentDir === 'mechanics' ? 'active' : ''; ?>">
                            <i class="fas fa-user-cog"></i> Mecânicos
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo strpos($_SERVER['PHP_SELF'], '/modules/') !== false ? '../../modules/checklists/index.php' : 'modules/checklists/index.php'; ?>" class="<?php echo $currentDir === 'checklists' ? 'active' : ''; ?>">
                            <i class="fas fa-clipboard-check"></i> Checklists
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo strpos($_SERVER['PHP_SELF'], '/modules/') !== false ? '../../modules/service-orders/index.php' : 'modules/service-orders/index.php'; ?>" class="<?php echo $currentDir === 'service-orders' ? 'active' : ''; ?>">
                            <i class="fas fa-tools"></i> Ordens de Serviço
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo strpos($_SERVER['PHP_SELF'], '/modules/') !== false ? '../../modules/users/index.php' : 'modules/users/index.php'; ?>" class="<?php echo $currentDir === 'users' ? 'active' : ''; ?>">
                            <i class="fas fa-users"></i> Usuários
                        </a>
                    </li>
                    <li>
                        <a href="<?php echo strpos($_SERVER['PHP_SELF'], '/modules/') !== false ? '../../modules/vehicles/index.php' : 'modules/vehicles/index.php'; ?>" class="<?php echo $currentDir === 'vehicles' ? 'active' : ''; ?>">
                            <i class="fas fa-car"></i> Veículos
                        </a>
                    </li>
                </ul>
            </nav>
            
            <div class="sidebar-footer">
                <a href="<?php echo strpos($_SERVER['PHP_SELF'], '/modules/') !== false ? '../../logout.php' : 'logout.php'; ?>" class="logout-btn">
                    <i class="fas fa-sign-out-alt"></i> Sair
                </a>
            </div>
        </aside>
        
        <main class="main-content">
            <header class="main-header">
                <button class="menu-toggle" id="menu-toggle">
                    <i class="fas fa-bars"></i>
                </button>
                
                <div class="header-actions">
                    <div class="header-search">
                        <input type="text" placeholder="Pesquisar...">
                        <button><i class="fas fa-search"></i></button>
                    </div>
                    
                    <div class="header-notifications">
                        <button class="notification-btn">
                            <i class="fas fa-bell"></i>
                            <span class="notification-badge">3</span>
                        </button>
                    </div>
                </div>
            </header>
            
            <div class="content-wrapper">
