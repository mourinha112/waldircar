<?php
session_start();
require_once '../../config/database.php';

// Check if user is logged in
if (!isset($_SESSION['user']) || !isset($_SESSION['access_token'])) {
    header('Location: ../../login.php');
    exit;
}

$supabase = new SupabaseClient(true); // Use service key for admin operations
$message = '';
$error = '';

$orderId = $_GET['id'] ?? '';

if (empty($orderId)) {
    header('Location: index.php');
    exit;
}

// Get service order details
$serviceOrder = $supabase->select('service_orders', '?id=eq.' . $orderId);

if ($serviceOrder['status'] !== 200 || empty($serviceOrder['data'])) {
    header('Location: index.php');
    exit;
}

$order = $serviceOrder['data'][0];

// Get vehicle details
$vehicle = $supabase->select('vehicles', '?id=eq.' . $order['vehicle_id']);
$vehicleData = $vehicle['status'] === 200 && !empty($vehicle['data']) ? $vehicle['data'][0] : null;

// Get user details
$user = $supabase->select('users', '?id=eq.' . $order['user_id']);
$userData = $user['status'] === 200 && !empty($user['data']) ? $user['data'][0] : null;

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $checklistItems = $_POST['checklist'] ?? [];
    $notes = $_POST['notes'] ?? '';
    $status = $_POST['status'] ?? 'in_progress';
    
    // Validate form data
    if (empty($checklistItems)) {
        $error = 'Por favor, preencha pelo menos um item do checklist.';
    } else {
        // Create checklist entry
        $checklistData = [
            'service_order_id' => $orderId,
            'items' => json_encode($checklistItems),
            'notes' => $notes,
            'performed_by' => $_SESSION['user']['id'],
            'created_at' => date('c'),
            'updated_at' => date('c')
        ];
        
        $result = $supabase->insert('checklists', $checklistData);
        
        // Update service order status
        $updateResult = $supabase->update('service_orders', 
            ['status' => $status, 'updated_at' => date('c')], 
            '?id=eq.' . $orderId
        );
        
        if ($result['status'] === 201 && $updateResult['status'] === 200) {
            header('Location: index.php?success=1');
            exit;
        } else {
            $error = 'Erro ao salvar o checklist: ' . json_encode($result['data']);
        }
    }
}
?>

<?php include '../../includes/header.php'; ?>

