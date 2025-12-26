const Stats = {
    cache: {
        data: null,
        timestamp: 0,
        TTL: 60000
    },

    async init() {
        console.log('🚀 Stats module initialized');
        await this.loadGlobalStats();
    },

    async loadGlobalStats() {
        const now = Date.now();
        if (this.cache.data && (now - this.cache.timestamp < this.cache.TTL)) {
            this.renderStats(this.cache.data);
            return;
        }

        try {
            const [
                { count: botsCount },
                { count: usersCount },
                { count: devsCount }
            ] = await Promise.all([
                supabaseClient.from('posts').select('*', { count: 'exact', head: true }),
                supabaseClient.from('profiles').select('*', { count: 'exact', head: true }),
                supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'reader')
            ]);

            const stats = {
                bots: botsCount || 0,
                users: usersCount || 0,
                devs: devsCount || 0
            };

            this.cache.data = stats;
            this.cache.timestamp = now;

            this.renderStats(stats);

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },

    renderStats(stats) {
        this.animateValue('totalBots', stats.bots);
        this.animateValue('totalUsers', stats.users);
        this.animateValue('totalDevs', stats.devs);

        if (document.getElementById('adminStatUsers')) {
            document.getElementById('adminStatUsers').textContent = stats.users;
            document.getElementById('adminStatBots').textContent = stats.bots;
            if (document.getElementById('adminStatStaff')) {
                document.getElementById('adminStatStaff').textContent = stats.devs;
            }
        }
    },

    animateValue(id, value) {
        const element = document.getElementById(id);
        if (!element) return;

        const start = 0;
        const end = parseInt(value, 10);
        const duration = 1000;
        const range = end - start;
        const minTimer = 50;
        let stepTime = Math.abs(Math.floor(duration / range));

        stepTime = Math.max(stepTime, minTimer);

        let startTime = new Date().getTime();
        let endTime = startTime + duration;
        let timer;

        function run() {
            let now = new Date().getTime();
            let remaining = Math.max((endTime - now) / duration, 0);
            let value = Math.round(end - (remaining * range));
            element.textContent = value;
            if (value == end) {
                clearInterval(timer);
            }
        }

        if (range === 0) {
            element.textContent = end;
            return;
        }

        timer = setInterval(run, stepTime);
        run();
    }
};

window.Stats = Stats;
