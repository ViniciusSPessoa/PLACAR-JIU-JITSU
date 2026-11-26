const { copyFileSync, mkdirSync } = require('node:fs');
const { dirname, join, resolve } = require('node:path');

const root = resolve(__dirname, '..');
const output = join(root, 'desktop-web');
const assets = [
    'index.html',
    'style.css',
    'match.js',
    'script.js',
    'src/file_000000007eac820ea5685ab4a9be1658.png',
    'sons/u_inx5oo5fv3-alarm-327234.mp3'
];

for (const asset of assets) {
    const destination = join(output, asset);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(root, asset), destination);
}
console.log('Frontend desktop preparado em ' + output);
