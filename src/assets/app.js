(() => {
  const CFG = window.TWOCES_CONFIG;
  let { CES_FEE, CONTACT, I18N } = CFG;
  const { MarketState, marketValues, fetchTRX, loadCachedMarket, applyTRXPrice } = window.TWOCES_PRICE_SERVICE;
  let LANG = 'es';

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const fmtN = (n, d=2) => Number.isFinite(n) ? n.toLocaleString(LANG==='es'?'es-ES':'en-US',{minimumFractionDigits:d,maximumFractionDigits:d}) : '—';
  const fmtInt = n => Number.isFinite(n) ? n.toLocaleString(LANG==='es'?'es-ES':'en-US',{maximumFractionDigits:0}) : '—';
  const enc = encodeURIComponent;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  function toast(msg){
    const t = $('#toast'); if(!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(()=>t.classList.remove('show'), 2600);
  }

  function renderMarket(){
    const { ready, max:marketMax, mid:marketMid } = marketValues();
    $$('[data-bind="ces-fee"]').forEach(n => n.textContent = fmtN(CES_FEE,2));
    $$('[data-bind="trx-usd"]').forEach(n => n.textContent = ready ? fmtN(MarketState.trxUSD,4) : '—');
    $$('[data-bind="mkt-max"]').forEach(n => n.textContent = ready ? fmtN(marketMax,2) : '—');
    $$('[data-bind="mkt-rate"]').forEach(n => n.textContent = ready ? fmtN(marketMid,2) : '—');
    const savePct = ready ? ((marketMax - CES_FEE) / marketMax) * 100 : NaN;
    $$('[data-bind="save-vs-max"]').forEach(n => n.textContent = fmtN(savePct,1)+'%');
    const max = $('#bar-max'), mid = $('#bar-mid'), ces = $('#bar-ces');
    if(max) max.style.width = ready ? '100%' : '0%';
    if(mid) mid.style.width = ready && marketMax > 0 ? clamp((marketMid / marketMax) * 100, 8, 100) + '%' : '0%';
    if(ces) ces.style.width = ready && marketMax > 0 ? clamp((CES_FEE / marketMax) * 100, 8, 100) + '%' : '0%';
    updateCalc();
  }

  function getTx(){
    const el = $('#tx'); if(!el) return 0;
    const digits = (el.value || '').replace(/\D+/g,'').slice(0, 12); // cap 12 digits
    return digits ? parseInt(digits, 10) : 0;
  }
  function formatTxInput(){
    const el = $('#tx'); if(!el) return;
    const tx = getTx();
    const start = el.selectionStart;
    const before = el.value;
    const formatted = tx ? fmtInt(tx) : '';
    if(formatted !== before){
      el.value = formatted;
      // best-effort caret restore at end-relative position
      try{ el.setSelectionRange(formatted.length, formatted.length); }catch(_){}
    }
  }
  function updateCalc(){
    const tx = getTx();
    const { ready, max:marketMax } = marketValues();
    const max = ready ? tx * marketMax : NaN;
    const ces = tx * CES_FEE;
    const loss = ready ? max - ces : NaN;
    const oMax = $('#o-max'), oCes = $('#o-ces'), oLoss = $('#o-loss');
    if(oMax)  oMax.textContent  = fmtInt(max);
    if(oCes)  oCes.textContent  = fmtInt(ces);
    if(oLoss) oLoss.textContent = fmtInt(loss);
  }

  function marketSelfTest(){
    const previous = {...MarketState};
    applyTRXPrice(0.1234);
    renderMarket();
    const first = $('[data-bind="mkt-max"]')?.textContent;
    const firstMid = $('[data-bind="mkt-rate"]')?.textContent;
    const firstSave = $('[data-bind="save-vs-max"]')?.textContent;
    applyTRXPrice(0.2345);
    renderMarket();
    const second = $('[data-bind="mkt-max"]')?.textContent;
    const secondMid = $('[data-bind="mkt-rate"]')?.textContent;
    const secondSave = $('[data-bind="save-vs-max"]')?.textContent;
    Object.assign(MarketState, previous);
    renderMarket();
    return Boolean(first && second && first !== second && firstMid !== secondMid && firstSave !== secondSave);
  }

  function openChannel(channel, message){
    const m = (message||'').trim();
    let url = '';
    if(channel === 'wa'){
      const num = CONTACT.wa.replace(/[^\d]/g,'');
      url = `https://wa.me/${num}` + (m ? `?text=${enc(m)}` : '');
    } else if(channel === 'tg'){
      const handle = CONTACT.tg.replace(/^@/,'');
      url = `https://t.me/${handle}` + (m ? `?text=${enc(m)}` : '');
    } else if(channel === 'email'){
      const dict = I18N[LANG].msg;
      const subject = dict.emailSub;
      const body = m || dict.emailBody;
      url = `mailto:${CONTACT.email}?subject=${enc(subject)}&body=${enc(body)}`;
    }
    if(!url) return;
    if(channel === 'email'){
      // mailto must escape the iframe to trigger the OS mail client
      const a = document.createElement('a');
      a.href = url;
      a.target = '_top';
      a.rel = 'noopener';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 0);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  function ctaHandler(e){
    const btn = e.target.closest('[data-cta]'); if(!btn) return;
    e.preventDefault();
    const dict = I18N[LANG].msg;
    const kind = btn.dataset.cta;
    if(kind === 'hero1') return openChannel('wa', dict.hero1);
    if(kind === 'hero2' || kind === 'calc'){
      const tx = getTx() || 10000;
      return openChannel('wa', dict.hero2(fmtInt(tx)));
    }
    if(kind === 'wa') return openChannel('wa', dict.wa);
    if(kind === 'tg') return openChannel('tg', dict.tg);
    if(kind === 'email') return openChannel('email', '');
    if(kind === 'form-wa'){
      const t = ($('#msg')?.value || '').trim();
      if(!t){ toast(I18N[LANG].toastEmpty); $('#msg')?.focus(); return; }
      openChannel('wa', t);
      toast(I18N[LANG].toastSent);
    }
  }

  function applyLang(lang){
    LANG = (lang === 'en') ? 'en' : 'es';
    document.documentElement.lang = LANG;
    const d = I18N[LANG];
    $$('[data-i18n]').forEach(n => { const k = n.getAttribute('data-i18n'); if(d[k] != null) n.textContent = d[k]; });
    $$('[data-i18n-html]').forEach(n => { const k = n.getAttribute('data-i18n-html'); if(d[k] != null) n.innerHTML = d[k]; });
    $$('[data-i18n-attr]').forEach(n => { const [attr, key] = n.getAttribute('data-i18n-attr').split('|'); if(d[key] != null) n.setAttribute(attr, d[key]); });
    const list = $('#faq-list');
    if(list) list.innerHTML = d.faq.map(([q,a])=>`<details class="qa"><summary>${q}</summary><div class="a">${a}</div></details>`).join('');
    const lt = $('#lang-toggle'); if(lt) lt.textContent = (LANG==='es') ? 'EN' : 'ES';
    const f = $('#wa-float'); if(f) f.setAttribute('aria-label', LANG==='es'?'Abrir WhatsApp 2CES':'Open WhatsApp 2CES');
    renderMarket();
    try{ localStorage.setItem('lang', LANG); }catch(_){}
  }

  function applyTheme(theme){
    const t = (theme === 'light') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    const tt = $('#theme-toggle'); if(tt) tt.textContent = (t==='dark') ? '🌙' : '☀️';
    try{ localStorage.setItem('theme', t); }catch(_){}
  }

  document.addEventListener('DOMContentLoaded', () => {
    let savedLang = null; try{ savedLang = localStorage.getItem('lang'); }catch(_){}
    const navLang = (navigator.language||'es').slice(0,2).toLowerCase();
    applyLang(savedLang || (['es','en'].includes(navLang) ? navLang : 'es'));

    let savedTheme = null; try{ savedTheme = localStorage.getItem('theme'); }catch(_){}
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
    try{
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if(!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
      });
    }catch(_){}

    $('#lang-toggle')?.addEventListener('click', () => applyLang(LANG==='es' ? 'en' : 'es'));
    $('#theme-toggle')?.addEventListener('click', () => applyTheme(document.documentElement.getAttribute('data-theme')==='dark' ? 'light' : 'dark'));

    document.addEventListener('click', ctaHandler);

    $('#tx')?.addEventListener('input', () => { formatTxInput(); updateCalc(); });
    $('#tx')?.addEventListener('blur', () => { formatTxInput(); updateCalc(); });

    const msg = $('#msg'), counter = $('#msg-counter');
    msg?.addEventListener('input', () => { counter.textContent = `${msg.value.length} / 1000`; });

    $('#wa-float')?.addEventListener('click', (e) => { e.preventDefault(); openChannel('wa', I18N[LANG].msg.wa); });
    const footer = $('footer'), waFloat = $('#wa-float');
    function keepFloatAboveFooter(){
      if(!footer || !waFloat) return;
      const overlap = Math.max(0, window.innerHeight - footer.getBoundingClientRect().top);
      waFloat.style.setProperty('--footer-clearance', `${overlap}px`);
      waFloat.classList.toggle('is-near-footer', overlap > 0);
    }
    keepFloatAboveFooter();
    window.addEventListener('scroll', keepFloatAboveFooter, {passive:true});
    window.addEventListener('resize', keepFloatAboveFooter);

    loadCachedMarket();
    renderMarket();
    fetchTRX().then(renderMarket);
    setInterval(() => fetchTRX().then(renderMarket), 60_000);
    marketSelfTest();

    // Inside an iframe with srcDoc, location.origin is "null" — resolve to parent.
    function apiOrigin(){
      try{
        if(window.location.origin && window.location.origin !== 'null') return window.location.origin;
        if(window.parent && window.parent.location && window.parent.location.origin) return window.parent.location.origin;
      }catch(_){}
      return '';
    }
    window.__API_ORIGIN__ = apiOrigin();
    const apiUrl = p => (window.__API_ORIGIN__ || '') + p;

    // --- Live settings from server (CES_FEE, contacts) ---
    fetch(apiUrl('/api/public/settings'), {cache:'no-store'})
      .then(r => r.ok ? r.json() : null)
      .then(s => {
        if(!s) return;
        if(Number.isFinite(s.ces_fee) && s.ces_fee > 0){
          CES_FEE = s.ces_fee; CFG.CES_FEE = s.ces_fee;
        }
        if(typeof s.whatsapp === 'string' && s.whatsapp) CONTACT.wa = s.whatsapp;
        if(typeof s.telegram === 'string' && s.telegram) CONTACT.tg = s.telegram;
        if(typeof s.email === 'string' && s.email) CONTACT.email = s.email;
        renderMarket();
      })
      .catch(()=>{});

    // --- Hidden admin panel ---
    initAdminPanel();
  });

  // ===== Admin panel =====
  function beep(kind){
    try{
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if(!Ctx) return;
      const ctx = beep._ctx || (beep._ctx = new Ctx());
      const now = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      if(kind === 'ok'){
        o.type='sine'; o.frequency.setValueAtTime(880, now); o.frequency.linearRampToValueAtTime(1320, now+.18);
        g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(.18, now+.02); g.gain.exponentialRampToValueAtTime(.0001, now+.32);
        o.start(now); o.stop(now+.34);
      } else {
        // failure: two short low tones
        o.type='square'; o.frequency.setValueAtTime(220, now); o.frequency.setValueAtTime(160, now+.12);
        g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(.22, now+.02); g.gain.exponentialRampToValueAtTime(.0001, now+.30);
        o.start(now); o.stop(now+.32);
      }
    }catch(_){}
  }

  async function api(path, body){
    const origin = (typeof window !== 'undefined' && window.__API_ORIGIN__) || '';
    const r = await fetch(origin + path, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body||{})});
    try { return await r.json(); } catch { return {ok:false}; }
  }

  // ===== Validators (per-field) =====
  // WhatsApp: formato E.164 — opcional '+', 6 a 20 dígitos.
  const V_WA = /^\+?[0-9]{6,20}$/;
  // Telegram: 5–32 caracteres, letras, dígitos y _ (ITU spec).
  const V_TG = /^[a-zA-Z0-9_]{5,32}$/;
  // Email: validación pragmática.
  const V_EM = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function tt(){ return I18N[LANG]; }
  function validateField(kind, raw){
    const T = tt();
    const v = (raw||'').trim();
    if(kind === 'wa'){
      const cleaned = v.replace(/[\s\-()]/g,'');
      if(!cleaned) return {ok:false, error:T.admErrReq};
      if(!V_WA.test(cleaned)) return {ok:false, error:T.admErrWa};
      return {ok:true, value:cleaned};
    }
    if(kind === 'tg'){
      const cleaned = v.replace(/^@/,'');
      if(!cleaned) return {ok:false, error:T.admErrReq};
      if(!V_TG.test(cleaned)) return {ok:false, error:T.admErrTg};
      return {ok:true, value:cleaned};
    }
    if(kind === 'em'){
      if(!v) return {ok:false, error:T.admErrReq};
      if(v.length>200 || !V_EM.test(v)) return {ok:false, error:T.admErrEm};
      return {ok:true, value:v};
    }
    if(kind === 'fee'){
      if(v === '') return {ok:false, error:T.admErrReq};
      const n = Number(v);
      if(!Number.isFinite(n)) return {ok:false, error:T.admErrFeeNum};
      if(n <= 0) return {ok:false, error:T.admErrFeeMin};
      if(n > 1000) return {ok:false, error:T.admErrFeeMax};
      return {ok:true, value: Math.round(n*10000)/10000};
    }
    return {ok:false, error:''};
  }

  function bindLiveValidation(inputEl, errEl, kind){
    const apply = () => {
      const r = validateField(kind, inputEl.value);
      if(r.ok){ inputEl.classList.remove('invalid'); errEl.textContent=''; }
      else { inputEl.classList.add('invalid'); errEl.textContent = r.error; }
      return r;
    };
    inputEl.addEventListener('input', apply);
    inputEl.addEventListener('blur', apply);
    return apply;
  }

  function initAdminPanel(){
    const trigger = document.getElementById('adm-trigger');
    const overlay = document.getElementById('adm-overlay');
    if(!trigger || !overlay) return;
    const closeBtn = document.getElementById('adm-close');
    const stage1 = document.getElementById('adm-stage-1');
    const stage2 = document.getElementById('adm-stage-2');
    const stage3 = document.getElementById('adm-stage-3');
    const keyInput = document.getElementById('adm-key');
    const msg = document.getElementById('adm-msg');
    const msg2 = document.getElementById('adm-msg2');
    const msg3 = document.getElementById('adm-msg3');
    const submit = document.getElementById('adm-submit');
    const saveBtn = document.getElementById('adm-save');
    const title = document.getElementById('adm-title');
    const roleLabel = document.getElementById('adm-role-label');
    const rotateOpenBtn = document.getElementById('adm-rotate-open');
    const rotateSaveBtn = document.getElementById('adm-rotate-save');
    const rotateBackBtn = document.getElementById('adm-rotate-back');

    const fWa  = document.getElementById('adm-wa');
    const fTg  = document.getElementById('adm-tg');
    const fEm  = document.getElementById('adm-em');
    const fFee = document.getElementById('adm-fee');
    const eWa  = document.getElementById('adm-err-wa');
    const eTg  = document.getElementById('adm-err-tg');
    const eEm  = document.getElementById('adm-err-em');
    const eFee = document.getElementById('adm-err-fee');

    const validators = {
      wa:  bindLiveValidation(fWa,  eWa,  'wa'),
      tg:  bindLiveValidation(fTg,  eTg,  'tg'),
      em:  bindLiveValidation(fEm,  eEm,  'em'),
      fee: bindLiveValidation(fFee, eFee, 'fee'),
    };

    let role = null;          // 'master' | 'admin'
    let phrases = [];         // master: [phrase]; admin: [p1,p2,p3]
    let adminStep = 0;

    function reset(){
      role = null; phrases = []; adminStep = 0;
      stage1.hidden = false; stage2.hidden = true; stage3.hidden = true;
      keyInput.value=''; msg.textContent=''; msg.className='adm-msg';
      title.textContent = tt().admTitleAccess;
      submit.textContent = tt().admValidate;
      [fWa,fTg,fEm,fFee].forEach(el => el.classList.remove('invalid'));
      [eWa,eTg,eEm,eFee].forEach(el => el.textContent='');
      rotateOpenBtn.hidden = true;
    }
    function open(){ reset(); overlay.hidden=false; setTimeout(()=>keyInput.focus(),20); }
    function close(){ overlay.hidden=true; reset(); }

    trigger.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if(e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if(e.key === 'Escape' && !overlay.hidden) close(); });

    async function tryPhrase(){
      const phrase = (keyInput.value||'').trim();
      if(!phrase){ return; }
      submit.disabled = true;
      msg.textContent = tt().admValidating; msg.className='adm-msg';

      if(role === null){
        const mr = await api('/api/public/admin-verify', {phrase, role:'master'});
        if(mr.ok){
          role='master'; phrases=[phrase];
          beep('ok');
          await enterStage2('Master');
          submit.disabled=false; return;
        }
        const ar = await api('/api/public/admin-verify', {phrase, role:'admin', step:0});
        if(ar.ok){
          role='admin'; phrases=[phrase]; adminStep=1;
          beep('ok');
          msg.textContent = tt().admStepOk(1); msg.className='adm-msg ok';
          keyInput.value=''; keyInput.focus();
          submit.disabled=false; return;
        }
        beep('fail');
        msg.textContent = tt().admDenied; msg.className='adm-msg err';
        keyInput.value=''; submit.disabled=false; return;
      }

      if(role === 'admin'){
        const r = await api('/api/public/admin-verify', {phrase, role:'admin', step:adminStep});
        if(!r.ok){
          beep('fail');
          msg.textContent = tt().admWrongPhrase; msg.className='adm-msg err';
          setTimeout(reset, 900);
          submit.disabled=false; return;
        }
        phrases.push(phrase);
        adminStep++;
        if(adminStep < 3){
          beep('ok');
          msg.textContent = tt().admStepOk(adminStep+1); msg.className='adm-msg ok';
          keyInput.value=''; keyInput.focus();
          submit.disabled=false; return;
        }
        beep('ok');
        await enterStage2('Admin');
        submit.disabled=false;
      }
    }

    submit.addEventListener('click', tryPhrase);
    keyInput.addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); tryPhrase(); }});

    async function enterStage2(roleName){
      stage1.hidden = true; stage2.hidden = false; stage3.hidden = true;
      title.textContent = `${tt().admPanel} · ${roleName}`;
      roleLabel.textContent = tt().admEditHint;
      rotateOpenBtn.hidden = (role !== 'master');
      try{
        const r = await fetch((window.__API_ORIGIN__||'')+'/api/public/settings', {cache:'no-store'});
        const s = await r.json();
        const A = tt().admActual;
        document.getElementById('adm-cur-wa').textContent  = A(s.whatsapp);
        document.getElementById('adm-cur-tg').textContent  = A(s.telegram);
        document.getElementById('adm-cur-em').textContent  = A(s.email);
        document.getElementById('adm-cur-fee').textContent = A(s.ces_fee);
        fWa.value = s.whatsapp; fTg.value = s.telegram; fEm.value = s.email; fFee.value = s.ces_fee;
        Object.values(validators).forEach(fn => fn());
      }catch(_){}
      msg2.textContent=''; msg2.className='adm-msg';
    }

    saveBtn.addEventListener('click', async () => {
      const rWa = validators.wa(), rTg = validators.tg(), rEm = validators.em(), rFee = validators.fee();
      if(!rWa.ok || !rTg.ok || !rEm.ok || !rFee.ok){
        beep('fail');
        msg2.textContent = tt().admReviewFields; msg2.className='adm-msg err';
        return;
      }
      saveBtn.disabled = true;
      msg2.textContent = tt().admSaving; msg2.className='adm-msg';
      const settings = { whatsapp: rWa.value, telegram: rTg.value, email: rEm.value, ces_fee: rFee.value };
      const r = await api('/api/public/admin-update', {role, phrases, settings});
      if(r.ok){
        beep('ok');
        msg2.textContent = tt().admSaved; msg2.className='adm-msg ok';
        try{
          const sr = await fetch((window.__API_ORIGIN__||'')+'/api/public/settings', {cache:'no-store'});
          const s = await sr.json();
          if(Number.isFinite(s.ces_fee) && s.ces_fee>0){ CES_FEE = s.ces_fee; CFG.CES_FEE = s.ces_fee; }
          CONTACT.wa = s.whatsapp; CONTACT.tg = s.telegram; CONTACT.email = s.email;
          renderMarket();
        }catch(_){}
        setTimeout(close, 900);
      } else {
        beep('fail');
        msg2.textContent = tt().admSaveFail(r.error||'error'); msg2.className='adm-msg err';
      }
      saveBtn.disabled = false;
    });

    // ===== Rotación de claves del Admin (solo Master) =====
    const rkInputs = ['adm-rk1','adm-rk2','adm-rk3'].map(id => document.getElementById(id));
    const rkErr   = document.getElementById('adm-err-rk');
    const rkShow  = document.getElementById('adm-rk-show');
    const rkConfirm = document.getElementById('adm-rk-confirm');
    const rkAck   = document.getElementById('adm-rk-ack');
    const rkStatus = document.getElementById('adm-rotated-status');
    const rkHistory = document.getElementById('adm-history-list');

    function validateRotation(){
      const T = tt();
      const vals = rkInputs.map(el => (el.value||'').trim());
      const lens = vals.map(v => v.length);
      let err = '';
      if(lens.some(l => l < 3 || l > 64)) err = T.admErrLen;
      else if(new Set(vals).size !== 3) err = T.admErrDiff;
      rkErr.textContent = err;
      const valid = !err;
      rkConfirm.hidden = !valid;
      const ackVal = (rkAck.value||'').trim().toLowerCase();
      const ackOk = valid && (ackVal === 'entendido' || ackVal === 'understood');
      rotateSaveBtn.disabled = !ackOk;
      return valid;
    }

    rkInputs.forEach(el => el.addEventListener('input', validateRotation));
    rkAck?.addEventListener('input', validateRotation);
    rkShow?.addEventListener('change', () => {
      const t = rkShow.checked ? 'text' : 'password';
      rkInputs.forEach(el => el.type = t);
    });

    async function loadAdminInfo(){
      const T = tt();
      rkStatus.textContent = T.admLoadingState;
      rkHistory.innerHTML = '';
      const r = await api('/api/public/admin-info', { masterPhrase: phrases[0] });
      if(!r.ok){ rkStatus.textContent = T.admStateFail; return; }
      rkStatus.innerHTML = r.rotated.map((ok,i) =>
        `<span class="adm-pill ${ok?'ok':'warn'}">${T.admKey} ${i+1}: ${ok?T.admRotatedYes:T.admRotatedNo}</span>`
      ).join('');
      rkHistory.innerHTML = (r.history||[]).map(h => {
        const d = new Date(h.created_at).toLocaleString(LANG==='es'?'es-ES':'en-US');
        return `<li><b>${h.role}</b> · ${h.action} · ${d} · <code>${h.ip||'—'}</code></li>`;
      }).join('') || `<li class="adm-empty">${T.admHistEmpty}</li>`;
    }

    rotateOpenBtn.addEventListener('click', () => {
      if(role !== 'master') return;
      stage2.hidden = true; stage3.hidden = false;
      title.textContent = tt().admRotateOpen;
      rkInputs.forEach(el => { el.value=''; el.type='password'; });
      if(rkShow) rkShow.checked = false;
      if(rkAck) rkAck.value = '';
      rkErr.textContent = '';
      rkConfirm.hidden = true;
      rotateSaveBtn.disabled = true;
      msg3.textContent=''; msg3.className='adm-msg';
      setTimeout(() => rkInputs[0]?.focus(), 20);
      loadAdminInfo();
    });
    rotateBackBtn.addEventListener('click', () => {
      stage3.hidden = true; stage2.hidden = false;
      title.textContent = `${tt().admPanel} · Master`;
      msg3.textContent=''; msg3.className='adm-msg';
    });
    rotateSaveBtn.addEventListener('click', async () => {
      if(role !== 'master') return;
      if(!validateRotation()) return;
      const ackVal = (rkAck.value||'').trim().toLowerCase();
      if(ackVal !== 'entendido' && ackVal !== 'understood') return;
      const [p1,p2,p3] = rkInputs.map(el => el.value.trim());
      rotateSaveBtn.disabled = true;
      msg3.textContent = tt().admSaving; msg3.className='adm-msg';
      const r = await api('/api/public/admin-rotate-keys', { masterPhrase: phrases[0], phrases:[p1,p2,p3] });
      if(r.ok){
        beep('ok');
        msg3.textContent = tt().admRotated; msg3.className='adm-msg ok';
        setTimeout(close, 1100);
      } else {
        beep('fail');
        const wait = r.retryAfter ? tt().admWait(r.retryAfter) : '';
        msg3.textContent = tt().admSaveFail(r.error||'error') + wait;
        msg3.className='adm-msg err';
        rotateSaveBtn.disabled = false;
      }
    });
  }
})();
