# Placar BJJ

Placar offline da Academia de Jiu-Jitsu Sergio Corrêa. Abra [index.html](index.html) em um navegador desktop atual e mantenha os arquivos e pastas do projeto juntos.

Versão Windows atual **1.0.1**. [Instruções de compilação e relatório da versão 1.0.0](docs/windows-v1.0.0.md).

## Operação

1. Digite os nomes nos cantos branco e vermelho. Abra **Configurações** e ajuste os campos **Min** e **Seg**. A duração padrão é cinco minutos e os valores aceitos vão de 00:01 a 99:59.
2. Em **Configurações**, ajuste o volume e use **Testar sinal** para verificar a saída de áudio. Use **Tela cheia** para ampliar o painel.
3. Clique em **Iniciar**. Use **Pausar** e **Retomar** conforme a arbitragem. Pontue com **+2**, **+3** e **+4**. **Desfazer ponto** remove o último lançamento daquele canto. Vantagens e faltas têm correção independente.
4. **Reiniciar tempo** volta à duração configurada mediante confirmação e conserva o placar. **Nova luta** exige confirmação para limpar nomes, pontuações, vantagens e faltas. A duração e o volume são reutilizados.

| Tecla | Ação |
| --- | --- |
| Espaço | Iniciar, pausar ou retomar o cronômetro |
| 1 / 2 / 3 | +2 / +3 / +4 para o canto branco |
| 7 / 8 / 9 | +2 / +3 / +4 para o canto vermelho |
| F | Alternar tela cheia |

Os atalhos são suspensos durante a digitação e com diálogos abertos. Com foco em um botão ou no controle de Configurações, Espaço aciona o controle em foco.

## Recuperação

O salvamento usa o armazenamento local do navegador. Uma luta interrompida volta pausada no último instante salvo. Clique em **Confirmar retomada** e confirme no diálogo. O tempo decorrido com a página fechada fica fora da contagem. Durante a execução há um salvamento aproximadamente a cada 250 ms quando o navegador está ativo, além do salvamento em alterações e ao sair da página. O navegador pode atrasar esses registros em segundo plano.

Prefira manter uma única aba do placar aberta. O armazenamento para arquivos locais depende do navegador, do perfil e do caminho do arquivo. A interface informa quando o armazenamento está indisponível. O áudio depende do volume, da saída selecionada e das permissões de reprodução do navegador.

## Arquitetura

- [match.js](match.js) contém o estado da luta, as transições do relógio, os históricos e a validação dos dados recuperados. O tempo restante deriva de um prazo baseado em `performance.now()`.
- [script.js](script.js) conecta os controles ao modelo, atualiza a tela, grava o estado, trata a reprodução de áudio e organiza os eventos.
- [index.html](index.html) e [style.css](style.css) definem o painel, as animações e o layout responsivo. O logotipo e o MP3 são os recursos originais.

## Testes e capturas

```powershell
node --test match.test.cjs tests/contrast.test.cjs
node tests/browser.cjs
```

Os testes usam Node.js 24. O teste de interface inicia um Chrome headless com um perfil temporário e uma porta de depuração local. No Windows, se o Chrome estiver em outro caminho, aponte `BJJ_CHROME` para o executável. O teste abre o HTML via `file:` com a rede desativada e grava as imagens em [docs/capturas/arena](docs/capturas/arena).

A execução final passou em seis testes automatizados de lógica e contraste. No Chrome, as quatro resoluções passaram nos testes de layout, com controles visíveis e sem sobreposição. Foram verificados nomes longos, placares com dois e três dígitos, os estados do cronômetro, o painel de configurações e a preferência por movimento reduzido. A execução também verificou o console, a reprodução do MP3, a exceção de áudio simulada, a entrada e saída nativas em tela cheia e os fluxos do placar com a rede desativada.

[1280×720](docs/capturas/arena/1280x720.png) · [1366×768](docs/capturas/arena/1366x768.png) · [1920×1080](docs/capturas/arena/1920x1080.png) · [2560×1440](docs/capturas/arena/2560x1440.png)

[Configurações abertas](docs/capturas/arena/1366x768-configuracoes.png) · [Em andamento](docs/capturas/arena/1366x768-em-andamento.png) · [Pausado](docs/capturas/arena/1366x768-pausado.png) · [Segundos finais](docs/capturas/arena/1366x768-segundos-finais.png) · [Encerrado](docs/capturas/arena/1366x768-encerrado.png)
