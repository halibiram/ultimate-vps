document.addEventListener('DOMContentLoaded', () => {
    /**
     * @class UltimateVPSDashboard
     * @description Manages the entire state and user interaction for the dashboard application.
     * This class handles authentication, API communication, data rendering, and event handling
     * for all features, including SSH account and Stunnel management.
     */
    class UltimateVPSDashboard {
        /**
         * Initializes the dashboard application.
         * It retrieves the authentication token from local storage and sets up
         * the initial state of the application.
         */
        constructor() {
            /** @type {string|null} The authentication token for API requests. */
            this.token = localStorage.getItem('auth_token');
            /** @type {number|null} The interval ID for real-time data updates. */
            this.updateInterval = null;
            this.init();
        }

        /**
         * Kicks off the application logic.
         * It binds all DOM event listeners and determines whether to show the login
         * screen or the main dashboard based on the presence of an auth token.
         */
        init() {
            this.bindEvents();
            if (this.token) {
                this.showDashboard();
            } else {
                this.showLogin();
            }
        }

        /**
         * Binds all necessary DOM event listeners for the application.
         * This includes listeners for login, logout, account creation, and Stunnel management.
         */
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

            // Stunnel management buttons
            document.getElementById('enableStunnelBtn').addEventListener('click', () => this.handleEnableStunnel());
            document.getElementById('disableStunnelBtn').addEventListener('click', () => this.handleDisableStunnel());
        }

        /**
         * A generic wrapper for making authenticated API requests using `fetch`.
         * It automatically includes the Authorization header with the stored JWT
         * and handles 401 Unauthorized errors by logging the user out.
         * @param {string} url - The API endpoint to request.
         * @param {object} [options={}] - The options for the `fetch` request (e.g., method, body).
         * @returns {Promise<any>} A promise that resolves with the JSON response from the API.
         * @throws {Error} Throws an error if the request fails, the response is not ok, or the user is unauthorized.
         */
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

        /**
         * Handles the user login form submission.
         * It sends the user's credentials to the login API and, on success, stores
         * the returned JWT in local storage and transitions to the main dashboard view.
         */
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
                alert('Login failed: ' + error.message);
            }
        }

        /**
         * Handles user logout.
         * It clears the token from memory and local storage, cancels any active
         * real-time update intervals, and shows the login screen.
         */
        handleLogout() {
            this.token = null;
            localStorage.removeItem('auth_token');
            this.showLogin();
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        }

        /**
         * Shows the login form and hides the main dashboard.
         */
        showLogin() {
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('dashboard').classList.add('hidden');
        }

        /**
         * Shows the main dashboard view and hides the login form.
         * It also triggers the initial load of all dashboard data and starts the
         * real-time update polling.
         */
        showDashboard() {
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            this.loadDashboardData();
            this.startRealTimeUpdates();
        }

        /**
         * Loads all initial data for the dashboard by calling the respective
         * data-loading methods concurrently.
         */
        async loadDashboardData() {
            await Promise.all([
                this.loadServerStats(),
                this.loadPortStatus(),
                this.loadSSHAccounts(),
                this.loadStunnelStatus()
            ]);
        }

        /**
         * Fetches and renders the real-time server statistics (CPU, RAM, Disk).
         */
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

        /**
         * Fetches and renders the status of monitored network ports.
         */
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

        /**
         * Fetches and renders the list of SSH accounts in a table.
         * It also dynamically binds event listeners to the action buttons (toggle, delete)
         * for each account.
         */
        async loadSSHAccounts() {
            try {
                const accounts = await this.apiFetch('/api/ssh/accounts');
                const tableBody = document.getElementById('sshAccountsList');
                tableBody.innerHTML = accounts.map(account => `
                    <tr class="hover:bg-gray-700" data-username="${account.username}">
                        <td class="p-3">${account.username}</td>
                        <td class="p-3">${new Date(account.expiryDate).toLocaleDateString()}</td>
                        <td class="p-3">${account.maxLogin}</td>
                        <td class="p-3"><span class="bg-blue-600 text-xs px-2 py-1 rounded">${account.activeConnections || 0}</span></td>
                        <td class="p-3"><span class="status-indicator ${account.isActive ? 'status-online' : 'status-offline'}"></span>${account.isActive ? 'Active' : 'Inactive'}</td>
                        <td class="p-3">
                            <div class="flex space-x-2">
                                <button data-action="toggle" class="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-xs">${account.isActive ? 'Deactivate' : 'Activate'}</button>
                                <button data-action="delete" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs">Delete</button>
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

        /**
         * Shows the modal dialog for creating a new SSH account.
         * It pre-fills the expiry date input to 30 days from the current date.
         */
        showCreateAccountModal() {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            document.getElementById('expiryDate').value = expiryDate.toISOString().split('T')[0];
            document.getElementById('createAccountModal').classList.remove('hidden');
        }

        /**
         * Hides the create account modal and resets its form fields.
         */
        hideCreateAccountModal() {
            document.getElementById('createAccountModal').classList.add('hidden');
            document.getElementById('createAccountForm').reset();
        }

        /**
         * Handles the submission of the create SSH account form.
         * It gathers the form data, sends it to the API, and reloads the account
         * list on success.
         */
        async handleCreateAccount() {
            const formData = {
                username: document.getElementById('newUsername').value,
                password: document.getElementById('newPassword').value,
                maxLogin: parseInt(document.getElementById('maxLogin').value),
                expiryDate: document.getElementById('expiryDate').value
            };
            try {
                await this.apiFetch('/api/ssh/create', { method: 'POST', body: JSON.stringify(formData) });
                alert('SSH account created successfully!');
                this.hideCreateAccountModal();
                this.loadSSHAccounts();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        /**
         * Toggles the active status of an SSH account.
         * @param {string} username - The username of the account to toggle.
         */
        async toggleAccount(username) {
            try {
                await this.apiFetch(`/api/ssh/toggle/${username}`, { method: 'PATCH' });
                this.loadSSHAccounts(); // Reload the list to show the new status
            } catch (error) {
                alert('Operation failed: ' + error.message);
            }
        }

        /**
         * Deletes an SSH account after receiving user confirmation.
         * @param {string} username - The username of the account to delete.
         */
        async deleteAccount(username) {
            if (confirm(`Are you sure you want to delete the account for ${username}?`)) {
                try {
                    await this.apiFetch(`/api/ssh/delete/${username}`, { method: 'DELETE' });
                    alert('Account deleted successfully!');
                    this.loadSSHAccounts(); // Reload the list to remove the deleted account
                } catch (error) {
                    alert('Delete operation failed: ' + error.message);
                }
            }
        }

        /**
         * Starts a polling interval to periodically refresh the server stats and port status.
         * This provides a real-time feel for the dashboard's monitoring features.
         */
        startRealTimeUpdates() {
            if (this.updateInterval) clearInterval(this.updateInterval);
            // Refresh stats every 30 seconds.
            this.updateInterval = setInterval(() => {
                this.loadServerStats();
                this.loadPortStatus();
            }, 30000);
        }

        /**
         * Fetches the current status of the Stunnel service and updates the UI accordingly.
         * It shows or hides the 'Enable' and 'Disable' buttons based on whether
         * Stunnel is currently active.
         */
        async loadStunnelStatus() {
            try {
                const status = await this.apiFetch('/api/stunnel/status');
                const stunnelStatusDiv = document.getElementById('stunnelStatus');
                const enableBtn = document.getElementById('enableStunnelBtn');
                const disableBtn = document.getElementById('disableStunnelBtn');

                if (status.isActive) {
                    stunnelStatusDiv.textContent = 'Active';
                    stunnelStatusDiv.className = 'status-indicator status-online';
                    enableBtn.classList.add('hidden');
                    disableBtn.classList.remove('hidden');
                } else {
                    stunnelStatusDiv.textContent = 'Inactive';
                    stunnelStatusDiv.className = 'status-indicator status-offline';
                    enableBtn.classList.remove('hidden');
                    disableBtn.classList.add('hidden');
                }
            } catch (error) {
                console.error('Failed to load Stunnel status:', error);
                document.getElementById('stunnelStatus').textContent = 'Error';
            }
        }

        /**
         * Handles the request to enable the Stunnel service.
         * It shows a confirmation dialog before sending the request to the API and
         * reloads the Stunnel status on success.
         */
        async handleEnableStunnel() {
            if (confirm('Are you sure you want to enable Stunnel? This will generate a new SSL certificate and may restart the SSH service.')) {
                try {
                    const result = await this.apiFetch('/api/stunnel/enable', { method: 'POST' });
                    alert(result.message);
                    this.loadStunnelStatus();
                } catch (error) {
                    alert('Failed to enable Stunnel: ' + error.message);
                }
            }
        }

        /**
         * Handles the request to disable the Stunnel service.
         * It shows a confirmation dialog before sending the request to the API and
         * reloads the Stunnel status on success.
         */
        async handleDisableStunnel() {
            if (confirm('Are you sure you want to disable Stunnel?')) {
                try {
                    const result = await this.apiFetch('/api/stunnel/disable', { method: 'POST' });
                    alert(result.message);
                    this.loadStunnelStatus();
                } catch (error) {
                    alert('Failed to disable Stunnel: ' + error.message);
                }
            }
        }
    }

    // Instantiate the class to start the application.
    new UltimateVPSDashboard();
});
