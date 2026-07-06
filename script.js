let points = 0;
let pointsPerClick = 1;
let pointsPerSecond = 0;

const upgrades = [
    { name: "Dito Forte", effect: "+1 per click", cost: 10, owned: 0, type: "click", value: 1 },
    { name: "Auto-Clicker", effect: "+1 al secondo", cost: 50, owned: 0, type: "auto", value: 1 },
    { name: "Mouse Dorato", effect: "+5 per click", cost: 200, owned: 0, type: "click", value: 5 },
    { name: "Robot", effect: "+5 al secondo", cost: 500, owned: 0, type: "auto", value: 5 },
    { name: "Fabbrica", effect: "+20 al secondo", cost: 2000, owned: 0, type: "auto", value: 20 },
    { name: "Impero", effect: "+100 al secondo", cost: 10000, owned: 0, type: "auto", value: 100 },
];

const milestones = [
    { target: 100, reward: "+10 punti", bonus: 10, icon: "🥉" },
    { target: 500, reward: "+50 punti", bonus: 50, icon: "🥈" },
    { target: 1000, reward: "+100 punti", bonus: 100, icon: "🥇" },
    { target: 5000, reward: "+500 punti", bonus: 500, icon: "💎" },
    { target: 10000, reward: "+1000 punti", bonus: 1000, icon: "👑" },
    { target: 50000, reward: "+5000 punti", bonus: 5000, icon: "🏆" },
];

let completedMilestones = new Set();

const mainBtn = document.getElementById("mainBtn");
const pointsDisplay = document.getElementById("points");
const perClickDisplay = document.getElementById("perClick");
const perSecondDisplay = document.getElementById("perSecond");
const upgradeGrid = document.getElementById("upgradeGrid");
const milestonesDiv = document.getElementById("milestones");
const achievementsDiv = document.getElementById("achievements");

let btnX = window.innerWidth / 2 - 60;
let btnY = 300;
let speedX = 4;
let speedY = 4;
let difficulty = 1;
let obstacles = [];
let invincible = false;
let audioCtx = null;

function playCoinSound() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.2);
}

function playExplosionSound() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = "sawtooth";
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
}

const obstacleEmojis = ["💀", "💣", "🔥", "⚡", "👻", "🦇", "🕷️", "🦈"];

function createObstacle() {
    const count = Math.min(3 + Math.floor(difficulty * 2), 20);
    while (obstacles.length < count) {
        const el = document.createElement("div");
        el.className = "obstacle";
        el.textContent = obstacleEmojis[Math.floor(Math.random() * obstacleEmojis.length)];
        document.body.appendChild(el);
        
        const obs = {
            el: el,
            x: Math.random() * (window.innerWidth - 60),
            y: Math.random() * (window.innerHeight - 200) + 100,
            vx: (Math.random() - 0.5) * 8 * difficulty,
            vy: (Math.random() - 0.5) * 8 * difficulty,
            size: 50
        };
        
        el.addEventListener("click", () => {
            if (invincible) return;
            const penalty = Math.floor(10 * difficulty);
            points = Math.max(0, points - penalty);
            updateDisplay();
            showAchievement(`💀 -${penalty} punti!`);
            playExplosionSound();
            
            invincible = true;
            mainBtn.style.opacity = "0.5";
            setTimeout(() => {
                invincible = false;
                mainBtn.style.opacity = "1";
            }, 500);
        });
        
        obstacles.push(obs);
    }
    while (obstacles.length > count) {
        const obs = obstacles.pop();
        obs.el.remove();
    }
}

function moveObstacles() {
    obstacles.forEach(obs => {
        obs.x += obs.vx;
        obs.y += obs.vy;
        
        if (obs.x < 0 || obs.x > window.innerWidth - obs.size) obs.vx *= -1;
        if (obs.y < 80 || obs.y > window.innerHeight - obs.size) obs.vy *= -1;
        
        obs.x = Math.max(0, Math.min(obs.x, window.innerWidth - obs.size));
        obs.y = Math.max(80, Math.min(obs.y, window.innerHeight - obs.size));
        
        obs.el.style.left = obs.x + "px";
        obs.el.style.top = obs.y + "px";
    });
}

