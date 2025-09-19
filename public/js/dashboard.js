document.addEventListener('DOMContentLoaded', () => {
    class UltimateVPSDashboard {
        constructor() {
            this.token = localStorage.getItem('auth_token');
            this.updateInterval = null;
            this.init();
        }

        init() {
            this.bindEvents();
            if (this.token) {
                this.showDashboard();
            } else {
                this.showLogin();
            }
        }

        bindEvents() {
            document.getElementById('loginFormSubmit').addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });

            document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
            document.getElementById('createAccountBtn').addEventListener('click', () => this.showCreateAccountModal());
            document.getElementById('cancelCreateAccount').addEventListener('click', () => this.hideCreateAccountModal());
            document.getElementById('createAccountForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateAccount();
            });
        }

        async apiFetch(url, options = {}) {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            };
            const response = await fetch(url, { ...defaultOptions, ...options });
            if (response.status === 401) {
                this.handleLogout();
                throw new Error('Unauthorized');
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
                throw new Error(errorData.message);
            }
            return response.status === 204 ? null : response.json();
        }

        async handleLogin() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            try {
                const data = await this.apiFetch('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ username, password }),
                    headers: { 'Content-Type': 'application/json' } // No auth token for login
                });
                this.token = data.token;
                localStorage.setItem('auth_token', this.token);
                this.showDashboard();
            } catch (error) {
                alert('Giriş başarısız: ' + error.message);
            }
        }

        handleLogout() {
            this.token = null;
            localStorage.removeItem('auth_token');
            this.showLogin();
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        }

        showLogin() {
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('dashboard').classList.add('hidden');
        }

        showDashboard() {
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            this.loadDashboardData();
            this.startRealTimeUpdates();
        }

        async loadDashboardData() {
            await Promise.all([
                this.loadServerStats(),
                this.loadPortStatus(),
                this.loadSSHAccounts()
            ]);
        }

        async loadServerStats() {
            try {
                const stats = await this.apiFetch('/api/stats/server');
                document.getElementById('cpuUsage').textContent = `${stats.cpu.toFixed(1)}%`;
                document.getElementById('ramUsage').textContent = `${stats.ram.toFixed(1)}%`;
                document.getElementById('diskUsage').textContent = `${stats.disk.toFixed(1)}%`;
            } catch (error) {
                console.error('Server stats loading failed:', error);
            }
        }

        async loadPortStatus() {
            try {
                const ports = await this.apiFetch('/api/stats/ports');
                const portStatusDiv = document.getElementById('portStatus');
                portStatusDiv.innerHTML = ports.map(port => `
                    <div class="port-card p-4 rounded-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-semibold">${port.service}</h4>
                                <p class="text-sm text-gray-400">Port: ${port.port}</p>
                            </div>
                            <div class="text-right">
                                <span class="status-indicator ${port.connections > 0 ? 'status-online' : 'status-offline'}"></span>
                                <span class="text-lg font-bold">${port.connections}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
                const totalConnections = ports.reduce((sum, port) => sum + port.connections, 0);
                document.getElementById('activeConnections').textContent = totalConnections;
            } catch (error) {
                console.error('Port status loading failed:', error);
            }
        }

        async loadSSHAccounts() {
            try {
                const accounts = await this.apiFetch('/api/ssh/accounts');
                const tableBody = document.getElementById('sshAccountsList');
                tableBody.innerHTML = accounts.map(account => `
                    <tr class="hover:bg-gray-700" data-username="${account.username}">
                        <td class="p-3">${account.username}</td>
                        <td class="p-3">${new Date(account.expiryDate).toLocaleDateString('tr-TR')}</td>
                        <td class="p-3">${account.maxLogin}</td>
                        <td class="p-3"><span class="bg-blue-600 text-xs px-2 py-1 rounded">${account.activeConnections || 0}</span></td>
                        <td class="p-3"><span class="status-indicator ${account.isActive ? 'status-online' : 'status-offline'}"></span>${account.isActive ? 'Aktif' : 'Pasif'}</td>
                        <td class="p-3">
                            <div class="flex space-x-2">
                                <button data-action="toggle" class="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-xs">${account.isActive ? 'Durdur' : 'Aktifleştir'}</button>
                                <button data-action="delete" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs">Sil</button>
                            </div>
                        </td>
                    </tr>
                `).join('');

                tableBody.querySelectorAll('tr[data-username]').forEach(row => {
                    const username = row.dataset.username;
                    row.querySelector('button[data-action="toggle"]')?.addEventListener('click', () => this.toggleAccount(username));
                    row.querySelector('button[data-action="delete"]')?.addEventListener('click', () => this.deleteAccount(username));
                });
            } catch (error) {
                console.error('SSH accounts loading failed:', error);
            }
        }

        showCreateAccountModal() {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            document.getElementById('expiryDate').value = expiryDate.toISOString().split('T')[0];
            document.getElementById('createAccountModal').classList.remove('hidden');
        }

        hideCreateAccountModal() {
            document.getElementById('createAccountModal').classList.add('hidden');
            document.getElementById('createAccountForm').reset();
        }

        async handleCreateAccount() {
            const formData = {
                username: document.getElementById('newUsername').value,
                password: document.getElementById('newPassword').value,
                maxLogin: parseInt(document.getElementById('maxLogin').value),
                expiryDate: document.getElementById('expiryDate').value
            };
            try {
                await this.apiFetch('/api/ssh/create', { method: 'POST', body: JSON.stringify(formData) });
                alert('SSH hesabı başarıyla oluşturuldu!');
                this.hideCreateAccountModal();
                this.loadSSHAccounts();
            } catch (error) {
                alert('Hata: ' + error.message);
            }
        }

        async toggleAccount(username) {
            try {
                await this.apiFetch(`/api/ssh/toggle/${username}`, { method: 'PATCH' });
                this.loadSSHAccounts();
            } catch (error) {
                alert('İşlem başarısız: ' + error.message);
            }
        }

        async deleteAccount(username) {
            if (confirm(`${username} hesabını silmek istediğinizden emin misiniz?`)) {
                try {
                    await this.apiFetch(`/api/ssh/delete/${username}`, { method: 'DELETE' });
                    alert('Hesap başarıyla silindi!');
                    this.loadSSHAccounts();
                } catch (error) {
                    alert('Silme işlemi başarısız: ' + error.message);
                }
            }
        }

        startRealTimeUpdates() {
            if (this.updateInterval) clearInterval(this.updateInterval);
            this.updateInterval = setInterval(() => {
                this.loadServerStats();
                this.loadPortStatus();
            }, 30000);
        }
    }

    new UltimateVPSDashboard();
});
