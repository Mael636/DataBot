const Hosting = {
    init() {
        console.log('🚀 Hosting module initialized');
    },

    generateReplitUrl(bot) {
        const baseUrl = 'https://replit.com/new';

        const templates = {
            'javascript': 'nodejs',
            'typescript': 'nodejs',
            'python': 'python3'
        };

        const template = templates[bot.language] || 'nodejs';

        return `${baseUrl}/${template}`;
    },

    generateDeploymentPackage(botId) {
        const bot = DataStore.getPost(botId);
        if (!bot) {
            App.showToast('Bot introuvable', 'error');
            return null;
        }

        const files = bot.files || [];
        if (files.length === 0) {
            App.showToast('Ce bot n\'a pas de fichiers', 'error');
            return null;
        }

        const configFiles = this.generateConfigFiles(bot);

        return {
            bot,
            files: [...files, ...configFiles],
            instructions: this.generateInstructions(bot)
        };
    },

    generateConfigFiles(bot) {
        const configs = [];

        if (bot.language === 'javascript' || bot.language === 'typescript') {
            configs.push({
                name: 'package.json',
                content: JSON.stringify({
                    name: bot.name.toLowerCase().replace(/\s+/g, '-'),
                    version: bot.version || '1.0.0',
                    description: bot.description,
                    main: this.findMainFile(bot.files, bot.language),
                    scripts: {
                        start: `node ${this.findMainFile(bot.files, bot.language)}`
                    },
                    dependencies: {
                        'discord.js': '^14.14.1'
                    }
                }, null, 2),
                language: 'json'
            });

            configs.push({
                name: '.replit',
                content: `run = "npm start"
entrypoint = "${this.findMainFile(bot.files, bot.language)}"

[nix]
channel = "stable-23_11"

[deployment]
run = ["sh", "-c", "npm start"]`,
                language: 'toml'
            });

        } else if (bot.language === 'python') {
            configs.push({
                name: 'requirements.txt',
                content: 'discord.py>=2.0.0\npython-dotenv',
                language: 'text'
            });

            configs.push({
                name: '.replit',
                content: `run = "python ${this.findMainFile(bot.files, bot.language)}"
entrypoint = "${this.findMainFile(bot.files, bot.language)}"

[nix]
channel = "stable-23_11"`,
                language: 'toml'
            });
        }

        configs.push({
            name: '.env.example',
            content: `DISCORD_TOKEN=votre_token_ici`,
            language: 'bash'
        });

        return configs;
    },

    findMainFile(files, language) {
        const mainNames = {
            'javascript': ['index.js', 'bot.js', 'main.js', 'app.js'],
            'typescript': ['index.ts', 'bot.ts', 'main.ts', 'app.ts'],
            'python': ['main.py', 'bot.py', 'app.py', 'index.py']
        };

        const names = mainNames[language] || mainNames['javascript'];

        for (const name of names) {
            if (files.some(f => f.name.toLowerCase() === name)) {
                return name;
            }
        }

        return files[0]?.name || 'index.js';
    },

    generateInstructions(bot) {
        return `# Déployer ${bot.name} sur Replit

## Étapes

1. **Créer un compte Replit** (gratuit)
   - Allez sur [replit.com](https://replit.com)
   - Créez un compte ou connectez-vous

2. **Créer un nouveau Repl**
   - Cliquez sur "+ Create Repl"
   - Choisissez "${bot.language === 'python' ? 'Python' : 'Node.js'}"
   - Nommez-le "${bot.name}"

3. **Copier les fichiers**
   - Copiez chaque fichier du bot dans Replit
   - N'oubliez pas le fichier \`.env\` avec votre token !

4. **Installer les dépendances**
   ${bot.language === 'python' ? '- Cliquez sur "Run" et Replit installera automatiquement' : '- Cliquez sur "Shell" et tapez: npm install'}

5. **Lancer le bot**
   - Cliquez sur "Run" ▶️
   - Votre bot sera en ligne !

## Garder le bot actif 24/7

Pour que le bot reste actif, utilisez [UptimeRobot](https://uptimerobot.com) :
1. Créez un compte gratuit
2. Ajoutez un moniteur HTTP
3. Utilisez l'URL de votre Repl

---
Généré par DataBot 🤖`;
    },

    async downloadAsZip(botId) {
        const pkg = this.generateDeploymentPackage(botId);
        if (!pkg) return;

        let content = `# ${pkg.bot.name}\n\n`;
        content += `## Fichiers du bot\n\n`;

        pkg.files.forEach(file => {
            content += `### ${file.name}\n\`\`\`${file.language || ''}\n${file.content}\n\`\`\`\n\n`;
        });

        content += `\n---\n\n${pkg.instructions}`;

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pkg.bot.name.replace(/\s+/g, '_')}_deployment.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        App.showToast('Package de déploiement téléchargé !', 'success');
    },

    showDeployModal(botId) {
        const pkg = this.generateDeploymentPackage(botId);
        if (!pkg) return;

        const modal = document.getElementById('deployModal');
        const content = document.getElementById('deployModalContent');

        if (!modal || !content) {
            App.showToast('Modal non trouvée', 'error');
            return;
        }

        content.innerHTML = `
            <div class="deploy-header">
                <h3>🚀 Déployer ${this.escapeHtml(pkg.bot.name)}</h3>
                <p>Hébergez votre bot gratuitement sur Replit</p>
            </div>
            
            <div class="deploy-steps">
                <div class="deploy-step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h4>Ouvrir Replit</h4>
                        <p>Créez un nouveau projet ${pkg.bot.language === 'python' ? 'Python' : 'Node.js'}</p>
                        <a href="${this.generateReplitUrl(pkg.bot)}" target="_blank" class="btn btn-primary">
                            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM5.78 8.75a9.64 9.64 0 0 0 1.363 4.177c.255.426.542.832.857 1.215.245-.296.551-.705.857-1.215A9.64 9.64 0 0 0 10.22 8.75Zm4.44-1.5a9.64 9.64 0 0 0-1.363-4.177c-.307-.51-.612-.919-.857-1.215a9.927 9.927 0 0 0-.857 1.215A9.64 9.64 0 0 0 5.78 7.25Zm-5.944 1.5H1.543a6.507 6.507 0 0 0 4.666 5.5c-.123-.181-.24-.365-.352-.552-.715-1.192-1.437-2.874-1.581-4.948Zm-2.733-1.5h2.733c.144-2.074.866-3.756 1.58-4.948.12-.197.237-.381.353-.552a6.507 6.507 0 0 0-4.666 5.5Zm10.181 1.5c-.144 2.074-.866 3.756-1.58 4.948-.12.197-.237.381-.353.552a6.507 6.507 0 0 0 4.666-5.5Zm2.733-1.5a6.507 6.507 0 0 0-4.666-5.5c.123.181.24.365.353.552.714 1.192 1.436 2.874 1.58 4.948Z"/></svg>
                            Ouvrir Replit
                        </a>
                    </div>
                </div>

                <div class="deploy-step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h4>Copier les fichiers</h4>
                        <p>Copiez chaque fichier dans votre Repl</p>
                        <div class="deploy-files">
                            ${pkg.files.map((file, i) => `
                                <div class="deploy-file">
                                    <span class="file-name">${this.escapeHtml(file.name)}</span>
                                    <button class="btn btn-sm btn-secondary" onclick="Hosting.copyFileContent(${botId}, ${i})">
                                        Copier
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="deploy-step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h4>Ajouter votre Token</h4>
                        <p>Créez un fichier <code>.env</code> avec votre token Discord</p>
                        <pre class="env-example">DISCORD_TOKEN=votre_token_ici</pre>
                    </div>
                </div>

                <div class="deploy-step">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <h4>Lancer le bot</h4>
                        <p>Cliquez sur "Run" dans Replit et votre bot sera en ligne ! 🎉</p>
                    </div>
                </div>
            </div>

            <div class="deploy-actions">
                <button class="btn btn-secondary" onclick="Hosting.downloadAsZip('${botId}')">
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"/><path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"/></svg>
                    Télécharger le package
                </button>
            </div>
        `;

        this.currentDeployBot = pkg;

        Auth.showModal('deployModal');
    },

    copyFileContent(botId, fileIndex) {
        if (!this.currentDeployBot) return;

        const file = this.currentDeployBot.files[fileIndex];
        if (!file) return;

        navigator.clipboard.writeText(file.content).then(() => {
            App.showToast(`${file.name} copié !`, 'success');
        }).catch(() => {
            App.showToast('Erreur lors de la copie', 'error');
        });
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
