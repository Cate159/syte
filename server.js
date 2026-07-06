const http = require('http');
const fs = require('fs');
const path = require('path');

const data = { counter: 0, todos: [] };

const server = http.createServer((req, res) => {
    const url = req.url;
    const method = req.method;

    if (url === '/api/data' && method === 'GET') {
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
