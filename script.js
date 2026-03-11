var dadosFiltradosAtuais = [];
var agenciasGlobais = [], dadosPagosGlobais = [], historicoGlobal = [], equipeGlobal = [], clientesGlobais = [];
var dadosGeraisRelatorio = []; 

// --- 1. CONFIGURAÇÃO DA PONTE (GITHUB -> GOOGLE) ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxbYi7t7TjEi0TX750IzWDwy5QGBXKIqcRAOZ8ZLEvMHwqvoyIT_4jfrE2vFSU2EU16/exec"; // <--- COLOQUE SEU LINK /exec AQUI

async function chamarGoogle(acao, dadosExtras = {}) {
  const email = localStorage.getItem("user_email");
  
  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      // ATENÇÃO: Removemos o bloco "headers" com o Authorization.
      // Isso elimina o erro de CORS imediatamente.
      body: JSON.stringify({ 
        acao: acao, 
        email: email, 
        dados: dadosExtras 
      })
    });
    
    return await response.json();
  } catch (erro) {
    console.error("Erro na chamada Google:", erro);
    mostrarToast("❌ Erro de conexão com o servidor", "erro");
  }
}



// --- 3. UTILITÁRIOS ---
function formatarMoeda(e) {
  var v = e.value.replace(/\D/g, ''); if (v === "") return;
  v = (v / 100).toFixed(2) + ''; v = v.replace(".", ","); v = v.replace(/(\d)(\d{3})(?=\,)/g, "$1.$2");
  e.value = v;
}

function converterParaFloat(t) {
  if (!t) return 0;
  if (typeof t === 'number') return t;
  let val = String(t).trim().replace("R$", "").trim();
  if (val.includes(",") && val.includes(".")) return parseFloat(val.replace(/\./g, "").replace(",", "."));
  if (val.includes(",")) return parseFloat(val.replace(",", "."));
  return parseFloat(val) || 0;
}

function extrairMesAno(dataStr) {
  if (!dataStr) return "";
  if (dataStr.includes("-")) return dataStr.substring(0, 7);
  if (dataStr.includes("/")) {
    var partes = dataStr.split("/");
    if (partes.length === 3) return partes[2] + "-" + partes[1];
  }
  return "";
}

function mudarAba(aba) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('btn-tab-' + aba).classList.add('active');
  document.getElementById('content-' + aba).classList.add('active');
}

// --- 4. NAVEGAÇÃO E PORTARIA ---
async function validarPortaria(resposta) {
  if (resposta && resposta.liberado === true) {
    const resDados = await chamarGoogle("carregarDadosIniciais");
    montarApp(resDados.dados); 
  } else {
    document.getElementById('tela-loading').style.display = 'none';
    document.getElementById('email-bloqueado').innerText = (resposta && resposta.email) || "não identificado";
    
    // Essa linha abaixo preenche o novo <p> que criamos no HTML
    const msgErro = (resposta && resposta.motivo) ? resposta.motivo : "E-mail sem licença ativa.";
    document.getElementById('motivo-bloqueio').innerText = msgErro;
    
    document.getElementById('tela-bloqueio').style.display = 'block';
  }
}

async function voltarDashboard() {
  document.querySelectorAll('.container-app > div').forEach(d => d.style.display = 'none');
  document.getElementById('tela-app').style.display = 'block';
  const res = await chamarGoogle("carregarDadosIniciais");
  document.getElementById('valor-pendente').innerText = "R$ " + res.dados.pendente;
}

function montarApp(dados) {
  document.getElementById('tela-loading').style.display = 'none'; 
  document.querySelectorAll('.container-app > div:not(#tela-loading)').forEach(d => d.style.display = 'none');
  document.getElementById('tela-app').style.display = 'block';
  document.getElementById('valor-pendente').innerText = "R$ " + dados.pendente;
  atualizarSelectsFormulario(dados);
}

