// =========================================
//  LITTLE PLANETS — Game Engine
//  Suika/Watermelon Game clone with planets
// =========================================

(function () {
  'use strict';

  // ─── PLANET DEFINITIONS ───────────────────
  const PLANETS = [
    { name: 'Météorite',  r: 12,  color: '#8899bb', glow: '#aab',  points: 1,   emoji: '🪨' },
    { name: 'Luna',       r: 18,  color: '#c8d8f0', glow: '#def',  points: 3,   emoji: '🌑' },
    { name: 'Mercure',    r: 24,  color: '#b8a090', glow: '#dba',  points: 6,   emoji: '🟤' },
    { name: 'Mars',       r: 32,  color: '#cc5533', glow: '#f86',  points: 10,  emoji: '🔴' },
    { name: 'Vénus',      r: 40,  color: '#e8c060', glow: '#fd8',  points: 15,  emoji: '🟡' },
    { name: 'Terre',      r: 50,  color: '#3388cc', glow: '#6bf',  points: 21,  emoji: '🌍' },
    { name: 'Neptune',    r: 60,  color: '#3355dd', glow: '#58f',  points: 28,  emoji: '🔵' },
    { name: 'Uranus',     r: 72,  color: '#66ddcc', glow: '#8fc',  points: 36,  emoji: '🩵' },
    { name: 'Saturne',    r: 84,  color: '#ddbb66', glow: '#fb8',  points: 45,  emoji: '🪐' },
    { name: 'Jupiter',    r: 98,  color: '#cc8855', glow: '#e96',  points: 55,  emoji: '🟠' },
    { name: 'Soleil',     r: 114, color: '#ffdd22', glow: '#ff8',  points: 100, emoji: '⭐' },
  ];

  // Spawn only the 5 smallest
  const SPAWN_POOL = [0, 1, 2, 3, 4];

  // ─── CANVAS SIZING ────────────────────────
  const W = Math.min(380, window.innerWidth - 180);
  const H = Math.min(580, window.innerHeight - 130);
  const WALL_T = 20;
  const DANGER_Y = 70; // px from top — game over if planet exceeds this

  // ─── DOM ──────────────────────────────────
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;

  const nextCanvas = document.getElementById('next-canvas');
  const nextCtx = nextCanvas.getContext('2d');

  const cursorCanvas = document.getElementById('cursor-planet');
  cursorCanvas.width = W;
  cursorCanvas.height = H;
  cursorCanvas.style.width = W + 'px';
  cursorCanvas.style.height = H + 'px';
  const cursorCtx = cursorCanvas.getContext('2d');

  document.getElementById('canvas-container').style.width = W + 'px';
  document.getElementById('canvas-container').style.height = H + 'px';

  document.getElementById('drop-line').style.height = H + 'px';
  document.getElementById('danger-line').style.top = DANGER_Y + 'px';

  // ─── MATTER.JS SETUP ──────────────────────
  const { Engine, Render, Runner, Bodies, Body, Events, World, Vector } = Matter;

  const engine = Engine.create({ gravity: { y: 2.2 } });
  const world = engine.world;

  // Walls (invisible physics boundaries)
  const ground = Bodies.rectangle(W / 2, H + WALL_T / 2, W * 2, WALL_T, { isStatic: true, label: 'wall' });
  const wallL  = Bodies.rectangle(-WALL_T / 2, H / 2, WALL_T, H * 2, { isStatic: true, label: 'wall' });
  const wallR  = Bodies.rectangle(W + WALL_T / 2, H / 2, WALL_T, H * 2, { isStatic: true, label: 'wall' });
  World.add(world, [ground, wallL, wallR]);

  // ─── GAME STATE ───────────────────────────
  let score = 0;
  let best = parseInt(localStorage.getItem('lp_best') || '0');
  let currentPlanetIdx = randomSpawn();
  let nextPlanetIdx    = randomSpawn();
  let mouseX = W / 2;
  let gameRunning = false;
  let canDrop = true;
  let bodies = []; // {body, typeIdx}
  let mergeQueue = []; // pairs to merge this frame
  let gameOverTimeout = null;
  let gameOverPending = false;

  document.getElementById('score-val').textContent = score;
  document.getElementById('best-val').textContent = best;

  // ─── STARFIELD ────────────────────────────
  (function initStars() {
    const sc = document.getElementById('stars');
    sc.width = window.innerWidth;
    sc.height = window.innerHeight;
    const sCtx = sc.getContext('2d');
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * sc.width,
      y: Math.random() * sc.height,
      r: Math.random() * 1.4,
      a: Math.random(),
      speed: 0.002 + Math.random() * 0.006
    }));

    function animStars() {
      sCtx.clearRect(0, 0, sc.width, sc.height);
      const t = Date.now() * 0.001;
      stars.forEach(s => {
        const alpha = 0.3 + 0.7 * Math.abs(Math.sin(t * s.speed + s.a * 100));
        sCtx.beginPath();
        sCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        sCtx.fillStyle = `rgba(200,220,255,${alpha})`;
        sCtx.fill();
      });
      requestAnimationFrame(animStars);
    }
    animStars();
  })();

  // ─── LEGEND ───────────────────────────────
  (function buildLegend() {
    const el = document.getElementById('legend');
    PLANETS.forEach((p, i) => {
      if (i > 7) return; // Only show first 8
      const div = document.createElement('div');
      div.className = 'legend-item';
      div.innerHTML = `
        <canvas class="legend-dot" width="14" height="14"></canvas>
        <span>${p.name}</span>
      `;
      const c = div.querySelector('canvas');
      const cCtx = c.getContext('2d');
      drawPlanetOnCtx(cCtx, 7, 7, 6, i);
      el.appendChild(div);
    });
  })();

  // ─── DRAW HELPERS ─────────────────────────
  function drawPlanetOnCtx(c, x, y, r, idx) {
    const p = PLANETS[idx];
    // Glow
    const grd = c.createRadialGradient(x, y, r * 0.2, x, y, r * 1.8);
    grd.addColorStop(0, p.glow + '55');
    grd.addColorStop(1, 'transparent');
    c.beginPath();
    c.arc(x, y, r * 1.8, 0, Math.PI * 2);
    c.fillStyle = grd;
    c.fill();

    // Body gradient
    const grad = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r);
    grad.addColorStop(0, lighten(p.color, 60));
    grad.addColorStop(0.5, p.color);
    grad.addColorStop(1, darken(p.color, 40));
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = grad;
    c.fill();

    // Specular
    c.beginPath();
    c.arc(x - r * 0.28, y - r * 0.28, r * 0.28, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.fill();

    // Ring for Saturn
    if (idx === 8) {
      c.save();
      c.translate(x, y);
      c.scale(1, 0.3);
      c.beginPath();
      c.arc(0, 0, r * 1.55, 0, Math.PI * 2);
      c.strokeStyle = 'rgba(220,180,80,0.55)';
      c.lineWidth = r * 0.25;
      c.stroke();
      c.restore();
    }

    // Glow ring for Sun
    if (idx === 10) {
      const sg = c.createRadialGradient(x, y, r, x, y, r * 2.5);
      sg.addColorStop(0, 'rgba(255,230,50,0.4)');
      sg.addColorStop(1, 'transparent');
      c.beginPath();
      c.arc(x, y, r * 2.5, 0, Math.PI * 2);
      c.fillStyle = sg;
      c.fill();
    }
  }

  function lighten(hex, amt) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.min(255,r+amt)},${Math.min(255,g+amt)},${Math.min(255,b+amt)})`;
  }

  function darken(hex, amt) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.max(0,r-amt)},${Math.max(0,g-amt)},${Math.max(0,b-amt)})`;
  }

  // ─── NEXT PLANET PREVIEW ──────────────────
  function drawNextPreview() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const p = PLANETS[nextPlanetIdx];
    const cx = nextCanvas.width / 2;
    const cy = nextCanvas.height / 2;
    const r = Math.min(p.r, 34);
    drawPlanetOnCtx(nextCtx, cx, cy, r, nextPlanetIdx);
  }

  // ─── CURSOR PLANET ────────────────────────
  function drawCursorPlanet(x) {
    cursorCtx.clearRect(0, 0, W, H);
    if (!gameRunning || !canDrop) return;
    const p = PLANETS[currentPlanetIdx];
    const cx = Math.max(p.r + WALL_T, Math.min(W - p.r - WALL_T, x));
    drawPlanetOnCtx(cursorCtx, cx, DANGER_Y + p.r + 4, p.r, currentPlanetIdx);

    // Drop guide line
    cursorCtx.beginPath();
    cursorCtx.moveTo(cx, DANGER_Y + p.r * 2 + 4);
    cursorCtx.lineTo(cx, H);
    cursorCtx.strokeStyle = 'rgba(100,180,255,0.15)';
    cursorCtx.setLineDash([4, 8]);
    cursorCtx.lineWidth = 1;
    cursorCtx.stroke();
    cursorCtx.setLineDash([]);

    // Update drop line
    document.getElementById('drop-line').style.left = cx + 'px';
  }

  // ─── SPAWN ────────────────────────────────
  function randomSpawn() {
    return SPAWN_POOL[Math.floor(Math.random() * SPAWN_POOL.length)];
  }

  function spawnPlanet(x) {
    if (!canDrop || !gameRunning) return;
    canDrop = false;

    const idx = currentPlanetIdx;
    const p = PLANETS[idx];
    const cx = Math.max(p.r + WALL_T, Math.min(W - p.r - WALL_T, x));
    const cy = DANGER_Y + p.r + 4;

    const body = Bodies.circle(cx, cy, p.r, {
      restitution: 0.3,
      friction: 0.6,
      frictionAir: 0.008,
      density: 0.002 * (idx + 1),
      label: 'planet_' + idx,
    });

    body._typeIdx = idx;
    body._justSpawned = true;
    bodies.push({ body, typeIdx: idx });
    World.add(world, body);

    // Transition to next
    currentPlanetIdx = nextPlanetIdx;
    nextPlanetIdx = randomSpawn();
    drawNextPreview();

    setTimeout(() => {
      if (body) body._justSpawned = false;
      canDrop = true;
      drawCursorPlanet(mouseX);
    }, 600);
  }

  // ─── MERGE LOGIC ──────────────────────────
  Events.on(engine, 'collisionStart', function (event) {
    if (!gameRunning) return;
    const pairs = event.pairs;
    pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;
      const aEntry = bodies.find(b => b.body === bodyA);
      const bEntry = bodies.find(b => b.body === bodyB);
      if (!aEntry || !bEntry) return;
      if (aEntry.typeIdx !== bEntry.typeIdx) return;
      if (aEntry.body._justSpawned || bEntry.body._justSpawned) return;
      if (aEntry.body._merging || bEntry.body._merging) return;

      aEntry.body._merging = true;
      bEntry.body._merging = true;

      mergeQueue.push({ a: aEntry, b: bEntry });
    });
  });

  function processMerges() {
    if (mergeQueue.length === 0) return;
    mergeQueue.forEach(({ a, b }) => {
      const idx = a.typeIdx;
      if (idx >= PLANETS.length - 1) {
        // Max planet — just remove both and add huge score
        removePlanet(a);
        removePlanet(b);
        addScore(PLANETS[idx].points * 3, a.body.position);
        spawnMergeEffect(a.body.position, idx);
        return;
      }

      const mx = (a.body.position.x + b.body.position.x) / 2;
      const my = (a.body.position.y + b.body.position.y) / 2;

      removePlanet(a);
      removePlanet(b);

      const newIdx = idx + 1;
      const np = PLANETS[newIdx];
      const newBody = Bodies.circle(mx, my, np.r, {
        restitution: 0.3,
        friction: 0.6,
        frictionAir: 0.008,
        density: 0.002 * (newIdx + 1),
        label: 'planet_' + newIdx,
      });
      newBody._typeIdx = newIdx;
      newBody._justSpawned = false;
      bodies.push({ body: newBody, typeIdx: newIdx });
      World.add(world, newBody);

      addScore(PLANETS[newIdx].points, { x: mx, y: my });
      spawnMergeEffect({ x: mx, y: my }, newIdx);
    });
    mergeQueue = [];
  }

  function removePlanet(entry) {
    bodies = bodies.filter(b => b !== entry);
    World.remove(world, entry.body);
  }

  // ─── SCORE ────────────────────────────────
  function addScore(pts, pos) {
    score += pts;
    document.getElementById('score-val').textContent = score;
    if (score > best) {
      best = score;
      localStorage.setItem('lp_best', best);
      document.getElementById('best-val').textContent = best;
    }
    // Score popup
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = '+' + pts;
    popup.style.left = (pos.x - 10) + 'px';
    popup.style.top = (pos.y - 20) + 'px';
    document.getElementById('canvas-container').appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
  }

  // ─── EFFECTS ──────────────────────────────
  const flashPool = [];
  function spawnMergeEffect(pos, idx) {
    const p = PLANETS[idx];
    const el = document.createElement('div');
    el.id = 'merge-flash';
    el.style.cssText = `
      width: ${p.r * 2}px;
      height: ${p.r * 2}px;
      left: ${pos.x}px;
      top: ${pos.y}px;
      background: radial-gradient(circle, ${p.glow}88 0%, transparent 70%);
      border: 2px solid ${p.glow}aa;
    `;
    document.getElementById('canvas-container').appendChild(el);
    setTimeout(() => el.remove(), 500);
  }

  // ─── GAME OVER CHECK ──────────────────────
  function checkGameOver() {
    if (!gameRunning) return;
    const over = bodies.some(({ body }) => {
      return !body._justSpawned && !body._merging && body.position.y - PLANETS[body._typeIdx].r < DANGER_Y;
    });

    if (over) {
      if (!gameOverPending) {
        gameOverPending = true;
        gameOverTimeout = setTimeout(triggerGameOver, 800);
      }
    } else {
      if (gameOverPending) {
        clearTimeout(gameOverTimeout);
        gameOverPending = false;
      }
    }
  }

  function triggerGameOver() {
    gameRunning = false;
    canDrop = false;
    document.getElementById('final-score').textContent = score;
    const prev = parseInt(localStorage.getItem('lp_best') || '0');
    if (score >= prev) {
      document.getElementById('final-best-text').textContent = '🏆 Nouveau record !';
    } else {
      document.getElementById('final-best-text').textContent = `Meilleur : ${prev}`;
    }
    document.getElementById('gameover-overlay').style.display = 'flex';
    cursorCtx.clearRect(0, 0, W, H);
  }

  // ─── MAIN RENDER LOOP ─────────────────────
  function render() {
    ctx.clearRect(0, 0, W, H);

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#030820');
    bgGrad.addColorStop(1, '#010410');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Danger zone tint
    ctx.fillStyle = 'rgba(255,60,60,0.04)';
    ctx.fillRect(0, 0, W, DANGER_Y);

    // Draw planets
    bodies.forEach(({ body, typeIdx }) => {
      const { x, y } = body.position;
      const angle = body.angle;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      drawPlanetOnCtx(ctx, 0, 0, PLANETS[typeIdx].r, typeIdx);
      ctx.restore();
    });

    // Walls (subtle)
    ctx.fillStyle = 'rgba(60,100,180,0.08)';
    ctx.fillRect(0, 0, WALL_T, H);
    ctx.fillRect(W - WALL_T, 0, WALL_T, H);

    // Danger line
    ctx.beginPath();
    ctx.moveTo(0, DANGER_Y);
    ctx.lineTo(W, DANGER_Y);
    ctx.strokeStyle = 'rgba(255,80,80,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Danger label
    ctx.fillStyle = 'rgba(255,100,100,0.5)';
    ctx.font = '10px Exo 2, sans-serif';
    ctx.fillText('DANGER', 4, DANGER_Y - 4);
  }

  // ─── GAME LOOP ────────────────────────────
  let lastTime = 0;
  function gameLoop(ts) {
    const delta = Math.min(ts - lastTime, 50);
    lastTime = ts;

    if (gameRunning) {
      Engine.update(engine, delta);
      processMerges();
      checkGameOver();
    }

    render();
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);

  // ─── INPUT ────────────────────────────────
  const container = document.getElementById('canvas-container');

  container.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    drawCursorPlanet(mouseX);
  });

  container.addEventListener('mouseleave', () => {
    cursorCtx.clearRect(0, 0, W, H);
  });

  container.addEventListener('click', e => {
    if (!gameRunning || !canDrop) return;
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    spawnPlanet(mouseX);
  });

  // Touch support
  container.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    mouseX = e.touches[0].clientX - rect.left;
    drawCursorPlanet(mouseX);
  }, { passive: false });

  container.addEventListener('touchend', e => {
    e.preventDefault();
    if (!gameRunning || !canDrop) return;
    spawnPlanet(mouseX);
  }, { passive: false });

  // ─── GAME CONTROL ─────────────────────────
  function startGame() {
    // Reset state
    bodies.forEach(({ body }) => World.remove(world, body));
    bodies = [];
    mergeQueue = [];
    score = 0;
    gameOverPending = false;
    canDrop = true;
    document.getElementById('score-val').textContent = 0;
    document.getElementById('best-val').textContent = localStorage.getItem('lp_best') || 0;

    currentPlanetIdx = randomSpawn();
    nextPlanetIdx = randomSpawn();
    drawNextPreview();

    document.getElementById('start-overlay').style.display = 'none';
    document.getElementById('gameover-overlay').style.display = 'none';

    gameRunning = true;
    drawCursorPlanet(mouseX);
  }

  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('retry-btn').addEventListener('click', startGame);
  document.getElementById('restart-btn').addEventListener('click', () => {
    if (gameRunning) startGame();
  });

  // Init preview
  drawNextPreview();

})();