<div class="content">
    <div class="content-header">
        <h1><i class="fas fa-clipboard-list"></i> Realizar Checklist</h1>
        <p>Preencha o checklist de inspeção do veículo</p>
    </div>
    
    <?php if (!empty($error)): ?>
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle"></i> <?php echo $error; ?>
        </div>
    <?php endif; ?>
    
    <div class="content-body">
        <div class="card">
            <div class="card-header">
                <h2>Informações do Veículo</h2>
            </div>
            <div class="card-body">
                <?php if ($vehicleData && $userData): ?>
                    <div class="vehicle-info-grid">
                        <div class="info-group">
                            <h3>Cliente</h3>
                            <p><strong>Nome:</strong> <?php echo $userData['name']; ?></p>
                            <p><strong>Email:</strong> <?php echo $userData['email']; ?></p>
                            <p><strong>Telefone:</strong> <?php echo $userData['phone'] ?? 'Não informado'; ?></p>
                        </div>
                        
                        <div class="info-group">
                            <h3>Veículo</h3>
                            <p><strong>Marca/Modelo:</strong> <?php echo $vehicleData['brand'] . ' ' . $vehicleData['model']; ?></p>
                            <p><strong>Ano:</strong> <?php echo $vehicleData['year']; ?></p>
                            <p><strong>Cor:</strong> <?php echo $vehicleData['color'] ?? 'Não informada'; ?></p>
                            <p><strong>Placa:</strong> <?php echo $vehicleData['license_plate']; ?></p>
                        </div>
                        
                        <div class="info-group">
                            <h3>Ordem de Serviço</h3>
                            <p><strong>Título:</strong> <?php echo $order['title']; ?></p>
                            <p><strong>Descrição:</strong> <?php echo $order['description'] ?? 'Não informada'; ?></p>
                            <p><strong>Data:</strong> <?php echo date('d/m/Y', strtotime($order['created_at'])); ?></p>
                            <p><strong>Status:</strong> 
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
                            </p>
                        </div>
                    </div>
                <?php else: ?>
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i> Informações do veículo ou cliente não encontradas.
                    </div>
                <?php endif; ?>
            </div>
        </div>
        
        <form method="POST" class="checklist-form">
            <div class="card mt-4">
                <div class="card-header">
                    <h2>Checklist de Inspeção</h2>
                </div>
                <div class="card-body">
                    <div class="checklist-section">
                        <h3>Exterior</h3>
                        <div class="checklist-items">
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[exterior][headlights]" value="1"> 
                                    Faróis funcionando corretamente
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[exterior][taillights]" value="1"> 
                                    Lanternas traseiras funcionando
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[exterior][turn_signals]" value="1"> 
                                    Setas funcionando
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[exterior][windshield]" value="1"> 
                                    Para-brisa sem trincas
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[exterior][wipers]" value="1"> 
                                    Limpadores de para-brisa funcionando
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[exterior][body_damage]" value="1"> 
                                    Carroceria sem danos aparentes
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="checklist-section">
                        <h3>Pneus e Rodas</h3>
                        <div class="checklist-items">
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[tires][pressure]" value="1"> 
                                    Pressão dos pneus adequada
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[tires][tread]" value="1"> 
                                    Profundidade da banda de rodagem adequada
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[tires][damage]" value="1"> 
                                    Pneus sem danos ou bolhas
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[tires][spare]" value="1"> 
                                    Estepe em boas condições
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[tires][wheel_damage]" value="1"> 
                                    Rodas sem danos ou amassados
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="checklist-section">
                        <h3>Motor e Fluidos</h3>
                        <div class="checklist-items">
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[engine][oil_level]" value="1"> 
                                    Nível de óleo adequado
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[engine][coolant_level]" value="1"> 
                                    Nível de líquido de arrefecimento adequado
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[engine][brake_fluid]" value="1"> 
                                    Nível de fluido de freio adequado
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[engine][power_steering]" value="1"> 
                                    Nível de fluido da direção hidráulica adequado
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[engine][battery]" value="1"> 
                                    Bateria em boas condições
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[engine][belts]" value="1"> 
                                    Correias sem danos
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[engine][hoses]" value="1"> 
                                    Mangueiras sem vazamentos
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="checklist-section">
                        <h3>Interior</h3>
                        <div class="checklist-items">
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[interior][dashboard]" value="1"> 
                                    Painel de instrumentos funcionando
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[interior][horn]" value="1"> 
                                    Buzina funcionando
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[interior][ac]" value="1"> 
                                    Ar-condicionado funcionando
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[interior][seatbelts]" value="1"> 
                                    Cintos de segurança em boas condições
                                </label>
                            </div>
                            <div class="checklist-item">
                                <label>
                                    <input type="checkbox" name="checklist[interior][seats]" value="1"> 
                                    Bancos em boas condições
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group mt-4">
                        <label for="notes"><i class="fas fa-sticky-note"></i> Observações</label>
                        <textarea id="notes" name="notes" rows="4" class="form-control"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="status"><i class="fas fa-tasks"></i> Status da Ordem de Serviço</label>
                        <select id="status" name="status" class="form-control">
                            <option value="in_progress" <?php echo $order['status'] === 'in_progress' ? 'selected' : ''; ?>>Em Progresso</option>
                            <option value="completed">Concluído</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="form-actions mt-4">
                <button type="submit" class="btn-primary">
                    <i class="fas fa-save"></i> Salvar Checklist
                </button>
                <a href="index.php" class="btn-secondary">
                    <i class="fas fa-times"></i> Cancelar
                </a>
            </div>
        </form>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>
