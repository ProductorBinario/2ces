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

  async function fetchTRX(){
    if(pendingFetch) return pendingFetch;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller ? setTimeout(()=>controller.abort(), 4500) : null;
    pendingFetch = (async () => {
      try{
        const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd', {cache:'no-store', signal:controller?.signal});
        if(!r.ok) throw new Error('http');
        const j = await r.json();
        const usd = j?.tron?.usd;
        if(applyTRXPrice(usd)){
          try{ localStorage.setItem(CACHE_KEY, JSON.stringify({trxUSD:MarketState.trxUSD, ts:MarketState.ts})); }catch(_){}
        }
      }catch(_){ /* fallback values stay */ }
      finally{
        if(timeout) clearTimeout(timeout);
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
