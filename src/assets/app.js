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
    if(channel === 'email') window.location.href = url;
    else window.open(url, '_blank', 'noopener,noreferrer');
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
  });
})();
