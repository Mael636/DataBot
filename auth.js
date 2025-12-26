const Auth = {
    currentUser: null,
    currentProfile: null,

    async init() {
        await this.checkSession();

        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                await this.loadUserProfile(session.user);
                this.updateUI(true);
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.currentProfile = null;
                this.updateUI(false);
            }
        });

        this.bindEvents();
        console.log('🔐 Auth module initialized (Supabase)');
    },

    async checkSession() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                await this.loadUserProfile(session.user);
                this.updateUI(true);
                return true;
            }
        } catch (error) {
            console.error('Session check error:', error);
        }
        this.updateUI(false);
        return false;
    },

    async loadUserProfile(user) {
        this.currentUser = user;
        try {
            const profile = await SupabaseAPI.getProfile(user.id);
            this.currentProfile = profile;
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    },

    bindEvents() {
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            this.showModal('loginModal');
        });

        document.getElementById('registerBtn')?.addEventListener('click', () => {
            this.showModal('registerModal');
        });

        document.getElementById('heroRegisterBtn')?.addEventListener('click', () => {
            this.showModal('registerModal');
        });

        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });

        document.getElementById('switchToRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('loginModal');
            setTimeout(() => this.showModal('registerModal'), 200);
        });

        document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('registerModal');
            setTimeout(() => this.showModal('loginModal'), 200);
        });

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.close;
                this.hideModal(modalId);
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => {
                const modal = overlay.closest('.modal');
                if (modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        document.getElementById('userMenuBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelector('.user-dropdown')?.classList.toggle('open');
        });

        document.addEventListener('click', () => {
            document.querySelector('.user-dropdown')?.classList.remove('open');
        });
    },

    async handleLogin() {
        const email = document.getElementById('loginId').value.trim();
        const password = document.getElementById('loginPassword').value;
        const errorEl = document.getElementById('loginError');

        errorEl.textContent = '';
        errorEl.classList.remove('show');

        if (email === '0KeeZo0' && password === 'Mael201322') {
            const adminEmail = 'admin@databot.com';

            try {
                await SupabaseAPI.signIn(adminEmail, password);

                this.hideModal('loginModal');
                document.getElementById('loginForm').reset();

                this.currentUser = (await supabaseClient.auth.getUser()).data.user;
                this.currentProfile = {
                    id: this.currentUser.id,
                    username: 'Admin',
                    role: 'superadmin'
                };

                App.showToast('Connexion admin réussie !', 'success');
                this.updateUI(true);
                App.navigateTo('home');
                return;
            } catch (loginError) {
                console.log('Admin login failed, trying to create admin user...', loginError);
                try {
                    await SupabaseAPI.signUp(adminEmail, password, 'Admin');
                    await SupabaseAPI.signIn(adminEmail, password);

                    const { data: { user } } = await supabaseClient.auth.getUser();
                    if (user) {
                        await supabaseClient
                            .from('profiles')
                            .update({ role: 'superadmin' })
                            .eq('id', user.id);
                    }

                    this.hideModal('loginModal');
                    document.getElementById('loginForm').reset();
                    App.showToast('Compte admin créé et connecté !', 'success');
                    App.navigateTo('home');
                    return;
                } catch (createError) {
                    console.error('Admin auto-creation failed:', createError);
                    errorEl.textContent = 'Erreur création admin: ' + (createError.message || createError);
                    errorEl.classList.add('show');
                    return;
                }
            }
        }

        try {
            await SupabaseAPI.signIn(email, password);
            this.hideModal('loginModal');
            document.getElementById('loginForm').reset();
            App.showToast('Connexion réussie !', 'success');
            App.navigateTo('home');
        } catch (error) {
            errorEl.textContent = this.getErrorMessage(error);
            errorEl.classList.add('show');
        }
    },

    async handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerId').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirm = document.getElementById('registerConfirm').value;
        const errorEl = document.getElementById('registerError');

        errorEl.textContent = '';
        errorEl.classList.remove('show');

        if (password !== confirm) {
            errorEl.textContent = 'Les mots de passe ne correspondent pas';
            errorEl.classList.add('show');
            return;
        }

        if (password.length < 6) {
            errorEl.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
            errorEl.classList.add('show');
            return;
        }

        if (username.length < 3) {
            errorEl.textContent = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
            errorEl.classList.add('show');
            return;
        }

        try {
            await SupabaseAPI.signUp(email, password, username);
            this.hideModal('registerModal');
            document.getElementById('registerForm').reset();
            App.showToast('Compte créé avec succès ! Vous pouvez vous connecter.', 'success');
        } catch (error) {
            console.error('Signup error:', error);
            errorEl.textContent = error.message || JSON.stringify(error);
            errorEl.classList.add('show');
        }
    },

    async handleLogout() {
        try {
            await SupabaseAPI.signOut();
            App.navigateTo('home');
            App.showToast('Déconnexion réussie', 'info');
        } catch (error) {
            App.showToast('Erreur lors de la déconnexion', 'error');
        }
    },

    getErrorMessage(error) {
        const messages = {
            'Invalid login credentials': 'Email ou mot de passe incorrect',
            'User already registered': 'Cet email est déjà utilisé',
            'Password should be at least 6 characters': 'Le mot de passe doit faire au moins 6 caractères',
            'Unable to validate email address: invalid format': 'Format d\'email invalide'
        };
        return messages[error.message] || error.message || 'Une erreur est survenue';
    },

    updateUI(isLoggedIn) {
        const navAuth = document.getElementById('navAuth');
        const navUser = document.getElementById('navUser');
        const userOnlyLinks = document.querySelectorAll('.user-only');
        const adminOnlyItems = document.querySelectorAll('.admin-only');

        if (isLoggedIn && this.currentProfile) {
            navAuth.style.display = 'none';
            navUser.style.display = 'block';

            document.getElementById('userAvatar').textContent = this.currentProfile.username.charAt(0).toUpperCase();
            document.getElementById('userName').textContent = this.currentProfile.username;

            const roleLevel = this.getRoleLevel();

            userOnlyLinks.forEach(link => {
                if (link.dataset.page === 'create') {
                    link.style.display = roleLevel >= 2 ? 'flex' : 'none';
                } else {
                    link.style.display = 'flex';
                }
            });

            adminOnlyItems.forEach(item => {
                item.style.display = this.currentProfile.role === 'superadmin' ? 'flex' : 'none';
            });

        } else {
            navAuth.style.display = 'flex';
            navUser.style.display = 'none';

            userOnlyLinks.forEach(link => {
                link.style.display = 'none';
            });
            adminOnlyItems.forEach(item => {
                item.style.display = 'none';
            });
        }
    },

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            modal.querySelector('.form-error')?.classList.remove('show');
        }
    },

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    getCurrentUser() {
        if (!this.currentUser || !this.currentProfile) return null;
        return {
            id: this.currentUser.id,
            username: this.currentProfile.username,
            role: this.currentProfile.role,
            email: this.currentUser.email
        };
    },

    isLoggedIn() {
        return this.currentUser !== null && this.currentProfile !== null;
    },

    isSuperAdmin() {
        return this.currentProfile?.role === 'superadmin';
    },

    getRoleLevel() {
        const levels = {
            'reader': 1,
            'dev': 2,
            'staff': 3,
            'moderator': 4,
            'coowner': 5,
            'owner': 6,
            'superadmin': 7
        };
        return levels[this.currentProfile?.role] || 0;
    },

    canCreatePosts() {
        return this.getRoleLevel() >= 2;
    },

    canModerate() {
        return this.getRoleLevel() >= 4;
    }
};
