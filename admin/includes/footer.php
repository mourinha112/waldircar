            </div> <!-- End of content-wrapper -->
        </main>
    </div>

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Toggle sidebar
        const menuToggle = document.getElementById('menu-toggle');
        const sidebarClose = document.getElementById('sidebar-close');
        const adminContainer = document.querySelector('.admin-container');
        
        if (menuToggle) {
            menuToggle.addEventListener('click', function() {
                adminContainer.classList.toggle('sidebar-collapsed');
            });
        }
        
        if (sidebarClose) {
            sidebarClose.addEventListener('click', function() {
                adminContainer.classList.add('sidebar-collapsed');
            });
        }
        
        // Handle notifications dropdown
        const notificationBtn = document.querySelector('.notification-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', function() {
                // Add notification dropdown functionality here
                alert('Notificações em breve!');
            });
        }
        
        // Handle form validations
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                const requiredFields = form.querySelectorAll('[required]');
                let isValid = true;
                
                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        isValid = false;
                        field.classList.add('error');
                    } else {
                        field.classList.remove('error');
                    }
                });
                
                if (!isValid) {
                    e.preventDefault();
                    alert('Por favor, preencha todos os campos obrigatórios.');
                }
            });
        });
    });
    </script>
</body>
</html>
