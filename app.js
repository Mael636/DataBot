const App = {
    currentPage: 'home',

    async init() {
        console.log('🚀 DataBot initializing...');

        await Auth.init();
        await Posts.init();
        await Projects.init();
        await Stats.init();
        Profile.init();
        Hosting.init();
        Theme.init();
        Admin.init();

        this.bindNavigation();
        this.loadInitialData();
        this.initHighlighting();

        console.log('✅ DataBot ready!');
    },

    bindNavigation() {
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateTo(page);

                document.querySelector('.user-dropdown')?.classList.remove('open');
            });
        });

        document.querySelector('.nav-brand')?.addEventListener('click', () => {
            this.navigateTo('home');
        });

        document.getElementById('heroExploreBtn')?.addEventListener('click', () => {
            this.navigateTo('explore');
        });
    },

    navigateTo(pageName) {
        if (pageName === 'admin' && !Auth.isSuperAdmin()) {
            this.showToast('Accès refusé', 'error');
            return;
        }

        if (pageName === 'create' && !Auth.canCreatePosts()) {
            this.showToast('Vous n\'avez pas la permission de créer des posts', 'error');
            return;
        }

        if (['profile', 'my-posts', 'create'].includes(pageName) && !Auth.isLoggedIn()) {
            Auth.showModal('loginModal');
            return;
        }

        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        const pageMap = {
            'home': 'homePage',
            'explore': 'explorePage',
            'projects': 'projectsPage',
            'createProject': 'createProjectPage',
            'projectDetail': 'projectDetailPage',
            'create': 'createPage',
            'profile': 'profilePage',
            'my-posts': 'myPostsPage',
            'admin': 'adminPage',
            'postDetail': 'postDetailPage'
        };

        const pageId = pageMap[pageName] || 'homePage';
        document.getElementById(pageId)?.classList.add('active');

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageName);
        });

        this.currentPage = pageName;
        this.loadPageData(pageName);
        window.scrollTo(0, 0);
    },

    loadPageData(pageName) {
        switch (pageName) {
            case 'home':
                Posts.loadRecentPosts();
                this.updateHomeStats();
                break;
            case 'explore':
                Posts.loadAllPosts();
                break;
            case 'profile':
                this.loadProfilePage();
                break;
            case 'my-posts':
                this.loadMyPostsPage();
                break;
            case 'admin':
                Admin.loadAdminPanel();
                break;
            case 'projects':
                Projects.loadAllProjects();
                break;
        }
    },

    loadInitialData() {
        Posts.loadRecentPosts();
        this.updateHomeStats();
    },

    updateHomeStats() {
        const stats = DataStore.getStats();
        document.getElementById('statUsers').textContent = stats.totalUsers;
        document.getElementById('statBots').textContent = stats.totalPosts;
        document.getElementById('statDevs').textContent = stats.devCount;
    },

    loadProfilePage() {
        const user = Auth.getCurrentUser();
        if (!user) return;

        const roleInfo = DataStore.ROLES[user.role];
        const date = new Date(user.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        document.getElementById('profileAvatar').textContent = user.username.charAt(0).toUpperCase();
        document.getElementById('profileName').textContent = user.username;
        document.getElementById('profileRole').textContent = roleInfo?.name || user.role;
        document.getElementById('profileRole').className = `role-badge ${roleInfo?.color || 'reader'}`;
        document.getElementById('profileDate').textContent = date;

        const userPosts = DataStore.getPostsByAuthor(user.id);
        document.getElementById('profilePosts').textContent = userPosts.length;
        Posts.loadUserPosts(user.id, 'userPosts');
    },

    loadMyPostsPage() {
        const user = Auth.getCurrentUser();
        if (!user) return;
        Posts.loadUserPosts(user.id, 'myPostsList');
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    initHighlighting() {
        if (typeof hljs !== 'undefined') {
            hljs.highlightAll();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
