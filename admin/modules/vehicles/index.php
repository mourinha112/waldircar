<?php
session_start();
require_once '../../config/database.php';

// Check if user is logged in
if (!isset($_SESSION['user']) && !isset($_SESSION['admin_logged_in'])) {
    header('Location: ../../login.php');
    exit;
}

$supabase = new SupabaseClient();

// Buscar todos os veículos com informações do proprietário
$query = '?select=profiles!inner(id,name,email,phone),car_brand,car_model,car_color,car_year,license_plate,car_photo';
$vehicles = $supabase->select('profiles', $query);

// Filtrar apenas os registros que têm informações de veículo
$vehiclesWithData = [];
if ($vehicles['status'] === 200 && isset($vehicles['data'])) {
    foreach ($vehicles['data'] as $profile) {
        if (!empty($profile['car_brand']) || !empty($profile['car_model'])) {
            $vehiclesWithData[] = $profile;
        }
    }
}

// Função para obter cor de fundo baseada na cor do carro
function getColorClass($color) {
    $color = strtolower($color);
    $colorMap = [
        'preto' => 'bg-dark text-white',
        'branco' => 'bg-light text-dark',
        'prata' => 'bg-secondary text-white',
        'cinza' => 'bg-secondary text-white',
        'vermelho' => 'bg-danger text-white',
        'azul' => 'bg-primary text-white',
        'verde' => 'bg-success text-white',
        'amarelo' => 'bg-warning text-dark',
        'laranja' => 'bg-warning text-dark',
        'marrom' => 'bg-brown text-white',
        'roxo' => 'bg-purple text-white'
    ];
    
    return isset($colorMap[$color]) ? $colorMap[$color] : 'bg-light text-dark';
}

// Título da página
$pageTitle = "Gerenciamento de Veículos";
include_once '../../includes/header.php';
?>

<div class="container-fluid px-4">
    <h1 class="mt-4">Veículos Cadastrados</h1>
    <ol class="breadcrumb mb-4">
        <li class="breadcrumb-item"><a href="../../index.php">Dashboard</a></li>
        <li class="breadcrumb-item active">Veículos</li>
    </ol>
    
    <div class="row mb-4">
        <div class="col-xl-3 col-md-6">
            <div class="card bg-primary text-white mb-4">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>Total de Veículos</div>
                        <div class="h3 mb-0"><?php echo count($vehiclesWithData); ?></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Filtros -->
    <div class="card mb-4">
        <div class="card-header">
            <i class="fas fa-filter me-1"></i>
            Filtros
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-3 mb-3">
                    <label for="filterBrand" class="form-label">Marca</label>
                    <select id="filterBrand" class="form-select">
                        <option value="">Todas</option>
                        <?php
                        $brands = [];
                        foreach ($vehiclesWithData as $vehicle) {
                            if (!empty($vehicle['car_brand']) && !in_array($vehicle['car_brand'], $brands)) {
                                $brands[] = $vehicle['car_brand'];
                                echo '<option value="' . htmlspecialchars($vehicle['car_brand']) . '">' . htmlspecialchars($vehicle['car_brand']) . '</option>';
                            }
                        }
                        ?>
                    </select>
                </div>
                <div class="col-md-3 mb-3">
                    <label for="filterColor" class="form-label">Cor</label>
                    <select id="filterColor" class="form-select">
                        <option value="">Todas</option>
                        <?php
                        $colors = [];
                        foreach ($vehiclesWithData as $vehicle) {
                            if (!empty($vehicle['car_color']) && !in_array($vehicle['car_color'], $colors)) {
                                $colors[] = $vehicle['car_color'];
                                echo '<option value="' . htmlspecialchars($vehicle['car_color']) . '">' . htmlspecialchars($vehicle['car_color']) . '</option>';
                            }
                        }
                        ?>
                    </select>
                </div>
                <div class="col-md-3 mb-3">
                    <label for="filterYear" class="form-label">Ano</label>
                    <select id="filterYear" class="form-select">
                        <option value="">Todos</option>
                        <?php
                        $years = [];
                        foreach ($vehiclesWithData as $vehicle) {
                            if (!empty($vehicle['car_year']) && !in_array($vehicle['car_year'], $years)) {
                                $years[] = $vehicle['car_year'];
                                echo '<option value="' . htmlspecialchars($vehicle['car_year']) . '">' . htmlspecialchars($vehicle['car_year']) . '</option>';
                            }
                        }
                        ?>
                    </select>
                </div>
                <div class="col-md-3 mb-3 d-flex align-items-end">
                    <button id="applyFilters" class="btn btn-primary">Aplicar Filtros</button>
                    <button id="clearFilters" class="btn btn-secondary ms-2">Limpar</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Cards de Veículos -->
    <div class="row" id="vehiclesContainer">
        <?php if (empty($vehiclesWithData)): ?>
            <div class="col-12">
                <div class="alert alert-info">
                    Nenhum veículo cadastrado ainda.
                </div>
            </div>
        <?php else: ?>
            <?php foreach ($vehiclesWithData as $vehicle): ?>
                <div class="col-xl-4 col-md-6 mb-4 vehicle-card" 
                     data-brand="<?php echo htmlspecialchars($vehicle['car_brand'] ?? ''); ?>"
                     data-color="<?php echo htmlspecialchars($vehicle['car_color'] ?? ''); ?>"
                     data-year="<?php echo htmlspecialchars($vehicle['car_year'] ?? ''); ?>">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center <?php echo getColorClass($vehicle['car_color'] ?? ''); ?>">
                            <h5 class="mb-0">
                                <?php echo htmlspecialchars($vehicle['car_brand'] ?? 'N/A'); ?> 
                                <?php echo htmlspecialchars($vehicle['car_model'] ?? ''); ?>
                            </h5>
                            <span class="badge bg-light text-dark">
                                <?php echo htmlspecialchars($vehicle['car_year'] ?? 'N/A'); ?>
                            </span>
                        </div>
                        
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-5">
                                    <?php if (!empty($vehicle['car_photo'])): ?>
                                        <img src="<?php echo htmlspecialchars($vehicle['car_photo']); ?>" class="img-fluid rounded mb-3" alt="Foto do Veículo">
                                    <?php else: ?>
                                        <div class="bg-light rounded d-flex justify-content-center align-items-center mb-3" style="height: 120px;">
                                            <i class="fas fa-car fa-3x text-secondary"></i>
                                        </div>
                                    <?php endif; ?>
                                </div>
                                <div class="col-md-7">
                                    <ul class="list-group list-group-flush">
                                        <li class="list-group-item d-flex justify-content-between align-items-center">
                                            <span><i class="fas fa-palette me-2"></i> Cor:</span>
                                            <span><?php echo htmlspecialchars($vehicle['car_color'] ?? 'N/A'); ?></span>
                                        </li>
                                        <li class="list-group-item d-flex justify-content-between align-items-center">
                                            <span><i class="fas fa-id-card me-2"></i> Placa:</span>
                                            <span><?php echo htmlspecialchars($vehicle['license_plate'] ?? 'N/A'); ?></span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            
                            <hr>
                            
                            <h6 class="mb-3"><i class="fas fa-user me-2"></i> Proprietário</h6>
                            <ul class="list-group list-group-flush">
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>Nome:</span>
                                    <span><?php echo htmlspecialchars($vehicle['profiles']['name'] ?? 'N/A'); ?></span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>Email:</span>
                                    <span><?php echo htmlspecialchars($vehicle['profiles']['email'] ?? 'N/A'); ?></span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>Telefone:</span>
                                    <span><?php echo htmlspecialchars($vehicle['profiles']['phone'] ?? 'N/A'); ?></span>
                                </li>
                            </ul>
                        </div>
                        
                        <div class="card-footer d-flex justify-content-between">
                            <button class="btn btn-sm btn-primary view-details" data-id="<?php echo htmlspecialchars($vehicle['profiles']['id'] ?? ''); ?>">
                                <i class="fas fa-eye me-1"></i> Detalhes
                            </button>
                            <button class="btn btn-sm btn-success schedule-service" data-id="<?php echo htmlspecialchars($vehicle['profiles']['id'] ?? ''); ?>">
                                <i class="fas fa-calendar-plus me-1"></i> Agendar Serviço
                            </button>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>

