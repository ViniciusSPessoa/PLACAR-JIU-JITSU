const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createReadStream } = require('node:fs');
const { copyFile, mkdir, readdir, stat, writeFile } = require('node:fs/promises');
const { join, resolve } = require('node:path');
const config = require('../src-tauri/tauri.conf.json');

async function build() {
    if (process.platform !== 'win32') throw new Error('Use um ambiente Windows para esta compilação.');
    const root = resolve(__dirname, '..');
    const target = 'x86_64-pc-windows-msvc';
    const targetDir = join(root, 'src-tauri', 'target');
    const result = spawnSync('cargo', ['tauri', 'build', '--target', target, '--bundles', 'nsis'], {
        cwd: root,
        env: { ...process.env, CARGO_TARGET_DIR: targetDir },
        stdio: 'inherit'
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error('A compilação do Tauri falhou com código ' + result.status + '.');

    const bundle = join(targetDir, target, 'release', 'bundle', 'nsis');
    const expected = config.productName + '_' + config.version + '_x64-setup.exe';
    const outputs = await readdir(bundle);
    if (!outputs.includes(expected)) throw new Error('Instalador esperado não encontrado: ' + expected);
    const distribution = join(root, 'dist');
    await mkdir(distribution, { recursive: true });
    const name = 'Placar-BJJ-' + config.version + '-Windows-x64-Setup.exe';
    const installer = join(distribution, name);
    await copyFile(join(bundle, expected), installer);
    const sha256 = createHash('sha256');
    for await (const chunk of createReadStream(installer)) sha256.update(chunk);
    const checksum = sha256.digest('hex');
    await writeFile(join(distribution, name + '.sha256'), checksum + '  ' + name + '\n');
    console.log(installer);
    console.log((await stat(installer)).size + ' bytes · SHA-256 ' + checksum);
}

build().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
