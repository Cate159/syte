const { watch } = require('fs');
const { spawn } = require('child_process');

const files = ['index.html', 'style.css', 'script.js', 'server.js', 'package.json'];
let timeout = null;

function sync() {
    console.log('Syncing with GitHub...');
    const git = spawn('git', ['add', '.'], { shell: true });
    git.on('close', () => {
        const commit = spawn('git', ['commit', '-m', 'Auto update'], { shell: true });
        commit.on('close', (code) => {
            if (code === 0) {
                const push = spawn('git', ['push'], { shell: true });
                push.on('close', () => console.log('Done!'));
            } else {
                console.log('No changes to sync');
            }
        });
    });
}

files.forEach(file => {
    watch(file, () => {
        clearTimeout(timeout);
        timeout = setTimeout(sync, 1000);
    });
});

console.log('Watching for changes... Press Ctrl+C to stop');
