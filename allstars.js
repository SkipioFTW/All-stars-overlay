const AGENT_ROLES = {
    jett: 'DUELIST', reyna: 'DUELIST', raze: 'DUELIST', phoenix: 'DUELIST',
    yoru: 'DUELIST', neon: 'DUELIST', iso: 'DUELIST', waylay: 'DUELIST',
    sova: 'INITIATOR', breach: 'INITIATOR', skye: 'INITIATOR', kayo: 'INITIATOR',
    fade: 'INITIATOR', gekko: 'INITIATOR', tejo: 'INITIATOR',
    brimstone: 'CONTROLLER', viper: 'CONTROLLER', omen: 'CONTROLLER',
    astra: 'CONTROLLER', harbor: 'CONTROLLER', clove: 'CONTROLLER',
    sage: 'SENTINEL', cypher: 'SENTINEL', killjoy: 'SENTINEL',
    chamber: 'SENTINEL', deadlock: 'SENTINEL', vyse: 'SENTINEL', veto: 'SENTINEL'
};

let allData = null;
let teamAName = '';
let teamBName = '';
let currentState = 0; // 0: Team A, 1: Team B, 2: Comparison

async function init() {
    console.log("All Stars Overlay Initializing...");
    const params = new URLSearchParams(window.location.search);
    teamAName = params.get('teamA') || 'Team Gold';
    teamBName = params.get('teamB') || 'Team Silver';

    console.log("Matchup:", teamAName, "vs", teamBName);

    const titleEl = document.getElementById('match-title');
    if (titleEl) titleEl.innerText = `${teamAName} vs ${teamBName}`;

    if (window.location.protocol === 'file:') {
        console.warn("Overlay is running on file:// protocol. Fetch may fail due to CORS.");
    }

    try {
        console.log("Fetching data/allstars.json...");
        const response = await fetch('./data/allstars.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allData = await response.json();
        console.log("Data loaded successfully:", allData);
    } catch (e) {
        console.error("Error loading allstars.json:", e);
        document.body.innerHTML = `
            <div style="color:white; text-align:center; padding-top:100px; background:#0a0a0c; height:100vh;">
                <h1 style="color:#d4af37">Error loading data</h1>
                <p>Failed to load <b>data/allstars.json</b>.</p>
                <p style="font-size:14px; color:#a0a0a0; margin-top:20px;">
                    ${e.message}<br><br>
                    <b>Tip:</b> If opening locally, you may need a local server (e.g. VS Code Live Server or 'npx serve').
                </p>
            </div>`;
        return;
    }

    cycleView();
    setInterval(cycleView, 12000);
}

function spinLogo() {
    const logo = document.getElementById('flv-logo');
    if (!logo) return;
    // Remove class to allow re-trigger
    logo.classList.remove('spinning');
    // Force reflow so re-adding the class triggers animation again
    void logo.offsetWidth;
    logo.classList.add('spinning');
    // After spin ends, resume float animation
    setTimeout(() => logo.classList.remove('spinning'), 900);
}

function cycleView() {
    const content = document.getElementById('view-content');

    spinLogo();

    // Add exit animation if content exists
    if (content.children.length > 0) {
        content.children[0].classList.add('view-exit');
        setTimeout(() => {
            renderState();
        }, 800); // Match CSS transition speed
    } else {
        renderState();
    }
}

function renderState() {
    const content = document.getElementById('view-content');
    content.innerHTML = '';

    let html = '';
    if (currentState === 0) {
        html = renderTeam(allData[teamAName]);
    } else if (currentState === 1) {
        html = renderTeam(allData[teamBName]);
    } else {
        html = renderComparison(allData[teamAName], allData[teamBName]);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'view-enter';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.innerHTML = html;
    content.appendChild(wrapper);

    currentState = (currentState + 1) % 3;
}

function renderTeam(teamData) {
    if (!teamData) return `<div class="team-layout"><h1>Team Data Missing</h1></div>`;

    const playersHtml = Object.entries(teamData.players).map(([name, info], index) => {
        const agentLower = (info["Most Played Agent"] || 'default').toLowerCase();
        const role = AGENT_ROLES[agentLower] || 'AGENT';
        const imgSrc = agentLower === 'default' ? '' : `./agents/${agentLower}.jfif`;
        const imgStyle = agentLower === 'default' ? 'style="opacity:0"' : '';

        return `
            <div class="player-card" style="animation-delay: ${index * 0.15}s">
                <div class="agent-img-wrapper">
                    <img src="${imgSrc}" ${imgStyle} onerror="this.onerror=null; this.style.opacity='0';">
                    <div class="role-badge">${role}</div>
                </div>
                <div class="card-content">
                    <div class="p-name">${name.replace('@', '')}</div>
                    <div class="p-rank">🏆 ${info.Rank}</div>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-val">${Math.round(info["Average ACS"])}</span>
                            <span class="stat-lbl">ACS</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-val">${info["Average K/D"].toFixed(2)}</span>
                            <span class="stat-lbl">K/D</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-val">${Math.round(info["Average ADR"])}</span>
                            <span class="stat-lbl">ADR</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-val">${Math.round(info["Average HS%"])}%</span>
                            <span class="stat-lbl">HS%</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');

    return `
        <div class="team-layout">
            <div class="team-info">
                <h2 class="team-name">${teamData.team_name}</h2>
            </div>
            <div class="players-container">
                ${playersHtml}
            </div>
        </div>`;
}

function renderComparison(teamA, teamB) {
    if (!teamA || !teamB) return `<div class="comparison-layout"><h1>Data Missing</h1></div>`;

    const metrics = [
        { label: 'AVERAGE ADR', key: 'avg_adr', format: (v) => Math.round(v), max: 200 },
        { label: 'AVG KAST', key: 'avg_kast', format: (v) => Math.round(v) + '%', max: 100 },
        { label: 'ENTRY SUCCESS', key: 'avg_fk_success', format: (v) => Math.round(v) + '%', max: 100 }
    ];

    const generateBars = (data) => {
        return metrics.map(m => {
            const val = data.averages[m.key] || 0;
            const pct = Math.min((val / m.max) * 100, 100);
            return `
                <div class="stat-row">
                    <div class="stat-header">
                        <span>${m.label}</span>
                        <span>${m.format(val)}</span>
                    </div>
                    <div class="stat-bar-bg">
                        <div class="stat-bar-fill" style="width: ${pct}%"></div>
                    </div>
                </div>`;
        }).join('');
    };

    return `
        <div class="comparison-layout">
            <div class="comp-header">
                <span class="comp-team-name" style="color:var(--gold-primary)">${teamA.team_name}</span>
                <div class="vs-pill">VS</div>
                <span class="comp-team-name">${teamB.team_name}</span>
            </div>
            <div class="comp-stats">
                <div class="comp-stat-box" style="animation-delay: 0.2s">
                    ${generateBars(teamA)}
                </div>
                <div class="comp-stat-box" style="animation-delay: 0.4s">
                    ${generateBars(teamB)}
                </div>
            </div>
        </div>`;
}

window.onload = init;
