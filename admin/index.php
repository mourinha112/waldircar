<?php
session_start();
require_once 'config/database.php';

// Check if user is logged in
if (!isset($_SESSION['user']) || !isset($_SESSION['access_token'])) {
    header('Location: login.php');
    exit;
}

$supabase = new SupabaseClient();

// Get counts for dashboard
$appointmentsCount = $supabase->select('appointments', '?select=count');
$usersCount = $supabase->select('users', '?select=count');
$vehiclesCount = $supabase->select('vehicles', '?select=count');
$serviceOrdersCount = $supabase->select('service_orders', '?select=count');

// Get recent appointments
$recentAppointments = $supabase->select('appointments', '?order=scheduled_date.desc&limit=5');

// Get pending service orders
$pendingOrders = $supabase->select('service_orders', '?status=eq.pending&order=created_at.desc&limit=5');
?>

<?php include 'includes/header.php'; ?>

<div class="dashboard-container">
    <h1>Painel Administrativo</h1>
    
    <div class="dashboard-stats">
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
            <div class="stat-content">
                <h3>Agendamentos</h3>
                <p class="stat-number"><?php echo $appointmentsCount['data'][0]['count'] ?? 0; ?></p>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-users"></i></div>
            <div class="stat-content">
                <h3>Usuários</h3>
                <p class="stat-number"><?php echo $usersCount['data'][0]['count'] ?? 0; ?></p>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-car"></i></div>
            <div class="stat-content">
                <h3>Veículos</h3>
                <p class="stat-number"><?php echo $vehiclesCount['data'][0]['count'] ?? 0; ?></p>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-tools"></i></div>
            <div class="stat-content">
                <h3>Ordens de Serviço</h3>
                <p class="stat-number"><?php echo $serviceOrdersCount['data'][0]['count'] ?? 0; ?></p>
            </div>
        </div>
    </div>
    
    <div class="dashboard-content">
        <div class="dashboard-card">
            <h2>Próximos Agendamentos</h2>
            <table class="dashboard-table">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Data</th>
                        <th>Serviço</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if ($recentAppointments['status'] === 200 && !empty($recentAppointments['data'])): ?>
                        <?php foreach ($recentAppointments['data'] as $appointment): ?>
                            <?php
                            // Get user info
                            $user = $supabase->select('users', '?id=eq.' . $appointment['user_id'] . '&select=name');
                            $userName = $user['status'] === 200 && !empty($user['data']) ? $user['data'][0]['name'] : 'Desconhecido';
                            ?>
                            <tr>
                                <td><?php echo $userName; ?></td>
                                <td><?php echo date('d/m/Y H:i', strtotime($appointment['scheduled_date'])); ?></td>
                                <td><?php echo $appointment['service_type']; ?></td>
                                <td>
                                    <span class="status-badge status-<?php echo $appointment['status']; ?>">
                                        <?php 
                                        $statusLabels = [
                                            'scheduled' => 'Agendado',
                                            'confirmed' => 'Confirmado',
                                            'completed' => 'Concluído',
                                            'canceled' => 'Cancelado',
                                            'missed' => 'Não Compareceu'
                                        ];
                                        echo $statusLabels[$appointment['status']] ?? $appointment['status']; 
                                        ?>
                                    </span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="4">Nenhum agendamento encontrado.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
            <div class="view-all">
                <a href="modules/appointments/index.php">Ver Todos</a>
            </div>
        </div>
        
        <div class="dashboard-card">
            <h2>Ordens de Serviço Pendentes</h2>
            <table class="dashboard-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Título</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if ($pendingOrders['status'] === 200 && !empty($pendingOrders['data'])): ?>
                        <?php foreach ($pendingOrders['data'] as $order): ?>
                            <?php
                            // Get user info
                            $user = $supabase->select('users', '?id=eq.' . $order['user_id'] . '&select=name');
                            $userName = $user['status'] === 200 && !empty($user['data']) ? $user['data'][0]['name'] : 'Desconhecido';
                            ?>
                            <tr>
                                <td><?php echo substr($order['id'], 0, 8); ?></td>
                                <td><?php echo $userName; ?></td>
                                <td><?php echo $order['title']; ?></td>
                                <td><?php echo date('d/m/Y', strtotime($order['created_at'])); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="4">Nenhuma ordem de serviço pendente.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
            <div class="view-all">
                <a href="modules/service-orders/index.php">Ver Todas</a>
            </div>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
