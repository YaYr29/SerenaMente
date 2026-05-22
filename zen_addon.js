/* ============================================================
   SerenaMente — "Desconéctate y relájate" Add-on Script
   Incluir ANTES del </body> en todos los archivos HTML
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. Inject the Zen dropdown HTML into every page ── */
  function buildZenUI() {
    const html = `
    <!-- Zen ambient canvas (Modo Zen background) -->
    <div class="zen-canvas" id="zenCanvas">
      <canvas id="zenParticleCanvas"></canvas>
    </div>

    <!-- Zen dropdown panel -->
    <div class="zen-dropdown" id="zenDropdown" role="dialog" aria-label="Zona de relajación">
      <div class="zen-dropdown-header">
        <div class="zen-dropdown-title">Desconéctate y relájate</div>
        <button class="zen-close-btn" id="zenCloseBtn" title="Cerrar">✕</button>
      </div>

      <!-- Tabs -->
      <div class="zen-tabs" role="tablist">
        <button class="zen-tab active" data-tab="music" role="tab">🎵 Música</button>
        <button class="zen-tab" data-tab="breath" role="tab">🌬️ Respiración</button>
        <button class="zen-tab" data-tab="modezen" role="tab">🌙 Modo Zen</button>
      </div>

      <!-- ── PANEL 1: Música / Sonidos ── -->
      <div class="zen-panel active" id="panel-music">
        <!-- YouTube embed — Only Time by Enya -->
        <div class="zen-yt-wrap">
          <iframe
            id="enyaPlayer"
            src="https://youtu.be/7wfYIMyS_dI?si=Sk_Iy0oS2-FFK0Mg"
            allow="autoplay; encrypted-media"
            allowfullscreen
            loading="lazy"
            title="Only Time — Enya">
          </iframe>
        </div>

        <!-- Background sounds -->
        <div class="zen-sounds-label">Sonidos de fondo en bucle</div>
        <div class="zen-sounds-grid">
          <button class="zen-sound-btn" data-sound="rain" title="Lluvia / Tormenta">
            <span class="sound-icon">🌧️</span>
            <span>Lluvia</span>
          </button>
          <button class="zen-sound-btn" data-sound="forest" title="Naturaleza / Bosque">
            <span class="sound-icon">🌲</span>
            <span>Bosque</span>
          </button>
          <button class="zen-sound-btn" data-sound="waves" title="Olas del mar">
            <span class="sound-icon">🌊</span>
            <span>Mar</span>
          </button>
          <button class="zen-sound-btn" data-sound="white" title="Ruido blanco">
            <span class="sound-icon">📡</span>
            <span>Ruido blanco</span>
          </button>
        </div>

        <!-- Volume control -->
        <div class="zen-volume-row">
          <span class="zen-volume-label">🔊 Volumen sonidos</span>
          <input type="range" class="zen-volume-slider" id="zenVolume" min="0" max="100" value="70">
        </div>

        <!-- Pause all -->
        <button class="zen-pause-all" id="zenPauseAll">
          ⏸ Pausar todo
        </button>
      </div>

      <!-- ── PANEL 2: Respiración 4-7-8 ── -->
      <div class="zen-panel" id="panel-breath">
        <div class="zen-breath-wrap">
          <div class="breath-circle-container">
            <div class="breath-ring"></div>
            <div class="breath-circle" id="breathCircle">
              <span id="breathCircleText">4–7–8</span>
            </div>
          </div>
          <div class="breath-phase-label" id="breathPhase">Presiona Iniciar</div>
          <div class="breath-timer" id="breathTimer">—</div>
          <div class="breath-info">Técnica 4-7-8: Inhala 4s · Sostén 7s · Exhala 8s</div>
          <div class="breath-controls">
            <button class="breath-btn breath-btn-start" id="breathStartBtn">▶ Iniciar</button>
            <button class="breath-btn breath-btn-reset" id="breathResetBtn">↺ Reiniciar</button>
          </div>
        </div>
      </div>

      <!-- ── PANEL 3: Modo Zen ── -->
      <div class="zen-panel" id="panel-modezen">
        <div class="zen-mode-panel">
          <p class="zen-mode-intro">
            El Modo Zen transforma la interfaz en un espacio oscuro y sereno, ocultando distracciones para que puedas enfocarte en tu bienestar.
          </p>

          <div class="zen-mode-toggle-row">
            <div class="zen-mode-toggle-label">
              <span>🌙</span>
              <span>Activar Modo Zen</span>
            </div>
            <label class="zen-toggle">
              <input type="checkbox" id="zenModeToggle">
              <span class="zen-toggle-slider"></span>
            </label>
          </div>

          <div class="zen-mode-toggle-row">
            <div class="zen-mode-toggle-label">
              <span>✨</span>
              <span>Partículas ambientales</span>
            </div>
            <label class="zen-toggle">
              <input type="checkbox" id="zenParticlesToggle" checked>
              <span class="zen-toggle-slider"></span>
            </label>
          </div>

          <p class="zen-mode-desc">«Calma, confianza y equilibrio — desde adentro»</p>
        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  /* ── 2. Inject nav item ── */
  function injectNavItem() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    const li = document.createElement('li');
    li.className = 'nav-relax';
    li.innerHTML = `
      <a href="#" id="zenNavTrigger" aria-haspopup="true" aria-expanded="false">
        <span class="relax-icon"></span>
        Desconéctate y relájate
      </a>`;
    navLinks.appendChild(li);
    navLinks.parentNode.querySelector('.nav-relax').after; // ensure inserted
  }

  /* ── 3. Sound engine (Web Audio API procedural sounds) ── */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.nodes = {};
      this.masterGain = null;
      this.volume = 0.7;
    }

    _init() {
      if (this.ctx) return;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }

    _makeRain() {
      const bufSize = this.ctx.sampleRate * 2;
      const buf = this.ctx.createBuffer(2, bufSize, this.ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.4;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3500;
      filter.Q.value = 0.6;

      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 600;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      src.connect(filter);
      filter.connect(this.masterGain);
      src.start();
      return { src, filter, lfo };
    }

    _makeForest() {
      const nodes = [];
      // birds: simple sine-based chirps via oscillator
      for (let b = 0; b < 3; b++) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 800 + b * 400;
        const env = this.ctx.createGain();
        env.gain.value = 0;
        osc.connect(env);
        env.connect(this.masterGain);
        osc.start();
        nodes.push({ osc, env });

        const chirp = () => {
          const t = this.ctx.currentTime;
          const delay = Math.random() * 4 + 1;
          env.gain.setValueAtTime(0, t + delay);
          env.gain.linearRampToValueAtTime(0.04, t + delay + 0.05);
          env.gain.linearRampToValueAtTime(0, t + delay + 0.15);
          osc.frequency.setValueAtTime(800 + b * 400 + Math.random() * 200, t + delay);
          setTimeout(chirp, (delay + 0.2) * 1000);
        };
        setTimeout(chirp, Math.random() * 2000);
      }

      // wind hiss
      const bufSize = this.ctx.sampleRate * 3;
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.15;
      const wind = this.ctx.createBufferSource();
      wind.buffer = buf;
      wind.loop = true;
      const wf = this.ctx.createBiquadFilter();
      wf.type = 'lowpass';
      wf.frequency.value = 600;
      wind.connect(wf);
      wf.connect(this.masterGain);
      wind.start();
      nodes.push({ src: wind });

      return nodes;
    }

    _makeWaves() {
      const bufSize = this.ctx.sampleRate * 4;
      const buf = this.ctx.createBuffer(2, bufSize, this.ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < bufSize; i++) {
          const t = i / this.ctx.sampleRate;
          const wave = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.12 * t);
          d[i] = (Math.random() * 2 - 1) * 0.3 * wave;
        }
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;

      src.connect(filter);
      filter.connect(this.masterGain);
      src.start();
      return { src, filter };
    }

    _makeWhite() {
      const bufSize = this.ctx.sampleRate * 2;
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(this.masterGain);
      src.start();
      return { src };
    }

    toggle(id) {
      this._init();
      if (this.ctx.state === 'suspended') this.ctx.resume();

      if (this.nodes[id]) {
        this._stop(id);
        return false;
      }

      const makers = { rain: '_makeRain', forest: '_makeForest', waves: '_makeWaves', white: '_makeWhite' };
      this.nodes[id] = this[makers[id]]();
      return true;
    }

    _stop(id) {
      const n = this.nodes[id];
      if (!n) return;
      const stopNode = (node) => {
        try { if (node.src) node.src.stop(); } catch (_) {}
        try { if (node.osc) node.osc.stop(); } catch (_) {}
      };
      if (Array.isArray(n)) n.forEach(stopNode);
      else stopNode(n);
      delete this.nodes[id];
    }

    stopAll() {
      Object.keys(this.nodes).forEach(id => this._stop(id));
    }

    setVolume(v) {
      this.volume = v;
      if (this.masterGain) this.masterGain.gain.linearRampToValueAtTime(v, (this.ctx?.currentTime || 0) + 0.1);
    }
  }

  /* ── 4. Breathing Guide (4-7-8) ── */
  class BreathingGuide {
    constructor(circleEl, phaseEl, timerEl) {
      this.circle = circleEl;
      this.phase = phaseEl;
      this.timer = timerEl;
      this.running = false;
      this.raf = null;
      this.seq = [
        { label: 'Inhala', duration: 4, scale: 1.5, color: 'rgba(91,184,208,0.6)' },
        { label: 'Sostén', duration: 7, scale: 1.5, color: 'rgba(122,158,142,0.55)' },
        { label: 'Exhala', duration: 8, scale: 0.75, color: 'rgba(42,143,168,0.35)' },
      ];
      this.idx = 0;
      this.elapsed = 0;
      this.lastTime = null;
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.lastTime = performance.now();
      this._tick();
    }

    _tick() {
      if (!this.running) return;
      const now = performance.now();
      const dt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      this.elapsed += dt;

      const step = this.seq[this.idx];
      const remaining = step.duration - this.elapsed;

      if (remaining <= 0) {
        this.idx = (this.idx + 1) % this.seq.length;
        this.elapsed = 0;
        this.raf = requestAnimationFrame(() => this._tick());
        return;
      }

      const progress = this.elapsed / step.duration;
      let scale;
      const prev = this.idx === 0 ? 0.75 : (this.seq[this.idx - 1]?.scale || 1);
      scale = prev + (step.scale - prev) * progress;

      this.circle.style.transform = `scale(${scale})`;
      this.circle.style.background = `radial-gradient(circle at 38% 38%, ${step.color}, rgba(42,143,168,0.2))`;
      this.phase.textContent = step.label;
      this.timer.textContent = Math.ceil(remaining) + 's';

      this.raf = requestAnimationFrame(() => this._tick());
    }

    stop() {
      this.running = false;
      if (this.raf) cancelAnimationFrame(this.raf);
    }

    reset() {
      this.stop();
      this.idx = 0;
      this.elapsed = 0;
      this.circle.style.transform = 'scale(1)';
      this.circle.style.background = '';
      this.phase.textContent = 'Presiona Iniciar';
      this.timer.textContent = '—';
    }
  }

  /* ── 5. Particle canvas (ambient Modo Zen) ── */
  function initParticles(canvas) {
    const ctx = canvas.getContext('2d');
    const particles = [];
    let enabled = true;
    let raf;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -Math.random() * 0.3 - 0.1,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    function draw() {
      if (!enabled) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(91,184,208,${p.alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }

    draw();

    return {
      setEnabled(val) {
        enabled = val;
        if (!val) { ctx.clearRect(0, 0, canvas.width, canvas.height); cancelAnimationFrame(raf); }
        else draw();
      }
    };
  }

  /* ── 6. Boot ── */
  function boot() {
    injectNavItem();
    buildZenUI();

    const sound = new SoundEngine();

    // Elements
    const trigger = document.getElementById('zenNavTrigger');
    const dropdown = document.getElementById('zenDropdown');
    const closeBtn = document.getElementById('zenCloseBtn');
    const pauseAllBtn = document.getElementById('zenPauseAll');
    const volumeSlider = document.getElementById('zenVolume');
    const soundBtns = document.querySelectorAll('.zen-sound-btn');
    const tabs = document.querySelectorAll('.zen-tab');
    const breathCircle = document.getElementById('breathCircle');
    const breathPhase = document.getElementById('breathPhase');
    const breathTimer = document.getElementById('breathTimer');
    const breathStart = document.getElementById('breathStartBtn');
    const breathReset = document.getElementById('breathResetBtn');
    const zenModeToggle = document.getElementById('zenModeToggle');
    const zenParticlesToggle = document.getElementById('zenParticlesToggle');
    const particleCanvas = document.getElementById('zenParticleCanvas');

    const breath = new BreathingGuide(breathCircle, breathPhase, breathTimer);
    let particleEngine = null;

    function loadZenState() {
      try {
        const raw = localStorage.getItem('serenaMenteZenState');
        if (!raw) return { zenActive: false, particles: true };
        const parsed = JSON.parse(raw);
        return {
          zenActive: Boolean(parsed.zenActive),
          particles: parsed.particles !== false,
        };
      } catch (_) {
        return { zenActive: false, particles: true };
      }
    }

    function saveZenState(state) {
      localStorage.setItem('serenaMenteZenState', JSON.stringify(state));
    }

    function updateParticles(enabled) {
      if (!document.body.classList.contains('zen-mode-active')) {
        if (particleEngine) {
          particleEngine.setEnabled(false);
          particleEngine = null;
        }
        return;
      }

      if (enabled && !particleEngine) {
        particleEngine = initParticles(particleCanvas);
      } else if (!enabled && particleEngine) {
        particleEngine.setEnabled(false);
        particleEngine = null;
      }
    }

    function setZenMode(active, particleEnabled) {
      document.body.classList.toggle('zen-mode-active', active);
      if (active && particleEnabled) {
        if (!particleEngine) particleEngine = initParticles(particleCanvas);
      } else if (particleEngine) {
        particleEngine.setEnabled(false);
        particleEngine = null;
      }
    }

    const savedZenState = loadZenState();
    zenModeToggle.checked = savedZenState.zenActive;
    zenParticlesToggle.checked = savedZenState.particles;
    setZenMode(savedZenState.zenActive, savedZenState.particles);

    // Open / close dropdown
    function openDropdown() {
      dropdown.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }
    function closeDropdown() {
      dropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('click', e => {
      e.preventDefault();
      dropdown.classList.contains('open') ? closeDropdown() : openDropdown();
    });

    closeBtn.addEventListener('click', closeDropdown);

    // Close on outside click
    document.addEventListener('click', e => {
      if (!dropdown.contains(e.target) && !trigger.contains(e.target)) closeDropdown();
    });

    // Tabs
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.zen-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
      });
    });

    // Sound buttons
    soundBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.sound;
        const playing = sound.toggle(id);
        btn.classList.toggle('playing', playing);
      });
    });

    // Volume
    volumeSlider.addEventListener('input', () => {
      const v = volumeSlider.value / 100;
      sound.setVolume(v);
      // Update slider fill
      volumeSlider.style.background = `linear-gradient(to right, var(--teal) ${volumeSlider.value}%, rgba(42,143,168,0.2) ${volumeSlider.value}%)`;
    });

    // Pause all
    pauseAllBtn.addEventListener('click', () => {
      sound.stopAll();
      soundBtns.forEach(b => b.classList.remove('playing'));
    });

    // Breathing
    breathStart.addEventListener('click', () => {
      if (breath.running) {
        breath.stop();
        breathStart.textContent = '▶ Continuar';
      } else {
        breath.start();
        breathStart.textContent = '⏸ Pausar';
      }
    });

    breathReset.addEventListener('click', () => {
      breath.reset();
      breathStart.textContent = '▶ Iniciar';
    });

    // Modo Zen
    zenModeToggle.addEventListener('change', () => {
      const active = zenModeToggle.checked;
      const particles = zenParticlesToggle.checked;
      setZenMode(active, particles);
      saveZenState({ zenActive: active, particles });
    });

    zenParticlesToggle.addEventListener('change', () => {
      const particles = zenParticlesToggle.checked;
      updateParticles(particles);
      saveZenState({ zenActive: document.body.classList.contains('zen-mode-active'), particles });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
