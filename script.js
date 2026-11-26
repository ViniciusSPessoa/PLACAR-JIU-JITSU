'use strict';

(() => {
    const key = 'placar-bjj:match:v1';
    const byId = id => document.getElementById(id);
    const storageStatus = byId('storage-status');
    const notice = byId('notice');
    let saved;
    let storageWarning = '';
    try {
        const raw = localStorage.getItem(key);
        saved = BjjMatch.restoreMatch(raw);
        if (raw !== null && !saved) storageWarning = 'Dados locais inválidos. Placar iniciado com os valores padrão.';
    } catch {
        storageWarning = 'O navegador bloqueou o salvamento local.';
    }

    const match = BjjMatch.createMatch({ saved });
    const { state } = match;
    const clock = document.querySelector('.clock');
    const time = byId('clock-time');
    const status = byId('clock-status');
    const toggle = byId('toggle-clock');
    const reset = byId('reset-clock');
    const form = byId('duration-form');
    const durationFields = byId('duration-fields');
    const minutes = byId('minutes');
    const seconds = byId('seconds');
    const durationError = byId('duration-error');
    const volume = byId('volume');
    const volumeValue = byId('volume-value');
    const alarm = byId('alarm');
    const testAudio = byId('test-audio');
    const fullscreen = byId('fullscreen');
    const confirmation = byId('confirmation');
    const shortcutDialog = byId('shortcut-dialog');
    const athletes = [...document.querySelectorAll('[data-athlete]')].map(panel => ({
        panel,
        name: panel.querySelector('[data-name]'),
        points: panel.querySelector('[data-points]'),
        history: panel.querySelector('[data-history]'),
        undo: panel.querySelector('[data-undo]'),
        flash: panel.querySelector('.score-flash'),
        counters: [...panel.querySelectorAll('[data-count]')],
        corrections: [...panel.querySelectorAll('[data-adjust][data-delta="-1"]')],
        flashTimeout: null
    }));

    const clockText = {
        ready: ['Pronto', 'Iniciar'],
        running: ['Em andamento', 'Pausar'],
        paused: ['Pausado', 'Retomar'],
        finished: ['Encerrado', 'Luta encerrada']
    };
    const shortcuts = {
        '1': [0, 2], '2': [0, 3], '3': [0, 4],
        '7': [1, 2], '8': [1, 3], '9': [1, 4]
    };
    let interval = null;
    let lastSave = -Infinity;
    let lastSnapshot = '';
    let durationValid = true;
    let confirmAction;
    let playbackId = 0;
    let signalActive = false;
    alarm.volume = state.volume;

    function setText(element, value) {
        const text = String(value);
        if (element.textContent !== text) element.textContent = text;
    }

    function save() {
        const snapshot = JSON.stringify(state);
        if (snapshot === lastSnapshot) return;
        try {
            localStorage.setItem(key, snapshot);
            lastSave = performance.now();
            lastSnapshot = snapshot;
            setText(storageStatus, storageWarning || 'Salvamento local ativo');
        } catch {
            lastSave = performance.now();
            setText(storageStatus, 'Salvamento local indisponível');
        }
    }

    function clockParts(ms) {
        const total = Math.ceil(ms / 1000);
        return [Math.floor(total / 60), total % 60].map(value => String(value).padStart(2, '0'));
    }

    function renderClock() {
        const [label, action] = clockText[state.status];
        setText(time, clockParts(state.remaining).join(':'));
        setText(status, state.needsConfirmation ? 'Luta recuperada · pausada' : label);
        setText(toggle, state.needsConfirmation ? 'Confirmar retomada' : action);
        toggle.disabled = state.status === 'finished' || !durationValid;
        durationFields.disabled = state.status !== 'ready';
        reset.disabled = state.status === 'ready';
        clock.classList.toggle('is-urgent', state.status === 'running' && state.remaining <= 10000);
        clock.classList.toggle('is-finished', state.status === 'finished');
    }

    function renderAthlete(index, { syncName = false } = {}) {
        const refs = athletes[index];
        const athlete = state.athletes[index];
        if (syncName) refs.name.value = athlete.name;
        const points = String(match.points(index));
        refs.points.dataset.digits = Math.min(points.length, 4);
        setText(refs.points, points);
        setText(refs.history, athlete.history.length ? athlete.history.map(points => '+' + points).join(' · ') : 'Sem pontuações');
        refs.history.scrollTop = refs.history.scrollHeight;
        refs.undo.disabled = athlete.history.length === 0;
        for (const field of refs.counters) setText(field, athlete[field.dataset.count]);
        for (const button of refs.corrections) button.disabled = athlete[button.dataset.adjust] === 0;
    }

    function syncDuration() {
        [minutes.value, seconds.value] = clockParts(state.duration);
        durationValid = true;
        setText(durationError, '');
        for (const input of [minutes, seconds]) input.removeAttribute('aria-invalid');
    }

    function configureDuration() {
        if (state.status !== 'ready') return;
        const duration = BjjMatch.parseDuration(minutes.value, seconds.value);
        durationValid = duration !== null;
        for (const input of [minutes, seconds]) input.setAttribute('aria-invalid', String(!durationValid));
        setText(durationError, durationValid ? '' : 'Informe uma duração entre 00:01 e 99:59.');
        if (durationValid) {
            match.configure(duration);
            save();
        }
        renderClock();
    }

    async function playSignal(finalSignal = false) {
        if (!finalSignal && signalActive) return;
        const request = ++playbackId;
        signalActive = finalSignal;
        testAudio.disabled = finalSignal;
        try {
            alarm.pause();
            alarm.currentTime = 0;
            if (alarm.error) alarm.load();
            await alarm.play();
            if (request === playbackId) setText(notice, '');
        } catch {
            if (request !== playbackId) return;
            signalActive = false;
            testAudio.disabled = false;
            setText(notice, 'Falha ao tocar o sinal. Use “Testar sinal” para verificar o áudio.');
        }
    }

    function syncInterval() {
        if (state.status === 'running' && interval === null) {
            interval = setInterval(updateClock, 50);
        } else if (state.status !== 'running' && interval !== null) {
            clearInterval(interval);
            interval = null;
        }
    }

    function updateClock() {
        const finished = match.tick();
        renderClock();
        if (finished || performance.now() - lastSave >= 250) save();
        if (finished) {
            syncInterval();
            void playSignal(true);
        }
    }

    function showConfirmation(title, copy, label, action) {
        confirmation.returnValue = 'cancel';
        setText(byId('confirm-title'), title);
        setText(byId('confirm-copy'), copy);
        setText(byId('confirm-action'), label);
        confirmAction = action;
        confirmation.showModal();
    }

    function handleClock() {
        if (!durationValid || state.status === 'finished') return;
        if (state.needsConfirmation) {
            showConfirmation('Retomar luta recuperada?', 'O cronômetro continuará a partir de ' + clockParts(state.remaining).join(':') + '.', 'Retomar luta', () => {
                match.start({ confirmed: true });
                commitClock();
            });
            return;
        }
        const wasRunning = state.status === 'running';
        const finished = wasRunning && match.pause();
        if (!wasRunning) match.start();
        commitClock();
        if (finished) void playSignal(true);
    }

    function commitClock() {
        renderClock();
        save();
        syncInterval();
    }

    function clearFlash(refs) {
        clearTimeout(refs.flashTimeout);
        refs.flash.classList.remove('flash');
        refs.points.classList.remove('bump');
    }

    function score(index, points) {
        if (!match.score(index, points)) return;
        const refs = athletes[index];
        renderAthlete(index);
        save();
        clearFlash(refs);
        setText(refs.flash, '+' + points);
        // Reflow restarts only the visual feedback on consecutive scores.
        void refs.flash.offsetWidth;
        refs.flash.classList.add('flash');
        refs.points.classList.add('bump');
        refs.flashTimeout = setTimeout(() => clearFlash(refs), 760);
    }

    function newFight() {
        match.newMatch();
        ++playbackId;
        alarm.pause();
        signalActive = false;
        testAudio.disabled = false;
        setText(notice, '');
        syncDuration();
        athletes.forEach((refs, index) => {
            clearFlash(refs);
            renderAthlete(index, { syncName: true });
        });
        commitClock();
    }

    async function changeFullscreen() {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await document.documentElement.requestFullscreen();
        } catch {
            setText(notice, 'Tela cheia indisponível neste navegador.');
        }
    }

    athletes.forEach((refs, index) => {
        refs.name.addEventListener('input', () => {
            match.rename(index, refs.name.value);
            save();
        });
        refs.panel.addEventListener('click', event => {
            const button = event.target.closest('button');
            if (!button) return;
            const { score: value, adjust, delta, undo } = button.dataset;
            if (value !== undefined) {
                score(index, Number(value));
                return;
            }
            const changed = undo !== undefined ? match.undo(index) : match.adjust(index, adjust, Number(delta));
            if (changed) {
                if (undo !== undefined) clearFlash(refs);
                renderAthlete(index);
                save();
            }
        });
    });

    confirmation.addEventListener('close', () => {
        const action = confirmAction;
        confirmAction = null;
        if (confirmation.returnValue === 'confirm' && action) action();
    });
    form.addEventListener('input', configureDuration);
    form.addEventListener('submit', event => {
        event.preventDefault();
        configureDuration();
        if (durationValid) syncDuration();
    });
    toggle.addEventListener('click', handleClock);
    reset.addEventListener('click', () => {
        showConfirmation('Reiniciar o tempo?', 'O cronômetro voltará à duração configurada. O placar será preservado.', 'Reiniciar tempo', () => {
            match.resetTimer();
            if (signalActive) {
                ++playbackId;
                alarm.pause();
                signalActive = false;
                testAudio.disabled = false;
            }
            syncDuration();
            commitClock();
        });
    });
    byId('new-match').addEventListener('click', () => {
        showConfirmation('Começar uma nova luta?', 'Os nomes, os pontos, as vantagens e as faltas serão apagados.', 'Nova luta', newFight);
    });
    byId('shortcuts').addEventListener('click', () => shortcutDialog.showModal());
    fullscreen.addEventListener('click', changeFullscreen);
    document.addEventListener('fullscreenchange', () => {
        setText(fullscreen, document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia');
    });
    volume.addEventListener('input', () => {
        match.setVolume(Number(volume.value) / 100);
        alarm.volume = state.volume;
        setText(volumeValue, Math.round(state.volume * 100) + '%');
        save();
    });
    testAudio.addEventListener('click', () => void playSignal());
    alarm.addEventListener('ended', () => {
        signalActive = false;
        testAudio.disabled = false;
    });
    document.addEventListener('keydown', event => {
        if (event.defaultPrevented || event.repeat || event.isComposing || event.ctrlKey || event.metaKey
            || event.altKey || event.shiftKey || confirmation.open || shortcutDialog.open
            || event.target.isContentEditable || event.target.closest('input, textarea, select, [role="textbox"]')) return;
        const pressed = event.key.toLowerCase();
        if (pressed === ' ' && !event.target.closest('button, a')) {
            event.preventDefault();
            handleClock();
        } else if (Object.hasOwn(shortcuts, pressed)) {
            event.preventDefault();
            score(...shortcuts[pressed]);
        } else if (pressed === 'f') {
            event.preventDefault();
            void changeFullscreen();
        }
    });
    window.addEventListener('pagehide', () => {
        updateClock();
        save();
    });
    document.addEventListener('visibilitychange', () => {
        updateClock();
        if (document.hidden) save();
    });

    syncDuration();
    volume.value = Math.round(state.volume * 100);
    setText(volumeValue, volume.value + '%');
    athletes.forEach((refs, index) => renderAthlete(index, { syncName: true }));
    renderClock();
    save();
})();
