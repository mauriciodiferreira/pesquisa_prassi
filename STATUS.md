# Pesquisa NPS — Status

> Documento de passagem: o que é o projeto, como funciona, como mudar, testar e publicar,
> e como criar uma nova pesquisa na mesma linha. Escrito para você (ou outra pessoa/IA)
> conseguir continuar sem depender da conversa original.

---

## 1. O que é

Uma pesquisa **NPS + Voice of Customer** dos clientes da Prassi, para enviar por
WhatsApp/e-mail. Página web única (HTML), aberta no navegador do cliente (celular ou
desktop). As respostas caem automaticamente numa planilha do Google Sheets — de graça.

**No ar em:** https://pesquisa.prassiengenharia.com.br/

---

## 2. Arquitetura (como as peças conversam)

```
Cliente abre o link  →  index.html (GitHub Pages / domínio próprio)
       preenche      →  envia via JavaScript (fetch POST)
                      →  Google Apps Script (Web App /exec)
                      →  1) grava linha na aba "Respostas" do Google Sheets
                      →  2) envia e-mail de notificação para o Maurício
```

- **Hospedagem do site:** GitHub Pages, repositório `mauriciodiferreira/pesquisa_prassi`,
  branch `main`, pasta raiz `/`. O arquivo servido é o `index.html`.
- **Domínio próprio:** `pesquisa.prassiengenharia.com.br` (registro CNAME no DNS da Vercel
  apontando para `mauriciodiferreira.github.io` + arquivo `CNAME` no repo). O link antigo
  `https://mauriciodiferreira.github.io/pesquisa_prassi/` continua funcionando como espelho.
- **Backend (recebe e grava):** Google Apps Script publicado como **App da Web**
  ("Executar como: eu" · "Quem pode acessar: Qualquer pessoa"). Código em
  `scripts/google-apps-script.gs`.
- **Banco de dados:** planilha do Google Sheets, aba **"Respostas"** (cabeçalho criado
  automaticamente na primeira resposta). Exportável para Excel/CSV a qualquer momento.
