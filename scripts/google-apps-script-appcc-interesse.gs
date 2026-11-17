/**
 * KIT APPCC · LISTA DO LANÇAMENTO — backend de appcc-interesse/index.html
 * Endereço: pesquisa.prassiengenharia.com.br/appcc-interesse/
 * Origens: DM da Emy no Instagram (?origem=instagram) e QR do deck do treinamento APPCC.
 *
 * Grava cada inscrição na aba "Interessados" e manda um e-mail ao Maurício.
 * Assunto ganha [LEAD] quando a pessoa quer implantar com a Prassi ou começar em até 3 meses.
 *
 * Publicar: Implantar > Nova implantação > App da Web · Executar como: eu · Acesso: Qualquer pessoa.
 * Mudou o código depois? Gerenciar implantações > lápis > Versão: Nova versão > Implantar
 * (NÃO criar "Nova implantação": muda a URL /exec e quebra o formulário).
 */

var NOTIFY_EMAIL = 'mauriciodiferreira@prassiengenharia.com.br';

// Ordem das colunas: [name do campo no HTML, título na planilha]
var FIELDS = [
  ['Origem',                'Origem'],
  ['Nome',                  'Nome'],
  ['Cervejaria',            'Cervejaria'],
  ['Email',                 'E-mail'],
  ['WhatsApp',              'WhatsApp'],
  ['Cidade UF',             'Cidade/UF'],
  ['Interesse kit',         'Quer o kit'],
  ['Interesse implantacao', 'Quer implantar com a Prassi'],
  ['Interesse treinamento', 'Quer treinamento'],
  ['Quando comecar',        'Quando quer começar'],
  ['BPF e POPs',            'BPF e POPs hoje'],
  ['Produto',               'Produto'],
  ['Coordenador',           'Quem coordenaria'],
  ['Receio',                'Maior receio'],
  ['Consentimento',         'Consentimento LGPD']
];

function doPost(e) {
  // Robô que preencheu o campo escondido: responde ok e não grava.
  if (e.parameter._gotcha) return json_({ result: 'ok' });

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Interessados') || ss.insertSheet('Interessados');

    if (sheet.getLastRow() === 0) {
      var header = ['Data/Hora'];
      FIELDS.forEach(function (f) { header.push(f[1]); });
      sheet.appendRow(header);
      sheet.getRange(1, 1, 1, header.length).setFontWeight('bold')
        .setBackground('#143779').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }

    var row = [new Date()];
    FIELDS.forEach(function (f) {
      var v = e.parameters[f[0]];
      row.push(v ? v.join(', ') : '');
    });
    sheet.appendRow(row);

    try { enviarEmail_(e, ss); } catch (mailErr) {}
    return json_({ result: 'ok' });
  } catch (err) {
    return json_({ result: 'error', error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function esc_(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function enviarEmail_(e, ss) {
  function val(name) { return e.parameters[name] ? e.parameters[name].join(', ') : ''; }

  var nome = val('Nome') || '(sem nome)';
  var cervejaria = val('Cervejaria');
  var email = val('Email');
  var implantar = val('Interesse implantacao') === 'Sim';
  var quando = val('Quando comecar');
  var quente = implantar || quando === 'Agora' || quando === 'Nos proximos 3 meses';

  var faixaLead = quente
    ? '<div style="background:#F1DCC6;border-left:4px solid #BF5C3B;padding:10px 14px;margin:0 0 14px;color:#4a3a2c">' +
      '<b style="color:#BF5C3B">OPORTUNIDADE</b>' +
      (implantar ? ' &middot; quer implantar com a Prassi' : '') +
      (quando ? '<br>Quando quer começar: <b>' + esc_(quando) + '</b>' : '') +
      '</div>'
    : '';

  var linhas = FIELDS.map(function (f) {
    var v = val(f[0]);
    return v ? ('<p style="margin:4px 0"><b style="color:#143779">' + f[1] + ':</b> ' + esc_(v) + '</p>') : null;
  }).filter(function (x) { return x; }).join('');

  var assunto = '[APPCC] Novo interessado - ' + nome + (cervejaria ? ' - ' + cervejaria : '') +
                (quente ? ' [LEAD]' : '');

  var corpo =
    '<div style="font-family:Georgia,serif;font-size:15px;color:#1a2333;max-width:600px">' +
      '<h2 style="color:#143779;margin:0 0 4px">Nova inscrição na lista do Kit APPCC</h2>' +
      '<p style="margin:0 0 14px;color:#657B8C">' + esc_(nome) + (cervejaria ? ' &middot; ' + esc_(cervejaria) : '') +
      ' &middot; origem: ' + esc_(val('Origem') || 'direto') + '</p>' +
      faixaLead + linhas +
      '<hr style="border:none;border-top:1px solid #e6d6c2;margin:16px 0">' +
      '<a href="' + ss.getUrl() + '" style="color:#BF5C3B;text-decoration:none">Abrir a planilha de inscritos &rarr;</a>' +
    '</div>';

  var msg = { to: NOTIFY_EMAIL, subject: assunto, htmlBody: corpo };
  if (email) msg.replyTo = email;   // responder o e-mail = responder a pessoa
  MailApp.sendEmail(msg);
}

function doGet() {
  return ContentService.createTextOutput('Kit APPCC Prassi - lista do lancamento - endpoint ativo.');
}
