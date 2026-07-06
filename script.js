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
const clickArea = document.getElementById("clickArea");
const pointsDisplay = document.getElementById("points");
const perClickDisplay = document.getElementById("perClick");
const perSecondDisplay = document.getElementById("perSecond");
const upgradeGrid = document.getElementById("upgradeGrid");
const milestonesDiv = document.getElementById("milestones");
const achievementsDiv = document.getElementById("achievements");

function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
}

function updateDisplay() {
    pointsDisplay.textContent = formatNumber(Math.floor(points));
    perClickDisplay.textContent = formatNumber(pointsPerClick);
    perSecondDisplay.textContent = formatNumber(pointsPerSecond);
    document.title = `⭐ ${formatNumber(Math.floor(points))} punti - Clicker Game`;
}

function createFloatText(x, y, text) {
    const el = document.createElement("div");
    el.className = "float-text";
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    clickArea.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

mainBtn.addEventListener("click", (e) => {
    points += pointsPerClick;
    updateDisplay();
    
    const rect = mainBtn.getBoundingClientRect();
    const areaRect = clickArea.getBoundingClientRect();
    const x = rect.left - areaRect.left + rect.width / 2 + (Math.random() - 0.5) * 100;
    const y = rect.top - areaRect.top;
    createFloatText(x, y, "+" + formatNumber(pointsPerClick));
    
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
