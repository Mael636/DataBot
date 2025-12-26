const Theme = {
    STORAGE_KEY: 'databot_theme',

    init() {
        const savedTheme = localStorage.getItem(this.STORAGE_KEY) || 'dark';
        this.applyTheme(savedTheme);
        this.bindEvents();
        console.log('🎨 Theme module initialized');
    },

    bindEvents() {
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggle();
            });
        }
    },

    toggle() {
        const currentTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        localStorage.setItem(this.STORAGE_KEY, newTheme);
    },

    applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
        this.updateToggleIcon(theme);
    },

    updateToggleIcon(theme) {
        const toggleBtn = document.getElementById('themeToggle');
        if (!toggleBtn) return;

        if (theme === 'light') {
            toggleBtn.innerHTML = `
                <svg viewBox="0 0 16 16" fill="currentColor" width="18" height="18">
                    <path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z"/>
                </svg>
            `;
            toggleBtn.title = 'Mode sombre';
        } else {
            toggleBtn.innerHTML = `
                <svg viewBox="0 0 16 16" fill="currentColor" width="18" height="18">
                    <path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5.657-8.157a.75.75 0 0 1 0 1.061l-1.061 1.06a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.06-1.06a.75.75 0 0 1 1.06 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0ZM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8Zm13 0a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8Zm-8 5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13Zm3.536-1.464a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061Zm-9.193-9.193a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061Z"/>
                </svg>
            `;
            toggleBtn.title = 'Mode clair';
        }
    },

    getCurrentTheme() {
        return document.body.classList.contains('light-mode') ? 'light' : 'dark';
    }
};
