# CHANGELOG — Pesquisa / formulários Prassi (`pesquisa_prassi`)

> Histórico datado. Mais novo no topo.

## 16/11/2026 — Kit APPCC · lista do lançamento (`appcc-interesse/`) no ar
- Novo formulário `appcc-interesse/index.html` (marca da ficha de adesão): contato, interesse,
  quando começar, bloco opcional para quem já quer implantar e consentimento LGPD. Campo
  oculto `Origem` vem de `?origem=` (instagram = DM da Emy; deck = QR do treinamento APPCC).
- Backend `scripts/google-apps-script-appcc-interesse.gs` (aba "Interessados"; e-mail com
  [LEAD] quando quer implantar ou começar em até 3 meses; responder o e-mail responde à pessoa).
- Apps Script implantado pelo Maurício (planilha "Prassi · Kit APPCC · Lista do lançamento").
  POST de teste respondeu `{"result":"ok"}`.

## 08/10/2026 — Levantamento de dados (LEV-001) criado, ainda não publicado
- Novo formulário `levantamento/index.html` (página genérica, salvamento automático, um link por cliente com `?c=<token>`), gerado por `~/Claude/Prassi-Docs-MAPA/scripts/gen-levantamento-html.mjs`.
- Novo backend `scripts/google-apps-script-levantamento.gs`. Testado só com backend simulado.
- Nada publicado: sem commit nem push e sem Apps Script implantado. Os passos que faltam estão no `STATUS.md`, seção "Levantamento de dados".
