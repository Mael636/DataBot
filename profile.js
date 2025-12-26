const Profile = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const editForm = document.getElementById('editProfileForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleUpdateProfile(e));
        }

        const editBtn = document.getElementById('editProfileBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.openEditModal());
        }
    },

    openEditModal() {
        const profile = Auth.currentProfile;
        if (!profile) return;

        document.getElementById('editProfileBio').value = profile.bio || '';
        document.getElementById('editProfileGithub').value = profile.github || '';
        document.getElementById('editProfileDiscord').value = profile.discord || '';

        App.showModal('editProfileModal');
    },

    async handleUpdateProfile(e) {
        e.preventDefault();

        const user = Auth.currentUser;
        if (!user) return;

        const updates = {
            bio: document.getElementById('editProfileBio').value.trim(),
            github: document.getElementById('editProfileGithub').value.trim(),
            discord: document.getElementById('editProfileDiscord').value.trim()
        };

        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Enregistrement...';
        btn.disabled = true;

        try {
            const updatedProfile = await SupabaseAPI.updateProfile(user.id, updates);

            Auth.currentProfile = updatedProfile;

            this.renderProfile(updatedProfile);

            App.hideModal('editProfileModal');
            App.showToast('Profil mis à jour !', 'success');
        } catch (error) {
            console.error('Update profile error:', error);
            App.showToast('Erreur lors de la mise à jour', 'error');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    },

    renderProfile(profile) {
        document.getElementById('profileName').textContent = profile.username;
        document.getElementById('profileRole').textContent = profile.role;
        document.getElementById('profileDate').textContent = new Date(profile.created_at).toLocaleDateString();

        const bioEl = document.getElementById('profileBio');
        if (bioEl) {
            bioEl.textContent = profile.bio || 'Aucune biographie renseignée.';
            if (!profile.bio) bioEl.style.fontStyle = 'italic';
            else bioEl.style.fontStyle = 'normal';
        }

        const linksContainer = document.getElementById('profileLinks');
        if (linksContainer) {
            linksContainer.innerHTML = '';

            if (profile.github) {
                linksContainer.innerHTML += `
                    <a href="${profile.github}" target="_blank" class="social-link github">
                        <i class="fab fa-github"></i> GitHub
                    </a>
                `;
            }

            if (profile.discord) {
                linksContainer.innerHTML += `
                    <div class="social-link discord">
                        <i class="fab fa-discord"></i> ${profile.discord}
                    </div>
                `;
            }
        }
    }
};

window.Profile = Profile;
