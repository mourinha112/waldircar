<?php
session_start();
require_once '../../config/database.php';

// Check if user is logged in
if (!isset($_SESSION['user']) || !isset($_SESSION['access_token'])) {
    header('Location: ../../login.php');
    exit;
}

$supabase = new SupabaseClient(true); // Use service key for admin operations

// Check if checklists table exists, if not create it
$checkTable = $supabase->query('checklists', 'HEAD');
if ($checkTable['status'] === 404) {
    // Create the table using SQL query
    $createTableQuery = "
    CREATE TABLE IF NOT EXISTS checklists (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
      items JSONB NOT NULL,
      notes TEXT,
      performed_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Políticas de segurança para checklists
    ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
    
    -- Apenas admins e mecânicos podem gerenciar checklists
    CREATE POLICY \"Admins e mecânicos podem gerenciar checklists\" 
    ON checklists 
    USING (is_admin() OR is_mechanic());
    
    -- Usuários podem ver seus próprios checklists
    CREATE POLICY \"Usuários podem ver seus próprios checklists\" 
    ON checklists FOR SELECT 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM service_orders 
        WHERE service_orders.id = checklists.service_order_id 
        AND service_orders.user_id = auth.uid()
      )
    );
    ";
    
    // Execute SQL via Supabase API
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, SUPABASE_URL . '/rest/v1/');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . SUPABASE_SERVICE_KEY,
        'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
        'Content-Type: application/json',
        'Prefer: return=minimal'
    ]);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['query' => $createTableQuery]));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
}

// Get all service orders that need checklists
$serviceOrders = $supabase->select('service_orders', '?status=in.(pending,in_progress)&order=created_at.desc');
?>

<?php include '../../includes/header.php'; ?>

<div class="content">
    <div class="content-header">
        <h1><i class="fas fa-clipboard-check"></i> Checklists de Veículos</h1>
        <p>Realize inspeções e checklists de veículos em manutenção</p>
    </div>
    
    <div class="content-body">
        <div class="card">
            <div class="card-header">
                <h2>Ordens de Serviço Pendentes</h2>
            </div>
            <div class="card-body">
                <?php if ($serviceOrders['status'] === 200 && !empty($serviceOrders['data'])): ?>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Cliente</th>
                                    <th>Veículo</th>
                                    <th>Data</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($serviceOrders['data'] as $order): ?>
                                    <?php
                                    // Get user info
                                    $user = $supabase->select('users', '?id=eq.' . $order['user_id'] . '&select=name,email');
                                    $userName = $user['status'] === 200 && !empty($user['data']) ? $user['data'][0]['name'] : 'Desconhecido';
                                    
                                    // Get vehicle info
                                    $vehicle = $supabase->select('vehicles', '?id=eq.' . $order['vehicle_id'] . '&select=brand,model,license_plate,color');
                                    $vehicleInfo = '';
                                    
                                    if ($vehicle['status'] === 200 && !empty($vehicle['data'])) {
                                        $v = $vehicle['data'][0];
                                        $vehicleInfo = $v['brand'] . ' ' . $v['model'] . ' - ' . $v['license_plate'];
                                        if (!empty($v['color'])) {
                                            $vehicleInfo .= ' (' . $v['color'] . ')';
                                        }
                                    } else {
                                        $vehicleInfo = 'Veículo não encontrado';
                                    }
                                    
                                    // Check if checklist already exists
                                    $checklist = $supabase->select('checklists', '?service_order_id=eq.' . $order['id']);
                                    $hasChecklist = $checklist['status'] === 200 && !empty($checklist['data']);
                                    ?>
                                    <tr>
                                        <td><?php echo substr($order['id'], 0, 8); ?></td>
                                        <td><?php echo $userName; ?></td>
                                        <td><?php echo $vehicleInfo; ?></td>
                                        <td><?php echo date('d/m/Y', strtotime($order['created_at'])); ?></td>
                                        <td>
                                            <span class="status-badge status-<?php echo $order['status']; ?>">
                                                <?php 
                                                $statusLabels = [
                                                    'pending' => 'Pendente',
                                                    'in_progress' => 'Em Progresso',
                                                    'completed' => 'Concluído',
                                                    'canceled' => 'Cancelado'
                                                ];
                                                echo $statusLabels[$order['status']] ?? $order['status']; 
                                                ?>
                                            </span>
                                        </td>
                                        <td class="actions">
                                            <?php if ($hasChecklist): ?>
                                                <a href="view.php?id=<?php echo $order['id']; ?>" class="btn-icon btn-view" title="Ver Checklist">
                                                    <i class="fas fa-eye"></i>
                                                </a>
                                                <a href="edit.php?id=<?php echo $order['id']; ?>" class="btn-icon btn-edit" title="Editar Checklist">
                                                    <i class="fas fa-edit"></i>
                                                </a>
                                            <?php else: ?>
                                                <a href="create.php?id=<?php echo $order['id']; ?>" class="btn-icon btn-primary" title="Realizar Checklist">
                                                    <i class="fas fa-clipboard-list"></i>
                                                </a>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php else: ?>
                    <div class="empty-state">
                        <i class="fas fa-clipboard"></i>
                        <p>Nenhuma ordem de serviço pendente encontrada.</p>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        
        <div class="card mt-4">
            <div class="card-header">
                <h2>Checklists Concluídos</h2>
            </div>
            <div class="card-body">
                <?php
                // Get completed checklists
                $completedChecklists = $supabase->query('checklists', 'GET', null, '?order=created_at.desc&limit=10');
                ?>
                
                <?php if ($completedChecklists['status'] === 200 && !empty($completedChecklists['data'])): ?>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Ordem de Serviço</th>
                                    <th>Realizado por</th>
                                    <th>Data</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($completedChecklists['data'] as $checklist): ?>
                                    <?php
                                    // Get service order info
                                    $serviceOrder = $supabase->select('service_orders', '?id=eq.' . $checklist['service_order_id'] . '&select=title');
                                    $serviceOrderTitle = $serviceOrder['status'] === 200 && !empty($serviceOrder['data']) ? $serviceOrder['data'][0]['title'] : 'Desconhecido';
                                    
                                    // Get mechanic info
                                    $mechanic = $supabase->select('users', '?id=eq.' . $checklist['performed_by'] . '&select=name');
                                    $mechanicName = $mechanic['status'] === 200 && !empty($mechanic['data']) ? $mechanic['data'][0]['name'] : 'Desconhecido';
                                    ?>
                                    <tr>
                                        <td><?php echo substr($checklist['id'], 0, 8); ?></td>
                                        <td><?php echo $serviceOrderTitle; ?></td>
                                        <td><?php echo $mechanicName; ?></td>
                                        <td><?php echo date('d/m/Y H:i', strtotime($checklist['created_at'])); ?></td>
                                        <td class="actions">
                                            <a href="view.php?checklist_id=<?php echo $checklist['id']; ?>" class="btn-icon btn-view" title="Ver Checklist">
                                                <i class="fas fa-eye"></i>
                                            </a>
                                            <a href="print.php?id=<?php echo $checklist['id']; ?>" class="btn-icon btn-print" title="Imprimir">
                                                <i class="fas fa-print"></i>
                                            </a>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php else: ?>
                    <div class="empty-state">
                        <i class="fas fa-clipboard-check"></i>
                        <p>Nenhum checklist concluído encontrado.</p>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>