function checkCollision() {
}

setInterval(() => {
    moveObstacles();
    checkCollision();
}, 16);

mainBtn.style.left = btnX + "px";
mainBtn.style.top = btnY + "px";

function updateDifficulty() {
    difficulty = 1 + Math.floor(points / 50) * 0.5;
    const baseSpeed = 4;
    speedX = baseSpeed * difficulty * (Math.random() > 0.5 ? 1 : -1);
    speedY = baseSpeed * difficulty * (Math.random() > 0.5 ? 1 : -1);
    createObstacle();
}

function moveButton() {
    btnX += speedX;
    btnY += speedY;
    
    if (btnX <= 0 || btnX >= window.innerWidth - 120) {
        speedX *= -1;
        speedX += (Math.random() - 0.5) * difficulty;
    }
    if (btnY <= 80 || btnY >= window.innerHeight - 120) {
        speedY *= -1;
        speedY += (Math.random() - 0.5) * difficulty;
    }
    
    btnX = Math.max(0, Math.min(btnX, window.innerWidth - 120));
    btnY = Math.max(80, Math.min(btnY, window.innerHeight - 120));
    
    mainBtn.style.left = btnX + "px";
    mainBtn.style.top = btnY + "px";
    
    requestAnimationFrame(moveButton);
}

mainBtn.addEventListener("mouseenter", () => {
    if (difficulty > 2) {
        const angle = Math.random() * Math.PI * 2;
        speedX = Math.cos(angle) * difficulty * 3;
        speedY = Math.sin(angle) * difficulty * 3;
    }
});

moveButton();

function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
}

function updateDisplay() {
    pointsDisplay.textContent = formatNumber(Math.floor(points));
    perClickDisplay.textContent = formatNumber(pointsPerClick);
    perSecondDisplay.textContent = formatNumber(pointsPerSecond);
    document.getElementById("difficulty").textContent = difficulty.toFixed(1);
    document.title = `⭐ ${formatNumber(Math.floor(points))} punti - Clicker Game`;
}