function atualizarSelectsFormulario(d) {
  var selServ = document.getElementById('tipoServico');
  if (selServ) {
    selServ.innerHTML = '<option value="" disabled selected>O que foi feito?</option>';
    if(d.tiposServico) d.tiposServico.forEach(s => selServ.innerHTML += `<option value="${s}">${s}</option>`);
  }
  var selAg = document.getElementById('agencia');
  if (selAg) {
    selAg.innerHTML = '<option value="" disabled selected>Escolha...</option>';
    if(d.agencias) d.agencias.forEach(a => selAg.innerHTML += `<option value="${a.nome}">${a.nome}</option>`);
  }
  var selEq = document.getElementById('interprete');
  if (selEq) {
    selEq.innerHTML = '<option value="" disabled selected>Quem executou?</option>';
    if(d.equipe) d.equipe.forEach(e => selEq.innerHTML += `<option value="${e}">${e}</option>`);
  }
  var dl = document.getElementById('listaEmpresasDatalist');
  if (dl) {
    dl.innerHTML = "";
    if (d.clientes) d.clientes.forEach(c => dl.innerHTML += `<option value="${c}">`);
  }
  agenciasGlobais = d.agencias;
  equipeGlobal = d.equipe;
  clientesGlobais = d.clientes;
}

// --- 5. REGISTROS ---
function abrirRegistro(linha = "", dados = null) {
  document.getElementById('tela-app').style.display = 'none'; 
  document.getElementById('tela-registro').style.display = 'block';
  document.getElementById('linha-edicao').value = linha;
  if (linha === "") {
    document.getElementById('formRegistro').reset(); 
    document.getElementById('data').valueAsDate = new Date();
    document.getElementById('valor-live-preview').innerText = "R$ 0,00";
  } else {
    document.getElementById('data').value = dados.dataOriginal; 
    document.getElementById('agencia').value = dados.agencia;
    document.getElementById('empresa').value = dados.empresa; 
    document.getElementById('inicio').value = dados.inicio;
    document.getElementById('fim').value = dados.fim; 
    document.getElementById('interprete').value = dados.interprete;
    document.getElementById('tipoServico').value = dados.tipoServico || "";
    document.getElementById('valor-base').value = dados.valor.replace("R$ ", "").trim(); 
    document.getElementById('obs').value = dados.obs;
    document.getElementById('status-antigo').value = dados.status; 
    document.getElementById('data-pgto-antiga').value = dados.dataPgto;
  } 
  calcularTotalLive();
}

function aoMudarAgencia() {
  var ag = document.getElementById('agencia').value;
  var obj = agenciasGlobais.find(a => a.nome === ag);
  if (obj) { 
    var num = converterParaFloat(obj.valor);
    document.getElementById('valor-base').value = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    calcularTotalLive(); 
  }
}

