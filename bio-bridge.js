/* ============================================================
   BIO-BRIDGE v1.0 — Sincronização entre apps MAX.CORE
   Mesmo arquivo carregado em TODOS os apps do ecossistema.
   Funciona por compartilhar localStorage no mesmo domínio
   (tatuvoardor-pixel.github.io).
   ============================================================ */

window.BioBridge = (function() {

    const PREFIXO = 'bio_bridge_';
    const PING_KEY = 'bio_bridge_ping';
    const TTL_MS = 24 * 60 * 60 * 1000; // dados válidos por 24h

    // --------- ESCRITA (satélites: PULSE, SLEEP, WORK, JEJUM, FUEL) ---------
    function push(app, data) {
        try {
            const payload = Object.assign({}, data, { ts: Date.now() });
            localStorage.setItem(PREFIXO + app, JSON.stringify(payload));
            // Dispara evento storage em outras abas/apps abertos
            localStorage.setItem(PING_KEY, String(Date.now()) + ':' + app);
            return true;
        } catch (e) {
            console.warn('[BioBridge] push falhou:', e);
            return false;
        }
    }

    // --------- LEITURA (hub: BioMetrics) ---------
    function pull(app) {
        try {
            const raw = localStorage.getItem(PREFIXO + app);
            if (!raw) return null;
            const data = JSON.parse(raw);
            // Descarta dados muito antigos
            if (data.ts && (Date.now() - data.ts) > TTL_MS) return null;
            return data;
        } catch (e) {
            return null;
        }
    }

    function pullAll() {
        return {
            pulse: pull('pulse'),
            sleep: pull('sleep'),
            work:  pull('work'),
            jejum: pull('jejum'),
            fuel:  pull('fuel')
        };
    }

    // --------- LISTENER EM TEMPO REAL ---------
    // Aciona callback quando:
    //  - outro app grava dados (evento 'storage' do navegador)
    //  - o usuário volta pro app (visibilitychange)
    function listen(callback) {
        window.addEventListener('storage', function(e) {
            if (e.key && e.key.indexOf(PREFIXO) === 0) {
                callback(pullAll(), e.key.replace(PREFIXO, ''));
            } else if (e.key === PING_KEY) {
                callback(pullAll(), 'ping');
            }
        });
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) callback(pullAll(), 'visibility');
        });
    }

    // --------- LIMPAR (debug / reset) ---------
    function clearApp(app) {
        localStorage.removeItem(PREFIXO + app);
    }

    function clearAll() {
        ['pulse','sleep','work','jejum','fuel'].forEach(clearApp);
        localStorage.removeItem(PING_KEY);
    }

    // --------- TIMESTAMP HUMANO ---------
    function tempoDesde(ts) {
        if (!ts) return 'nunca';
        const diff = Date.now() - ts;
        const min = Math.floor(diff / 60000);
        if (min < 1) return 'agora';
        if (min < 60) return min + ' min';
        const h = Math.floor(min / 60);
        if (h < 24) return h + 'h';
        return Math.floor(h / 24) + 'd';
    }

    return { push, pull, pullAll, listen, clearApp, clearAll, tempoDesde };

})();
