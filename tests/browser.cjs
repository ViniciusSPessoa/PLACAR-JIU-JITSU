const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtemp, readFile, writeFile, mkdir, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const { setTimeout: sleep } = require('node:timers/promises');

const root = resolve(__dirname, '..');
const entry = pathToFileURL(join(root, 'index.html')).href;
const executable = process.env.BJJ_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sizes = [[1280, 720], [1366, 768], [1920, 1080], [2560, 1440]];

async function until(check, description) {
    for (let attempt = 0; attempt < 80; attempt++) {
        const result = await check();
        if (result) return result;
        await sleep(75);
    }
    throw new Error('Tempo limite: ' + description);
}

async function run() {
    const profile = await mkdtemp(join(tmpdir(), 'bjj-test-'));
    const screenshots = join(root, 'docs', 'capturas', 'arena');
    await mkdir(screenshots, { recursive: true });
    const chrome = spawn(executable, ['--headless', '--window-size=1280,720', '--no-first-run', '--disable-background-networking',
        '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], {
        windowsHide: true, stdio: ['ignore', 'ignore', 'pipe']
    });
    let diagnostics = '';
    chrome.stderr.on('data', chunk => { diagnostics += chunk; });
    chrome.on('error', error => { diagnostics += error.message; });
    let socket;
    try {
        const port = await until(async () => {
            if (chrome.exitCode !== null) throw new Error('Chrome encerrou: ' + diagnostics);
            try {
                return (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
            } catch {
                return false;
            }
        }, 'porta DevTools');
        const [page] = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
        socket = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => {
            socket.addEventListener('open', resolve, { once: true });
            socket.addEventListener('error', reject, { once: true });
        });
        let sequence = 0;
        const pending = new Map();
        const errors = [];
        const requests = [];
        socket.addEventListener('message', ({ data }) => {
            const result = JSON.parse(data);
            if (result.id) {
                pending.get(result.id)(result);
                pending.delete(result.id);
            }
            if (result.method === 'Runtime.exceptionThrown') errors.push(result.params.exceptionDetails);
            if (result.method === 'Log.entryAdded' && result.params.entry.level === 'error') errors.push(result.params.entry);
            if (result.method === 'Runtime.consoleAPICalled' && result.params.type === 'error') errors.push(result.params);
            if (result.method === 'Network.requestWillBeSent') requests.push(result.params.request.url);
        });
        function send(method, params = {}) {
            const id = ++sequence;
            return new Promise((resolve, reject) => {
                pending.set(id, result => result.error ? reject(new Error(result.error.message)) : resolve(result.result));
                socket.send(JSON.stringify({ id, method, params }));
            });
        }
        async function js(expression) {
            const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
            if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || expression);
            return result.result.value;
        }
        async function load() {
            const navigated = await send('Page.navigate', { url: entry });
            assert.equal(navigated.errorText, undefined);
            await until(() => js('location.protocol === "file:" && document.readyState === "complete" && typeof BjjMatch !== "undefined"').catch(() => false), 'abertura por arquivo');
        }
        const text = selector => js('document.querySelector(' + JSON.stringify(selector) + ').textContent');
        const click = selector => js('document.querySelector(' + JSON.stringify(selector) + ').click()');
        // Pointer input grants browser user activation for audio and fullscreen.
        async function clickNative(selector) {
            const [x, y] = await js('(() => { const el = document.querySelector(' + JSON.stringify(selector) + '); el.scrollIntoView({block:"center"}); const r = el.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()');
            for (const type of ['mousePressed', 'mouseReleased']) {
                await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
            }
        }
        const press = (key, target = 'document.body', extra = '') => js(target + '.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: ' + JSON.stringify(key) + extra + ' }))');
        const setInput = (id, value) => js('(() => { const input = document.getElementById(' + JSON.stringify(id) + '); input.value = ' + JSON.stringify(value) + '; input.dispatchEvent(new Event("input", {bubbles:true})); })()');
        const storedKey = 'placar-bjj:match:v1';
        const expectStatus = status => until(async () => (await text('#clock-status')) === status, status);
        const keep = selector => click('#confirmation button[value="' + selector + '"]');
        const openSettings = () => click('#settings:not([open]) summary');
        const closeSettings = () => click('#settings[open] summary');
        const points = corner => text('.athlete-' + corner + ' [data-points]');

        for (const method of ['Page.enable', 'Runtime.enable', 'Log.enable', 'Network.enable']) await send(method);
        await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
        await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
        await load();
        assert.equal(await js('navigator.onLine'), false);
        assert.equal(await text('#clock-time'), '05:00');
        assert.equal(await js('document.querySelector(".brand img").naturalWidth > 0'), true);
        await until(() => js('document.querySelector("audio").readyState >= 2'), 'MP3 local carregado');

        await press('1', 'document.querySelector("#athlete-0")');
        await press('1', 'document.body', ', repeat:true');
        assert.equal(await points(0), '0');
        await press('1');
        await press('2');
        await press('8');
        assert.equal(await points(0), '5');
        assert.equal(await points(1), '3');
        await click('.athlete-0 [data-undo]');
        assert.equal(await points(0), '2');
        for (const corner of [0, 1]) for (const stat of ['advantages', 'penalties']) {
            const selector = '.athlete-' + corner + ' [data-adjust="' + stat + '"]';
            await click(selector + '[data-delta="1"]');
            assert.equal(await text('.athlete-' + corner + ' [data-count="' + stat + '"]'), '1');
            await click(selector + '[data-delta="-1"]');
            await click(selector + '[data-delta="-1"]');
            assert.equal(await text('.athlete-' + corner + ' [data-count="' + stat + '"]'), '0');
        }
        await openSettings();
        await click('#shortcuts');
        await press('9');
        assert.equal(await points(1), '3');
        await click('#shortcut-dialog button');
        await closeSettings();
        await click('#new-match');
        await keep('cancel');
        assert.equal(await points(0), '2');

        await openSettings();
        await setInput('minutes', '00');
        await setInput('seconds', '60');
        assert.equal(await js('document.getElementById("toggle-clock").disabled'), true);
        await setInput('seconds', '03');
        assert.equal(await text('#clock-time'), '00:03');
        await closeSettings();
        await press(' ');
        await expectStatus('Em andamento');
        assert.equal(await js('document.querySelector(".clock").classList.contains("is-urgent")'), true);
        await press(' ');
        await expectStatus('Pausado');
        await click('#toggle-clock');
        await expectStatus('Em andamento');
        await click('#reset-clock');
        await keep('confirm');
        await expectStatus('Pronto');
        assert.equal(await points(0), '2');

        await click('#toggle-clock');
        await load();
        await expectStatus('Luta recuperada · pausada');
        const recovered = await text('#clock-time');
        await sleep(1100);
        assert.equal(await text('#clock-time'), recovered);
        await click('#toggle-clock');
        await keep('cancel');
        await expectStatus('Luta recuperada · pausada');
        await load();
        await expectStatus('Luta recuperada · pausada');
        await js('window.playCount = 0; document.querySelector("audio").play = () => { window.playCount++; return Promise.reject(new Error("bloqueado")); };');
        await click('#toggle-clock');
        await keep('confirm');
        await expectStatus('Em andamento');
        await expectStatus('Encerrado');
        await until(async () => (await text('#notice')).includes('Falha ao tocar'), 'falha de áudio tratada');
        await press(' ');
        assert.equal(await js('window.playCount'), 1);
        assert.equal(await text('#clock-time'), '00:00');
        await click('#test-audio');
        assert.equal(await js('window.playCount'), 2);
        await click('#new-match');
        await keep('confirm');
        await expectStatus('Pronto');
        assert.equal(await points(0), '0');
        assert.equal(await points(1), '0');

        await js('localStorage.setItem(' + JSON.stringify(storedKey) + ', "{");');
        await load();
        assert.match(await text('#storage-status'), /inválidos/);
        await load();
        await setInput('volume', '42');
        assert.equal(await js('document.querySelector("audio").volume'), .42);
        await load();
        assert.equal(await text('#volume-value'), '42%');
        await setInput('volume', '75');
        await openSettings();
        await clickNative('#test-audio');
        await until(() => js('!document.querySelector("audio").paused'), 'reprodução do MP3').catch(async error => {
            throw new Error(error.message + ': ' + await text('#notice'));
        });
        await js('document.querySelector("audio").pause()');
        await closeSettings();

        const names = ['Maria Eduarda Valentina Ribeiro Albuquerque', 'João Pedro Alexandre dos Santos Montenegro'];
        await setInput('athlete-0', names[0]);
        await setInput('athlete-1', names[1]);
        await js(`(() => {
            const score = (corner, value) => document.querySelector('.athlete-' + corner + ' [data-score="' + value + '"]').click();
            for (let i = 0; i < 23; i++) score(0, 4);
            score(0, 3);
            score(0, 3);
            for (let i = 0; i < 31; i++) score(1, 4);
        })()`);
        assert.equal(await points(0), '98');
        assert.equal(await points(1), '124');
        await click('.athlete-0 [data-adjust="advantages"][data-delta="1"]');
        await click('.athlete-1 [data-adjust="penalties"][data-delta="1"]');
        await sleep(850);
        async function capture(name) {
            const { data } = await send('Page.captureScreenshot', { format: 'png' });
            await writeFile(join(screenshots, name + '.png'), Buffer.from(data, 'base64'));
        }
        for (const [width, height] of sizes) {
            await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
            const layout = await js(`(() => {
                const arena = document.querySelector('.arena').getBoundingClientRect();
                const panels = [...document.querySelectorAll('.arena > section')].map(el => el.getBoundingClientRect());
                const controls = [...document.querySelectorAll('.shell button, .shell input, .shell summary')]
                    .filter(el => !el.closest('.settings:not([open]) .clock-settings'))
                    .map(el => el.getBoundingClientRect());
                const names = [...document.querySelectorAll('.name-preview')];
                const scores = [...document.querySelectorAll('[data-points]')];
                return {
                    viewport: [innerWidth, innerHeight],
                    fits: document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight,
                    symmetric: Math.abs(panels[0].width - panels[2].width) < 1,
                    aligned: panels.every(p => p.top === panels[0].top && p.bottom === panels[0].bottom),
                    fills: arena.height / innerHeight > .72 && arena.width / innerWidth > .90,
                    visible: controls.every(r => r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight),
                    uniqueIds: new Set([...document.querySelectorAll('[id]')].map(el => el.id)).size === document.querySelectorAll('[id]').length,
                    names: names.map(el => el.textContent),
                    namesFit: names.every(el => el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().height <= parseFloat(getComputedStyle(el).lineHeight) * 2.1),
                    scoresFit: scores.every(el => {
                        const a = el.getBoundingClientRect();
                        const b = el.closest('.score').getBoundingClientRect();
                        return a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom;
                    }),
                    noOverlap: controls.every((a, i) => controls.slice(i + 1).every(b => a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom))
                };
            })()`);
            assert.deepEqual(layout, { viewport: [width, height], fits: true, symmetric: true, aligned: true,
                fills: true, visible: true, uniqueIds: true, names, namesFit: true, scoresFit: true, noOverlap: true });
            await capture(width + 'x' + height);
            console.log(width + '×' + height + ' — layout, controles e captura OK');
        }
        await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
        await openSettings();
        await until(() => js('document.getElementById("settings").open'), 'configurações abertas');
        await setInput('minutes', '00');
        await setInput('seconds', '12');
        await clickNative('#toggle-clock');
        await expectStatus('Em andamento');
        await sleep(200);
        assert.equal(await js('document.getElementById("duration-fields").disabled'), true);
        assert.equal(await js(`(() => {
            const settings = document.querySelector('.clock-settings').getBoundingClientRect();
            return [...document.querySelectorAll('[data-points]')].every(score => score.getBoundingClientRect().top >= settings.bottom);
        })()`), true, 'o painel aberto deve manter as duas pontuações visíveis');
        await capture('1366x768-configuracoes');
        await closeSettings();
        await until(() => js('!document.getElementById("settings").open'), 'configurações fechadas');
        await capture('1366x768-em-andamento');
        await click('#toggle-clock');
        await expectStatus('Pausado');
        await capture('1366x768-pausado');
        await click('#toggle-clock');
        const progress = () => js('Number(document.querySelector(".clock").style.getPropertyValue("--final-progress"))');
        const first = await until(async () => (await progress()) >= .45 && await progress(), 'realce progressivo do cronômetro');
        await sleep(420);
        assert.ok(await progress() > first);
        await capture('1366x768-segundos-finais');
        await expectStatus('Encerrado');
        await sleep(320);
        await capture('1366x768-encerrado');
        console.log('Nomes longos, placares de 2 e 3 dígitos, estados do cronômetro e painel retrátil OK.');
        await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
        await press('1');
        assert.equal(await js('getComputedStyle(document.querySelector(".score-flash.flash")).animationName'), 'none');
        assert.equal(await js('getComputedStyle(document.querySelector(".score-flash.flash")).opacity'), '1');
        await send('Emulation.setEmulatedMedia', { features: [] });
        await send('Emulation.clearDeviceMetricsOverride');
        await send('Page.bringToFront');
        await js(`(() => {
            const root = document.documentElement;
            const native = root.requestFullscreen.bind(root);
            root.requestFullscreen = async () => {
                try { await native(); }
                catch (error) { window.fullscreenFailure = error.message; throw error; }
            };
        })()`);
        await clickNative('#fullscreen');
        await until(() => js('Boolean(document.fullscreenElement || window.fullscreenFailure)'), 'resposta nativa de tela cheia');
        const fullscreenFailure = await js('window.fullscreenFailure || ""');
        if (fullscreenFailure) {
            assert.match(await text('#notice'), /Tela cheia indisponível/);
            await js(`(() => {
                let element = null;
                Object.defineProperty(document, 'fullscreenElement', { get: () => element });
                document.documentElement.requestFullscreen = async () => {
                    element = document.documentElement;
                    document.dispatchEvent(new Event('fullscreenchange'));
                };
                document.exitFullscreen = async () => {
                    element = null;
                    document.dispatchEvent(new Event('fullscreenchange'));
                };
            })()`);
            await press('f');
        }
        await until(async () => (await text('#fullscreen')) === 'Sair da tela cheia', 'entrada em tela cheia');
        await click('#fullscreen');
        await until(async () => (await text('#fullscreen')) === 'Tela cheia', 'saída de tela cheia');
        console.log(fullscreenFailure ? 'Tela cheia: fluxo simulado e recusa nativa tratada (' + fullscreenFailure + ').' : 'Tela cheia nativa OK.');
        assert.deepEqual(errors, []);
        assert.ok(requests.length > 0 && requests.every(url => url.startsWith('file:')), requests.join('\n'));
        console.log('Fluxos de arbitragem, recuperação, áudio, atalhos, modo offline e console OK.');
    } catch (error) {
        if (!socket) console.error(diagnostics);
        throw error;
    } finally {
        socket?.close();
        if (chrome.exitCode === null && chrome.signalCode === null && chrome.pid) {
            const exited = new Promise(resolve => chrome.once('exit', resolve));
            chrome.kill();
            await exited;
        }
        await rm(profile, { recursive: true, force: true, maxRetries: 5 }).catch(error => {
            console.warn('Perfil temporário retido:', error.code);
        });
    }
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
