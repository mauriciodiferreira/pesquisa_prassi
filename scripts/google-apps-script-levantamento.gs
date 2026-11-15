/**
 * LEVANTAMENTO DE DADOS DO CLIENTE (LEV-001) — backend do formulário levantamento/index.html
 *
 * Diferente das pesquisas: o cliente preenche aos poucos e a página SALVA SOZINHA.
 * Cada cliente tem um código (token) no link: .../levantamento/?c=<token>
 *
 * Abas da planilha (criadas sozinhas na 1ª execução de instalar()):
 *   Clientes      — VOCÊ preenche: token | cliente | config (JSON com alertas e perguntas extras)
 *   Respostas     — 1 linha por cliente, com o JSON completo e a data da última gravação
 *   Perguntas, Equipe, Metas, Equipamentos, Instrumentos, Documentos — versão legível,
 *                   reescrita a cada gravação (linhas do cliente apagadas e regravadas)
 *
 * Publicar: Implantar → Nova implantação → App da Web · Executar como: eu · Acesso: Qualquer pessoa.
 * Mudou o código depois? Gerenciar implantações → lápis → Versão: Nova versão → Implantar
 * (NÃO criar "Nova implantação": muda a URL /exec e quebra o link da página).
 */

var NOTIFY_EMAIL = 'mauriciodiferreira@prassiengenharia.com.br';

var ABAS = {
  Clientes:     ['Token', 'Cliente', 'Config (JSON)', 'Criado em'],
  Respostas:    ['Token', 'Cliente', 'Status', 'Atualizado em', 'Respondente', 'E-mail', 'JSON'],
  Perguntas:    ['Token', 'Cliente', 'Nº', 'Tema', 'Pergunta', 'Resposta', 'Arquivo enviado?'],
  Equipe:       ['Token', 'Cliente', 'Nome completo', 'Cargo', 'Função / atividades', 'Papel no programa de BPF', 'Admissão', 'Capacitação em BPF'],
  Metas:        ['Token', 'Cliente', 'Meta', 'Sugestão da Prassi', 'Decisão', 'Outro valor', 'Observação'],
  Equipamentos: ['Token', 'Cliente', 'Tipo', 'Descrição', 'Fabricante e modelo', 'Capacidade', 'Unidade', 'Quantidade', 'Refrigeração', 'Ano / nº de série', 'Observações'],
  Instrumentos: ['Token', 'Cliente', 'Instrumento', 'TAG', 'Local de uso', 'Faixa e resolução', 'Fabricante e modelo', 'Última calibração', 'Laboratório / certificado', 'Observações'],
  Documentos:   ['Token', 'Cliente', 'Documento', 'Enviado?', 'Data do envio', 'Observação']
};

