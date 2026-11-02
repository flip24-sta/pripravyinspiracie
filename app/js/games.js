/* Iskrička — herný engine pre deti (dotykové hry, zvuky, hlas) */
(function () {
  const S = () => ISK.state;
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
  const shuffle = (a) => ISK.shuffle(a);
  const pick = (a) => ISK.pick(a);
  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  /* ---------- Zvuky (WebAudio, bez súborov) ---------- */
  let actx;
  function tone(freqs, dur = 0.12, type = 'sine', vol = 0.18) {
    if (!S().settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = actx.createOscillator(); const g = actx.createGain();
        o.type = type; o.frequency.value = f;
        const t0 = actx.currentTime + i * dur;
        g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur * 1.6);
        o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + dur * 1.7);
      });
    } catch (e) {}
  }
  const sfx = {
    ok: () => tone([660, 880, 1320], 0.09, 'triangle'),
    bad: () => tone([220, 180], 0.14, 'sawtooth', 0.08),
    flip: () => tone([520], 0.05, 'triangle', 0.1),
    win: () => tone([523, 659, 784, 1047, 784, 1047], 0.11, 'triangle'),
  };

  /* ---------- Hlas ---------- */
  let voice;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => /^sk/i.test(v.lang)) || vs.find((v) => /^cs/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function say(text) {
    if (!S().settings.speech || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = voice ? voice.lang : 'sk-SK'; if (voice) u.voice = voice;
      u.rate = 0.92; u.pitch = 1.15;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  ISK.say = say;

  /* ---------- Konfety ---------- */
  function confetti(root, n = 60) {
    const colors = ['#FF6B6B', '#FFC93C', '#4ECDC4', '#5B8DEF', '#9B5DE5', '#3DBE8B'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = pick(colors);
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.animationDuration = 1.6 + Math.random() * 1.4 + 's';
      c.style.transform = `rotate(${Math.random() * 360}deg)`;
      root.appendChild(c);
      setTimeout(() => c.remove(), 3600);
    }
  }
  ISK.confetti = confetti;

  const PRAISE = ['Výborne!', 'Super!', 'Si šikovný!', 'Bravó!', 'Úžasné!', 'Paráda!', 'Tak je to!'];
  const RETRY = ['Skús to ešte raz.', 'Skoro! Skús znova.', 'Hmm, ešte raz.'];

  function ageLevel() {
    const a = S().profile.age;
    return a === '3-4' ? 1 : a === '4-5' ? 2 : 3;
  }

  ISK.allSets = function () { return ISK.THEMES.concat(S().gameSets || []); };
  ISK.getSet = function (id) { return ISK.allSets().find((s) => s.id === id) || ISK.THEMES[0]; };

  /* ---------- Overlay herného režimu ---------- */
  let root, ctx;

  function open(gameId, setId) {
    const game = ISK.GAMES.find((g) => g.id === gameId);
    if (!game) return;
    if (!ISK.canPlay(gameId)) { ISK.paywall('game'); return; }
    const set = ISK.getSet(setId);
    root = $(`<div class="play" role="dialog" aria-label="${game.name}">
      <div class="play-top">
        <button class="play-exit" title="Podržte pre ukončenie" aria-label="Ukončiť hru (podržte)"><span>✕</span><i class="hold"></i></button>
        <div class="play-title"><span class="play-icon">${game.icon}</span> ${game.name} <small>· ${set.icon || '✨'} ${set.name}</small></div>
        <div class="play-stars" aria-live="polite"></div>
      </div>
      <div class="play-stage"></div>
    </div>`);
    document.body.appendChild(root);
    document.body.classList.add('playing');
    try { if (root.requestFullscreen && matchMedia('(pointer:coarse)').matches) root.requestFullscreen().catch(() => {}); } catch (e) {}

    // Ukončenie podržaním 0,8 s — aby deti hru omylom nezavreli
    const exit = root.querySelector('.play-exit');
    let holdT;
    const startHold = (e) => { e.preventDefault(); exit.classList.add('holding'); holdT = setTimeout(close, 800); };
    const endHold = () => { exit.classList.remove('holding'); clearTimeout(holdT); };
    exit.addEventListener('pointerdown', startHold);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => exit.addEventListener(ev, endHold));
    exit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') close(); });

    ctx = { game, set, child: null, rounds: 0, firstTry: 0, total: 0, started: Date.now() };
    choosePlayer();
  }

  function close() {
    if (!root) return;
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    try { speechSynthesis.cancel(); } catch (e) {}
    root.remove(); root = null; document.body.classList.remove('playing');
    ISK.emit('route');
  }

  function stage() { return root.querySelector('.play-stage'); }

  function choosePlayer() {
    const kids = S().children;
    if (!kids.length) return startGame();
    const st = stage();
    st.innerHTML = `<div class="who"><h2>Kto sa ide hrať?</h2><div class="who-grid">
      ${kids.map((k) => `<button class="who-kid" data-id="${k.id}" style="--c:${k.color}"><span>${k.avatar}</span><b>${esc(k.name)}</b></button>`).join('')}
      <button class="who-kid" data-id="" style="--c:#cbd5e1"><span>🙂</span><b>Bez mena</b></button></div></div>`;
    say('Kto sa ide hrať?');
    st.querySelectorAll('.who-kid').forEach((b) => b.onclick = () => {
      ctx.child = kids.find((k) => k.id === b.dataset.id) || null;
      startGame();
    });
  }

  function startGame() {
    ctx.rounds = 0; ctx.firstTry = 0; ctx.total = 0;
    const impl = GAMES[ctx.game.id];
    ctx.total = impl.rounds ? impl.rounds() : 6;
    renderStars();
    impl.start();
  }

  function renderStars() {
    if (!root) return;
    const el = root.querySelector('.play-stars');
    if (GAMES[ctx.game.id].rounds === null) { el.textContent = ''; return; }
    el.innerHTML = Array.from({ length: ctx.total }, (_, i) => `<i class="${i < ctx.rounds ? 'on' : ''}">⭐</i>`).join('');
  }

  /* Spoločná logika pre kolové hry */
  function roundGame(makeRound) {
    let missed = false;
    function next() {
      if (!root) return;
      if (ctx.rounds >= ctx.total) return finish(ctx.firstTry / ctx.total);
      missed = false;
      const st = stage();
      st.innerHTML = '';
      makeRound(st, answer);
    }
    function answer(ok, el) {
      if (ok) {
        sfx.ok();
        if (!missed) ctx.firstTry++;
        ctx.rounds++;
        renderStars();
        el && el.classList.add('good');
        say(pick(PRAISE));
        stage().classList.add('celebrate');
        setTimeout(() => { if (root) { stage().classList.remove('celebrate'); next(); } }, 1100);
      } else {
        sfx.bad(); missed = true;
        el && (el.classList.remove('shake'), void el.offsetWidth, el.classList.add('shake'));
        say(pick(RETRY));
      }
    }
    next();
  }

  function finish(ratio) {
    const stars = ratio >= 0.85 ? 3 : ratio >= 0.5 ? 2 : 1;
    sfx.win(); confetti(root, 90);
    const name = ctx.child ? ctx.child.name : '';
    say((name ? name + ', ' : '') + (stars === 3 ? 'si úžasný hráč! Získal si tri hviezdy!' : 'výborne, dohral si hru!'));
    recordResult(stars);
    const st = stage();
    st.innerHTML = `<div class="finish">
      <div class="finish-stars">${[1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}" style="animation-delay:${i * 0.18}s">⭐</span>`).join('')}</div>
      <h2>${name ? esc(name) + ', si' : 'Si'} hviezda!</h2>
      <p>${ctx.game.name} · ${ctx.set.name}</p>
      <div class="finish-actions">
        <button class="kbtn" data-a="again">🔁 Hrať znova</button>
        <button class="kbtn alt" data-a="who">👧 Ďalšie dieťa</button>
        <button class="kbtn ghost" data-a="exit">🏠 Koniec</button>
      </div></div>`;
    st.querySelector('[data-a=again]').onclick = startGame;
    st.querySelector('[data-a=who]').onclick = choosePlayer;
    st.querySelector('[data-a=exit]').onclick = close;
  }

  function recordResult(stars) {
    const s = S();
    s.stats.gamesPlayed++;
    if (ctx.child) {
      const kid = s.children.find((k) => k.id === ctx.child.id);
      if (kid) {
        kid.games = kid.games || {};
        const g = kid.games[ctx.game.id] = kid.games[ctx.game.id] || { plays: 0, stars: 0, best: 0 };
        g.plays++; g.stars += stars; g.best = Math.max(g.best, stars); g.last = ISK.today();
      }
    }
    ISK.save();
    ISK.track('game_played', { game: ctx.game.id, set: ctx.set.id, stars, secs: Math.round((Date.now() - ctx.started) / 1000) });
    ISK.unlock('first_game');
    if (s.stats.gamesPlayed >= 20) ISK.unlock('games20');
  }

  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------- Jednotlivé hry ---------------- */
  const GAMES = {
    pexeso: {
      rounds: null,
      start() {
        const pairs = [4, 6, 8][ageLevel() - 1];
        const items = shuffle(ctx.set.items).slice(0, pairs);
        const cards = shuffle(items.concat(items).map((it, i) => ({ it, k: it[0] + '|' + it[1], i })));
        const st = stage();
        st.innerHTML = `<div class="pex" style="--cols:${pairs <= 4 ? 4 : pairs <= 6 ? 4 : 4}">${cards.map((c, i) => `<button class="pcard" data-i="${i}" aria-label="kartička"><span class="back">${ctx.set.icon || '✨'}</span><span class="front">${c.it[0]}</span></button>`).join('')}</div>`;
        say('Nájdi dvojice rovnakých obrázkov.');
        let open = [], found = 0, moves = 0, lock = false;
        st.querySelectorAll('.pcard').forEach((b) => b.onclick = () => {
          if (lock || b.classList.contains('open')) return;
          sfx.flip(); b.classList.add('open'); open.push(b);
          if (open.length === 2) {
            moves++; lock = true;
            const [a, c] = open;
            if (cards[a.dataset.i].k === cards[c.dataset.i].k) {
              setTimeout(() => {
                a.classList.add('done'); c.classList.add('done'); sfx.ok();
                say(cards[a.dataset.i].it[1]);
                open = []; lock = false; found++;
                if (found === pairs) setTimeout(() => finish(Math.min(1, (pairs * 1.6) / moves)), 700);
              }, 350);
            } else {
              setTimeout(() => { a.classList.remove('open'); c.classList.remove('open'); open = []; lock = false; }, 900);
            }
          }
        });
      },
    },

    pocitanie: {
      start() {
        const max = [5, 7, 10][ageLevel() - 1];
        roundGame((st, answer) => {
          const n = rand(1, max);
          const it = pick(ctx.set.items);
          const opts = shuffle([n, ...shuffle([...Array(max).keys()].map((x) => x + 1).filter((x) => x !== n)).slice(0, 2)]);
          st.innerHTML = `<div class="q">Koľko ich je?</div>
            <div class="count-field">${Array.from({ length: n }, () => `<span style="--r:${rand(-14, 14)}deg">${it[0]}</span>`).join('')}</div>
            <div class="opts">${opts.map((o) => `<button class="opt num" data-v="${o}">${o}</button>`).join('')}</div>`;
          say('Koľko ich je? Spočítaj!');
          st.querySelectorAll('.opt').forEach((b) => b.onclick = () => answer(+b.dataset.v === n, b));
        });
      },
    },

    farby: {
      start() {
        const lvl = ageLevel();
        roundGame((st, answer) => {
          const nOpts = [3, 4, 6][lvl - 1];
          const colors = shuffle(ISK.COLORS).slice(0, lvl === 1 ? 3 : 4);
          const shapes = shuffle(ISK.SHAPES).slice(0, lvl === 1 ? 2 : 3);
          const combos = [];
          colors.forEach((c) => shapes.forEach((s) => combos.push({ c, s })));
          const choice = shuffle(combos).slice(0, nOpts);
          const target = pick(choice);
          const adj = target.s.gender === 'f' ? target.c.fem : target.s.gender === 'n' ? target.c.name.replace(/ý$/, 'é') : target.c.name;
          const prompt = `Ťukni na ${adj} ${target.s.name}`;
          st.innerHTML = `<div class="q">${prompt}</div>
            <div class="opts shapes">${choice.map((o, i) => `<button class="opt shape" data-i="${i}" aria-label="${o.c.name} ${o.s.name}">${shapeSvg(o.s.id, o.c.hex)}</button>`).join('')}</div>`;
          say(prompt);
          st.querySelectorAll('.opt').forEach((b) => b.onclick = () => answer(choice[b.dataset.i] === target, b));
        });
      },
    },

    hlasky: {
      start() {
        const items = ctx.set.items.filter((i) => /^[a-zA-ZáäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ]/.test(i[1]));
        const queue = shuffle(items);
        let qi = 0;
        roundGame((st, answer) => {
          const it = queue[qi++ % queue.length];
          const L = (w) => w.charAt(0).toUpperCase();
          const right = L(it[1]);
          const pool = [...new Set(ISK.allSets().flatMap((s) => s.items.map((x) => L(x[1]))))].filter((x) => x !== right);
          const opts = shuffle([right, ...shuffle(pool).slice(0, ageLevel() === 1 ? 1 : 2)]);
          st.innerHTML = `<div class="q">Na akú hlásku sa začína?</div>
            <button class="big-emoji" aria-label="Prehrať slovo">${it[0]}<small>🔊</small></button>
            <div class="word">${ageLevel() === 3 ? '<b>?</b>' + esc(it[1].slice(1)) : '&nbsp;'}</div>
            <div class="opts">${opts.map((o) => `<button class="opt letter" data-v="${o}">${o}</button>`).join('')}</div>`;
          const speak = () => say(it[1] + '. Na akú hlásku sa začína slovo ' + it[1] + '?');
          speak();
          st.querySelector('.big-emoji').onclick = speak;
          st.querySelectorAll('.opt').forEach((b) => b.onclick = () => answer(b.dataset.v === right, b));
        });
      },
    },

    nepatri: {
      start() {
        roundGame((st, answer) => {
          const others = ISK.allSets().filter((s) => s.id !== ctx.set.id);
          const odd = pick(pick(others).items);
          const own = shuffle(ctx.set.items).slice(0, ageLevel() === 3 ? 4 : 3).filter((x) => x[0] !== odd[0]);
          const all = shuffle(own.concat([odd]));
          st.innerHTML = `<div class="q">Čo sem nepatrí?</div>
            <div class="opts pics">${all.map((it, i) => `<button class="opt pic" data-i="${i}" aria-label="${esc(it[1])}">${it[0]}</button>`).join('')}</div>`;
          say('Čo sem nepatrí?');
          st.querySelectorAll('.opt').forEach((b) => b.onclick = () => {
            const ok = all[b.dataset.i] === odd;
            answer(ok, b);
            if (ok) setTimeout(() => say(odd[1] + ' sem nepatrí'), 450);
          });
        });
      },
    },

    postupnost: {
      start() {
        const patterns = [['AB'], ['AB', 'AAB', 'ABB'], ['ABC', 'AAB', 'ABB', 'ABBC']][ageLevel() - 1];
        roundGame((st, answer) => {
          const pat = pick(patterns);
          const uniq = [...new Set(pat)];
          const its = shuffle(ctx.set.items).slice(0, uniq.length);
          const map = {}; uniq.forEach((k, i) => (map[k] = its[i]));
          const len = pat.length * 2 + 1;
          const seq = Array.from({ length: len }, (_, i) => map[pat[i % pat.length]]);
          const right = map[pat[len % pat.length]];
          const distract = shuffle(ctx.set.items.filter((x) => x !== right)).slice(0, 2);
          const opts = shuffle([right, ...distract]);
          st.innerHTML = `<div class="q">Čo príde ďalej?</div>
            <div class="seq">${seq.map((s) => `<span>${s[0]}</span>`).join('')}<span class="qm">?</span></div>
            <div class="opts pics">${opts.map((o, i) => `<button class="opt pic" data-i="${i}" aria-label="${esc(o[1])}">${o[0]}</button>`).join('')}</div>`;
          say('Čo príde v rade ďalej?');
          st.querySelectorAll('.opt').forEach((b) => b.onclick = () => {
            const ok = opts[b.dataset.i] === right;
            if (ok) { const q = st.querySelector('.qm'); q.textContent = right[0]; q.classList.add('filled'); }
            answer(ok, b);
          });
        });
      },
    },

    tiene: {
      start() {
        roundGame((st, answer) => {
          const opts = shuffle(ctx.set.items).slice(0, ageLevel() === 1 ? 3 : 4);
          const target = pick(opts);
          st.innerHTML = `<div class="q">Ktorý tieň patrí k obrázku?</div>
            <div class="big-emoji static">${target[0]}</div>
            <div class="opts pics">${opts.map((o, i) => `<button class="opt pic shadow" data-i="${i}" aria-label="tieň">${o[0]}</button>`).join('')}</div>`;
          say('Ktorý tieň patrí k obrázku ' + target[1] + '?');
          st.querySelectorAll('.opt').forEach((b) => b.onclick = () => {
            const ok = opts[b.dataset.i] === target;
            if (ok) b.classList.remove('shadow');
            answer(ok, b);
          });
        });
      },
    },
  };

  function shapeSvg(id, c) {
    const P = {
      kruh: `<circle cx="50" cy="50" r="40" fill="${c}"/>`,
      stvorec: `<rect x="12" y="12" width="76" height="76" rx="8" fill="${c}"/>`,
      trojuholnik: `<path d="M50 8 L92 88 L8 88 Z" fill="${c}" stroke="${c}" stroke-width="6" stroke-linejoin="round"/>`,
      hviezda: `<path d="M50 6l12.6 27.4 29.9 3.3-22.4 20.1 6.4 29.5L50 71.4 23.5 86.3l6.4-29.5L7.5 36.7l29.9-3.3z" fill="${c}" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`,
      srdce: `<path d="M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C39 8 46 13 50 21 C54 13 61 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88 Z" fill="${c}"/>`,
    };
    return `<svg viewBox="0 0 100 100" aria-hidden="true">${P[id]}</svg>`;
  }

  ISK.games = { open, close, say, sfx };
})();
