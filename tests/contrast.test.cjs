const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const css = readFileSync(resolve(__dirname, '..', 'style.css'), 'utf8');
const token = name => css.match(new RegExp('--' + name + ': (#[0-9a-f]{6});'))[1];

function luminance(hex) {
    const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255);
    const linear = rgb.map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
}

test('cores do placar e comandos principais excedem contraste de 4,5:1', () => {
    const pairs = [
        [token('white'), token('panel')],
        [token('muted'), token('panel')],
        [token('gold'), '#282219'],
        [token('white'), '#121318'],
        ['#ff7589', '#121317'],
        ['#ffffff', '#bd1b35'],
        ['#ffffff', '#d8203d'],
        ['#15161a', '#eceef3']
    ];
    for (const [foreground, background] of pairs) {
        const [low, high] = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
        const ratio = (high + .05) / (low + .05);
        assert.ok(ratio >= 4.5, foreground + ' sobre ' + background + ': ' + ratio.toFixed(2));
    }
});
