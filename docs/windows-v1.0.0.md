# Placar BJJ 1.0.0 para Windows x64

## Dependências e compilação

- Windows 10 ou 11 x64.
- Rust estável de pelo menos 1.90, Cargo e alvo `x86_64-pc-windows-msvc`. Instale pelo [Rustup oficial](https://rust-lang.org/tools/install/).
- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/). No Visual Studio Installer, selecione **Desenvolvimento para desktop com C++** e confirme os componentes **MSVC x64/x86** e **Windows 10 SDK** ou **Windows 11 SDK**.
- Microsoft Edge WebView2 Runtime. O pacote único usa o instalador offline Evergreen da Microsoft para máquinas sem o runtime. [Opções do WebView2 no Tauri](https://v2.tauri.app/distribute/windows-installer/#webview2-installation-options)
- Node.js 24 para o preparo do frontend e os testes. Tauri CLI 2 para compilar. O Tauri obtém o NSIS e o instalador offline do WebView2 na preparação do primeiro pacote. Esse primeiro build exige rede para obter as dependências. [Pré-requisitos do Tauri](https://v2.tauri.app/start/prerequisites/)

Abra um novo PowerShell na raiz do projeto, após instalar as ferramentas indicadas.

```powershell
rustup default stable-x86_64-pc-windows-msvc
rustup target add x86_64-pc-windows-msvc
cargo install tauri-cli --version 2.12.6 --locked
node --test match.test.cjs tests/contrast.test.cjs
node scripts/build-windows.cjs
```

O script copia o instalador compilado para `dist/Placar-BJJ-1.0.0-Windows-x64-Setup.exe`, escreve o arquivo `.sha256` e imprime o caminho absoluto, o tamanho em bytes e o SHA-256. O primeiro build também resolve as dependências Rust do aplicativo e gera `src-tauri/Cargo.lock`. O lockfile do build validado está versionado.

A versão web continua disponível pelo [index.html](../index.html). O desktop embute cópias dos quatro arquivos web e dos dois recursos originais presentes na árvore de trabalho. A tag `pre-windows-v1.0.0` guarda a Arena aprovada no commit `c70f84e`. A remoção das legendas dos seis atalhos no HTML já existia localmente e foi preservada fora dos commits desta etapa.

## Instalação e operação

Confira o hash e a assinatura do arquivo recebido no PowerShell.

```powershell
$setup = 'dist/Placar-BJJ-1.0.0-Windows-x64-Setup.exe'
Get-FileHash -LiteralPath $setup -Algorithm SHA256
Get-AuthenticodeSignature -LiteralPath $setup | Select-Object Status, SignerCertificate
```

A configuração do pacote não inclui certificado de assinatura. Um instalador sem assinatura pode exibir um aviso do Windows SmartScreen. Confirme a origem e o SHA-256 antes de prosseguir.

1. Execute o instalador. O fluxo NSIS está configurado em português brasileiro e instala para o usuário atual. O Windows ou o instalador do WebView2 pode solicitar elevação conforme a política da máquina.
2. Abra **Placar BJJ** pelo menu Iniciar. Para criar um atalho na área de trabalho, marque essa opção na tela final do instalador.
3. Ajuste duração e volume em **Configurações** e use **Testar sinal** antes da luta. Consulte o [guia de operação](../README.md) para os controles e atalhos.
4. Para reinstalar ou atualizar, feche o aplicativo e execute a nova versão para o mesmo usuário. Se usar o desinstalador, mantenha desmarcada a opção de apagar dados do aplicativo para preservá-los.

O perfil WebView2 usa `%LOCALAPPDATA%\br.com.placarbjj.sergiocorrea\WebView2`. O identificador, o diretório de dados e a origem interna `https://tauri.localhost` devem permanecer estáveis entre versões. Os dados salvos pelo navegador na edição web ficam no perfil daquele navegador. Se uma luta ativa for recuperada, o operador deve confirmar a retomada no placar.

## Relatório de testes

Validação em 26/11/2026 no Windows 11 x64 25H2, build 26200, com Node.js 24.14.1 e WebView2 158.0.4370.33. Build de produção com Rust e Cargo 1.100.0, MSVC 19.44.35230, Windows SDK 10.0.26100.0, Tauri 2.12.7 e Tauri CLI 2.12.6. A instalação das ferramentas terminou sem solicitar reinicialização.

| Verificação | Resultado observado |
| --- | --- |
| Lógica e contraste | 6 testes aprovados antes e depois da integração |
| Fonte destinada ao pacote | HTML, CSS, JavaScript, logotipo e MP3 idênticos à árvore de trabalho |
| Instalação limpa do Placar para o usuário atual | NSIS silencioso com código 0, versão instalada 1.0.0, atalhos válidos no menu Iniciar e na área de trabalho |
| Janela e instância única | Primeira execução maximizada, fechamento normal e segunda instância encerrada sem criar outra janela |
| Recuperação | Com a luta ativa, o processo foi encerrado à força. Nome, pontuação, tempo salvo e volume foram recuperados em pausa. Cancelar manteve a pausa e confirmar permitiu retomar |
| Reinstalação da mesma versão | Preservou o placar, a luta pausada, os nomes, a duração e o volume |
| Desinstalação | Removidos os executáveis, os dois atalhos e a entrada de desinstalação. O perfil WebView2 foi preservado |
| Regressão no Placar instalado | Pontuação, correções, vantagens, faltas, históricos, Nova luta, atalhos, configurações, sinal único, teste de áudio, volume, recuperação de dados inválidos, início, pausa, retomada, reinício e encerramento passaram |
| Cronometragem nativa | Para 12 s configurados, 12.116 ms de parede observados, descontada a pausa e incluindo a latência de observação do teste |
| Funcionamento offline | WebView2 com rede emulada como desconectada e cache desabilitado. Todas as requisições observadas foram para o protocolo local do app. Tela cheia nativa e console sem erros |
| Identidade visual | Comparação lado a lado de Chrome e WebView2 em 1280×720, 1366×768, 1920×1080 e 2560×1440. Composição, tipografia, cores e controles correspondentes nas quatro áreas de conteúdo |

As capturas em perspectiva de conteúdo foram feitas na WebView2 do executável instalado, com as quatro dimensões emuladas. A [comparação visual](../dist/comparativo-arena.png) e as [capturas nativas](../dist/capturas-windows) acompanham a distribuição.

### Instalador

- [Placar-BJJ-1.0.0-Windows-x64-Setup.exe](../dist/Placar-BJJ-1.0.0-Windows-x64-Setup.exe), 301.762.609 bytes (287,78 MiB).
- [Arquivo SHA-256](../dist/Placar-BJJ-1.0.0-Windows-x64-Setup.exe.sha256). Valor verificado com PowerShell e Node.js, `3a2f4e42265d2cafbc6a9ec4740c0e5742cc0cdce5316c2c85544d4bffbdf82c`.
- Authenticode do instalador do Placar, `NotSigned`. O instalador independente do WebView2 incluído tem 294.302.984 bytes e assinatura válida da Microsoft.
- Arquivos instalados do Placar, 10.425.524 bytes (9,94 MiB), excluindo o perfil WebView2 e o runtime compartilhado.

### Medições do aplicativo instalado

| Cenário | Duração observada | RAM média | Pico amostrado de RAM | CPU média |
| --- | --- | --- | --- | --- |
| Em repouso | 65,99 s | 486,15 MiB | 494,57 MiB | 0,377% |
| Cronômetro em andamento | 66,37 s | 501,51 MiB | 523,79 MiB | 0,194% |

A RAM é a soma do working set do processo do Placar e dos processos filhos, medida em sete amostras por cenário. Páginas compartilhadas podem aparecer mais de uma vez na soma. A CPU foi calculada pela diferença do tempo de processador acumulado na árvore de processos, normalizada pelos 12 processadores lógicos. Os valores descrevem uma execução nesta máquina.

O perfil WebView2 continha 9.658.005 bytes (9,21 MiB) em 212 arquivos após a validação. O tamanho em disco informado é a soma dos comprimentos lógicos dos arquivos.

### Cobertura da instalação offline

O runtime WebView2 já existia nesta máquina. O instalador offline da Microsoft foi incluído no NSIS. A instalação foi testada em um perfil sem Placar BJJ, em Windows com WebView2 presente. A instalação com a rede realmente desconectada em uma máquina sem WebView2 permanece pendente. Este Windows é edição Home Single Language e o ambiente não forneceu uma VM limpa para esse cenário.