function createFloatText(x, y, text) {
    const el = document.createElement("div");
    el.className = "float-text";
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.position = "fixed";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

mainBtn.addEventListener("click", (e) => {
    points += pointsPerClick;
    updateDisplay();
    updateDifficulty();
    
    playCoinSound();
    
    createFloatText(e.clientX, e.clientY - 50, "+" + formatNumber(pointsPerClick));
    
    const angle = Math.random() * Math.PI * 2;
    btnX = Math.random() * (window.innerWidth - 150) + 30;
    btnY = Math.random() * (window.innerHeight - 200) + 100;
    
    checkMilestones();
});

function renderUpgrades() {
    upgradeGrid.innerHTML = "";
    upgrades.forEach((u, i) => {
        const cost = Math.floor(u.cost * Math.pow(1.15, u.owned));
        const canAfford = points >= cost;
        
        const card = document.createElement("div");
        card.className = "upgrade-card" + (canAfford ? "" : " disabled");
        card.innerHTML = `
            <div class="name">${u.name}</div>
            <div class="effect">${u.effect}</div>
            <span class="cost">⭐ ${formatNumber(cost)}</span>
            <span class="owned">x${u.owned}</span>
        `;
        
        if (canAfford) {
            card.addEventListener("click", () => buyUpgrade(i));
        }
        
        upgradeGrid.appendChild(card);
    });
}

function buyUpgrade(index) {
    const u = upgrades[index];
    const cost = Math.floor(u.cost * Math.pow(1.15, u.owned));
    
    if (points >= cost) {
        points -= cost;
        u.owned++;
        
        if (u.type === "click") {
            pointsPerClick += u.value;
        } else {
            pointsPerSecond += u.value;
        }
        
        updateDisplay();
        renderUpgrades();
    }
}

function renderMilestones() {
    milestonesDiv.innerHTML = "";
    milestones.forEach((m, i) => {
        const completed = completedMilestones.has(i);
        const progress = Math.min((points / m.target) * 100, 100);
        
        const div = document.createElement("div");
        div.className = "milestone" + (completed ? " completed" : "");
        div.innerHTML = `
            <span class="icon">${m.icon}</span>
            <div class="info">
                <div>${completed ? "✅ Completato!" : formatNumber(m.target) + " punti"}</div>
                <div class="target">Ricompensa: ${m.reward}</div>
                ${!completed ? `<div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>` : ""}
            </div>
        `;
        milestonesDiv.appendChild(div);
    });
}

function checkMilestones() {
    milestones.forEach((m, i) => {
        if (!completedMilestones.has(i) && points >= m.target) {
            completedMilestones.add(i);
            points += m.bonus;
            showAchievement(`${m.icon} Obiettivo raggiunto! ${m.reward}`);
            renderMilestones();
        }
    });
}

function showAchievement(text) {
    const popup = document.createElement("div");
    popup.className = "achievement-popup";
    popup.textContent = text;
    achievementsDiv.appendChild(popup);
    setTimeout(() => popup.remove(), 3000);
}

setInterval(() => {
    if (pointsPerSecond > 0) {
        points += pointsPerSecond / 10;
        updateDisplay();
        checkMilestones();
    }
}, 100);

setInterval(() => {
    renderUpgrades();
    saveGame();
}, 1000);

function saveGame() {
    const data = { points, pointsPerClick, pointsPerSecond, upgrades: upgrades.map(u => u.owned), completedMilestones: [...completedMilestones] };
    localStorage.setItem("clickerGame", JSON.stringify(data));
}

function loadGame() {
    const data = JSON.parse(localStorage.getItem("clickerGame") || "null");
    if (data) {
        points = data.points || 0;
        pointsPerClick = data.pointsPerClick || 1;
        pointsPerSecond = data.pointsPerSecond || 0;
        data.upgrades?.forEach((owned, i) => upgrades[i].owned = owned);
        completedMilestones = new Set(data.completedMilestones || []);
    }
}

loadGame();
updateDisplay();
renderUpgrades();
renderMilestones();
createObstacle();
loadLeaderboard();

async function loadLeaderboard() {
    try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        renderLeaderboard(data);
    } catch (e) {
        console.log('Leaderboard non disponibile');
    }
}

function renderLeaderboard(entries) {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '';
    
    if (entries.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #aaa;">Nessun punteggio ancora. Sarai il primo!</p>';
        return;
    }
    
    entries.slice(0, 10).forEach((entry, i) => {
        const div = document.createElement('div');
        const topClass = i < 3 ? ` top-${i + 1}` : '';
        div.className = `leaderboard-entry${topClass}`;
        
        const medals = ['🥇', '🥈', '🥉'];
        const rank = i < 3 ? medals[i] : `#${i + 1}`;
        
        div.innerHTML = `
            <span class="leaderboard-rank">${rank}</span>
            <span class="leaderboard-name">${entry.name}</span>
            <span class="leaderboard-score">⭐ ${formatNumber(entry.score)}</span>
        `;
        list.appendChild(div);
    });
}

async function saveScore() {
    const nameInput = document.getElementById('playerName');
    const name = nameInput.value.trim();
    
    if (!name) {
        showAchievement('⚠️ Inserisci un nome!');
        return;
    }
    
    if (points < 10) {
        showAchievement('⚠️ Punteggio troppo basso!');
        return;
    }
    
    try {
        const res = await fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, score: Math.floor(points) })
        });
        
        const data = await res.json();
        
        if (data.success) {
            showAchievement(`🎉 Punteggio salvato! Posizione #${data.rank}`);
            loadLeaderboard();
        }
    } catch (e) {
        showAchievement('❌ Errore nel salvataggio');
    }
}
