const DataStore = {
    ROLES: {
        superadmin: { level: 100, name: 'Super Admin', color: 'superadmin' },
        owner: { level: 80, name: 'Owner', color: 'owner' },
        coowner: { level: 70, name: 'Co-Owner', color: 'coowner' },
        moderator: { level: 50, name: 'Moderator', color: 'moderator' },
        staff: { level: 40, name: 'Staff', color: 'staff' },
        dev: { level: 20, name: 'Dev', color: 'dev' },
        reader: { level: 10, name: 'Reader', color: 'reader' }
    },

    PERMISSIONS: {
        superadmin: ['all'],
        owner: ['manage_posts', 'manage_users', 'view_stats', 'moderate'],
        coowner: ['manage_posts', 'manage_users', 'moderate'],
        moderator: ['moderate', 'delete_posts', 'warn_users'],
        staff: ['view_reports', 'assist_moderation'],
        dev: ['create_posts', 'edit_own_posts', 'delete_own_posts'],
        reader: ['view_posts']
    },

    init() {
        console.log('📦 DataStore initialized');
    },

    getSession() {
        if (Auth.currentUser && Auth.currentProfile) {
            return {
                id: Auth.currentUser.id,
                username: Auth.currentProfile.username,
                role: Auth.currentProfile.role
            };
        }
        return null;
    },

    getUser(userId) {
        return Auth.currentProfile;
    },

    async getUsers() {
        try {
            return await SupabaseAPI.getAllProfiles();
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    },

    async updateUserRole(userId, newRole) {
        try {
            await SupabaseAPI.updateProfile(userId, { role: newRole });
            return true;
        } catch (error) {
            console.error('Error updating role:', error);
            return false;
        }
    },

    async getPosts() {
        try {
            const posts = await SupabaseAPI.getPosts();
            return posts.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                language: p.language,
                version: p.version,
                features: p.features,
                files: p.files || [],
                inviteLink: p.invite_link,
                allowFork: p.allow_fork,
                views: p.views || 0,
                likes: [],
                comments: [],
                authorId: p.author_id,
                authorName: p.author?.username || 'Unknown',
                forkedFrom: p.forked_from,
                createdAt: p.created_at,
                updatedAt: p.updated_at
            }));
        } catch (error) {
            console.error('Error getting posts:', error);
            return [];
        }
    },

    async getPost(postId) {
        try {
            const p = await SupabaseAPI.getPost(postId);
            if (!p) return null;
            return {
                id: p.id,
                name: p.name,
                description: p.description,
                language: p.language,
                version: p.version,
                features: p.features,
                files: p.files || [],
                inviteLink: p.invite_link,
                allowFork: p.allow_fork,
                views: p.views || 0,
                likes: [],
                comments: p.comments || [],
                authorId: p.author_id,
                authorName: p.author?.username || 'Unknown',
                forkedFrom: p.forked_from,
                createdAt: p.created_at,
                updatedAt: p.updated_at
            };
        } catch (error) {
            console.error('Error getting post:', error);
            return null;
        }
    },

    async getPostsByAuthor(authorId) {
        try {
            const posts = await SupabaseAPI.getPostsByAuthor(authorId);
            return posts.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                language: p.language,
                version: p.version,
                authorId: p.author_id,
                authorName: p.author?.username || 'Unknown',
                createdAt: p.created_at
            }));
        } catch (error) {
            console.error('Error getting posts by author:', error);
            return [];
        }
    },

    async createPost(data) {
        const session = this.getSession();
        if (!session) {
            throw new Error('Vous devez être connecté pour créer un post');
        }

        try {
            const post = await SupabaseAPI.createPost({
                name: data.name,
                description: data.description,
                language: data.language,
                version: data.version || '1.0.0',
                features: data.features,
                files: data.files || [],
                invite_link: data.inviteLink,
                allow_fork: data.allowFork !== false
            });

            return {
                id: post.id,
                name: post.name,
                authorId: post.author_id,
                authorName: session.username,
                createdAt: post.created_at
            };
        } catch (error) {
            throw new Error(error.message || 'Erreur lors de la création du post');
        }
    },

    async updatePost(postId, data) {
        try {
            await SupabaseAPI.updatePost(postId, {
                name: data.name,
                description: data.description,
                language: data.language,
                version: data.version,
                features: data.features,
                files: data.files,
                invite_link: data.inviteLink,
                allow_fork: data.allowFork
            });
            return true;
        } catch (error) {
            throw new Error(error.message || 'Erreur lors de la mise à jour');
        }
    },

    async deletePost(postId) {
        try {
            await SupabaseAPI.deletePost(postId);
            return true;
        } catch (error) {
            throw new Error(error.message || 'Erreur lors de la suppression');
        }
    },

    async likePost(postId) {
        try {
            await SupabaseAPI.likePost(postId);
            return await SupabaseAPI.getLikeCount(postId);
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async unlikePost(postId) {
        try {
            await SupabaseAPI.unlikePost(postId);
            return await SupabaseAPI.getLikeCount(postId);
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async hasLiked(postId) {
        try {
            return await SupabaseAPI.hasLiked(postId);
        } catch (error) {
            return false;
        }
    },

    async addComment(postId, content) {
        try {
            return await SupabaseAPI.addComment(postId, content);
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async deleteComment(postId, commentId) {
        try {
            await SupabaseAPI.deleteComment(commentId);
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async incrementViews(postId) {
        try {
            await SupabaseAPI.incrementViews(postId);
        } catch (error) {
            console.error('Error incrementing views:', error);
        }
    },

    async forkPost(postId) {
        const session = this.getSession();
        if (!session) throw new Error('Vous devez être connecté');

        try {
            const original = await SupabaseAPI.getPost(postId);
            if (!original) throw new Error('Post introuvable');
            if (original.allow_fork === false) throw new Error('Fork non autorisé');

            const forked = await SupabaseAPI.createPost({
                name: original.name + ' (Fork)',
                description: original.description,
                language: original.language,
                version: original.version,
                features: original.features,
                files: JSON.parse(JSON.stringify(original.files || [])),
                invite_link: '',
                allow_fork: true,
                forked_from: original.id
            });

            return { id: forked.id };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async getProjects() {
        try {
            return await SupabaseAPI.getProjects();
        } catch (error) {
            console.error('Error getting projects:', error);
            return [];
        }
    },

    async getProject(projectId) {
        try {
            return await SupabaseAPI.getProject(projectId);
        } catch (error) {
            console.error('Error getting project:', error);
            return null;
        }
    },

    async createProject(data) {
        try {
            return await SupabaseAPI.createProject(data);
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async deleteProject(projectId) {
        try {
            await SupabaseAPI.deleteProject(projectId);
        } catch (error) {
            throw new Error(error.message);
        }
    },

    async getStatistics() {
        try {
            return await SupabaseAPI.getStats();
        } catch (error) {
            return { totalUsers: 0, totalPosts: 0, devCount: 0 };
        }
    },

    hasPermission(userId, permission) {
        const session = this.getSession();
        if (!session) return false;
        const permissions = this.PERMISSIONS[session.role] || [];
        return permissions.includes('all') || permissions.includes(permission);
    },

    canManageUser(managerId, targetId) {
        return false;
    },

    isSuperAdmin(userId) {
        const session = this.getSession();
        return session?.role === 'superadmin';
    }
};