function calcularTotalLive() {
  var tipo = document.querySelector('input[name="tipoCobranca"]:checked').value;
  var campoValor = document.getElementById('valor-base');
  var vI = converterParaFloat(campoValor.value);
  var p = document.getElementById('valor-live-preview');
  var hI = document.getElementById('inicio').value, hF = document.getElementById('fim').value;
  var horas = 0;
  if (hI && hF) {
    var dI = new Date(0,0,0,hI.split(":")[0], hI.split(":")[1]), dF = new Date(0,0,0,hF.split(":")[0], hF.split(":")[1]);
    if (dF < dI) dF.setDate(dF.getDate() + 1);
    horas = (dF - dI) / 3600000;
  }
  var agNome = document.getElementById('agencia').value;
  var objAg = agenciasGlobais.find(a => a.nome === agNome);
  var valorAgencia = objAg ? converterParaFloat(objAg.valor) : 0;
  if (tipo === "hora") {
    if (objAg && vI !== valorAgencia && vI > valorAgencia) {
       vI = valorAgencia;
       campoValor.value = vI.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    var subtotal = horas * vI;
    p.innerText = "R$ " + subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else {
    if (objAg && vI === valorAgencia && horas > 0) {
       vI = horas * valorAgencia;
       campoValor.value = vI.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    p.innerText = "R$ " + vI.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

async function enviarDados(e) {
  e.preventDefault(); 
  var btn = document.getElementById('btnSalvar');
  var textoOriginal = btn.innerText;
  btn.disabled = true;
  btn.innerText = "⏳ Salvando...";
  btn.style.opacity = "0.7";

  var d = {
    tipoServico: document.getElementById('tipoServico').value,
    data: document.getElementById('data').value, 
    agencia: document.getElementById('agencia').value, 
    empresa: document.getElementById('empresa').value,
    inicio: document.getElementById('inicio').value, 
    fim: document.getElementById('fim').value, 
    interprete: document.getElementById('interprete').value,
    valorFinal: document.getElementById('valor-live-preview').innerText.replace("R$ ", ""), 
    obs: document.getElementById('obs').value,
    statusAntigo: document.getElementById('status-antigo').value || "Pendente", 
    dataPgtoAntiga: document.getElementById('data-pgto-antiga').value || ""
  };
  
  var l = document.getElementById('linha-edicao').value;

  try {
    if (l === "") {
      await chamarGoogle("salvarRegistro", d);
      mostrarToast("✅ Salvo com sucesso!", "sucesso");
    } else {
      await chamarGoogle("atualizarRegistro", { linha: l, dados: d });
      mostrarToast("✅ Atualizado com sucesso!", "sucesso");
    }
    voltarDashboard();
  } catch (err) {
    btn.disabled = false;
    btn.innerText = textoOriginal;
    btn.style.opacity = "1";
    mostrarToast("❌ Erro ao salvar. Verifique sua conexão.", "erro");
  }
}

// --- 6. HISTÓRICO ---
async function abrirHistorico() { 
  document.querySelectorAll('.container-app > div').forEach(d => d.style.display = 'none');
  document.getElementById('tela-historico').style.display = 'block';
  document.getElementById('lista-html').innerHTML = '<div class="loader"></div>';
  document.getElementById('dataRecebimento').valueAsDate = new Date();
  const res = await chamarGoogle("buscarTodosServicos");
  renderizarHistorico(res.dados); 
}

function renderizarHistorico(l) {
  historicoGlobal = l;
  var c = document.getElementById('lista-html'); c.innerHTML = "";
  var fA = document.getElementById('filtroAgenciaHist'); fA.innerHTML = '<option value="todas">Todas</option>';
  var fI = document.getElementById('filtroInterpreteHist'); fI.innerHTML = '<option value="todos">Todos</option>';
  var agLidas = [], memLidos = []; 
  
  l.forEach(i => { 
    if(!agLidas.includes(i.agencia)){ agLidas.push(i.agencia); fA.innerHTML += `<option value="${i.agencia.toLowerCase()}">${i.agencia}</option>`; }
    if(!memLidos.includes(i.interprete)){ memLidos.push(i.interprete); fI.innerHTML += `<option value="${i.interprete.toLowerCase()}">${i.interprete}</option>`; }
    
    var p = i.status === "Pago";
    c.innerHTML += `<div class="item-pendente item-historico" style="border-left-color:${p?'#4CAF50':'#ff9800'}" 
      data-status="${p?'pago':'pendente'}" data-agencia="${i.agencia.toLowerCase()}" data-empresa="${i.empresa.toLowerCase()}" 
      data-interprete="${i.interprete.toLowerCase()}" data-data="${i.data}">
        <div style="display:flex; justify-content:space-between;"><strong>${i.agencia}</strong> <span style="font-size:11px; color:#9c27b0;">👤 ${i.interprete}</span></div>
        <span style="font-size:12px;">📅 ${i.data} - ${i.empresa}</span><br><strong>${i.valor}</strong>
        <div class="acoes-card">
          <button class="btn-acao btn-excluir" onclick="chamarExcluir(${i.linha})">🗑️</button>
          <button class="btn-acao btn-editar" onclick="chamarEditar(${i.linha})">✏️</button>
          ${p?'':`<button class="btn-acao btn-baixa" onclick="confirmarBaixa(${i.linha})">✔️</button>`}
        </div></div>`;
  }); 
  filtrarListaHistorico();
}

function filtrarListaHistorico() {
  var st = document.getElementById('filtroStatus').value, ag = document.getElementById('filtroAgenciaHist').value, 
      mem = document.getElementById('filtroInterpreteHist').value, cl = document.getElementById('filtroClienteHist').value.toLowerCase(), 
      dt = document.getElementById('filtroDataHist').value.toLowerCase();
  Array.from(document.getElementsByClassName('item-historico')).forEach(i => {
    var ok = (st==='todos'||i.dataset.status===st) && (ag==='todas'||i.dataset.agencia===ag) && 
             (mem==='todos'||i.dataset.interprete===mem) && (!cl||i.dataset.empresa.includes(cl)) && (!dt||i.dataset.data.includes(dt));
    i.style.display = ok ? 'block' : 'none';
  });
}

async function confirmarBaixa(l) { 
  var dt = document.getElementById('dataRecebimento').value; 
  if(!dt) return mostrarToast("⚠️ Selecione a data!", "erro"); 
  await chamarGoogle("darBaixaPagamento", { linha: l, data: dt });
  abrirHistorico();
}

async function chamarExcluir(l) { if(confirm("Excluir registro?")) { await chamarGoogle("excluirRegistro", l); abrirHistorico(); } }
function chamarEditar(l) { var i = historicoGlobal.find(x => x.linha === l); abrirRegistro(l, i); }

// --- 7. RELATÓRIOS ---
async function abrirRelatorios() { 
  document.querySelectorAll('.container-app > div').forEach(d => d.style.display = 'none');
  document.getElementById('tela-relatorios').style.display = 'block';
  document.getElementById('lista-relatorio').innerHTML = '<div class="loader"></div>';
  const res = await chamarGoogle("buscarTodosServicos");
  dadosGeraisRelatorio = res.dados; 
  var hj = new Date(); 
  document.getElementById('filtroMesRelatorio').value = hj.getFullYear() + "-" + ("0" + (hj.getMonth() + 1)).slice(-2);
  var sa = document.getElementById('filtroAgenciaRelatorio'); sa.innerHTML = '<option value="todas">Todas as Agências</option>';
  var sm = document.getElementById('filtroMembroRelatorio'); sm.innerHTML = '<option value="todos">Todos os Membros</option>';
  var lAg = [], lMem = [];
  res.dados.forEach(i => { 
    if(!lAg.includes(i.agencia)){ lAg.push(i.agencia); sa.innerHTML += `<option value="${i.agencia}">${i.agencia}</option>`; } 
    if(!lMem.includes(i.interprete)){ lMem.push(i.interprete); sm.innerHTML += `<option value="${i.interprete}">${i.interprete}</option>`; } 
  });
  gerarRelatorio();
}

function gerarRelatorio() {
    var tipo = document.getElementById('tipoRelatorio').value;
    var mesFiltro = document.getElementById('filtroMesRelatorio').value; 
    var agFiltro = document.getElementById('filtroAgenciaRelatorio').value; 
    var memFiltro = document.getElementById('filtroMembroRelatorio').value;
    var container = document.getElementById('lista-relatorio'); 
    var cFat = document.getElementById('valor-total-relatorio');
    var cHor = document.getElementById('horas-total-relatorio');
    
    container.innerHTML = ""; 
    var fTotal = 0, hTotal = 0;

    var filtrados = dadosGeraisRelatorio.filter(i => {
      var mesItem = tipo === 'nf' ? extrairMesAno(i.dataPgto) : extrairMesAno(i.dataOriginal);
      if (tipo === 'nf' && i.status !== "Pago") return false;
      return (mesFiltro === "" || mesItem === mesFiltro) && (agFiltro === "todas" || i.agencia === agFiltro) && (memFiltro === "todos" || i.interprete === memFiltro);
    });

    dadosFiltradosAtuais = filtrados; 
    if (filtrados.length === 0) {
      cFat.innerText = "R$ 0,00"; cHor.innerText = "0.00h";
      container.innerHTML = "<p style='text-align:center; color:#666; padding:20px;'>Nenhum dado encontrado.</p>";
      return;
    }

    filtrados.forEach(i => {
      fTotal += i.valorNum;
      if (i.inicio && i.fim) {
        var dI = new Date(0,0,0, i.inicio.split(":")[0], i.inicio.split(":")[1]), dF = new Date(0,0,0, i.fim.split(":")[0], i.fim.split(":")[1]);
        if (dF < dI) dF.setDate(dF.getDate() + 1);
        hTotal += (dF - dI) / 3600000;
      }
    });

    cFat.innerText = "R$ " + fTotal.toLocaleString('pt-BR', {minimumFractionDigits:2});
    cHor.innerText = hTotal.toFixed(2) + "h";

    if (tipo === 'nf') {
      var nfPorM = {}; 
      filtrados.forEach(it => { 
        if(!nfPorM[it.interprete]) nfPorM[it.interprete] = { t: 0, ags: {} }; 
        if(!nfPorM[it.interprete].ags[it.agencia]) nfPorM[it.interprete].ags[it.agencia] = { t: 0, items: [] }; 
        nfPorM[it.interprete].t += it.valorNum; 
        nfPorM[it.interprete].ags[it.agencia].t += it.valorNum; 
        nfPorM[it.interprete].ags[it.agencia].items.push(it); 
      });
      Object.keys(nfPorM).forEach(nome => {
        var h = `<div class="item-pendente" style="border-left: 5px solid #9c27b0; margin-bottom: 12px; padding-bottom: 8px;">
            <div style="display:flex; justify-content:space-between;"><strong>👤 ${nome}</strong><strong style="color:#2e7d32;">R$ ${nfPorM[nome].t.toLocaleString('pt-BR',{minimumFractionDigits:2})}</strong></div>
            <div style="font-size:12px; color:#666; margin-top:4px;">Total a emitir no período</div>`;
        Object.keys(nfPorM[nome].ags).forEach(ag => {
          h += `<details style="margin-top:10px; border-top:1px solid #eee; padding-top:8px;">
              <summary style="font-size:12px; color:#7b1fa2; cursor:pointer; font-weight:600;">🏢 ${ag} ➔ R$ ${nfPorM[nome].ags[ag].t.toLocaleString('pt-BR',{minimumFractionDigits:2})} 🔽</summary>
              <div style="margin-top:8px; background:#fafafa; padding:8px; border-radius:6px; border:1px solid #e0e0e0;">`;
          nfPorM[nome].ags[ag].items.forEach(it => {
            h += `<div style="font-size:11px; padding:4px 0; border-bottom:1px dashed #ccc; display:flex; justify-content:space-between;">
                <span>📅 ${it.data} - ${it.empresa}</span><span style="color:#2e7d32; font-weight:bold;">R$ ${it.valorNum.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span></div>`;
          });
          h += `</div></details>`;
        });
        h += `</div>`; container.innerHTML += h;
      });
    } else {
      var pM = {};
      filtrados.forEach(i => {
        if(!pM[i.interprete]) pM[i.interprete] = {h:0, jobs:0, fat:0, list: []};
        var diff = 0;
        if(i.inicio && i.fim) {
          var dI = new Date(0,0,0, i.inicio.split(":")[0], i.inicio.split(":")[1]), dF = new Date(0,0,0, i.fim.split(":")[0], i.fim.split(":")[1]);
          if (dF < dI) dF.setDate(dF.getDate() + 1);
          diff = (dF - dI) / 3600000;
        }
        pM[i.interprete].h += diff; pM[i.interprete].jobs++; pM[i.interprete].fat += i.valorNum;
        i.hCalc = diff; pM[i.interprete].list.push(i);
      });
      Object.keys(pM).forEach(nome => {
        var h = `<div class="item-pendente" style="border-left:5px solid #2196F3; margin-bottom:12px; padding-bottom:8px;">
            <div style="display:flex; justify-content:space-between;"><strong>👤 ${nome}</strong><strong style="color:#1a237e;">${pM[nome].h.toFixed(2)}h</strong></div>
            <div style="font-size:12px; color:#666; margin-top:4px; display:flex; justify-content:space-between;">
              <span>${pM[nome].jobs} atendimentos</span><span style="color:#2e7d32; font-weight:bold;">R$ ${pM[nome].fat.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span></div>
            <details style="margin-top:10px; border-top:1px solid #eee; padding-top:8px;">
              <summary style="font-size:12px; color:#1976d2; cursor:pointer;">Ver Detalhamento 🔽</summary>
              <div style="margin-top:8px; background:#f8f9fa; padding:8px; border-radius:6px; border:1px solid #e0e0e0;">`;
        pM[nome].list.forEach(it => {
          h += `<div style="font-size:11px; padding:6px 0; border-bottom:1px dashed #ccc;">
              <div style="display:flex; justify-content:space-between;"><strong>📅 ${it.data} - ${it.empresa}</strong><span style="color:#d32f2f;">⏱️ ${it.hCalc.toFixed(2)}h</span></div>
              <div style="display:flex; justify-content:space-between; color:#555;"><span>🏢 ${it.agencia}</span><span style="color:#2e7d32;">R$ ${it.valorNum.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span></div></div>`;
        });
        h += `</div></details></div>`; container.innerHTML += h;
      });
    }
}

function copiarResumo() { 
  var tipo = document.getElementById('tipoRelatorio').value, mes = document.getElementById('filtroMesRelatorio').value, txt = "";
  if (dadosFiltradosAtuais.length === 0) return mostrarToast("⚠️ Nada para copiar!", "erro");
  if (tipo === 'nf') {
    txt += `*RESUMO PARA NOTA FISCAL*\nReferência: ${mes || 'Geral'}\n\n`;
    var nf = {};
    dadosFiltradosAtuais.forEach(i => {
      if(!nf[i.interprete]) nf[i.interprete] = { t: 0, ags: {} };
      if(!nf[i.interprete].ags[i.agencia]) nf[i.interprete].ags[i.agencia] = 0;
      nf[i.interprete].ags[i.agencia] += i.valorNum; nf[i.interprete].t += i.valorNum;
    });
    Object.keys(nf).forEach(m => {
      txt += `👤 *${m}*\n💰 Total: R$ ${nf[m].t.toLocaleString('pt-BR',{minimumFractionDigits:2})}\n`;
      Object.keys(nf[m].ags).forEach(a => txt += ` 🏢 ${a}: R$ ${nf[m].ags[a].toLocaleString('pt-BR',{minimumFractionDigits:2})}\n`);
      txt += `\n`;
    });
  } else {
    txt += `*CONFIRMAÇÃO DE PRODUTIVIDADE*\nPeríodo: ${mes || 'Geral'}\n\n`;
    var p = {};
    dadosFiltradosAtuais.forEach(i => {
      if(!p[i.interprete]) p[i.interprete] = {h:0, f:0, items:[]};
      var d = 0;
      if(i.inicio && i.fim) {
        var dI = new Date(0,0,0, i.inicio.split(":")[0], i.inicio.split(":")[1]), dF = new Date(0,0,0, i.fim.split(":")[0], i.fim.split(":")[1]);
        if (dF < dI) dF.setDate(dF.getDate() + 1); d = (dF - dI) / 3600000;
      }
      p[i.interprete].h += d; p[i.interprete].f += i.valorNum;
      p[i.interprete].items.push(`📅 ${i.data} | ${i.inicio}-${i.fim} | ${i.empresa} (${i.agencia}) - R$ ${i.valorNum.toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
    });
    Object.keys(p).forEach(m => {
      txt += `👤 *${m}* | ⏱️ ${p[m].h.toFixed(2)}h | R$ ${p[m].f.toLocaleString('pt-BR',{minimumFractionDigits:2})}\n`;
      p[m].items.forEach(it => txt += ` ${it}\n`); txt += `\n`;
    });
  }
  navigator.clipboard.writeText(txt).then(() => mostrarToast("📋 Copiado para o WhatsApp!"));
}

function baixarImagemRelatorio() {
  var btn = document.getElementById('btnBaixarImagem'), orig = btn.innerHTML;
  btn.innerHTML = "⏳ Gerando Foto..."; btn.disabled = true;
  document.querySelectorAll('details').forEach(d => d.open = true);
  var el = document.querySelector('#tela-relatorios .card');
  html2canvas(el, { scale: 2 }).then(canvas => {
    var link = document.createElement('a');
    link.download = `Relatorio_InterpretePro_${document.getElementById('filtroMesRelatorio').value}.png`;
    link.href = canvas.toDataURL('image/png'); link.click();
    btn.innerHTML = orig; btn.disabled = false; mostrarToast("🖼️ Imagem salva!");
  }).catch(() => { btn.innerHTML = orig; btn.disabled = false; mostrarToast("❌ Erro ao gerar imagem", "erro"); });
}

// --- 8. CONFIGURAÇÕES ---
async function abrirConfiguracoes() {
  // 1. Mostra o loading primeiro
  document.getElementById('tela-app').style.display = 'none';
  document.getElementById('tela-loading').style.display = 'flex';

  try {
    // 2. Busca os dados (APENAS UMA VEZ!)
    const res = await chamarGoogle("buscarConfigAgencias");
    const d = res.dados;
    
    // 3. Esconde o loading e mostra os ajustes
    document.getElementById('tela-loading').style.display = 'none';
    document.getElementById('tela-configuracoes').style.display = 'block';
    
    // --- RENDERIZAÇÃO DAS LISTAS ---
    var cs = document.getElementById('lista-servicos-ui'); cs.innerHTML = "";
    if(d.tiposServico) d.tiposServico.forEach(s => cs.innerHTML += `<div class="item-pendente item-config-flex" style="border-left-color:#546e7a"><strong>${s}</strong><div><button class="btn-acao btn-editar" onclick="editarConfig('servico','${s}')">✏️</button><button class="btn-acao btn-excluir" onclick="excluirConfig('Tipos_Servico','${s}')">🗑️</button></div></div>`);
    
    var ce = document.getElementById('lista-equipe-ui'); ce.innerHTML = "";
    if(d.equipe) d.equipe.forEach(n => ce.innerHTML += `<div class="item-pendente item-config-flex" style="border-left-color:#9c27b0"><strong>${n}</strong><div><button class="btn-acao btn-editar" onclick="editarConfig('equipe','${n}')">✏️</button><button class="btn-acao btn-excluir" onclick="excluirConfig('Minha_Equipe','${n}')">🗑️</button></div></div>`);
    
    var ca = document.getElementById('lista-configuracoes'); ca.innerHTML = "";
    if(d.agencias) d.agencias.forEach(i => ca.innerHTML += `<div class="item-pendente item-config-flex" style="border-left-color:#607d8b"><strong>${i.nome}</strong> - R$ ${i.valor}<div><button class="btn-acao btn-editar" onclick="editarConfig('agencia','${i.nome}','${i.valor}')">✏️</button><button class="btn-acao btn-excluir" onclick="excluirConfig('Minhas_Empresas','${i.nome}')">🗑️</button></div></div>`);
    
    var cl = document.getElementById('lista-clientes-ui'); cl.innerHTML = "";
    if(d.clientes) d.clientes.forEach(n => cl.innerHTML += `<div class="item-pendente item-config-flex" style="border-left-color:#FF9800"><strong>${n}</strong><div><button class="btn-acao btn-editar" onclick="editarConfig('cliente','${n}')">✏️</button><button class="btn-acao btn-excluir" onclick="excluirConfig('Minhas_Empresas_Finais','${n}')">🗑️</button></div></div>`);
    
    atualizarSelectsFormulario(d);
  } catch (erro) {
    console.error("Erro ao carregar configurações:", erro);
    mostrarToast("❌ Erro ao buscar dados do servidor", "erro");
    voltarDashboard();
  }
}

// ADICIONE ESTA NOVA FUNÇÃO NO FINAL DO script.js
function editarConfig(tipo, nome, valor = "") {
  if (tipo === 'servico') { document.getElementById('servico-antigo').value = nome; document.getElementById('configServicoNome').value = nome; }
  if (tipo === 'equipe') { document.getElementById('equipe-antigo').value = nome; document.getElementById('configEquipeNome').value = nome; }
  if (tipo === 'cliente') { document.getElementById('cliente-antigo').value = nome; document.getElementById('configClienteNome').value = nome; }
  if (tipo === 'agencia') { document.getElementById('agencia-antigo').value = nome; document.getElementById('configNome').value = nome; document.getElementById('configValor').value = valor; }
  window.scrollTo(0,0); // Sobe a tela para o formulário
}

// --- SALVAR AGÊNCIA (Editando ou Criando) ---
async function salvarAgencia(e) { 
  e.preventDefault(); 
  const nomeNovo = document.getElementById('configNome').value;
  const valorNovo = document.getElementById('configValor').value;
  const nomeAntigo = document.getElementById('agencia-antigo').value; // Pega o que estava no hidden

  mostrarToast("Salvando agência...");
  await chamarGoogle("salvarConfigAgencia", { 
    nome: nomeNovo, 
    valor: valorNovo, 
    antigo: nomeAntigo 
  });

  document.getElementById('formConfig').reset(); 
  document.getElementById('agencia-antigo').value = ""; // Limpa para o próximo
  abrirConfiguracoes(); 
}

// --- SALVAR EQUIPE ---
async function salvarEquipe(e) {
  e.preventDefault();
  const nomeNovo = document.getElementById('configEquipeNome').value;
  const nomeAntigo = document.getElementById('equipe-antigo').value;

  mostrarToast("Salvando membro...");
  await chamarGoogle("salvarMembroEquipe", { 
    nome: nomeNovo, 
    antigo: nomeAntigo 
  });

  document.getElementById('formEquipe').reset(); 
  document.getElementById('equipe-antigo').value = "";
  abrirConfiguracoes();
}

// --- SALVAR CLIENTE ---
async function salvarCliente(e) {
  e.preventDefault();
  const nomeNovo = document.getElementById('configClienteNome').value;
  const nomeAntigo = document.getElementById('cliente-antigo').value;

  mostrarToast("Salvando cliente...");
  await chamarGoogle("salvarEmpresaFinal", { 
    nome: nomeNovo, 
    antigo: nomeAntigo 
  });

  document.getElementById('formClientes').reset(); 
  document.getElementById('cliente-antigo').value = "";
  abrirConfiguracoes();
}

// --- SALVAR TIPO DE SERVIÇO ---
async function salvarTipoServico(e) {
  e.preventDefault();
  const nomeNovo = document.getElementById('configServicoNome').value;
  const nomeAntigo = document.getElementById('servico-antigo').value;

  mostrarToast("Salvando serviço...");
  await chamarGoogle("salvarTipoServico", { 
    nome: nomeNovo, 
    antigo: nomeAntigo 
  });

  document.getElementById('formServicos').reset(); 
  document.getElementById('servico-antigo').value = "";
  abrirConfiguracoes();
}

// Melhore a exclusão para não deletar sem querer no celular
async function excluirConfig(aba, valor) {
  if(!confirm(`Tem certeza que deseja excluir "${valor}"?`)) return;
  
  mostrarToast("Excluindo...");
  const res = await chamarGoogle("excluirConfig", { aba: aba, valor: valor });
  if(res.status === "Sucesso") {
    abrirConfiguracoes(); // Recarrega a lista
    mostrarToast("✅ Excluído com sucesso");
  }
}

function mostrarToast(mensagem, tipo = 'sucesso') {
  var container = document.getElementById('toast-container');
  var toast = document.createElement('div');
  toast.className = 'toast ' + tipo; toast.innerText = mensagem;
  container.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 3000);
}

// Função para sair do sistema
function logout() {
  document.getElementById('modal-logout').style.display = 'flex';
}

function fecharModalLogout() {
  document.getElementById('modal-logout').style.display = 'none';
}

function confirmarLogout() {
  localStorage.clear();
  location.reload();
}

// Verifica login automático quando a página carrega
window.onload = () => {
  const token = localStorage.getItem("google_access_token");
  const email = localStorage.getItem("user_email");
  // Se já existe e-mail salvo, entra direto pulando o checkbox
  if (token && email) {
    handleSaaSLogin(email);
  }
};


// Funções para o Modal de Termos
function abrirModalTermos(e) {
  e.preventDefault();
  document.getElementById('modal-termos').style.display = 'flex';
}

function fecharModalTermos() {
  document.getElementById('modal-termos').style.display = 'none';
}

// AJUSTE NA FUNÇÃO DE LOGIN EXISTENTE
// AJUSTE FINAL: Compatível com o botão azul e login automático
async function handleSaaSLogin(email) {
  // 1. Só verifica o checkbox se a tela de login estiver visível (evita travar o login automático)
  const telaLogin = document.getElementById('tela-login-google');
  if (telaLogin.style.display !== 'none') {
    const aceito = document.getElementById('aceito-termos').checked;
    if (!aceito) {
      fecharModalTermos();
      mostrarToast("⚠️ Você precisa aceitar os Termos de Uso para entrar.", "erro");
      return; 
    }
  }

  // 2. Prossiga com o login
  document.getElementById('tela-loading').style.display = 'flex';
  telaLogin.style.display = 'none';
  
  // O e-mail já vem como parâmetro, não precisa de 'response.credential'
  localStorage.setItem("user_email", email);

  try {
    const res = await chamarGoogle("verificarAcesso");
    validarPortaria(res);
  } catch (e) {
    console.error("Erro no Login:", e);
    mostrarToast("❌ Falha na comunicação.", "erro");
    telaLogin.style.display = 'block';
    document.getElementById('tela-loading').style.display = 'none';
  }
}
