const Projects = {
    currentProjectId: null,

    init() {
        this.bindEvents();
        console.log('📁 Projects module initialized');
    },

    bindEvents() {
        document.getElementById('createProjectForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateProject();
        });

        document.getElementById('cancelCreateProject')?.addEventListener('click', () => {
            App.navigateTo('projects');
        });

        document.getElementById('backToProjects')?.addEventListener('click', () => {
            App.navigateTo('projects');
        });

        document.getElementById('addBotToProjectBtn')?.addEventListener('click', () => {
            this.showAddBotModal();
        });

        document.querySelectorAll('[data-close="addBotModal"]').forEach(btn => {
            btn.addEventListener('click', () => {
                Auth.hideModal('addBotModal');
            });
        });
    },

    loadAllProjects() {
        const container = document.getElementById('projectsList');
        if (!container) return;

        const projects = DataStore.getProjects();
        this.renderProjects(container, projects);
    },

    loadUserProjects(userId) {
        const container = document.getElementById('userProjectsList');
        if (!container) return;

        const projects = DataStore.getProjectsByAuthor(userId);
        this.renderProjects(container, projects);
    },

    renderProjects(container, projects) {
        if (projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📁</div>
                    <div class="empty-state-title">Aucun projet</div>
                    <div class="empty-state-text">Créez votre premier projet pour regrouper vos bots !</div>
                </div>
            `;
            return;
        }

        container.innerHTML = projects.map(project => this.createProjectCard(project)).join('');

        container.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showProjectDetail(card.dataset.projectId);
            });
        });
    },

    createProjectCard(project) {
        const date = new Date(project.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
        });

        const botsCount = project.bots ? project.bots.length : 0;

        return `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-card-header">
                    <div class="project-card-icon">📁</div>
                    <div class="project-card-info">
                        <h3 class="project-card-title">${this.escapeHtml(project.name)}</h3>
                        <p class="project-card-author">par ${this.escapeHtml(project.authorName)}</p>
                    </div>
                </div>
                ${project.description ? `<p class="project-card-desc">${this.escapeHtml(project.description)}</p>` : ''}
                <div class="project-card-footer">
                    <span class="project-stat">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Z"/></svg>
                        ${botsCount} bot${botsCount > 1 ? 's' : ''}
                    </span>
                    <span class="project-stat">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5.75 0a.75.75 0 0 1 .75.75V2h3V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-4H2.75a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25Z"/></svg>
                        ${date}
                    </span>
                </div>
            </div>
        `;
    },

    handleCreateProject() {
        const name = document.getElementById('projectName').value.trim();
        const description = document.getElementById('projectDescription').value.trim();

        if (!name) {
            App.showToast('Veuillez entrer un nom de projet', 'error');
            return;
        }

        try {
            const project = DataStore.createProject({
                name,
                description
            });

            App.showToast('Projet créé avec succès !', 'success');
            document.getElementById('createProjectForm').reset();
            this.showProjectDetail(project.id);
        } catch (error) {
            App.showToast(error.message, 'error');
        }
    },

    showProjectDetail(projectId) {
        const project = DataStore.getProject(projectId);
        if (!project) {
            App.showToast('Projet introuvable', 'error');
            return;
        }

        this.currentProjectId = projectId;

        const container = document.getElementById('projectDetailContent');
        const bots = DataStore.getProjectBots(projectId);
        const date = new Date(project.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const session = DataStore.getSession();
        const canEdit = session && (project.authorId === session.id || DataStore.ROLES[DataStore.getUser(session.id)?.role]?.level >= 50);

        container.innerHTML = `
            <div class="project-detail-top">
                <div class="project-detail-icon">📁</div>
                <div class="project-detail-info">
                    <h1>${this.escapeHtml(project.name)}</h1>
                    <p class="project-meta">par ${this.escapeHtml(project.authorName)} • créé le ${date}</p>
                    ${project.description ? `<p class="project-desc">${this.escapeHtml(project.description)}</p>` : ''}
                </div>
            </div>
            <div class="project-detail-actions">
                ${canEdit ? `
                    <button class="btn btn-primary" id="projectAddBot">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"/></svg>
                        Ajouter un Bot
                    </button>
                    <button class="btn btn-danger" id="projectDelete">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75Z"/></svg>
                        Supprimer
                    </button>
                ` : ''}
            </div>
            <div class="project-bots-section">
                <h2>Bots du projet (${bots.length})</h2>
                <div class="project-bots-grid" id="projectBotsGrid">
                    ${bots.length === 0 ? `
                        <div class="empty-state small">
                            <div class="empty-state-icon">🤖</div>
                            <div class="empty-state-text">Aucun bot dans ce projet</div>
                        </div>
                    ` : bots.map(bot => this.createBotInProjectCard(bot, canEdit)).join('')}
                </div>
            </div>
        `;

        document.getElementById('projectAddBot')?.addEventListener('click', () => {
            this.showAddBotModal();
        });

        document.getElementById('projectDelete')?.addEventListener('click', () => {
            this.handleDeleteProject(projectId);
        });

        container.querySelectorAll('.remove-from-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleRemoveBotFromProject(btn.dataset.botId);
            });
        });

        container.querySelectorAll('.bot-in-project-card').forEach(card => {
            card.addEventListener('click', () => {
                Posts.showPostDetail(card.dataset.botId);
            });
        });

        App.navigateTo('projectDetail');
    },

    createBotInProjectCard(bot, canEdit) {
        return `
            <div class="bot-in-project-card" data-bot-id="${bot.id}">
                <div class="bot-card-header">
                    <span class="bot-emoji">🤖</span>
                    <div class="bot-card-info">
                        <h4>${this.escapeHtml(bot.name)}</h4>
                        <span class="post-lang-badge ${bot.language}">${bot.language}</span>
                    </div>
                    ${canEdit ? `
                        <button class="btn btn-sm btn-secondary remove-from-project" data-bot-id="${bot.id}" title="Retirer du projet">
                            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>
                        </button>
                    ` : ''}
                </div>
                <p class="bot-card-desc">${this.escapeHtml(bot.description || '')}</p>
            </div>
        `;
    },

    showAddBotModal() {
        const session = DataStore.getSession();
        if (!session) return;

        const project = DataStore.getProject(this.currentProjectId);
        const userBots = DataStore.getPostsByAuthor(session.id);
        const availableBots = userBots.filter(bot => !project.bots.includes(bot.id));

        const container = document.getElementById('availableBotsList');
        if (container) {
            if (availableBots.length === 0) {
                container.innerHTML = `
                    <div class="empty-state small">
                        <p>Aucun bot disponible à ajouter.</p>
                        <p><a href="#" onclick="App.navigateTo('create'); Auth.hideModal('addBotModal');">Créer un nouveau bot</a></p>
                    </div>
                `;
            } else {
                container.innerHTML = availableBots.map(bot => `
                    <div class="available-bot-item" data-bot-id="${bot.id}">
                        <span class="bot-emoji">🤖</span>
                        <div class="bot-info">
                            <strong>${this.escapeHtml(bot.name)}</strong>
                            <span class="post-lang-badge ${bot.language}">${bot.language}</span>
                        </div>
                        <button class="btn btn-sm btn-primary add-bot-btn" data-bot-id="${bot.id}">Ajouter</button>
                    </div>
                `).join('');

                container.querySelectorAll('.add-bot-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        this.handleAddBotToProject(btn.dataset.botId);
                    });
                });
            }
        }

        Auth.showModal('addBotModal');
    },

    handleAddBotToProject(botId) {
        try {
            DataStore.addBotToProject(this.currentProjectId, botId);
            App.showToast('Bot ajouté au projet !', 'success');
            Auth.hideModal('addBotModal');
            this.showProjectDetail(this.currentProjectId);
        } catch (error) {
            App.showToast(error.message, 'error');
        }
    },

    handleRemoveBotFromProject(botId) {
        if (!confirm('Retirer ce bot du projet ?')) return;

        try {
            DataStore.removeBotFromProject(this.currentProjectId, botId);
            App.showToast('Bot retiré du projet', 'info');
            this.showProjectDetail(this.currentProjectId);
        } catch (error) {
            App.showToast(error.message, 'error');
        }
    },

    handleDeleteProject(projectId) {
        const project = DataStore.getProject(projectId);
        if (!confirm(`Supprimer le projet "${project.name}" ? Les bots ne seront pas supprimés.`)) return;

        try {
            DataStore.deleteProject(projectId);
            App.showToast('Projet supprimé', 'success');
            App.navigateTo('projects');
        } catch (error) {
            App.showToast(error.message, 'error');
        }
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
