(() => {
  const { MKT_MAX_TRX, MKT_MID_TRX, CACHE_KEY } = window.TWOCES_CONFIG;
  const MarketState = { trxUSD:null, mktMax:null, mktRate:null, ts:0 };
  const validNumber = n => Number.isFinite(n) && n > 0;
  const marketValues = () => {
    const trx = Number(MarketState.trxUSD);
    if(!validNumber(trx)) return { ready:false, max:NaN, mid:NaN };
    return { ready:true, max:MKT_MAX_TRX * trx, mid:MKT_MID_TRX * trx };
  };

  async function fetchTRX(){
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller ? setTimeout(()=>controller.abort(), 4500) : null;
    try{
      const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd', {cache:'no-store', signal:controller?.signal});
      if(!r.ok) throw new Error('http');
      const j = await r.json();
      const usd = j?.tron?.usd;
      if(typeof usd === 'number' && usd > 0){
        MarketState.trxUSD = usd;
        MarketState.mktMax = MKT_MAX_TRX * usd;
        MarketState.mktRate = MKT_MID_TRX * usd;
        MarketState.ts = Date.now();
        try{ localStorage.setItem(CACHE_KEY, JSON.stringify({trxUSD:usd, ts:MarketState.ts})); }catch(_){}
      }
    }catch(_){ /* fallback values stay */ }
    finally{ if(timeout) clearTimeout(timeout); }
    return MarketState;
  }

  function loadCachedMarket(){
    try{
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if(cached && validNumber(cached.trxUSD) && Date.now() - cached.ts < 300000){
        MarketState.trxUSD = cached.trxUSD;
        MarketState.mktMax = MKT_MAX_TRX * cached.trxUSD;
        MarketState.mktRate = MKT_MID_TRX * cached.trxUSD;
        MarketState.ts = cached.ts;
      }
    }catch(_){}
  }


  window.TWOCES_PRICE_SERVICE = { MarketState, marketValues, fetchTRX, loadCachedMarket };
})();
