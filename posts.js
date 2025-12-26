
const Posts = {
    currentFiles: [],

    init() {
        this.bindEvents();
        console.log('📝 Posts module initialized');
    },

    bindEvents() {
        const form = document.getElementById('createForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                console.log('🚀 Tentative de soumission du formulaire...');
                e.preventDefault();
                this.handleCreatePost();
            });
        } else {
            console.error('❌ Formulaire de création (createForm) NON TROUVÉ !');
        }

        document.getElementById('cancelCreate')?.addEventListener('click', () => {
            this.currentFiles = [];
            this.renderFilesList();
            App.navigateTo('explore');
        });

        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.filterPosts(e.target.value.toLowerCase());
        });
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterByLanguage(btn.dataset.filter);
            });
        });

        document.getElementById('backToExplore')?.addEventListener('click', () => {
            App.navigateTo('explore');
        });

        this.initFileUpload();
    },

    initFileUpload() {
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');

        if (!uploadZone) return;
        document.querySelectorAll('.upload-method-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const method = tab.dataset.method;

                document.querySelectorAll('.upload-method-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                document.querySelectorAll('.upload-method-content').forEach(c => c.classList.remove('active'));
                document.getElementById(method + 'Method')?.classList.add('active');
            });
        });

        fileInput?.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
            fileInput.value = '';
        });
        const folderInput = document.getElementById('folderInput');
        folderInput?.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
            folderInput.value = '';
        });

        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });

        document.getElementById('addPasteFile')?.addEventListener('click', () => {
            this.handlePasteFileAdd();
        });
    },
    handleFileUpload(fileList) {
        const files = Array.from(fileList);

        files.forEach(file => {
            if (file.name.startsWith('.') || file.webkitRelativePath.includes('node_modules')) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const filePath = file.webkitRelativePath || file.name;

                const exists = this.currentFiles.some(f => f.name === filePath);
                if (exists) {
                    App.showToast(`Le fichier "${filePath}" existe déjà`, 'error');
                    return;
                }

                this.currentFiles.push({
                    name: filePath,
                    content: e.target.result,
                    size: file.size,
                    language: this.getLanguageFromExtension(file.name)
                });

                this.renderFilesList();
                App.showToast(`Fichier "${filePath}" ajouté`, 'success');
            };

            reader.readAsText(file);
        });
    },

    handlePasteFileAdd() {
        const nameInput = document.getElementById('pasteFileName');
        const contentInput = document.getElementById('pasteFileContent');

        const name = nameInput.value.trim();
        const content = contentInput.value;

        if (!name || !content) {
            App.showToast('Veuillez remplir le nom du fichier et le code', 'error');
            return;
        }

        const exists = this.currentFiles.some(f => f.name === name);
        if (exists) {
            App.showToast(`Le fichier "${name}" existe déjà`, 'error');
            return;
        }

        this.currentFiles.push({
            name: name,
            content: content,
            size: new Blob([content]).size,
            language: this.getLanguageFromExtension(name)
        });

        this.renderFilesList();
        nameInput.value = '';
        contentInput.value = '';
        App.showToast(`Fichier "${name}" ajouté`, 'success');
    },

    getLanguageFromExtension(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const mapping = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'json': 'json',
            'md': 'markdown',
            'css': 'css',
            'html': 'html',
            'yml': 'yaml',
            'yaml': 'yaml',
            'txt': 'text',
            'env': 'bash'
        };
        return mapping[ext] || 'text';
    },

    renderFilesList() {
        const container = document.getElementById('filesList');
        if (!container) return;

        if (this.currentFiles.length === 0) {
            container.innerHTML = '';
            return;
        }

        const formatSize = (bytes) => {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        };

        container.innerHTML = `
            <div class="files-count">${this.currentFiles.length} fichier(s)</div>
            ${this.currentFiles.map((file, index) => `
                <div class="file-item" data-index="${index}">
                    <div class="file-item-icon">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.75 1.5a.25.25 0 0 0-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25V6H9.75A1.75 1.75 0 0 1 8 4.25V1.5Zm5.75.56v2.19c0 .138.112.25.25.25h2.19L9.5 2.06ZM2 1.75C2 .784 2.784 0 3.75 0h5.086c.464 0 .909.184 1.237.513l3.414 3.414c.329.328.513.773.513 1.237v8.086A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25Z"/></svg>
                    </div>
                    <div class="file-item-info">
                        <div class="file-item-name">${this.escapeHtml(file.name)}</div>
                        <div class="file-item-size">${formatSize(file.size)} • ${file.language}</div>
                    </div>
                    <div class="file-item-actions">
                        <button type="button" class="file-item-btn" title="Voir" onclick="Posts.previewFile(${index})">
                            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.831.88 9.577.43 8.899a1.62 1.62 0 0 1 0-1.798c.45-.678 1.367-1.932 2.637-3.023C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.824.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z"/></svg>
                        </button>
                        <button type="button" class="file-item-btn delete" title="Supprimer" onclick="Posts.removeFile(${index})">
                            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM6.5 1.75v1.25h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25ZM4.997 6.178a.75.75 0 0 1 0 1.06l-2.575 2.566a.75.75 0 0 1-1.06-1.06l2.574-2.566a.75.75 0 0 1 1.061 0ZM14.72 6.178a.75.75 0 0 0 0 1.06l-2.575 2.566a.75.75 0 1 0 1.06-1.06l2.574-2.566a.75.75 0 0 0-1.061 0Z"/><path d="M3.75 6.5a.75.75 0 0 1 .75.75v6c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25v-6a.75.75 0 0 1 1.5 0v6A1.75 1.75 0 0 1 11.25 15h-6.5A1.75 1.75 0 0 1 3 13.25v-6a.75.75 0 0 1 .75-.75Z"/></svg>
                        </button>
                    </div>
                </div>
            `).join('')}
        `;
    },

    previewFile(index) {
        const file = this.currentFiles[index];
        if (!file) return;

        alert(`📄 ${file.name}\n${'─'.repeat(30)}\n\n${file.content.substring(0, 500)}${file.content.length > 500 ? '\n...(tronqué)' : ''}`);
    },

    removeFile(index) {
        const file = this.currentFiles[index];
        if (file && confirm(`Supprimer "${file.name}" ?`)) {
            this.currentFiles.splice(index, 1);
            this.renderFilesList();
            App.showToast('Fichier supprimé', 'info');
        }
    },

    async handleCreatePost() {
        console.log('📦 handleCreatePost appelé !');
        const name = document.getElementById('botName').value.trim();
        const description = document.getElementById('botDescription').value.trim();
        const language = document.getElementById('botLanguage').value;
        const version = document.getElementById('botVersion').value.trim() || '1.0.0';
        const features = document.getElementById('botFeatures').value.trim();
        const inviteLink = document.getElementById('botInvite').value.trim();

        if (this.currentFiles.length === 0) {
            App.showToast('Veuillez ajouter au moins un fichier', 'error');
            return;
        }

        try {
            const post = await DataStore.createPost({
                name,
                description,
                language,
                version,
                features,
                files: this.currentFiles,
                inviteLink,
                allowFork: document.getElementById('allowFork')?.checked !== false
            });

            App.showToast('Bot publié avec succès !', 'success');
            this.currentFiles = [];
            this.renderFilesList();
            document.getElementById('createForm').reset();
            App.navigateTo('explore');
            await this.loadAllPosts();
        } catch (error) {
            App.showToast(error.message, 'error');
        }
    },

    resetCreateForm() {
        this.currentFiles = [];
        this.renderFilesList();
        document.getElementById('createForm')?.reset();
    },

    async loadRecentPosts() {
        const container = document.getElementById('recentPosts');
        if (!container) return;

        const posts = await DataStore.getPosts();
        this.renderPosts(container, posts.slice(0, 6));
    },

    async loadAllPosts() {
        const container = document.getElementById('allPosts');
        if (!container) return;

        const posts = await DataStore.getPosts();
        this.renderPosts(container, posts);
    },

    async loadUserPosts(userId, containerId = 'userPosts') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const posts = await DataStore.getPostsByAuthor(userId);
        this.renderPosts(container, posts);
    },

    renderPosts(container, posts) {
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🤖</div>
                    <div class="empty-state-title">Aucun bot trouvé</div>
                    <div class="empty-state-text">Soyez le premier à partager un bot !</div>
                </div>
            `;
            return;
        }

        container.innerHTML = posts.map(post => this.createPostCard(post)).join('');

        container.querySelectorAll('.post-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showPostDetail(card.dataset.postId);
            });
        });
    },

    createPostCard(post) {
        const date = new Date(post.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
        });

        const filesCount = post.files ? post.files.length : (post.code ? 1 : 0);

        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <div>
                        <h3 class="post-title">${this.escapeHtml(post.name)}</h3>
                        <div class="post-author">
                            par <span>${this.escapeHtml(post.authorName)}</span>
                        </div>
                    </div>
                    <span class="post-lang-badge ${post.language}">${post.language}</span>
                </div>
                <p class="post-description">${this.escapeHtml(post.description)}</p>
                <div class="post-footer">
                    <span class="post-stat">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.75 1.5a.25.25 0 0 0-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25V6H9.75A1.75 1.75 0 0 1 8 4.25V1.5Zm5.75.56v2.19c0 .138.112.25.25.25h2.19Z"/></svg>
                        ${filesCount} fichier${filesCount > 1 ? 's' : ''}
                    </span>
                    <span class="post-stat">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.75A2.75 2.75 0 0 1 4.75 0h8.5A2.75 2.75 0 0 1 16 2.75v10.5A2.75 2.75 0 0 1 13.25 16h-8.5A2.75 2.75 0 0 1 2 13.25Zm2.75-1.25c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h8.5c.69 0 1.25-.56 1.25-1.25V2.75c0-.69-.56-1.25-1.25-1.25Z"/></svg>
                        v${this.escapeHtml(post.version || '1.0.0')}
                    </span>
                    <span class="post-stat">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5.75 0a.75.75 0 0 1 .75.75V2h3V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-4H2.75a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25Z"/></svg>
                        ${date}
                    </span>
                </div>
            </div>
        `;
    },

    async showPostDetail(postId) {
        const post = await DataStore.getPost(postId);
        if (!post) {
            App.showToast('Post introuvable', 'error');
            return;
        }

        const userHasLiked = await DataStore.hasLiked(postId);

        const container = document.getElementById('postDetailContent');
        const date = new Date(post.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const files = post.files || (post.code ? [{ name: 'main.' + (post.language === 'python' ? 'py' : 'js'), content: post.code, language: post.language }] : []);

        container.innerHTML = `
            <div class="post-detail-top">
                <h1 class="post-detail-title">${this.escapeHtml(post.name)}</h1>
                <div class="post-detail-meta">
                    <span class="post-lang-badge ${post.language}">${post.language}</span>
                    <span>v${this.escapeHtml(post.version || '1.0.0')}</span>
                    <span>par ${this.escapeHtml(post.authorName)}</span>
                    <span>${date}</span>
                    <span>${files.length} fichier${files.length > 1 ? 's' : ''}</span>
                    ${post.forkedFrom ? `<span>🔀 Fork de ${this.escapeHtml(post.forkedFrom.authorName)}</span>` : ''}
                </div>
            </div>
            <div class="post-actions-bar">
                <button class="like-btn ${userHasLiked ? 'liked' : ''}" id="likeBtn" data-post-id="${postId}">
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="m8 14.25.345.666a.75.75 0 0 1-.69 0l-.008-.004-.018-.01a7.152 7.152 0 0 1-.31-.17 22.055 22.055 0 0 1-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002ZM4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.58 20.58 0 0 0 8 13.393a20.58 20.58 0 0 0 3.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.749.749 0 0 1-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5Z"/></svg>
                    <span id="likeCount">${(post.likes || []).length}</span>
                </button>
                <span class="post-stat-item">
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.831.88 9.577.43 8.899a1.62 1.62 0 0 1 0-1.798c.45-.678 1.367-1.932 2.637-3.023C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.824.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z"/></svg>
                    ${post.views || 0} vues
                </span>
                <span class="post-stat-item">
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"/></svg>
                    ${(post.comments || []).length} commentaires
                </span>
                ${post.allowFork !== false ? `
                    <button class="btn btn-fork" onclick="Posts.handleFork('${postId}')">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>
                        Fork
                    </button>
                ` : ''}
            </div>
            <div class="post-detail-body">
                <div class="post-detail-section">
                    <h3>Description</h3>
                    <p>${this.escapeHtml(post.description)}</p>
                </div>
                ${post.features ? `
                    <div class="post-detail-section">
                        <h3>Fonctionnalités</h3>
                        <p>${this.escapeHtml(post.features).replace(/\\n/g, '<br>')}</p>
                    </div>
                ` : ''}
                <div class="post-detail-section">
                    <h3>Fichiers</h3>
                    <div class="files-panel">
                        <div class="files-tabs" id="filesTabs">
                            ${files.map((file, i) => `
                                <button class="file-tab ${i === 0 ? 'active' : ''}" data-file-index="${i}">
                                    ${this.escapeHtml(file.name)}
                                </button>
                            `).join('')}
                        </div>
                        <div id="filesContent">
                            ${files.map((file, i) => `
                                <div class="file-content ${i === 0 ? 'active' : ''}" data-file-index="${i}">
                                    <div class="post-code-header" style="display: flex; justify-content: flex-end; padding: 8px 16px; background: var(--bg-tertiary);">
                                        <button class="btn btn-sm btn-secondary" onclick="Posts.copyFileCode('${postId}', ${i})">
                                            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>
                                            Copier
                                        </button>
                                    </div>
                                    <pre class="file-code-content"><code class="language-${file.language || post.language}">${this.escapeHtml(file.content)}</code></pre>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                ${post.inviteLink ? `
                    <div class="post-detail-section">
                        <h3>Lien d'invitation</h3>
                        <a href="${this.escapeHtml(post.inviteLink)}" target="_blank" class="btn btn-primary">
                            <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>
                            Ajouter ce bot
                        </a>
                    </div>
                ` : ''}
                <div class="post-detail-section">
                    <h3>🚀 Héberger ce bot</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 16px;">Déployez ce bot gratuitement sur Replit en quelques clics</p>
                    <button class="btn btn-deploy" onclick="Hosting.showDeployModal('${postId}')">
                        <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM5.78 8.75a9.64 9.64 0 0 0 1.363 4.177c.255.426.542.832.857 1.215.245-.296.551-.705.857-1.215A9.64 9.64 0 0 0 10.22 8.75Zm4.44-1.5a9.64 9.64 0 0 0-1.363-4.177c-.307-.51-.612-.919-.857-1.215a9.927 9.927 0 0 0-.857 1.215A9.64 9.64 0 0 0 5.78 7.25Zm-5.944 1.5H1.543a6.507 6.507 0 0 0 4.666 5.5c-.123-.181-.24-.365-.352-.552-.715-1.192-1.437-2.874-1.581-4.948Zm-2.733-1.5h2.733c.144-2.074.866-3.756 1.58-4.948.12-.197.237-.381.353-.552a6.507 6.507 0 0 0-4.666 5.5Zm10.181 1.5c-.144 2.074-.866 3.756-1.58 4.948-.12.197-.237.381-.353.552a6.507 6.507 0 0 0 4.666-5.5Zm2.733-1.5a6.507 6.507 0 0 0-4.666-5.5c.123.181.24.365.353.552.714 1.192 1.436 2.874 1.58 4.948Z"/></svg>
                        Déployer sur Replit
                    </button>
                </div>
                <div class="comments-section">
                    <h3>💬 Commentaires (${(post.comments || []).length})</h3>
                    ${Auth.isLoggedIn() ? `
                        <div class="comment-form">
                            <textarea id="commentInput" placeholder="Ajouter un commentaire..."></textarea>
                            <button class="btn btn-primary" onclick="Posts.handleAddComment('${postId}')">Envoyer</button>
                        </div>
                    ` : '<p style="color: var(--text-muted); margin-bottom: 16px;">Connectez-vous pour commenter</p>'}
                    <div class="comments-list" id="commentsList">
                        ${this.renderComments(post.comments || [], postId)}
                    </div>
                </div>
            </div>
        `;

        if (typeof hljs !== 'undefined') {
            container.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        }

        container.querySelectorAll('.file-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const index = tab.dataset.fileIndex;

                container.querySelectorAll('.file-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                container.querySelectorAll('.file-content').forEach(c => c.classList.remove('active'));
                container.querySelector(`.file-content[data-file-index="${index}"]`)?.classList.add('active');
            });
        });

        const likeBtn = document.getElementById('likeBtn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                this.handleLikeToggle(postId);
            });
        }

        DataStore.incrementViews(postId);

        App.navigateTo('postDetail');
    },

    copyFileCode(postId, fileIndex) {
        const post = DataStore.getPost(postId);
        if (!post) return;

        const files = post.files || (post.code ? [{ content: post.code }] : []);
        const file = files[fileIndex];

        if (!file) return;

        navigator.clipboard.writeText(file.content).then(() => {
            App.showToast('Code copié !', 'success');
        }).catch(() => {
            App.showToast('Erreur lors de la copie', 'error');
        });
    },

    copyCode(postId) {
        this.copyFileCode(postId, 0);
    },

    filterPosts(searchTerm) {
        const posts = DataStore.getPosts().filter(post => {
            return post.name.toLowerCase().includes(searchTerm) ||
                post.description.toLowerCase().includes(searchTerm) ||
                post.authorName.toLowerCase().includes(searchTerm);
        });

        const container = document.getElementById('allPosts');
        this.renderPosts(container, posts);
    },

    filterByLanguage(language) {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        let posts = DataStore.getPosts();

        if (language !== 'all') {
            posts = posts.filter(p => p.language === language);
        }

        if (searchTerm) {
            posts = posts.filter(post => {
                return post.name.toLowerCase().includes(searchTerm) ||
                    post.description.toLowerCase().includes(searchTerm) ||
                    post.authorName.toLowerCase().includes(searchTerm);
            });
        }

        const container = document.getElementById('allPosts');
        this.renderPosts(container, posts);
    },

    async handleLikeToggle(postId) {
        try {
            const hasLiked = await DataStore.hasLiked(postId);
            let newCount;

            if (hasLiked) {
                newCount = await DataStore.unlikePost(postId);
            } else {
                newCount = await DataStore.likePost(postId);
            }

            const likeBtn = document.getElementById('likeBtn');
            const likeCount = document.getElementById('likeCount');

            if (likeBtn) {
                likeBtn.classList.toggle('liked', !hasLiked);
            }
            if (likeCount) {
                likeCount.textContent = newCount;
            }
        } catch (error) {
            App.showToast(error.message, 'error');
        }
    },

    async handleAddComment(postId) {
        const input = document.getElementById('commentInput');
        if (!input) return;

        const content = input.value.trim();
        if (!content) {
            App.showToast('Le commentaire ne peut pas être vide', 'error');
            return;
        }

        try {
            await DataStore.addComment(postId, content);
            input.value = '';

            const post = await DataStore.getPost(postId);
            const commentsList = document.getElementById('commentsList');
            if (commentsList && post) {
                commentsList.innerHTML = this.renderComments(post.comments || [], postId);
            }

            App.showToast('Commentaire ajouté !', 'success');
        } catch (error) {
            App.showToast(error.message, 'error');
        }
    },

    async handleDeleteComment(postId, commentId) {
        if (!confirm('Supprimer ce commentaire ?')) return;

        try {
            await DataStore.deleteComment(postId, commentId);

            const post = await DataStore.getPost(postId);
            const commentsList = document.getElementById('commentsList');
            if (commentsList && post) {
                commentsList.innerHTML = this.renderComments(post.comments || [], postId);
            }

            App.showToast('Commentaire supprimé', 'success');
        } catch (error) {
            App.showToast(error.message, 'error');
        }
    },

    async handleFork(postId) {
        if (!Auth.isLoggedIn()) {
            App.showToast('Vous devez être connecté pour forker', 'error');
            return;
        }

        try {
            const forkedPost = await DataStore.forkPost(postId);
            App.showToast('Bot forké avec succès !', 'success');
            await this.showPostDetail(forkedPost.id);
        } catch (error) {
            App.showToast(error.message, 'error');
        }
    },

    renderComments(comments, postId) {
        if (!comments || comments.length === 0) {
            return '<p style="color: var(--text-muted);">Aucun commentaire pour le moment</p>';
        }

        const session = DataStore.getSession();
        const currentUserId = session?.id;
        const userLevel = session ? (DataStore.ROLES[DataStore.getUser(session.id)?.role]?.level || 0) : 0;

        return comments.map(comment => {
            const date = new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const canDelete = currentUserId === comment.authorId || userLevel >= DataStore.ROLES.moderator.level;

            return `
                <div class="comment-item">
                    <div class="comment-avatar">${comment.authorName.charAt(0).toUpperCase()}</div>
                    <div class="comment-content">
                        <div class="comment-header">
                            <span class="comment-author">${this.escapeHtml(comment.authorName)}</span>
                            <span class="comment-date">${date}</span>
                        </div>
                        <p class="comment-text">${this.escapeHtml(comment.content)}</p>
                        ${canDelete ? `
                            <div class="comment-actions">
                                <button class="comment-delete" onclick="Posts.handleDeleteComment('${postId}', '${comment.id}')">Supprimer</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
