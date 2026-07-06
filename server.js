const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS visits (
                id SERIAL PRIMARY KEY,
                count INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS leaderboard (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                score INTEGER NOT NULL,
                date TIMESTAMP DEFAULT NOW()
            );
        `);
        
        const result = await pool.query('SELECT count FROM visits WHERE id = 1');
        if (result.rows.length === 0) {
            await pool.query('INSERT INTO visits (id, count) VALUES (1, 0)');
        }
        console.log('Database connected!');
    } catch (e) {
        console.log('Database error:', e.message);
    }
}

initDB();

const data = { counter: 0, todos: [] };
const leaderboardFile = path.join(__dirname, 'leaderboard.json');

function getLeaderboardLocal() {
    try {
        if (fs.existsSync(leaderboardFile)) {
            return JSON.parse(fs.readFileSync(leaderboardFile, 'utf8'));
        }
    } catch (e) {}
    return [];
}

function saveLeaderboardLocal(leaderboard) {
    fs.writeFileSync(leaderboardFile, JSON.stringify(leaderboard, null, 2));
}

const server = http.createServer((req, res) => {
    const url = req.url;
    const method = req.method;

    if (url === '/api/visits' && method === 'GET') {
        pool.query('SELECT count FROM visits WHERE id = 1')
            .then(result => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ visits: result.rows[0]?.count || 0 }));
            })
            .catch(e => {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Database error' }));
            });
    }
    else if (url === '/api/visits' && method === 'POST') {
        pool.query('UPDATE visits SET count = count + 1 WHERE id = 1 RETURNING count')
            .then(result => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ visits: result.rows[0].count }));
            })
            .catch(e => {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Database error' }));
            });
    }
    else if (url === '/api/data' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }
    else if (url === '/api/counter/increment' && method === 'POST') {
        data.counter++;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ counter: data.counter }));
    }
    else if (url === '/api/counter/decrement' && method === 'POST') {
        data.counter--;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ counter: data.counter }));
    }
    else if (url === '/api/todos' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const todo = { id: Date.now(), text: JSON.parse(body).text };
            data.todos.push(todo);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(todo));
        });
    }
    else if (url.startsWith('/api/todos/') && method === 'DELETE') {
        const id = parseInt(url.split('/')[3]);
        data.todos = data.todos.filter(t => t.id !== id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
    }
    else if (url === '/api/leaderboard' && method === 'GET') {
        pool.query('SELECT name, score, date FROM leaderboard ORDER BY score DESC LIMIT 100')
            .then(result => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result.rows));
            })
            .catch(e => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(getLeaderboardLocal()));
            });
    }
    else if (url === '/api/leaderboard' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { name, score } = JSON.parse(body);
                if (!name || !score) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Name and score required' }));
                    return;
                }
                
                pool.query('SELECT id, score FROM leaderboard WHERE name = $1', [name])
                    .then(result => {
                        if (result.rows.length > 0) {
                            if (score > result.rows[0].score) {
                                return pool.query('UPDATE leaderboard SET score = $1, date = NOW() WHERE name = $2', [score, name]);
                            }
                        } else {
                            return pool.query('INSERT INTO leaderboard (name, score) VALUES ($1, $2)', [name, score]);
                        }
                    })
                    .then(() => pool.query('SELECT row_number() OVER (ORDER BY score DESC) as rank FROM leaderboard WHERE name = $1', [name]))
                    .then(result => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, rank: result.rows[0]?.rank || 1 }));
                    })
                    .catch(e => {
                        let leaderboard = getLeaderboardLocal();
                        const existing = leaderboard.findIndex(e => e.name === name);
                        
                        if (existing >= 0) {
                            if (score > leaderboard[existing].score) {
                                leaderboard[existing].score = score;
                                leaderboard[existing].date = new Date().toISOString();
                            }
                        } else {
                            leaderboard.push({ name, score, date: new Date().toISOString() });
                        }
                        
                        leaderboard.sort((a, b) => b.score - a.score);
                        leaderboard = leaderboard.slice(0, 100);
                        saveLeaderboardLocal(leaderboard);
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, rank: leaderboard.findIndex(e => e.name === name) + 1 }));
                    });
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid data' }));
            }
        });
    }
    else {
        const filePath = url === '/' ? '/index.html' : url;
        const ext = path.extname(filePath);
        const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };
        fs.readFile(__dirname + filePath, (err, content) => {
            if (err) {
                res.writeHead(404);
                res.end('Not found');
            } else {
                res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
                res.end(content);
            }
        });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port ' + PORT));

if (process.env.NODE_ENV !== 'production') {
    const { spawn } = require('child_process');
    const files = ['index.html', 'style.css', 'script.js', 'server.js', 'package.json'];
    let timeout = null;
    
    const sync = () => {
        console.log('\nSyncing with GitHub...');
        spawn('git', ['add', '.'], { shell: true, stdio: 'inherit' })
            .on('close', () => {
                spawn('git', ['commit', '-m', 'Auto update'], { shell: true, stdio: 'inherit' })
                    .on('close', (code) => {
                        if (code === 0) spawn('git', ['push'], { shell: true, stdio: 'inherit' });
                    });
            });
    };
    
    files.forEach(f => fs.watch(f, () => {
        clearTimeout(timeout);
        timeout = setTimeout(sync, 2000);
    }));
    console.log('Auto-sync enabled');
}
