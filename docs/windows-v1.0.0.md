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
cargo install tauri-cli --version "^2" --locked
node --test match.test.cjs tests/contrast.test.cjs
node scripts/build-windows.cjs
```

O script copia o instalador compilado para `dist/Placar-BJJ-1.0.0-Windows-x64-Setup.exe`, escreve o arquivo `.sha256` e imprime o caminho absoluto, o tamanho em bytes e o SHA-256. O primeiro build também resolve as dependências Rust do aplicativo e gera `src-tauri/Cargo.lock`. Registre esse arquivo junto à validação de um build bem-sucedido.

A versão web continua disponível pelo [index.html](../index.html). O desktop embute cópias dos quatro arquivos web e dos dois recursos originais presentes na árvore de trabalho. A tag `pre-windows-v1.0.0` guarda a Arena aprovada no commit `c70f84e`. A remoção das legendas dos seis atalhos no HTML já existia localmente e foi preservada fora dos commits desta etapa.

## Instalação e operação

Quando o instalador estiver disponível, confira o hash e a assinatura do arquivo recebido no PowerShell.

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

Ambiente verificado em 26/11/2026, Windows x64 build 26200, Node.js 24.14.1 e WebView2 158.0.4370.33. Rust, Cargo, MSVC C++ e Windows SDK não foram encontrados. A execução de `node scripts/build-windows.cjs` terminou com `spawnSync cargo ENOENT`.

| Verificação | Resultado observado |
| --- | --- |
| Antes da integração, lógica e contraste | 6 testes aprovados |
| Antes da integração, Chrome com a rede desativada | Fluxos do placar e as quatro resoluções aprovados. Tela cheia nativa e áudio local verificados |
| Depois da integração, arquivos destinados ao pacote | HTML, CSS, JavaScript, logotipo e MP3 conferidos byte a byte com a árvore de trabalho |
| Depois da integração, lógica e contraste | 6 testes aprovados |
| Depois da integração, cópia do pacote no Chrome offline | As quatro resoluções e os fluxos de arbitragem, recuperação, atalhos, áudio e tela cheia passaram, sem erros de console |
| Aplicativo Tauri, instalador NSIS e medições | Pendentes da compilação. Sem binário, SHA-256, assinatura verificada, capturas do Windows ou medidas de RAM, CPU, disco e tamanho do instalador |

### Validação pendente do executável e do instalador

- Em uma instalação limpa do Windows x64, desconecte a rede e instale com uma conta padrão. Em uma VM de teste sem WebView2, repita para exercitar o instalador offline incluído. Registre quando houver solicitação de elevação e verifique idioma, ícone e atalhos.
- Abra o placar e compare com a Arena web nas mesmas dimensões da área de conteúdo em 1280×720, 1366×768, 1920×1080 e 2560×1440. Capture o aplicativo instalado, a tela cheia e o painel de configurações. Abra pelo segundo atalho e confirme que a janela em uso ganha foco.
- Execute os fluxos de relógio, placar e arbitragem descritos no guia. Compare uma contagem de 60 segundos com uma referência externa, verifique pausa, retomada, reinício, sinal único, volume, histórico, atalhos, vantagens, faltas, correções e Nova luta. Repita com a rede desativada.
- Com uma luta ativa e mudanças de nome, pontos e volume, encerre o processo pelo Gerenciador de Tarefas. Reabra e confirme que a luta volta pausada, aguarda confirmação e preserva os valores gravados. Em um perfil descartável, teste também a recuperação de dados inválidos.
- Reinstale mantendo os dados, verifique o estado e desinstale. Confirme remoção dos atalhos e opção de preservar o perfil do usuário.
- Meça RAM do processo principal e dos subprocessos WebView2 do placar, CPU em janelas de 60 segundos em repouso e com contagem ativa, espaço em disco da instalação e do perfil separadamente, tamanho do instalador e SHA-256. Registre o método, a máquina e os valores observados.
