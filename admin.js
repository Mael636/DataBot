const Admin = {
    currentTab: 'users',

    init() {
        this.bindEvents();
        console.log('👑 Admin module initialized');
    },

    bindEvents() {
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        document.getElementById('adminSearchUser')?.addEventListener('input', (e) => {
            this.filterUsers(e.target.value.toLowerCase());
        });

        document.getElementById('adminSearchPost')?.addEventListener('input', (e) => {
            this.filterAdminPosts(e.target.value.toLowerCase());
        });

        document.getElementById('roleForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRoleChange();
        });
    },

    switchTab(tabName) {
        this.currentTab = tabName;

        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        document.querySelectorAll('.admin-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tabName}Tab`)?.classList.remove('hidden');

        switch (tabName) {
            case 'users':
                this.loadUsers();
                break;
            case 'posts':
                this.loadAdminPosts();
                break;
            case 'stats':
                this.loadStats();
                break;
        }
    },

    loadAdminPanel() {
        this.loadUsers();
        this.loadStats();
    },

    loadUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        const users = Object.values(DataStore.getUsers());
        this.renderUsersTable(tbody, users);
    },

    renderUsersTable(tbody, users) {
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Aucun utilisateur</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => {
            const date = new Date(user.createdAt).toLocaleDateString('fr-FR');
            const roleInfo = DataStore.ROLES[user.role];
            const isSuperAdmin = DataStore.isSuperAdmin(user.id);

            return `
                <tr>
                    <td>
                        <div class="user-cell">
                            <div class="user-cell-avatar">${user.username.charAt(0).toUpperCase()}</div>
                            <span>${Posts.escapeHtml(user.username)}</span>
                        </div>
                    </td>
                    <td><code>${Posts.escapeHtml(user.id)}</code></td>
                    <td><span class="role-badge ${roleInfo?.color || 'reader'}">${roleInfo?.name || user.role}</span></td>
                    <td>${date}</td>
                    <td class="actions-cell">
                        ${isSuperAdmin ? `
                            <span style="color: var(--text-muted); font-size: 0.75rem;">Super Admin</span>
                        ` : `
                            <button class="btn btn-sm btn-secondary" onclick="Admin.openRoleModal('${user.id}')">
                                Rôle
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="Admin.confirmDeleteUser('${user.id}')">
                                Suppr.
                            </button>
                        `}
                    </td>
                </tr>
            `;
        }).join('');
    },

    filterUsers(searchTerm) {
        const users = Object.values(DataStore.getUsers()).filter(user => {
            return user.username.toLowerCase().includes(searchTerm) ||
                user.id.toLowerCase().includes(searchTerm) ||
                user.role.toLowerCase().includes(searchTerm);
        });

        const tbody = document.getElementById('usersTableBody');
        this.renderUsersTable(tbody, users);
    },

    loadAdminPosts() {
        const tbody = document.getElementById('postsTableBody');
        if (!tbody) return;

        const posts = DataStore.getPosts();
        this.renderPostsTable(tbody, posts);
    },

    renderPostsTable(tbody, posts) {
        if (posts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Aucun post</td></tr>';
            return;
        }

        tbody.innerHTML = posts.map(post => {
            const date = new Date(post.createdAt).toLocaleDateString('fr-FR');

            return `
                <tr>
                    <td>${Posts.escapeHtml(post.name)}</td>
                    <td>${Posts.escapeHtml(post.authorName)}</td>
                    <td><span class="post-lang-badge ${post.language}">${post.language}</span></td>
                    <td>${date}</td>
                    <td class="actions-cell">
                        <button class="btn btn-sm btn-secondary" onclick="Posts.showPostDetail('${post.id}')">
                            Voir
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="Admin.confirmDeletePost('${post.id}')">
                            Suppr.
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    filterAdminPosts(searchTerm) {
        const posts = DataStore.getPosts().filter(post => {
            return post.name.toLowerCase().includes(searchTerm) ||
                post.authorName.toLowerCase().includes(searchTerm) ||
                post.language.toLowerCase().includes(searchTerm);
        });

        const tbody = document.getElementById('postsTableBody');
        this.renderPostsTable(tbody, posts);
    },

    loadStats() {
        const stats = DataStore.getStats();

        document.getElementById('adminStatUsers').textContent = stats.totalUsers;
        document.getElementById('adminStatPosts').textContent = stats.totalPosts;
        document.getElementById('adminStatDevs').textContent = stats.devCount;
        document.getElementById('adminStatStaff').textContent = stats.staffCount;

        this.renderRoleChart(stats.roleBreakdown);
    },

    renderRoleChart(breakdown) {
        const container = document.getElementById('rolesChart');
        if (!container) return;

        const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
        if (total === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">Aucune donnée</p>';
            return;
        }

        const bars = Object.entries(breakdown)
            .filter(([_, count]) => count > 0)
            .map(([role, count]) => {
                const roleInfo = DataStore.ROLES[role];
                const percentage = Math.round((count / total) * 100);
                return `
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span class="role-badge ${roleInfo?.color || role}" style="min-width: 100px;">${roleInfo?.name || role}</span>
                        <div style="flex: 1; height: 24px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
                            <div style="width: ${percentage}%; height: 100%; background: var(--accent-blue); transition: width 0.5s ease;"></div>
                        </div>
                        <span style="min-width: 60px; text-align: right; color: var(--text-secondary);">${count} (${percentage}%)</span>
                    </div>
                `;
            }).join('');

        container.innerHTML = bars;
    },

    openRoleModal(userId) {
        const user = DataStore.getUser(userId);
        if (!user) return;

        document.getElementById('roleUserId').value = userId;
        document.getElementById('roleUsername').value = user.username;
        document.getElementById('roleSelect').value = user.role;

        Auth.showModal('roleModal');
    },

    handleRoleChange() {
        const userId = document.getElementById('roleUserId').value;
        const newRole = document.getElementById('roleSelect').value;

        try {
            DataStore.updateUserRole(userId, newRole);
            Auth.hideModal('roleModal');
            App.showToast('Rôle modifié avec succès !', 'success');
            this.loadUsers();
            this.loadStats();
        } catch (error) {
            App.showToast(error.message, 'error');
        }
    },

    confirmDeleteUser(userId) {
        const user = DataStore.getUser(userId);
        if (!user) return;

        if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.username}" ?\nCette action est irréversible.`)) {
            try {
                DataStore.deleteUser(userId);
                App.showToast('Utilisateur supprimé', 'success');
                this.loadUsers();
                this.loadStats();
            } catch (error) {
                App.showToast(error.message, 'error');
            }
        }
    },

    confirmDeletePost(postId) {
        const post = DataStore.getPost(postId);
        if (!post) return;

        if (confirm(`Êtes-vous sûr de vouloir supprimer le bot "${post.name}" ?\nCette action est irréversible.`)) {
            try {
                DataStore.deletePost(postId);
                App.showToast('Post supprimé', 'success');
                this.loadAdminPosts();
                this.loadStats();
                Posts.loadAllPosts();
                Posts.loadRecentPosts();
            } catch (error) {
                App.showToast(error.message, 'error');
            }
        }
    }
};
