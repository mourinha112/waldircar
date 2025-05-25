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

// Check if available_slots table exists, if not create it
$checkTable = $supabase->query('available_slots', 'HEAD');
if ($checkTable['status'] === 404) {
    // Create the table using SQL query
    $createTableQuery = "
    CREATE TABLE IF NOT EXISTS available_slots (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      max_appointments INTEGER NOT NULL DEFAULT 1,
      created_by UUID REFERENCES users(id),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Políticas de segurança para horários disponíveis
    ALTER TABLE available_slots ENABLE ROW LEVEL SECURITY;
    
    -- Apenas admins podem gerenciar horários
    CREATE POLICY \"Admins podem gerenciar horários disponíveis\" 
    ON available_slots 
    USING (is_admin());
    
    -- Todos os usuários autenticados podem visualizar horários disponíveis
    CREATE POLICY \"Usuários autenticados podem ver horários disponíveis\" 
    ON available_slots FOR SELECT 
    TO authenticated 
    USING (is_active = TRUE);
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

// Handle form submission for new available time slots
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $date = $_POST['date'] ?? '';
    $startTime = $_POST['start_time'] ?? '';
    $endTime = $_POST['end_time'] ?? '';
    $maxAppointments = intval($_POST['max_appointments'] ?? 1);
    
    if (empty($date) || empty($startTime) || empty($endTime)) {
        $error = 'Por favor, preencha todos os campos obrigatórios.';
    } else {
        // Create a new available time slot
        $result = $supabase->insert('available_slots', [
            'date' => $date,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'max_appointments' => $maxAppointments,
            'created_by' => $_SESSION['user']['id'],
            'is_active' => true,
            'created_at' => date('c'),
            'updated_at' => date('c')
        ]);
        
        if ($result['status'] === 201) {
            $message = 'Horário disponível adicionado com sucesso!';
        } else {
            $error = 'Erro ao adicionar horário disponível: ' . json_encode($result['data']);
        }
    }
}

// Get all available time slots
$availableSlots = $supabase->select('available_slots', '?order=date.asc,start_time.asc');
?>

<?php include '../../includes/header.php'; ?>

<div class="content">
    <div class="content-header">
        <h1><i class="fas fa-calendar-alt"></i> Gerenciamento de Horários Disponíveis</h1>
        <p>Configure os horários disponíveis para agendamentos dos clientes</p>
    </div>
    
    <?php if (!empty($message)): ?>
        <div class="alert alert-success">
            <i class="fas fa-check-circle"></i> <?php echo $message; ?>
        </div>
    <?php endif; ?>
    
    <?php if (!empty($error)): ?>
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle"></i> <?php echo $error; ?>
        </div>
    <?php endif; ?>
    
    <div class="content-body">
        <div class="card">
            <div class="card-header">
                <h2>Adicionar Novo Horário</h2>
            </div>
            <div class="card-body">
                <form method="POST" class="form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="date"><i class="fas fa-calendar"></i> Data</label>
                            <input type="date" id="date" name="date" required min="<?php echo date('Y-m-d'); ?>">
                        </div>
                        
                        <div class="form-group">
                            <label for="start_time"><i class="fas fa-clock"></i> Horário de Início</label>
                            <input type="time" id="start_time" name="start_time" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="end_time"><i class="fas fa-clock"></i> Horário de Término</label>
                            <input type="time" id="end_time" name="end_time" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="max_appointments"><i class="fas fa-users"></i> Máximo de Agendamentos</label>
                            <input type="number" id="max_appointments" name="max_appointments" min="1" value="1" required>
                            <small>Número máximo de agendamentos simultâneos neste horário</small>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-plus-circle"></i> Adicionar Horário
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <div class="card mt-4">
            <div class="card-header">
                <h2>Horários Disponíveis</h2>
            </div>
            <div class="card-body">
                <?php if ($availableSlots['status'] === 200 && !empty($availableSlots['data'])): ?>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Horário</th>
                                    <th>Vagas</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($availableSlots['data'] as $slot): ?>
                                    <tr>
                                        <td><?php echo date('d/m/Y', strtotime($slot['date'])); ?></td>
                                        <td><?php echo date('H:i', strtotime($slot['start_time'])) . ' - ' . date('H:i', strtotime($slot['end_time'])); ?></td>
                                        <td><?php echo $slot['max_appointments']; ?></td>
                                        <td>
                                            <span class="status-badge status-<?php echo $slot['is_active'] ? 'active' : 'inactive'; ?>">
                                                <?php echo $slot['is_active'] ? 'Ativo' : 'Inativo'; ?>
                                            </span>
                                        </td>
                                        <td class="actions">
                                            <a href="edit.php?id=<?php echo $slot['id']; ?>" class="btn-icon btn-edit" title="Editar">
                                                <i class="fas fa-edit"></i>
                                            </a>
                                            <a href="toggle.php?id=<?php echo $slot['id']; ?>&status=<?php echo $slot['is_active'] ? '0' : '1'; ?>" 
                                               class="btn-icon <?php echo $slot['is_active'] ? 'btn-deactivate' : 'btn-activate'; ?>" 
                                               title="<?php echo $slot['is_active'] ? 'Desativar' : 'Ativar'; ?>"
                                               onclick="return confirm('Tem certeza que deseja <?php echo $slot['is_active'] ? 'desativar' : 'ativar'; ?> este horário?')">
                                                <i class="fas fa-<?php echo $slot['is_active'] ? 'times-circle' : 'check-circle'; ?>"></i>
                                            </a>
                                            <a href="delete.php?id=<?php echo $slot['id']; ?>" 
                                               class="btn-icon btn-delete" 
                                               title="Excluir"
                                               onclick="return confirm('Tem certeza que deseja excluir este horário? Esta ação não pode ser desfeita.')">
                                                <i class="fas fa-trash-alt"></i>
                                            </a>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php else: ?>
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <p>Nenhum horário disponível encontrado.</p>
                        <p>Adicione novos horários usando o formulário acima.</p>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>
