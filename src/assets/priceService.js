(() => {
  const { MKT_MAX_TRX, MKT_MID_TRX, CACHE_KEY } = window.TWOCES_CONFIG;
  const MarketState = { trxUSD:null, mktMax:null, mktRate:null, ts:0 };
  let pendingFetch = null;

  const validNumber = n => Number.isFinite(n) && n > 0;

  function applyTRXPrice(usd, ts = Date.now()){
    if(!validNumber(usd)) return false;
    MarketState.trxUSD = usd;
    MarketState.mktMax = MKT_MAX_TRX * usd;
    MarketState.mktRate = MKT_MID_TRX * usd;
    MarketState.ts = ts;
    return true;
  }

  const marketValues = () => {
    const trx = Number(MarketState.trxUSD);
    if(!validNumber(trx)) return { ready:false, max:NaN, mid:NaN };
    return { ready:true, trx, max:MKT_MAX_TRX * trx, mid:MKT_MID_TRX * trx };
  };

  // Fetch con timeout (AbortController). Devuelve null si falla.
  async function fetchJSON(url, timeoutMs){
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = ctl ? setTimeout(() => ctl.abort(), timeoutMs) : null;
    try{
      const r = await fetch(url, { cache:'no-store', signal: ctl?.signal });
      if(!r.ok) return null;
      return await r.json();
    } catch(_){
      return null;
    } finally {
      if(t) clearTimeout(t);
    }
  }

  // Binance primero (más rápido y estable). CoinGecko sólo si Binance falla.
  async function fetchTRX(){
    if(pendingFetch) return pendingFetch;
    pendingFetch = (async () => {
      try{
        const TIMEOUT = 2500;
        // 1) Binance
        const b = await fetchJSON('https://api.binance.com/api/v3/ticker/price?symbol=TRXUSDT', TIMEOUT);
        let usd = b ? Number(b.price) : NaN;
        // 2) Fallback: CoinGecko
        if(!validNumber(usd)){
          const g = await fetchJSON('https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd', TIMEOUT);
          usd = g?.tron?.usd;
        }
        if(applyTRXPrice(usd)){
          try{ localStorage.setItem(CACHE_KEY, JSON.stringify({ trxUSD: MarketState.trxUSD, ts: MarketState.ts })); }catch(_){}
        }
      } finally {
        pendingFetch = null;
      }
      return MarketState;
    })();
    return pendingFetch;
  }

  function loadCachedMarket(){
    try{
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if(cached && validNumber(cached.trxUSD) && Date.now() - cached.ts < 300000){
        applyTRXPrice(cached.trxUSD, cached.ts);
      }
    }catch(_){}
    return MarketState;
  }

  window.TWOCES_PRICE_SERVICE = { MarketState, marketValues, fetchTRX, loadCachedMarket, applyTRXPrice };
})();
