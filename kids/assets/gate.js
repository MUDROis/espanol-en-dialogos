/**
 * Гейт доступа для детского курса «Испанский в диалогах» (A0–A1).
 * Уроки открываются только авторизованным пользователям с типом доступа
 * "kids" (или администраторам). Проверка — через Firestore (users).
 */
(function () {
  'use strict';

  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyDCwM5m0z5WJM-IK_euwNGJfoERg9dNZlo",
    authDomain: "spanishindialogues.firebaseapp.com",
    projectId: "spanishindialogues",
    storageBucket: "spanishindialogues.firebasestorage.app",
    messagingSenderId: "341192539732",
    appId: "1:341192539732:web:7476c77ffcdba1010ef7c1",
    measurementId: "G-K3PFBRPWWN"
  };

  var overlay = null;
  var auth = null;
  var db = null;

  function el(tag, props, html) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        if (k === 'style') node.style.cssText = props[k];
        else node.setAttribute(k, props[k]);
      });
    }
    if (html) node.innerHTML = html;
    return node;
  }

  function buildOverlay() {
    var style = document.createElement('style');
    style.textContent =
      '#kids-gate{position:fixed;inset:0;z-index:99999;background:#fff8f0;display:flex;' +
      'align-items:center;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#3a2e24;' +
      'overflow:auto;padding:20px}' +
      '#kids-gate.kids-hidden{display:none}' +
      '#kids-gate-card{background:#fff;border:1px solid #f0e0cc;border-radius:16px;max-width:380px;width:100%;' +
      'padding:28px;box-shadow:0 10px 30px rgba(120,80,30,.12);text-align:center}' +
      '#kids-gate h1{font-size:20px;margin:0 0 6px}' +
      '#kids-gate p{font-size:14px;color:#7a6a55;margin:0 0 16px;line-height:1.45}' +
      '#kids-gate input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #e5d5bd;' +
      'border-radius:8px;font-size:15px;margin:6px 0;outline:none}' +
      '#kids-gate input:focus{border-color:#e08b3a}' +
      '#kids-gate button{width:100%;padding:12px;border:none;border-radius:8px;background:#e08b3a;color:#fff;' +
      'font-size:15px;font-weight:600;cursor:pointer;margin-top:10px}' +
      '#kids-gate button:disabled{opacity:.6;cursor:default}' +
      '#kids-gate-error{color:#c0392b;font-size:13px;margin-top:8px;display:none}' +
      '#kids-gate a{color:#e08b3a;font-weight:600;text-decoration:none}' +
      '#kids-gate .kids-gate-note{font-size:12px;color:#a3927d;margin-top:14px}';
    document.head.appendChild(style);

    overlay = el('div', { id: 'kids-gate' });
    overlay.appendChild(el('div', { id: 'kids-gate-card' }));
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  function showCard(html) {
    document.getElementById('kids-gate-card').innerHTML = html;
    overlay.classList.remove('kids-hidden');
  }

  function showLogin() {
    showCard(
      '<h1>🔐 Уроки для учеников</h1>' +
      '<p>Курс «Испанский в диалогах для детей» доступен после оплаты. Войдите в аккаунт ученика.</p>' +
      '<input type="email" id="kids-email" placeholder="Email" autocomplete="email">' +
      '<input type="password" id="kids-password" placeholder="Пароль" autocomplete="current-password">' +
      '<div id="kids-gate-error"></div>' +
      '<button id="kids-login-btn">Войти</button>' +
      '<p class="kids-gate-note">Нет доступа? <a href="../index.html#pricing" target="_blank" rel="noopener">Оформить</a></p>'
    );
    document.getElementById('kids-login-btn').addEventListener('click', login);
  }

  function showNoAccess() {
    showCard(
      '<h1>🚫 Доступ не найден</h1>' +
      '<p>Аккаунт не имеет доступа к детскому курсу. Оформите покупку или обратитесь к администратору.</p>' +
      '<a href="../index.html#pricing" class="kids-btn" style="display:block;padding:12px;background:#e08b3a;' +
      'color:#fff;border-radius:8px;font-weight:600">Оформить доступ</a>'
    );
  }

  function login() {
    var email = document.getElementById('kids-email').value.trim();
    var password = document.getElementById('kids-password').value;
    var errEl = document.getElementById('kids-gate-error');
    var btn = document.getElementById('kids-login-btn');
    errEl.style.display = 'none';

    if (!email || !password) {
      errEl.textContent = 'Введите email и пароль';
      errEl.style.display = 'block';
      return;
    }

    btn.disabled = true;
    auth.signInWithEmailAndPassword(email, password)
      .catch(function (e) {
        errEl.textContent = e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential'
          ? 'Неверный email или пароль' : (e.message || 'Ошибка входа');
        errEl.style.display = 'block';
        btn.disabled = false;
      });
  }

  function checkAccess(user) {
    if (!db) return Promise.resolve(false);
    return db.collection('users').doc(user.uid).get()
      .then(function (doc) {
        if (!doc.exists) return false;
        var data = doc.data();
        return data.role === 'admin' || data.accessType === 'kids';
      })
      .catch(function () { return false; });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Не удалось загрузить ' + src)); };
      document.head.appendChild(s);
    });
  }

  function boot() {
    loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js')
      .then(function () { return loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js'); })
      .then(function () { return loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'); })
      .then(function () {
        firebase.initializeApp(FIREBASE_CONFIG);
        auth = firebase.auth();
        db = firebase.firestore();
        auth.onAuthStateChanged(function (user) {
          if (!user) { showLogin(); return; }
          checkAccess(user).then(function (ok) {
            if (ok) {
              overlay.classList.add('kids-hidden');
              document.body.style.overflow = '';
            } else {
              showNoAccess();
            }
          });
        });
      })
      .catch(function (e) {
        showCard('<h1>⚠️ Ошибка загрузки</h1><p>' + e.message + '</p>');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { buildOverlay(); boot(); });
  } else {
    buildOverlay();
    boot();
  }
})();