function instalar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(ABAS).forEach(function (nome) {
    var sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
    if (sh.getLastRow() === 0) {
      sh.appendRow(ABAS[nome]);
      sh.getRange(1, 1, 1, ABAS[nome].length).setFontWeight('bold')
        .setBackground('#143779').setFontColor('#FFFFFF');
      sh.setFrozenRows(1);
    }
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function cliente_(token) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clientes');
  if (!sh || !token) return null;
  var v = sh.getDataRange().getValues();
  for (var i = 1; i < v.length; i++) {
    if (String(v[i][0]).trim() === token) {
      var cfg = {};
      try { cfg = JSON.parse(v[i][2] || '{}'); } catch (e) {}
      return { cliente: v[i][1], config: cfg };
    }
  }
  return null;
}

function linhaResposta_(sh, token) {
  var v = sh.getDataRange().getValues();
  for (var i = 1; i < v.length; i++) if (v[i][0] === token) return i + 1;
  return 0;
}

// GET ?c=<token> → configuração do cliente + respostas já salvas
function doGet(e) {
  instalar();
  var token = (e.parameter.c || '').trim();
  var c = cliente_(token);
  if (!c) return json_({ ok: false, erro: 'codigo-invalido' });
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Respostas');
  var lin = linhaResposta_(sh, token), respostas = null, status = '', atualizado = '';
  if (lin) {
    var r = sh.getRange(lin, 1, 1, 7).getValues()[0];
    status = r[2]; atualizado = r[3];
    try { respostas = JSON.parse(r[6]); } catch (err) {}
  }
  return json_({ ok: true, cliente: c.cliente, config: c.config, respostas: respostas, status: status, atualizado: atualizado });
}

// POST acao=salvar|concluir · c=<token> · payload=<JSON>
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    instalar();
    var p = e.parameter, token = (p.c || '').trim();
    var c = cliente_(token);
    if (!c) return json_({ ok: false, erro: 'codigo-invalido' });
    var d = JSON.parse(p.payload || '{}');
    var agora = new Date();
    var status = p.acao === 'concluir' ? 'Concluído' : 'Em preenchimento';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1) Respostas — upsert da linha do cliente (JSON completo)
    var sh = ss.getSheetByName('Respostas');
    var linha = [token, c.cliente, status, agora, (d.contato || {}).nome || '', (d.contato || {}).email || '', JSON.stringify(d)];
    var lin = linhaResposta_(sh, token);
    if (lin) {
      var anterior = sh.getRange(lin, 3).getValue();
      if (anterior === 'Concluído' && status !== 'Concluído') linha[2] = 'Concluído · editado depois';
      sh.getRange(lin, 1, 1, linha.length).setValues([linha]);
    } else sh.appendRow(linha);

    // 2) Abas legíveis — apaga as linhas do cliente e regrava
    var base = [token, c.cliente];
    reescrever_(ss, 'Perguntas', token, (d.perguntas || []).map(function (q) { return base.concat([q.n, q.tema, q.pergunta, q.resposta, q.arquivo]); }));
    reescrever_(ss, 'Equipe', token, (d.equipe || []).map(function (r) { return base.concat([r.nome, r.cargo, r.funcao, r.papel, r.admissao, r.bpf]); }));
    reescrever_(ss, 'Metas', token, (d.metas || []).map(function (r) { return base.concat([r.meta, r.sugestao, r.decisao, r.outro, r.obs]); }));
    reescrever_(ss, 'Equipamentos', token, (d.equipamentos || []).map(function (r) { return base.concat([r.tipo, r.descricao, r.modelo, r.capacidade, r.unidade, r.quantidade, r.refrigeracao, r.serie, r.obs]); }));
    reescrever_(ss, 'Instrumentos', token, (d.instrumentos || []).map(function (r) { return base.concat([r.instrumento, r.tag, r.local, r.faixa, r.modelo, r.calibracao, r.laboratorio, r.obs]); }));
    reescrever_(ss, 'Documentos', token, (d.documentos || []).map(function (r) { return base.concat([r.documento, r.enviado, r.data, r.obs]); }));

    if (p.acao === 'concluir') enviarEmail_(c.cliente, token, d);
    return json_({ ok: true, status: linha[2], atualizado: agora });
  } catch (err) {
    return json_({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function reescrever_(ss, aba, token, linhas) {
  var sh = ss.getSheetByName(aba);
  var v = sh.getDataRange().getValues();
  for (var i = v.length - 1; i >= 1; i--) if (v[i][0] === token) sh.deleteRow(i + 1);
  linhas = linhas.filter(function (l) { return l.slice(2).some(function (x) { return String(x || '').trim() !== ''; }); });
  if (linhas.length) sh.getRange(sh.getLastRow() + 1, 1, linhas.length, linhas[0].length).setValues(linhas);
}

function enviarEmail_(cliente, token, d) {
  var vazias = (d.perguntas || []).filter(function (q) { return !String(q.resposta || '').trim(); }).length;
  var outras = (d.metas || []).filter(function (m) { return m.decisao === 'Outro valor'; });
  var url = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  var html = '<div style="font-family:Georgia,serif;color:#1a2333;max-width:620px">' +
    '<div style="background:#143779;color:#fff;padding:18px 22px;border-radius:6px 6px 0 0">' +
    '<div style="font-size:11px;letter-spacing:3px;color:#B3C0C9">LEVANTAMENTO DE DADOS</div>' +
    '<div style="font-size:22px;margin-top:6px">' + cliente + ' concluiu o levantamento</div></div>' +
    '<div style="border:1px solid #B3C0C9;border-top:none;padding:18px 22px;border-radius:0 0 6px 6px">' +
    '<p>Respondente: <b>' + ((d.contato || {}).nome || '—') + '</b> · ' + ((d.contato || {}).email || '') + '</p>' +
    '<p>Perguntas sem resposta: <b>' + vazias + '</b> · Funcionários: <b>' + (d.equipe || []).length +
    '</b> · Equipamentos: <b>' + (d.equipamentos || []).length + '</b> · Instrumentos: <b>' + (d.instrumentos || []).length + '</b></p>' +
    (outras.length ? '<div style="background:#F1DCC6;border-left:4px solid #BF5C3B;padding:10px 14px;margin:12px 0">' +
      '<b>Metas com valor próprio:</b><br>' + outras.map(function (m) { return m.meta + ': ' + m.outro; }).join('<br>') + '</div>' : '') +
    '<p><a href="' + url + '" style="color:#BF5C3B">Abrir a planilha</a> (código ' + token + ')</p></div></div>';
  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: '[LEVANTAMENTO] ' + cliente + ' — concluído' + (vazias ? ' (' + vazias + ' sem resposta)' : ''), htmlBody: html });
}
