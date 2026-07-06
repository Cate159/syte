const { watch } = require('fs');
const { execSync } = require('child_process');

console.log('🔄 Auto-sync attivo. Modifica i file e verranno sincronizzati automaticamente.');
console.log('Premi Ctrl+C per fermare.\n');

const files = ['index.html', 'style.css', 'script.js', 'server.js', 'package.json'];
let syncing = false;

files.forEach(file => {
    watch(file, () => {
        if (syncing) return;
        syncing = true;
        setTimeout(() => {
            try {
                console.log('📤 Sincronizzo con GitHub...');
                execSync('git add .', { stdio: 'inherit' });
                execSync('git commit -m "Auto update"', { stdio: 'inherit' });
                execSync('git push', { stdio: 'inherit' });
                console.log('✅ Fatto!\n');
            } catch (e) {}
            syncing = false;
        }, 1000);
    });
});
