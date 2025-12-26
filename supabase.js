const SUPABASE_URL = 'https://ddcrszcycbccmperzqux.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkY3JzemN5Y2JjY21wZXJ6cXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NDQ0NjMsImV4cCI6MjA4MjEyMDQ2M30.II10PojHVYULsTT9DXrbF8qW3AoOAl9HMvwbMJpnFJU';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SupabaseAPI = {
    async signUp(email, password, username) {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        });

        if (error) throw error;

        if (data.user) {
            try {
                const { error: profileError } = await supabaseClient
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        username: username,
                        role: 'reader'
                    }, { onConflict: 'id' });

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                }
            } catch (e) {
                console.error('Profile upsert failed:', e);
            }
        }

        return data;
    },

    async signIn(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    },

    async getCurrentUser() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return null;

        const profile = await this.getProfile(user.id);
        return { ...user, profile };
    },

    onAuthStateChange(callback) {
        return supabaseClient.auth.onAuthStateChange(callback);
    },

    async createProfile(userId, username) {
        const { data, error } = await supabaseClient
            .from('profiles')
            .insert({ id: userId, username })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getProfile(userId) {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
    },

    async updateProfile(userId, updates) {
        const { data, error } = await supabaseClient
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getProfileByUsername(username) {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async getAllProfiles() {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async createPost(postData) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Vous devez être connecté');

        const { data, error } = await supabaseClient
            .from('posts')
            .insert({
                ...postData,
                author_id: user.id
            })
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    async getPosts() {
        const { data, error } = await supabaseClient
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getPost(postId) {
        const { data, error } = await supabaseClient
            .from('posts')
            .select('*')
            .eq('id', postId)
            .single();

        if (error) throw error;

        if (data) {
            const { data: comments } = await supabaseClient
                .from('comments')
                .select('id, content, created_at, author_id')
                .eq('post_id', postId)
                .order('created_at', { ascending: true });
            data.comments = comments || [];
        }

        return data;
    },

    async getPostsByAuthor(authorId) {
        const { data, error } = await supabaseClient
            .from('posts')
            .select('*')
            .eq('author_id', authorId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async updatePost(postId, updates) {
        const { data, error } = await supabaseClient
            .from('posts')
            .update(updates)
            .eq('id', postId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deletePost(postId) {
        const { error } = await supabaseClient
            .from('posts')
            .delete()
            .eq('id', postId);

        if (error) throw error;
    },

    async incrementViews(postId) {
        const { data, error } = await supabaseClient.rpc('increment_views', { post_id: postId });
        if (error) console.error('Error incrementing views:', error);
        return data;
    },

    async likePost(postId) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Vous devez être connecté');

        const { error } = await supabaseClient
            .from('likes')
            .insert({ user_id: user.id, post_id: postId });

        if (error && error.code !== '23505') throw error;
    },

    async unlikePost(postId) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Vous devez être connecté');

        const { error } = await supabaseClient
            .from('likes')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', postId);

        if (error) throw error;
    },

    async hasLiked(postId) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return false;

        const { data, error } = await supabaseClient
            .from('likes')
            .select('*')
            .eq('user_id', user.id)
            .eq('post_id', postId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return !!data;
    },

    async getLikeCount(postId) {
        const { count, error } = await supabaseClient
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

        if (error) throw error;
        return count || 0;
    },

    async addComment(postId, content) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Vous devez être connecté');

        const { data, error } = await supabaseClient
            .from('comments')
            .insert({
                post_id: postId,
                author_id: user.id,
                content
            })
            .select(`
                *,
                author:profiles(username)
            `)
            .single();

        if (error) throw error;
        return data;
    },

    async getComments(postId) {
        const { data, error } = await supabaseClient
            .from('comments')
            .select(`
                *,
                author:profiles(id, username)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async deleteComment(commentId) {
        const { error } = await supabaseClient
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) throw error;
    },

    async createProject(projectData) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Vous devez être connecté');

        const { data, error } = await supabaseClient
            .from('projects')
            .insert({
                ...projectData,
                author_id: user.id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getProjects() {
        const { data, error } = await supabaseClient
            .from('projects')
            .select(`
                *,
                author:profiles(username),
                bots:project_bots(post_id)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getProject(projectId) {
        const { data, error } = await supabaseClient
            .from('projects')
            .select(`
                *,
                author:profiles(username),
                bots:project_bots(
                    post:posts(*)
                )
            `)
            .eq('id', projectId)
            .single();

        if (error) throw error;
        return data;
    },

    async addBotToProject(projectId, postId) {
        const { error } = await supabaseClient
            .from('project_bots')
            .insert({ project_id: projectId, post_id: postId });

        if (error) throw error;
    },

    async removeBotFromProject(projectId, postId) {
        const { error } = await supabaseClient
            .from('project_bots')
            .delete()
            .eq('project_id', projectId)
            .eq('post_id', postId);

        if (error) throw error;
    },

    async deleteProject(projectId) {
        const { error } = await supabaseClient
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;
    },

    async getStats() {
        const [usersRes, postsRes, devsRes] = await Promise.all([
            supabaseClient.from('profiles').select('*', { count: 'exact', head: true }),
            supabaseClient.from('posts').select('*', { count: 'exact', head: true }),
            supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'dev')
        ]);

        return {
            totalUsers: usersRes.count || 0,
            totalPosts: postsRes.count || 0,
            devCount: devsRes.count || 0
        };
    }
};