<!-- Modal de Detalhes -->
<div class="modal fade" id="vehicleDetailsModal" tabindex="-1" aria-labelledby="vehicleDetailsModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="vehicleDetailsModalLabel">Detalhes do Veículo</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div id="vehicleDetailsContent">
                    <!-- Conteúdo será preenchido via JavaScript -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Filtros
    const applyFilters = () => {
        const brandFilter = document.getElementById('filterBrand').value.toLowerCase();
        const colorFilter = document.getElementById('filterColor').value.toLowerCase();
        const yearFilter = document.getElementById('filterYear').value;
        
        const vehicleCards = document.querySelectorAll('.vehicle-card');
        
        vehicleCards.forEach(card => {
            const brand = card.dataset.brand.toLowerCase();
            const color = card.dataset.color.toLowerCase();
            const year = card.dataset.year;
            
            const brandMatch = !brandFilter || brand.includes(brandFilter);
            const colorMatch = !colorFilter || color.includes(colorFilter);
            const yearMatch = !yearFilter || year === yearFilter;
            
            if (brandMatch && colorMatch && yearMatch) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    };
    
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    
    document.getElementById('clearFilters').addEventListener('click', () => {
        document.getElementById('filterBrand').value = '';
        document.getElementById('filterColor').value = '';
        document.getElementById('filterYear').value = '';
        
        document.querySelectorAll('.vehicle-card').forEach(card => {
            card.style.display = 'block';
        });
    });
    
    // Botões de detalhes
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.dataset.id;
            // Aqui você pode fazer uma requisição AJAX para buscar mais detalhes
            // Por enquanto, vamos apenas mostrar uma mensagem
            document.getElementById('vehicleDetailsContent').innerHTML = `
                <div class="alert alert-info">
                    Carregando detalhes do veículo do usuário ID: ${userId}...
                </div>
            `;
            
            const modal = new bootstrap.Modal(document.getElementById('vehicleDetailsModal'));
            modal.show();
        });
    });
    
    // Botões de agendar serviço
    document.querySelectorAll('.schedule-service').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.dataset.id;
            window.location.href = '../schedules/create.php?user_id=' + userId;
        });
    });
});
</script>

<?php include_once '../../includes/footer.php'; ?>
