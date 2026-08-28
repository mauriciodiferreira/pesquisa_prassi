# NPS — pesquisa de relacionamento com clientes

Herda `~/Claude/CLAUDE.md`.

**O que é.** Pesquisa NPS da Prassi: página estática publicada no **GitHub Pages**
(repositório `mauriciodiferreira/pesquisa_prassi`) gravando respostas em **Google
Sheets** via Google Apps Script. Não usa Vercel nem banco próprio.

**Duas frentes na pasta:** raiz/`bpf/` (pesquisa geral e da trilha BPF) e
`agraria/` (feedback da palestra Agrária Malte, copiado de
`~/Claude/Apresentacao-CQ-Agraria/formulario/`).

**Ao mexer no Apps Script** (`scripts/google-apps-script.gs`, `scripts/google-apps-script-agraria.gs`):
o script precisa ser **republicado como nova versão** na interface do Google para
a mudança valer — editar o arquivo aqui não publica nada.

**CNAME** na raiz define o domínio do GitHub Pages — não apagar.