- **Notificação por e-mail:** a cada resposta, o script envia um e-mail (função
  `enviarEmail_`) para o endereço na variável `NOTIFY_EMAIL` (hoje
  `mauriciodiferreira@gmail.com`) com a nota, a classificação Promotor/Neutro/**Detrator**,
  as respostas e link para a planilha. O e-mail sai da própria conta que roda o script
  (de você para você — normal). Requer o escopo "enviar e-mail": ao alterar o `.gs` e
  reimplantar, o Google pede essa autorização — aprove. Se o envio falhar, a resposta
  ainda é gravada (o e-mail está dentro de `try/catch`). Para mudar o destinatário, edite
  a linha `NOTIFY_EMAIL` e reimplante (seção 6.2).
- **Envio sem CORS:** o formulário manda os dados como `URLSearchParams` com
  `mode:'no-cors'`. Por isso o navegador não lê a resposta do servidor — a tela de
  "Obrigado" aparece assim que o envio completa. É esperado e funciona.

### URL do Apps Script atualmente em uso (campo `action` do formulário)
```
https://script.google.com/macros/s/AKfycbwV5S7nOzZ2vabm8e6vgHbmSXHq3RH-RCIO8UKo9qBwkwJo7a0ctN8JYIf75a-ls7TYTQ/exec
```
> ⚠️ Toda vez que você cria uma **nova implantação** do Apps Script, essa URL muda e
> precisa ser atualizada no `index.html` (campo `action=`). Se só editar o código e usar
> **"Gerenciar implantações → Nova versão"**, a URL **não** muda (recomendado).

---

## 3. Arquivos desta pasta (`~/Claude/NPS`)

| Arquivo | O que é | Vai ao GitHub? |
|---|---|---|
| `index.html` | **A pesquisa** (versão no ar). | **SIM** (público) |
| `.gitignore` | Lista dos arquivos privados que ficam fora do repo. | SIM |
| `Pesquisa_NPS_Prassi.html` | Cópia idêntica com nome amigável (backup/leitura). | não (ignorado) |
| `scripts/google-apps-script.gs` | Código do backend (colar no editor do Apps Script). | não (ignorado) |
| `Pesquisa_NPS_Prassi.docx` | Guia estratégico original (roteiro, cálculo de NPS, textos). | não (ignorado) |
| `STATUS.md` | Este documento. | não (ignorado) |

> **Esta pasta É o repositório Git** (`origin` = `mauriciodiferreira/pesquisa_prassi`).
> O `.gitignore` garante que só o `index.html` (+ `.gitignore`) sobem ao repo público —
> os demais arquivos ficam privados no seu computador.
> **Fonte da verdade = `index.html` desta pasta.** Edite aqui e publique (seção 6).

---

## 4. Como está de acordo com a marca (prassi_brand.md / prassi_digital.md)

- **Cores:** azul-marinho `#143779` domina; terracota `#BF5C3B` e caramelo `#E78F56`
  só como acento (filetes finos, itálicos); creme `#F1DCC6` no painel de intro; neutros
  aço/névoa. Nada fora da paleta.
- **Tipografia:** EB Garamond em todo o texto; Michroma só em rótulos curtos em
  caixa-alta (códigos de seção "01–05", botão, kicker), via Google Fonts.
- **Símbolo P:** lockup branco **oficial** embutido no hero (não redesenhado).
- **Sobriedade:** cantos ≤ 6px, sombras ausentes/sutis, **sem emojis**, sem gradientes.
  Escalas de sentimento em números (1–5), não em carinhas.
- **Assinatura/dados:** "Maurício di Ferreira · Engenheiro Químico · CREA-RS 149251 ·
  CRQ-V 05303466", CNPJ e endereço oficiais no rodapé. **Nunca CPF** (dado sensível).
  (CRQ confirmado pelo Maurício: `05303466` — o manual de marca foi corrigido também.)

---

## 5. Como MUDAR a pesquisa

### 5.1 Regra de ouro (não quebrar o backend)
O Apps Script grava as colunas a partir dos **atributos `name`** dos campos do HTML,
que precisam bater com a lista `FIELDS` do `scripts/google-apps-script.gs`. Se você **adicionar,
remover ou renomear** uma pergunta, atualize os DOIS lugares:

1. No `index.html`: o `name="..."` do campo.
2. No `.gs`: a lista `FIELDS` (par `['name_no_html', 'Título na planilha']`), na mesma ordem.

Depois republique o Apps Script (seção 6.2) **e** o site (seção 6.1).

> Mudar só textos, cores, ordem visual ou opções que **não** alteram os `name=` → basta
> republicar o site (6.1). Não precisa mexer no Apps Script.

### 5.2 Campos atuais (name → coluna)
`nps`, `Motivo da nota`, `Mais valoriza`, `Sensacao de trabalhar comigo`,
`O que ainda nao recebe`, `Dois maiores desafios`, `Precisa de ajuda`,
`Sentimento sobre o negocio`, `Sentimento sobre a parceria`, `Onde gostaria de apoio`,
`O que nao encontra no mercado`, `Investimento mensal`, `Depoimento`, `Espaco livre`,
`Nome`, `Empresa`.

### 5.3 Decisão de conteúdo já tomada
**Não usar checklist de serviços para o cliente marcar** — os clientes já contratam
vários, e listar soa como desconhecer o cliente. Interesse e disposição a pagar são
captados por perguntas **abertas** (Bloco 04).

---

## 6. Como PUBLICAR (colocar no ar depois de mudar)

### 6.1 Republicar o site (o `index.html`)
Esta pasta é um clone Git. Depois de editar o `index.html`:

**Pelo GitHub Desktop (recomendado):** o repositório é `~/Claude/NPS`. Ele mostra a
alteração → escreva um resumo → **Commit to main** → **Push origin**. ~1 min → no ar.

**Pelo terminal:**
```bash
cd ~/Claude/NPS
git add index.html
git commit -m "descreva a mudança"
git push origin main   # exige login do GitHub (feito pelo GitHub Desktop na 1ª vez)
```
O link continua o mesmo. Os arquivos privados (`.docx`, `.gs`, `STATUS.md`) não sobem,
graças ao `.gitignore`.

### 6.2 Republicar o backend (só se mexeu no `.gs`)
1. Google Sheets → **Extensões → Apps Script**.
2. Cole/edite o código → **Salvar** (Ctrl/Cmd+S).
3. Confira que compila: seletor de função (perto do ▶) deve listar `doPost` e `doGet`.
4. **Implantar → Gerenciar implantações → ✏️ → Versão: "Nova versão" → Implantar.**
   (Mantém a mesma URL. Só use "Nova implantação" se aceitar trocar a URL no HTML.)

> **Erro clássico** (já aconteceu): "Função de script não encontrada: doPost". Significa
> que a versão publicada é antiga OU o código não compila (algo colado errado). Solução:
> limpar tudo, colar o `.gs` inteiro de novo, salvar, e publicar **Nova versão**.

---

## 7. Como TESTAR

**Rápido (linha de comando):** envia uma resposta de teste direto ao backend.
```bash
URL="COLE_A_URL_/exec_AQUI"
curl -sL "$URL" -w "\n%{http_code}\n" \
  --data-urlencode "nps=10" \
  --data-urlencode "Nome=Teste" --data-urlencode "Empresa=Prassi"
# Sucesso = {"result":"ok"}
```
**Humano:** abra o link no celular, preencha, envie, confirme a tela "Recebido" e a
linha nova na aba "Respostas". Apague as linhas de teste depois (linha inteira, não o
cabeçalho).

---

## 8. Como CRIAR OUTRA pesquisa na mesma linha (clonar)

1. **Copie** esta pasta (ex.: `~/Claude/Pesquisa-Satisfacao-Cervejarias`).
2. **Backend novo:** crie uma **nova planilha** do Google → Apps Script → cole o `.gs`
   (ajuste `FIELDS` para as novas perguntas) → publique como App da Web → copie a URL `/exec`.
3. **HTML:** no `index.html` copiado, troque o `action=` pela nova URL, ajuste hero,
   textos e perguntas (mantendo as regras de marca da seção 4 e a regra de ouro 5.1).
4. **Novo repositório** no GitHub (ex.: `pesquisa_cervejarias`) → upload do `index.html`
   → **Settings → Pages → branch main /root** → gera o novo link.
5. Teste (seção 7) antes de divulgar.

> Dá para reaproveitar o mesmo repositório com várias pesquisas em subpastas
> (`/satisfacao/index.html`, `/pos-projeto/index.html`), cada uma com sua URL de Apps
> Script. O link fica `.../pesquisa_prassi/satisfacao/`.

---

## 9. Texto de convite (WhatsApp) — tom sóbrio, sem emoji

> Olá, [NOME]. Aqui é o Maurício, da Prassi.
>
> Estou ouvindo de perto os clientes que acompanho para aprimorar o nosso trabalho, e a
> sua opinião é uma das que mais me importam. É uma pesquisa breve (cerca de 4 minutos),
> que abre direto no navegador — no celular ou no computador. Pode responder com toda
> sinceridade, inclusive críticas.
>
> https://pesquisa.prassiengenharia.com.br/
>
> Obrigado pela parceria. — Maurício di Ferreira, Prassi Engenharia.

> Link curto opcional (TinyURL, alias `pesquisa-prassi`) → `tinyurl.com/pesquisa-prassi`.
> Cole o link no fim da mensagem para o WhatsApp gerar o cartão de pré-visualização.

---

## 10. Depois das respostas (o que fazer com os dados)

- **NPS = % Promotores (9–10) − % Detratores (0–6).** Neutros (7–8) não entram na conta.
  Fórmula no Google Sheets (nota na coluna B, a partir de B2):
  `=ROUND((COUNTIF(B2:B;">=9")-COUNTIFS(B2:B;"<=6";B2:B;">=0"))/COUNTA(B2:B)*100;0)`
- **Detratores primeiro:** retorno em até 48h — é o que mais fideliza.
- **Respostas abertas** ("o que ainda não recebe", "onde gostaria de apoio") = sua maior
  fonte de novos serviços.
- **Depoimentos** autorizados → provas sociais para site/propostas.
- Repita a cada 3–6 meses para acompanhar a tendência.

---

## 11. Pendências / ideias futuras

- [x] CRQ confirmado: **05303466** (corrigido no `index.html` e no manual de marca).
- [x] Domínio próprio no ar: **pesquisa.prassiengenharia.com.br** (HTTPS).
- [x] Notificação por e-mail a cada resposta (função `enviarEmail_`).
- [ ] (Opcional) Cartão de pré-visualização do WhatsApp com imagem — exige Open Graph
      (`og:image`) apontando para um PNG hospedado.
- [ ] (Opcional) Aba de cálculo automático de NPS e um painel no Looker Studio.
- [ ] Aplicar a mesma linha visual às demais pesquisas/produtos Prassi.
