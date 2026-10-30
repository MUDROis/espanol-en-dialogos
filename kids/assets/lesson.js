/* ==========================================================================
   Español A0–A1 · общий движок уроков
   Все 20 уроков используют этот файл. Версия 1.0
   ========================================================================== */
(function () {
  'use strict';

  var EL = {};
  window.EL = EL;

  var cfg = {};
  var steps = [];
  var currentStep = 1;
  var recognition = null;
  var recognitionBusy = false;
  var store = {};
  var voiceWarned = false;
  var dialogTimers = [];

  /* ---------------------------------------------------------------- утилиты */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function norm(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[¡!¿?.,;:¡¿()"'`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  EL.$ = $; EL.$$ = $$; EL.el = el; EL.shuffle = shuffle; EL.norm = norm;

  /* ------------------------------------------------------- оценка похожести */
  function similarity(a, b) {
    a = norm(a); b = norm(b);
    if (!a || !b) return 0;
    if (a === b) return 1;
    var m = [], i, j;
    for (i = 0; i <= a.length; i++) m[i] = [i];
    for (j = 0; j <= b.length; j++) m[0][j] = j;
    for (i = 1; i <= a.length; i++) {
      for (j = 1; j <= b.length; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost);
      }
    }
    return 1 - m[a.length][b.length] / Math.max(a.length, b.length);
  }
  EL.similarity = similarity;

  /* -------------------------------------------------------------- озвучка */
  function pickVoice(lang) {
    if (!('speechSynthesis' in window)) return null;
    var vs = speechSynthesis.getVoices() || [];
    var base = String(lang || 'es-ES').toLowerCase().slice(0, 2);
    for (var i = 0; i < vs.length; i++) {
      if (String(vs[i].lang || '').toLowerCase().indexOf(base) === 0) return vs[i];
    }
    return null;
  }

  /* Разбивает текст на части по языкам: кириллица — русский, латиница — испанский.
     Пунктуация и пробелы приклеиваются к предыдущей части. */
  function splitByLang(text) {
    var tokens = String(text).match(/[а-яё]+|[A-Za-zÁÉÍÓÚÜÑáéíóúüñ¿¡]+|[^а-яёA-Za-zÁÉÍÓÚÜÑáéíóúüñ¿¡]+/gi) || [];
    var runs = [];
    tokens.forEach(function (t) {
      var lang = /[а-яё]/i.test(t) ? 'ru-RU' : (/[a-zñ]/i.test(t) ? 'es-ES' : null);
      if (lang === null) {
        if (runs.length) runs[runs.length - 1].text += t;
        return;
      }
      var last = runs[runs.length - 1];
      if (last && last.lang === lang) last.text += t;
      else runs.push({ text: t, lang: lang });
    });
    if (!runs.length) runs.push({ text: String(text), lang: /[а-яё]/i.test(text) ? 'ru-RU' : 'es-ES' });
    return runs;
  }

  function speakOne(text, lang, opts) {
    var u = new SpeechSynthesisUtterance(String(text));
    u.lang = lang;
    u.rate = opts.rate != null ? opts.rate : (cfg.rate || 0.75);
    u.pitch = opts.pitch != null ? opts.pitch : 1.1;
    u.volume = 1;
    var v = pickVoice(lang);
    if (v) u.voice = v;
    try { speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { /* нет озвучки */ }
  }

  function speak(text, opts) {
    opts = opts || {};
    if (!text || !('speechSynthesis' in window)) return;
    if (!opts.keepTimers) stopDialog();
    var runs = splitByLang(text);
    if (runs.length > 1) {
      var at = 0;
      runs.forEach(function (run) {
        dialogTimers.push(setTimeout(function () { speakOne(run.text, run.lang, opts); }, at));
        var secs = Math.max(0.6, (String(run.text).length / 13) / (cfg.rate || 0.75));
        at += secs * 1000 + 220;
      });
      return;
    }
    speakOne(text, runs[0].lang, opts);
  }
  EL.speak = speak;

  function stopDialog() {
    dialogTimers.forEach(clearTimeout);
    dialogTimers = [];
    if ('speechSynthesis' in window) { try { speechSynthesis.cancel(); } catch (e) {} }
  }
  EL.stopDialog = stopDialog;

  /* Последовательное озвучивание реплик диалога */
  function playLines(lines, gap) {
    stopDialog();
    gap = gap || Math.max(1400, (cfg.rate ? 1 / cfg.rate : 1.3) * 1000 * 0.85);
    lines.forEach(function (line, i) {
      dialogTimers.push(setTimeout(function () { speak(line, { keepTimers: true }); }, Math.round(i * gap)));
    });
  }
  EL.playLines = playLines;

  /* ------------------------------------------------- распознавание речи */
  function initRecognition() {
    if (recognition) return true;
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    try {
      recognition = new SR();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      recognition.maxAlternatives = 5;
      recognition.continuous = false;
    } catch (e) { recognition = null; }
    return !!recognition;
  }
  EL.hasVoice = function () { return initRecognition(); };

  function warnNoVoice() {
    if (voiceWarned) return;
    voiceWarned = true;
    var b = $('#voiceNote');
    if (b) b.classList.add('show');
  }

  /* opts: { expect, btn, step, threshold, onOk(result), onFail(result), hint } */
  function listen(opts) {
    opts = opts || {};
    var step = opts.step || currentStep;
    if (!initRecognition()) {
      warnNoVoice();
      say(step, opts.noVoice || ' Проверка голоса работает в Chrome и Edge. Послушай образец и повтори вслух!', 'error');
      return;
    }
    if (recognitionBusy) return;

    var btn = opts.btn;
    if (btn) btn.classList.add('listening');
    recognitionBusy = true;

    var done = function () {
      recognitionBusy = false;
      if (btn) btn.classList.remove('listening');
    };

    recognition.onresult = function (ev) {
      var best = '', bestScore = -1;
      for (var i = 0; i < ev.results[0].length; i++) {
        var t = ev.results[0][i].transcript;
        var sc = opts.expect ? similarity(t, opts.expect) : 1;
        if (sc > bestScore) { bestScore = sc; best = t; }
      }
      done();
      var th = opts.threshold != null ? opts.threshold : 0.55;
      if (!opts.expect || bestScore >= th) {
        if (btn) { btn.classList.add('mic-ok'); btn.classList.remove('mic-bad'); }
        if (opts.onOk) opts.onOk(best);
        else say(step, opts.okText || ' ¡Muy bien! Отлично звучит!', 'success');
      } else {
        if (btn) { btn.classList.add('mic-bad'); btn.classList.remove('mic-ok'); }
        if (opts.onFail) opts.onFail(best);
        else say(step, ' ¡Casi! Я услышал «' + best + '». Послушай ещё раз и повтори!', 'error');
      }
    };
    recognition.onerror = function (ev) {
      done();
      var code = ev && ev.error;
      if (code === 'no-speech') say(step, ' Я ничего не услышал. Подойди ближе к микрофону и скажи фразу ещё раз!', 'error');
      else if (code === 'not-allowed' || code === 'service-not-allowed') say(step, ' Доступ к микрофону запрещён. Разреши его в настройках браузера.', 'error');
      else if (code !== 'aborted') say(step, ' Не получилось услышать. Попробуй ещё раз!', 'error');
    };
    recognition.onend = function () { recognitionBusy = false; if (btn) btn.classList.remove('listening'); };

    try { recognition.start(); }
    catch (e) { done(); }
  }
  EL.listen = listen;

  /* -------------------------------------------------------------- отклик */
  function say(step, text, type, ms) {
    var fb = document.getElementById('feedback' + step);
    if (!fb) return;
    if (ms == null) ms = 3400;
    fb.className = 'feedback ' + (type || 'success');
    fb.textContent = text;
    if (fb._t) clearTimeout(fb._t);
    if (ms) fb._t = setTimeout(function () { fb.textContent = ''; fb.className = 'feedback'; }, ms);
  }
  EL.say = say;

  /* ------------------------------------------------------------- конфетти */
  function themeColors() {
    var cs = getComputedStyle(document.body);
    var out = [];
    for (var i = 1; i <= 6; i++) {
      var v = cs.getPropertyValue('--c' + i);
      if (v && v.trim()) out.push(v.trim());
    }
    return out.length ? out : ['#FF6B6B', '#4ECDC4', '#FFD93D', '#FF8E53'];
  }
  function confetti(count) {
    var colors = themeColors();
    var box = $('#confetti');
    if (!box) { box = el('div'); box.id = 'confetti'; document.body.appendChild(box); }
    for (var i = 0; i < (count || 90); i++) {
      (function (i) {
        setTimeout(function () {
          var c = el('i', 'confetti-bit');
          c.style.left = Math.random() * 100 + 'vw';
          c.style.background = colors[Math.floor(Math.random() * colors.length)];
          c.style.animationDuration = (Math.random() * 1.8 + 2) + 's';
          c.style.animationDelay = (Math.random() * 0.4) + 's';
          c.style.fontSize = (Math.random() * 8 + 8) + 'px';
          c.textContent = Math.random() < 0.35 ? '' : '';
          box.appendChild(c);
          setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 4200);
        }, i * 28);
      })(i);
    }
  }
  EL.confetti = confetti;

  /* ---------------------------------------------------- прогресс / localStorage */
  function storageKey() { return cfg.key || ('lesson' + cfg.id + '_progress'); }

  function save(quiet) {
    try {
      store.step = currentStep;
      store.ts = Date.now();
      if (store.step === steps.length && store.step > 1) store.done = true;
      localStorage.setItem(storageKey(), JSON.stringify(store));
      if (!quiet) flashSave();
    } catch (e) { /* приватный режим */ }
  }
  EL.save = save;

  function flashSave() {
    var s = $('#saveIndicator');
    if (!s) return;
    s.classList.add('show');
    if (flashSave._t) clearTimeout(flashSave._t);
    flashSave._t = setTimeout(function () { s.classList.remove('show'); }, 1600);
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(storageKey()); } catch (e) { return false; }
    if (!raw) return false;
    var data;
    try { data = JSON.parse(raw); } catch (e) { return false; }
    if (!data || typeof data !== 'object') return false;
    if (data.ts && Date.now() - data.ts > 1000 * 60 * 60 * 24 * 30) return false; /* месяц — начинаем заново */
    store = data;
    var step = data.step || data.currentStep || 1;
    if (step < 2) return false;
    return confirm((cfg.resumeMsg || 'Продолжить урок с шага ') + step + '?');
  }
  EL.get = function (k, def) {
    return store[k] === undefined ? def : store[k];
  };
  EL.set = function (k, v) { store[k] = v; save(); };

  /* ------------------------------------------------------- навигация по шагам */
  function buildProgressBar() {
    var bar = $('#progressBar');
    if (!bar) return;
    bar.innerHTML = '';
    steps.forEach(function (st, i) {
      var d = el('div', 'progress-step', String(i + 1));
      d.title = 'Шаг ' + (i + 1) + ': ' + (st.getAttribute('data-title') || '');
      bar.appendChild(d);
    });
  }

  function showStep(n, opts) {
    opts = opts || {};
    n = Math.max(1, Math.min(steps.length, n));
    steps.forEach(function (s) { s.classList.remove('active'); });
    var node = document.getElementById('step' + n);
    if (!node) return;
    node.classList.add('active');
    $$('.progress-step', $('#progressBar') || document).forEach(function (p, i) {
      p.classList.remove('active', 'done');
      if (i + 1 < n) p.classList.add('done');
      else if (i + 1 === n) p.classList.add('active');
    });
    currentStep = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    stopDialog();
    if (cfg.onStep && !opts.fromInit) { try { cfg.onStep(n, store); } catch (e) { console.error(e); } }
    save(opts.fromInit);
  }
  EL.showStep = showStep;
  EL.next = function () { if (currentStep < steps.length) showStep(currentStep + 1); };
  EL.prev = function () { if (currentStep > 1) showStep(currentStep - 1); };

  function restart() {
    if (!confirm(' Начать урок заново? Прогресс будет сброшен.')) return;
    try { localStorage.removeItem(storageKey()); } catch (e) {}
    store = {};
    if (cfg.onRestart) { try { cfg.onRestart(); } catch (e) { console.error(e); } }
    showStep(1);
  }
  EL.restart = restart;

  /* ------------------------------------------------- чек-лист «¡Yo puedo!» */
  EL.canDo = function (items, key) {
    var box = document.getElementById('canDo');
    if (!box) return;
    var done = EL.get(key || 'canDo', {});
    box.innerHTML = '';
    items.forEach(function (txt, i) {
      var id = 'cand' + i;
      var lab = el('label', 'cand' + (done[i] ? ' done' : ''));
      var inp = el('input');
      inp.type = 'checkbox';
      inp.checked = !!done[i];
      inp.id = id;
      inp.addEventListener('change', function () {
        done[i] = inp.checked;
        lab.classList.toggle('done', inp.checked);
        save();
        if (Object.keys(done).filter(function (k) { return done[k]; }).length === items.length) {
          say('7', ' ¡Increíble! Ты умеешь всё из этого урока!', 'success');
        }
      });
      lab.appendChild(inp);
      lab.appendChild(el('span', 'cand-box', ''));
      lab.appendChild(el('span', 'cand-txt', txt));
      box.appendChild(lab);
    });
  };

  /* -------------------------------------------------- игра «Найди пару» */
  /* pairs: [{ a: 'Слово', b: '', sa: 'слово-произносимое', sb: 'подпись' }]
     Панель «Показать карточки» + «Начать игру»: сначала ребёнок подглядывает,
     и только после нажатия на старт карточки можно открывать. */
  EL.memory = function (pairs, opts) {
    opts = opts || {};
    var grid = document.getElementById(opts.grid || 'memoryGrid');
    var counter = document.getElementById(opts.counter || 'memoryCounter');
    if (!grid) return;

    var key = opts.stateKey || 'memory';
    var matched = EL.get(key, []) || [];
    var cards = [];
    pairs.forEach(function (p, i) {
      cards.push({ pid: String(i), kind: 'a', val: p.a, say: p.sa || p.a });
      cards.push({ pid: String(i), kind: 'b', val: p.b, say: p.sb || null });
    });
    cards = shuffle(cards);

    grid.innerHTML = '';
    grid.style.gridTemplateColumns = 'repeat(' + (opts.cols || (pairs.length > 4 ? 5 : 4)) + ', 1fr)';
    cards.forEach(function (c, idx) {
      var d = el('div', 'memory-card', '?');
      d.dataset.pair = c.pid;
      d.dataset.kind = c.kind;
      d.dataset.value = c.val;
      d.dataset.index = String(idx);
      d.dataset.sayWord = c.say || '';
      if (matched.indexOf(c.pid) > -1) { d.classList.add('matched'); d.textContent = c.val; }
      grid.appendChild(d);
    });

    if (counter) {
      counter.textContent = matched.length;
      counter.classList.toggle('complete', matched.length === pairs.length);
    }

    /* Панель управления: подглядеть и начать игру */
    var tools = grid.__memoryTools;
    if (!tools) {
      tools = el('div', 'memory-tools');
      tools.innerHTML = '<button type="button" class="btn btn-secondary memory-peek">👀 Показать карточки</button>' +
                        '<button type="button" class="btn btn-primary memory-go">▶ Начать игру</button>';
      grid.parentNode.insertBefore(tools, grid);
      grid.__memoryTools = tools;
    }
    var peekBtn = $('.memory-peek', tools);
    var goBtn = $('.memory-go', tools);

    var started = matched.length === pairs.length;
    var allDone = matched.length === pairs.length;
    var lock = false, open = [];

    goBtn.disabled = allDone;
    goBtn.textContent = allDone ? '✓ Все пары!' : '▶ Начать игру';

    function faceDownAll() {
      $$('.memory-card', grid).forEach(function (c) {
        if (!c.classList.contains('matched')) { c.classList.remove('peeked'); c.textContent = '?'; }
      });
    }

    goBtn.onclick = function () {
      if (allDone) return;
      started = true;
      faceDownAll();
      goBtn.disabled = true;
      goBtn.textContent = '▶ Играем!';
      say(opts.step || 3, ' ¡Vamos! Открывай по две карточки и ищи пары.', 'info', 2600);
    };

    peekBtn.onclick = function () {
      if (lock || allDone) return;
      var any = false;
      $$('.memory-card', grid).forEach(function (c) { // eslint-disable-line no-loop-func
        if (!c.classList.contains('matched')) {
          c.classList.add('peeked');
          c.textContent = c.dataset.value;
          any = true;
        }
      });
      if (!any) return;
      lock = true;
      say(opts.step || 3, started
        ? ' Подглядываем — запоминай, где что лежит!'
        : ' Запоминай карточки! Через пару секунд они закроются.', 'info', 1800);
      setTimeout(function () {
        faceDownAll();
        lock = false;
      }, opts.peekTime || 2600);
    };

    grid.onclick = function (e) {
      var card = e.target.closest('.memory-card');
      if (!card || lock) return;
      if (!started) {
        card.classList.add('shake');
        setTimeout(function () { card.classList.remove('shake'); }, 500);
        say(opts.step || 3, ' Сначала посмотри карточки и нажми «▶ Начать игру»!', 'info', 2200);
        return;
      }
      if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
      card.classList.add('flipped');
      card.textContent = card.dataset.value;
      if (card.dataset.sayWord) speak(card.dataset.sayWord);
      open.push(card);
      if (open.length < 2) return;
      lock = true;
      setTimeout(function () {
        var a = open[0], b = open[1];
        if (a.dataset.pair === b.dataset.pair && a.dataset.kind !== b.dataset.kind) {
          a.classList.add('matched'); a.classList.remove('flipped');
          b.classList.add('matched'); b.classList.remove('flipped');
          if (matched.indexOf(a.dataset.pair) === -1) matched.push(a.dataset.pair);
          EL.set(key, matched);
          var cnt = document.getElementById(opts.counter || 'memoryCounter');
          if (cnt) {
            cnt.textContent = matched.length;
            if (matched.length === pairs.length) cnt.classList.add('complete');
          }
          if (matched.length === pairs.length) {
            allDone = true;
            say(opts.step || 3, ' ¡Perfecto! Все пары найдены!', 'success');
            if (opts.onWin) opts.onWin();
          } else {
            say(opts.step || 3, ' ¡Muy bien! Пара найдена!', 'success', 1600);
          }
        } else {
          a.classList.remove('flipped'); a.textContent = '?';
          b.classList.remove('flipped'); b.textContent = '?';
          say(opts.step || 3, ' ¡Casi! Это не пара. Попробуй ещё раз!', 'error', 2000);
        }
        open = [];
        lock = false;
      }, opts.delay || 850);
    };
  };

  /* ------------------------------------- игра «Разложи по местам» (drag & tap) */
  /* items: [{ key, label, emoji, say }] — куда попасть
     slots: [{ key, label, emoji, accept?:[keys] }] — куда класть              */
  EL.assign = function (opt) {
    var bank = document.getElementById(opt.bank);
    var grid = document.getElementById(opt.targets);
    if (!bank || !grid) return;
    var items = opt.items || [], slots = opt.slots || [];
    var key = opt.stateKey || 'assign';
    var placed = EL.get(key, []) || [];           /* [[itemIndex, slotKey], ...] */
    var validate = opt.validate || function (itemKey, slotKey) { return itemKey === slotKey; };
    var step = opt.step || 5;

    function savePlaced() { EL.set(key, placed); }

    function chipFor(i) {
      var it = items[i];
      var c = el('div', 'chip', (it.emoji ? '<span class="chip-emoji">' + it.emoji + '</span>' : '') + '<span class="chip-label">' + it.label + '</span>');
      c.dataset.i = String(i);
      c.dataset.key = it.key;
      c.dataset.sayWord = it.say || '';
      if (it.say) c.dataset.say = it.say;
      return c;
    }

    function render() {
      bank.innerHTML = '';
      grid.innerHTML = '';
      var used = {};
      placed.forEach(function (p) { used[p[0]] = p[1]; });

      items.forEach(function (it, i) {
        var c = chipFor(i);
        if (used[i] !== undefined) {
          c.classList.add('placed');
          c.querySelector('.chip-label').textContent = '';
          c.querySelector('.chip-label').setAttribute('aria-hidden', 'true');
        }
        bank.appendChild(c);
      });
      /* раскладываем занятые чипы по слотам */
      slots.forEach(function (s) {
        var slot = el('div', 'slot');
        slot.dataset.key = s.key;
        if (s.emoji) slot.appendChild(el('div', 'slot-emoji', s.emoji));
        if (s.label) slot.appendChild(el('div', 'slot-label', s.label));
        var holder = el('div', 'slot-drop');
        placed.forEach(function (p) {
          if (p[1] === s.key) {
            var c = chipFor(p[0]);
            c.classList.add('in-slot');
            c.querySelector('.chip-label').textContent = items[p[0]].label;
            holder.appendChild(c);
          }
        });
        slot.appendChild(holder);
        grid.appendChild(slot);
      });
      $$('.chip', bank).forEach(enableDrag);
      updateProgress();
    }

    function updateProgress() {
      var prog = document.getElementById(opt.progress || 'assignProgress');
      if (!prog) return;
      var ok = 0, total = items.length;
      items.forEach(function (it, i) {
        for (var k = 0; k < placed.length; k++) {
          if (placed[k][0] === i && validate(it.key, placed[k][1])) { ok++; break; }
        }
      });
      prog.textContent = ok + '/' + total;
      if (ok === total) {
        prog.classList.add('complete');
        if (!store['assignDone_' + key]) {
          store['assignDone_' + key] = true; save();
          say(step, opt.winMsg || ' ¡Excelente! Всё разложено правильно!', 'success');
          confetti(60);
          if (opt.onWin) opt.onWin();
        }
      } else {
        prog.classList.remove('complete');
      }
    }

    /* --- выбор чипа (тап) + перетаскивание мышью/пальцем --- */
    var selected = null;

    function clearSelection() {
      if (selected) selected.classList.remove('selected');
      selected = null;
      $$('.slot', grid).forEach(function (s) { s.classList.remove('drop-ready'); });
    }

    function place(chip, slot) {
      var i = +chip.dataset.i, item = items[i];
      if (!validate(item.key, slot.dataset.key)) {
        slot.classList.add('slot-bad');
        say(step, opt.badMsg || ' ¡Casi! Подумай, куда это подходит. Попробуй другое место!', 'error');
        setTimeout(function () { slot.classList.remove('slot-bad'); }, 700);
        return false;
      }
      placed = placed.filter(function (p) { return p[0] !== i && p[1] !== slot.dataset.key; });
      placed.push([i, slot.dataset.key]);
      savePlaced();
      render();
      return true;
    }

    function unplace(chip) {
      var i = +chip.dataset.i;
      placed = placed.filter(function (p) { return p[0] !== i; });
      store['assignDone_' + key] = false;
      savePlaced();
      render();
    }

    function onChipTap(chip) {
      if (selected === chip) { clearSelection(); return; }
      clearSelection();
      selected = chip;
      chip.classList.add('selected');
      say(step, ' Выбрано: ' + items[+chip.dataset.i].label + '. Теперь нажми на нужное место.', 'info', 2600);
      if ('speechSynthesis' in window && items[+chip.dataset.i].say) speak(items[+chip.dataset.i].say);
    }

    bank.onclick = function (e) {
      if (e.detail !== 0) return; /* мышь и тап обработаны в pointerup */
      var chip = e.target.closest('.chip');
      if (chip) onChipTap(chip);
    };

    grid.onclick = function (e) {
      var chip = e.target.closest('.chip');
      if (chip && chip.classList.contains('in-slot')) { unplace(chip); say(step, ' Вернули обратно в банк.', 'info', 1800); return; }
      var slot = e.target.closest('.slot');
      if (!slot) return;
      var picked = selected;
      if (!picked) return;
      var idx = +picked.dataset.i;
      var ok = place(picked, slot);
      clearSelection();
      if (ok && items[idx] && items[idx].say) speak(items[idx].say);
    };

    function enableDrag(chip) {
      if (chip.dataset.dragReady) return;
      chip.dataset.dragReady = '1';
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', '0');
      chip.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChipTap(chip); }
      });
      let sx = 0, sy = 0, ghost = null, dragging = false;
      chip.addEventListener('pointerdown', function (e) {
        if (chip.classList.contains('in-slot')) return;
        sx = e.clientX; sy = e.clientY; dragging = false;
        try { chip.setPointerCapture(e.pointerId); } catch (err) {}
      });
      chip.addEventListener('pointermove', function (e) {
        if (!chip.hasPointerCapture || !chip.hasPointerCapture(e.pointerId)) return;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (!dragging && Math.abs(dx) + Math.abs(dy) < 8) return;
        if (!dragging) {
          dragging = true;
          ghost = chip.cloneNode(true);
          ghost.className = 'chip ghost';
          ghost.style.width = chip.offsetWidth + 'px';
          document.body.appendChild(ghost);
          chip.classList.add('dragging');
        }
        ghost.style.left = (e.clientX - chip.offsetWidth / 2) + 'px';
        ghost.style.top = (e.clientY - 22) + 'px';
        var under = document.elementFromPoint(e.clientX, e.clientY);
        var slot = under && under.closest ? under.closest('.slot') : null;
        $$('.slot', grid).forEach(function (s) { s.classList.remove('drop-hot'); });
        if (slot) slot.classList.add('drop-hot');
      });
      chip.addEventListener('pointerup', function (e) {
        if (!dragging) { onChipTap(chip); return; }
        var under = document.elementFromPoint(e.clientX, e.clientY);
        var slot = under && under.closest ? under.closest('.slot') : null;
        if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
        chip.classList.remove('dragging');
        $$('.slot', grid).forEach(function (s) { s.classList.remove('drop-hot'); });
        dragging = false; ghost = null;
        if (slot) {
          var ok = place(chip, slot);
          if (ok && items[+chip.dataset.i].say) speak(items[+chip.dataset.i].say);
        }
      });
      chip.addEventListener('pointercancel', function () {
        if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
        chip.classList.remove('dragging');
        dragging = false; ghost = null;
      });
    }

    $$('.chip', bank).forEach(enableDrag);

    render();
    EL.rebindDrag = function () { $$('.chip', bank).forEach(enableDrag); };
    return { render: render };
  };

  /* --------------------------------------------------------- мини-тест */
  EL.quiz = function (questions, opts) {
    opts = opts || {};
    var box = document.getElementById(opts.box || 'quizContainer');
    if (!box) return;
    var key = opts.stateKey || 'quiz';
    var answers = EL.get(key, {}) || {};
    var scoreKey = key + '_score';
    box.innerHTML = '';

    questions.forEach(function (q, i) {
      var block = el('div', 'quiz-question');
      var h = '<p class="quiz-q"><strong>' + (i + 1) + '.</strong> ' + q.q + '</p>';
      if (q.audio) h += '<button class="btn btn-small btn-secondary" data-quiz-say="' + q.audio + '"> Прослушать</button> ';
      if (q.say) h += '<button class="btn btn-small btn-secondary" data-quiz-say="' + q.say + '"> Повторить</button> ';
      block.innerHTML = h + '<div class="quiz-options"></div>';
      var box2 = $('.quiz-options', block);
      shuffle(q.opts).forEach(function (o) {
        var b = el('button', 'quiz-btn', o);
        b.dataset.opt = o;
        if (answers[i] === o) b.classList.add('selected');
        if (answers[i] === o && answers[i + '_ok']) b.classList.add('right');
        b.addEventListener('click', function () {
          answers[i] = o;
          $$('.quiz-btn', box2).forEach(function (x) { x.classList.remove('selected', 'right'); });
          b.classList.add('selected');
          if (o === q.correct) {
            answers[i + '_ok'] = true;
            b.classList.add('right');
            say(opts.step || 6, ' ¡Muy bien! Правильно!', 'success');
            if (q.say || q.audio) speak(q.answerSay || q.correct);
          } else {
            answers[i + '_ok'] = false;
            say(opts.step || 6, ' ¡Casi! Послушай правильный ответ: ' + q.correct, 'error');
            if (q.correct) speak(q.answerSay || q.correct);
          }
          EL.set(key, answers);
          checkScore();
        });
        box2.appendChild(b);
      });
      box.appendChild(block);
    });

    function checkScore() {
      var n = 0;
      questions.forEach(function (_, i) { if (answers[i + '_ok']) n++; });
      EL.set(scoreKey, n);
      var bar = document.getElementById('quizScore');
      if (bar) {
        bar.textContent = 'Правильных ответов: ' + n + ' из ' + questions.length;
        if (n === questions.length) {
          say(opts.step || 6, ' Все ответы верные! ¡Perfecto!', 'success');
          confetti(60);
          if (opts.onWin) opts.onWin();
        }
      }
    }
    checkScore();
  };

  /* --------------------------------------------------- универсальные кнопки */
  /* Игра «выбери правильный вариант»: cards с data-answer */
  EL.choice = function (opt) {
    var box = document.getElementById(opt.box);
    if (!box) return;
    var idx = opt.index || 0;
    var correct = opt.correct[idx];
    $$('[data-answer]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.dataset.answer;
        if (a === correct) {
          b.classList.add('right');
          say(opt.step || 5, opt.okMsg || ' ¡Muy bien!', 'success');
          if (opt.onOk) opt.onOk(a, b);
        } else {
          b.classList.add('wrong');
          say(opt.step || 5, opt.badMsg || ' ¡Casi! Попробуй ещё раз!', 'error');
          setTimeout(function () { b.classList.remove('wrong'); }, 700);
        }
      });
    });
  };

  /* ------------------------------------------------------ инициализация */
  EL.init = function (conf) {
    cfg = conf || {};
    cfg.rate = cfg.rate || 0.75;
    steps = $$('.step');
    if (!steps.length) { console.error('EL.init: не найдено ни одного .step'); return; }

    /* автонумерация шагов, если id не заданы */
    steps.forEach(function (s, i) {
      if (!s.id) s.id = 'step' + (i + 1);
      var h = $('h1, h2', s);
      if (h && !s.getAttribute('data-title')) s.setAttribute('data-title', h.textContent.trim().slice(0, 40));
    });

    buildProgressBar();
    initRecognition();

    /* делегированные кнопки */
    document.addEventListener('click', function (e) {
      var mic = e.target.closest('[data-mic]');
      if (mic) {
        e.preventDefault();
        var sayWord = mic.dataset.say || mic.dataset.mic;
        listen({
          expect: mic.dataset.mic,
          btn: mic,
          step: mic.dataset.step || currentStep,
          threshold: +(mic.dataset.threshold || 0.55),
          okText: mic.dataset.ok || ' ¡Muy bien! Отлично звучит!',
          noVoice: mic.dataset.novoice || undefined
        });
        return;
      }
      var nxt = e.target.closest('[data-next]');
      if (nxt) { e.preventDefault(); EL.next(); return; }
      var prv = e.target.closest('[data-prev]');
      if (prv) { e.preventDefault(); EL.prev(); return; }
      var rs = e.target.closest('[data-restart]');
      if (rs) { e.preventDefault(); restart(); return; }
      var gt = e.target.closest('[data-goto]');
      if (gt) { e.preventDefault(); showStep(+gt.dataset.goto); return; }
      var qs = e.target.closest('[data-quiz-say]');
      if (qs) { e.preventDefault(); speak(qs.dataset.quizSay); return; }
      var rep = e.target.closest('[data-repeat]');
      if (rep) { e.preventDefault(); playLines(JSON.parse(rep.dataset.repeat), rep.dataset.gap ? +rep.dataset.gap : undefined); return; }

      var sayEl = e.target.closest('[data-say]');
      if (sayEl && !e.target.closest('[data-nosay]')) {
        speak(sayEl.dataset.say);
        sayEl.classList.add('speaking');
        setTimeout(function () { sayEl.classList.remove('speaking'); }, 600);
      }
    });

    /* клавиатура: стрелки — шаги урока (удобно преподавателю) */
    document.addEventListener('keydown', function (e) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '').toUpperCase())) return;
      if (e.key === 'ArrowRight') { EL.next(); }
      else if (e.key === 'ArrowLeft') { EL.prev(); }
    });

    /* восстановление */
    var resumeStep = 1;
    if (load()) resumeStep = store.step || store.currentStep || 1;
    showStep(resumeStep, { fromInit: true });
    if (cfg.onStep) { try { cfg.onStep(resumeStep, store); } catch (e) { console.error(e); } }

    if (!('speechSynthesis' in window)) {
      var w = $('#voiceNote');
      if (w) { w.classList.add('show'); w.textContent = ' В этом браузере нет озвучки. Открой урок в Chrome, Edge или Яндекс.Браузере — там испанские голоса работают.'; }
    }

    setInterval(function () { save(true); }, 30000);
  };

  EL.stepCount = function () { return steps.length; };
  EL.step = function () { return currentStep; };
  EL.steps = function () { return steps.length; };
})();