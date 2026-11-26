const test = require('node:test');
const assert = require('node:assert/strict');
const { createMatch, parseDuration, restoreMatch } = require('./match.js');

test('todas as sequências de três golpes mantêm históricos independentes', () => {
    for (const a of [2, 3, 4]) for (const b of [2, 3, 4]) for (const c of [2, 3, 4]) {
        const match = createMatch();
        for (const value of [a, b, c]) match.score(0, value);
        for (const value of [c, a, b]) match.score(1, value);
        assert.deepEqual(match.state.athletes.map(x => x.history), [[a, b, c], [c, a, b]]);
        assert.equal(match.points(0), a + b + c);
        match.undo(0);
        assert.equal(match.points(0), a + b);
        assert.equal(match.points(1), a + b + c);
        for (let i = 0; i < 100; i++) match.undo(0);
        assert.equal(match.points(0), 0);
    }
});

test('correções e entradas inválidas', () => {
    const match = createMatch();
    for (const input of ['', ' ', '1.5', '-1', 'NaN', 'Infinity', '100']) {
        assert.equal(parseDuration(input, '01'), null);
    }
    for (const seconds of ['60', '-1', '1e1', '']) assert.equal(parseDuration('01', seconds), null);
    assert.equal(parseDuration('00', '00'), null);
    assert.equal(parseDuration('99', '59'), 5999000);
    for (const value of [0, 1, -2, NaN, Infinity, '2']) assert.equal(match.score(0, value), false);
    assert.equal(match.score(2, 2), false);
    for (const field of ['advantages', 'penalties']) {
        assert.equal(match.adjust(1, field, -1), false);
        assert.equal(match.adjust(1, field, 9), false);
        match.adjust(1, field, 1);
        match.adjust(1, field, 1);
        match.adjust(1, field, -1);
        assert.equal(match.state.athletes[1][field], 1);
        assert.equal(match.state.athletes[0][field], 0);
    }
});

test('prazo monotônico, callbacks atrasados e término único', () => {
    let now = 100;
    const match = createMatch({ now: () => now });
    match.configure(12000);
    assert.equal(match.state.remaining, 12000);
    assert.equal(match.start(), true);
    for (let i = 0; i < 200; i++) assert.equal(match.start(), false);
    now += 4555;
    match.tick();
    assert.equal(match.state.remaining, 7445);
    match.pause();
    now += 100000;
    assert.equal(match.tick(), false);
    assert.equal(match.state.remaining, 7445);
    match.start();
    now += 7446;
    assert.equal(match.tick(), true);
    assert.equal(match.tick(), false);
    assert.equal(match.state.status, 'finished');
    assert.equal(match.state.remaining, 0);
    assert.equal(match.start(), false);
});

test('reset em curso limpa o prazo e conserva pontos', () => {
    let now = 0;
    const match = createMatch({ now: () => now });
    match.score(0, 3);
    match.start();
    now += 100;
    assert.equal(match.configure(2000), false);
    match.resetTimer();
    now += 999999;
    assert.equal(match.tick(), false);
    assert.equal(match.state.status, 'ready');
    assert.equal(match.state.remaining, match.state.duration);
    assert.equal(match.points(0), 3);
    match.newMatch();
    assert.equal(match.points(0), 0);
});

test('recuperação pausa, persiste a confirmação e recusa dados inválidos', () => {
    const original = createMatch({ now: () => 0 });
    original.configure(3000);
    original.score(1, 4);
    original.start();
    const data = JSON.stringify(original.state);
    const snapshot = restoreMatch(data);
    const recovered = createMatch({ saved: snapshot, now: () => 99999 });
    assert.equal(recovered.state.remaining, 3000);
    assert.equal(recovered.points(1), 4);
    assert.equal(recovered.state.status, 'paused');
    assert.equal(recovered.start(), false);
    assert.equal(restoreMatch(JSON.stringify(recovered.state)).needsConfirmation, true);
    assert.equal(recovered.start({ confirmed: true }), true);
    for (const raw of [null, '', '!', '[]', '{}', data.replace('3000', '-1'), data.replace('[4]', '[7]')]) {
        assert.equal(restoreMatch(raw), null);
    }
});
