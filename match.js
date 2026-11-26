'use strict';

const BjjMatch = (() => {
    const allowedScores = [2, 3, 4];
    const counters = ['advantages', 'penalties'];
    const statuses = ['ready', 'running', 'paused', 'finished'];
    const maxDuration = 5999000;
    const validDuration = value => Number.isInteger(value) && value >= 1000
        && value <= maxDuration && value % 1000 === 0;
    const validCounter = value => Number.isSafeInteger(value) && value >= 0;
    const newAthlete = () => ({ name: '', history: [], advantages: 0, penalties: 0 });

    function parseDuration(minutes, seconds) {
        if (!/^\d{1,2}$/.test(minutes) || !/^\d{1,2}$/.test(seconds) || Number(seconds) > 59) return null;
        const duration = (Number(minutes) * 60 + Number(seconds)) * 1000;
        return validDuration(duration) ? duration : null;
    }

    function restoreMatch(raw) {
        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            return null;
        }
        if (data?.version !== 1 || !statuses.includes(data.status) || !validDuration(data.duration)
            || !Number.isFinite(data.remaining) || data.remaining < 0 || data.remaining > data.duration
            || (data.status === 'finished') !== (data.remaining === 0)
            || (data.status === 'ready' && data.remaining !== data.duration)
            || typeof data.needsConfirmation !== 'boolean'
            || (data.needsConfirmation && data.status !== 'paused')
            || !Number.isFinite(data.volume) || data.volume < 0 || data.volume > 1
            || !Array.isArray(data.athletes) || data.athletes.length !== 2) return null;
        for (const athlete of data.athletes) {
            if (typeof athlete?.name !== 'string' || athlete.name.length > 50
                || !Array.isArray(athlete.history) || !athlete.history.every(value => allowedScores.includes(value))
                || !counters.every(field => validCounter(athlete[field]))) return null;
        }
        if (data.status === 'running') {
            data.status = 'paused';
            data.needsConfirmation = true;
        }
        return data;
    }

    function createMatch({ saved = null, now = () => performance.now() } = {}) {
        const state = saved ?? {
            version: 1, status: 'ready', duration: 300000, remaining: 300000,
            athletes: [newAthlete(), newAthlete()], volume: 0.75, needsConfirmation: false
        };
        let deadline = null;
        const athleteAt = index => index === 0 || index === 1 ? state.athletes[index] : null;

        function tick() {
            if (state.status !== 'running') return false;
            state.remaining = Math.max(0, deadline - now());
            if (state.remaining > 0) return false;
            deadline = null;
            state.status = 'finished';
            return true;
        }

        function resetTimer() {
            deadline = null;
            state.status = 'ready';
            state.remaining = state.duration;
            state.needsConfirmation = false;
        }

        return {
            state,
            tick,
            resetTimer,
            configure(duration) {
                if (state.status !== 'ready' || !validDuration(duration)) return false;
                state.duration = duration;
                resetTimer();
                return true;
            },
            start({ confirmed = false } = {}) {
                if (!['ready', 'paused'].includes(state.status) || (state.needsConfirmation && !confirmed)) return false;
                deadline = now() + state.remaining;
                state.status = 'running';
                state.needsConfirmation = false;
                return true;
            },
            pause() {
                if (state.status !== 'running') return false;
                if (tick()) return true;
                deadline = null;
                state.status = 'paused';
                return false;
            },
            newMatch() {
                resetTimer();
                state.athletes = [newAthlete(), newAthlete()];
            },
            points(index) {
                return athleteAt(index)?.history.reduce((total, value) => total + value, 0) ?? 0;
            },
            score(index, value) {
                const athlete = athleteAt(index);
                if (!athlete || !allowedScores.includes(value)) return false;
                athlete.history.push(value);
                return true;
            },
            undo(index) {
                return athleteAt(index)?.history.pop() !== undefined;
            },
            adjust(index, field, delta) {
                const athlete = athleteAt(index);
                if (!athlete || !counters.includes(field) || ![-1, 1].includes(delta)
                    || !validCounter(athlete[field] + delta)) return false;
                athlete[field] += delta;
                return true;
            },
            rename(index, name) {
                const athlete = athleteAt(index);
                if (athlete && typeof name === 'string') athlete.name = name.slice(0, 50);
            },
            setVolume(volume) {
                if (Number.isFinite(volume) && volume >= 0 && volume <= 1) state.volume = volume;
            }
        };
    }

    return { createMatch, parseDuration, restoreMatch };
})();

if (typeof module !== 'undefined') module.exports = BjjMatch;
