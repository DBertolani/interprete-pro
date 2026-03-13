// ============================================
// CORREÇÕES JAVASCRIPT - IntérpretePro
// ============================================
// 
// Este arquivo contém os trechos que você deve PROCURAR NO SEU script.js
// e SUBSTITUIR pelas versões corrigidas abaixo.
//
// Procure pelo nome da função e substitua todo o bloco.

// ============================================
// 1. FUNÇÃO: renderizarListasConfig
// ============================================
// LOCALIZAÇÃO: Procure por "function renderizarListasConfig"
// PROPÓSITO: Renderizar listas de Serviços, Equipe, Agências e Clientes

function renderizarListasConfig(d) {
  // Serviços
  var cs = document.getElementById('lista-servicos-ui'); 
  cs.innerHTML = "";
  d.tiposServico.forEach(s => {
    cs.innerHTML += `<div class="item-pendente item-config-flex" style="border-left-color:#546e7a"><strong>${s}</strong><div style="display:flex; gap:8px; flex-shrink:0;"><button class="btn-acao btn-editar" onclick="editarConfig('servico','${s}')">✏️</button><button class="btn-acao btn-excluir" onclick="excluirConfig('Tipos_Servico','${s}')">🗑️</button></div></div>`;
  });
  
  // Equipe
  var ce = document.getElementById('lista-equipe-ui'); 
  ce.innerHTML = "";
  d.equipe.forEach(n => {
    ce.innerHTML += `<div class="item-pendente item-config-flex" style="border-left-color:#9c27b0"><strong>${n}</strong><div style="display:flex; gap:8px; flex-shrink:0;"><button class="btn-acao btn-editar" onclick="editarConfig('equipe','${n}')">✏️</button><button class="btn-acao btn-excluir" onclick="excluirConfig('Minha_Equipe','${n}')">🗑️</button></div></div>`;
  });
  
  // Agências - COM DESTAQUE PARA O VALOR
  var ca = document.getElementById('lista-configuracoes'); 
  ca.innerHTML = "";
  d.agencias.forEach(i => {
    const valorFormatado = parseFloat(i.valor).toLocaleString('pt-BR', {
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2
    });
    ca.innerHTML += `<div class="item-pendente item-config-flex" style="border-left-color:#607d8b;">
      <strong style="font-size: 15px; flex-shrink: 0;">${i.nome}</strong>
      <span class="valor-tag">R$ ${valorFormatado}</span>
      <div style="display: flex; gap: 8px; flex-shrink: 0;">
        <button class="btn-acao btn-editar" onclick="editarConfig('agencia','${i.nome}','${i.valor}')">✏️</button>
        <button class="btn-acao btn-excluir" onclick="excluirConfig('Minhas_Empresas','${i.nome}')">🗑️</button>
      </div>
    </div>`;
  });
  
  // Clientes
  var cl = document.getElementById('lista-clientes-ui'); 
  cl.innerHTML = "";
  d.clientes.forEach(n => {
    cl.innerHTML += `<div class="item-pendente item-config-flex" style="border-left-color:#FF9800"><strong>${n}</strong><div style="display:flex; gap:8px; flex-shrink:0;"><button class="btn-acao btn-editar" onclick="editarConfig('cliente','${n}')">✏️</button><button class="btn-acao btn-excluir" onclick="excluirConfig('Minhas_Empresas_Finais','${n}')">🗑️</button></div></div>`;
  });
}

// ============================================
// 2. FUNÇÃO: montarApp
// ============================================
// LOCALIZAÇÃO: Procure por "function montarApp(dados)"
// PROPÓSITO: Montar o Dashboard após login bem-sucedido

function montarApp(dados) {
  // 1. Esconde o loading
  document.getElementById('tela-loading').style.display = 'none'; 
  
  // 2. Esconde TUDO (para garantir limpeza completa)
  document.querySelectorAll('.container-app > div').forEach(d => d.style.display = 'none');
  
  // 3. MOSTRA APENAS O DASHBOARD (com flex para melhor altura)
  document.getElementById('tela-app').style.display = 'flex';
  
  // 4. Preenche os valores do usuário
  document.getElementById('valor-pendente').innerText = "R$ " + dados.pendente;
  atualizarSelectsFormulario(dados);

  // 5. Trava de segurança - só admin pode ver o botão Master
  const emailLogado = localStorage.getItem("user_email");
  const btnAdmin = document.getElementById('btn-tab-admin');
  if (btnAdmin) {
    btnAdmin.style.display = (emailLogado === "danilobertolani@gmail.com") ? 'block' : 'none';
  }
}

// ============================================
// 3. FUNÇÃO: handleSaaSLogin
// ============================================
// LOCALIZAÇÃO: Procure por "async function handleSaaSLogin(email)"
// PROPÓSITO: Processar login do Google e validar acesso

async function handleSaaSLogin(email) {
  const telaLogin = document.getElementById('tela-login-google');
  
  // 1. Validar checkbox apenas se a tela de login estiver visível
  if (telaLogin.style.display !== 'none' && telaLogin.style.display !== '') {
    const aceito = document.getElementById('aceito-termos').checked;
    if (!aceito) {
      fecharModalTermos();
      mostrarToast("⚠️ Você precisa aceitar os Termos de Uso para entrar.", "erro");
      return; 
    }
  }

  // 2. Buscar o nome do usuário e atualizar a tela de boas-vindas
  const nomeCompleto = localStorage.getItem("user_name");
  if (nomeCompleto && nomeCompleto !== "Usuário") {
    const primeiroNome = nomeCompleto.split(" ")[0];
    const spanNome = document.getElementById('nome-usuario-loading');
    if (spanNome) spanNome.innerText = primeiroNome;
  }

  // 3. Esconde tudo e mostra o loading centralizado
  document.querySelectorAll('.container-app > div').forEach(d => d.style.display = 'none');
  
  const loading = document.getElementById('tela-loading');
  loading.style.display = 'flex'; // Mostra como flexbox (centralizado)
  
  localStorage.setItem("user_email", email);

  // 4. Verifica acesso no backend
  try {
    const res = await chamarGoogle("verificarAcesso");
    validarPortaria(res);
  } catch (e) {
    console.error("Erro no Login:", e);
    mostrarToast("❌ Falha na comunicação.", "erro");
    
    // Se falhar, volta para a tela home
    loading.style.display = 'none';
    document.getElementById('tela-home').style.display = 'block';
  }
}

// ============================================
// 4. FUNÇÃO: abrirConfiguracoes
// ============================================
// LOCALIZAÇÃO: Procure por "function abrirConfiguracoes()"
// PROPÓSITO: Abrir tela de ajustes/configurações

function abrirConfiguracoes() {
  // 1. Abre a tela na hora (sem chamar o Google novamente)
  document.getElementById('tela-app').style.display = 'none';
  document.getElementById('tela-configuracoes').style.display = 'block';

  // 2. Usa dados já armazenados globalmente (muito mais rápido!)
  const d = {
    tiposServico: tiposServicoGlobal,
    equipe: equipeGlobal,
    agencias: agenciasGlobais,
    clientes: clientesGlobais
  };
  
  // 3. Renderiza as listas com a nova função
  renderizarListasConfig(d);
  
  // 4. Ativa a primeira aba por padrão
  mudarAba('servicos');
}

// ============================================
// 5. FUNÇÃO: voltarDashboard
// ============================================
// LOCALIZAÇÃO: Procure por "async function voltarDashboard()"
// PROPÓSITO: Voltar para o dashboard principal

async function voltarDashboard() {
  // Esconde todas as telas secundárias
  document.querySelectorAll('.container-app > div').forEach(d => d.style.display = 'none');
  
  // Mostra o dashboard com flex para melhor layout
  document.getElementById('tela-app').style.display = 'flex';
  
  // Atualiza o valor pendente
  try {
    const res = await chamarGoogle("carregarDadosIniciais");
    document.getElementById('valor-pendente').innerText = "R$ " + res.dados.pendente;
  } catch (e) {
    console.error("Erro ao carregar dados:", e);
    mostrarToast("⚠️ Erro ao atualizar. Tente recarregar.", "erro");
  }
}

// ============================================
// 6. FUNÇÃO: abrirRegistro
// ============================================
// LOCALIZAÇÃO: Procure por "function abrirRegistro(linha = "", dados = null)"
// PROPÓSITO: Abrir formulário de novo registro/edição

function abrirRegistro(linha = "", dados = null) {
  document.getElementById('tela-app').style.display = 'none'; 
  document.getElementById('tela-registro').style.display = 'block'; // Deixa como 'block', CSS cuida
  
  document.getElementById('linha-edicao').value = linha;
  
  if (linha === "") {
    // Novo registro - limpar form
    document.getElementById('formRegistro').reset(); 
    document.getElementById('data').valueAsDate = new Date();
    document.getElementById('valor-live-preview').innerText = "R$ 0,00";
    document.getElementById('titulo-form').innerText = "Novo Atendimento";
  } else {
    // Editar registro
    document.getElementById('titulo-form').innerText = "Editar Atendimento";
    document.getElementById('data').value = dados.dataOriginal; 
    document.getElementById('agencia').value = dados.agencia;
    document.getElementById('empresa').value = dados.empresa; 
    document.getElementById('inicio').value = dados.inicio;
    document.getElementById('fim').value = dados.fim; 
    document.getElementById('interprete').value = dados.interprete;
    document.getElementById('tipoServico').value = dados.tipoServico || "";
    
    // Converter valor para formato legível
    const valorLimpo = dados.valor.replace("R$ ", "").trim();
    document.getElementById('valor-base').value = valorLimpo; 
    
    document.getElementById('obs').value = dados.obs;
    document.getElementById('status-antigo').value = dados.status; 
    document.getElementById('data-pgto-antiga').value = dados.dataPgto;
  } 
  
  calcularTotalLive();
}

// ============================================
// 7. FUNÇÃO: abrirHistorico
// ============================================
// LOCALIZAÇÃO: Procure por "async function abrirHistorico()"
// PROPÓSITO: Abrir tela de histórico de atendimentos

async function abrirHistorico() { 
  document.querySelectorAll('.container-app > div').forEach(d => d.style.display = 'none');
  document.getElementById('tela-historico').style.display = 'block';
  
  document.getElementById('lista-html').innerHTML = '<div class="loader"></div>';
  document.getElementById('dataRecebimento').valueAsDate = new Date();
  
  const res = await chamarGoogle("buscarTodosServicos");
  renderizarHistorico(res.dados); 
}

// ============================================
// 8. FUNÇÃO: abrirRelatorios
// ============================================
// LOCALIZAÇÃO: Procure por "async function abrirRelatorios()"
// PROPÓSITO: Abrir tela de relatórios

async function abrirRelatorios() { 
  document.querySelectorAll('.container-app > div').forEach(d => d.style.display = 'none');
  document.getElementById('tela-relatorios').style.display = 'block';
  
  document.getElementById('lista-relatorio').innerHTML = '<div class="loader"></div>';
  
  const res = await chamarGoogle("buscarTodosServicos");
  dadosGeraisRelatorio = res.dados; 
  
  var hj = new Date(); 
  document.getElementById('filtroMesRelatorio').value = hj.getFullYear() + "-" + ("0" + (hj.getMonth() + 1)).slice(-2);
  
  var sa = document.getElementById('filtroAgenciaRelatorio'); 
  sa.innerHTML = '<option value="todas">Todas as Agências</option>';
  
  var sm = document.getElementById('filtroMembroRelatorio'); 
  sm.innerHTML = '<option value="todos">Todos os Membros</option>';
  
  var lAg = [], lMem = [];
  
  res.dados.forEach(i => { 
    if(!lAg.includes(i.agencia)){ 
      lAg.push(i.agencia); 
      sa.innerHTML += `<option value="${i.agencia}">${i.agencia}</option>`; 
    } 
    if(!lMem.includes(i.interprete)){ 
      lMem.push(i.interprete); 
      sm.innerHTML += `<option value="${i.interprete}">${i.interprete}</option>`; 
    } 
  });
  
  gerarRelatorio();
}

// ============================================
// 9. FUNÇÃO: abrirAdmin
// ============================================
// LOCALIZAÇÃO: Procure por "async function abrirAdmin()"
// PROPÓSITO: Abrir painel master de gerenciamento de clientes

async function abrirAdmin() {
  document.getElementById('tela-app').style.display = 'none';
  document.getElementById('tela-admin').style.display = 'block';
  
  const container = document.getElementById('lista-clientes-master');
  container.innerHTML = '<div class="loader"></div>';

  try {
    const res = await chamarGoogle("buscarTodosClientes");
    container.innerHTML = "";

    if (res.clientes && res.clientes.length > 0) {
      res.clientes.forEach(c => {
        const corStatus = c.status === 'Ativo' ? '#2e7d32' : '#c62828';
        const dataFormatada = c.vencimento || 'N/A';
        
        container.innerHTML += `
          <div class="item-pendente" style="border-left: 5px solid ${corStatus}; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items: start; gap: 10px;">
              <div style="flex: 1; min-width: 0;">
                <strong style="display: block; font-size: 14px; word-break: break-word;">${c.nome}</strong>
                <span style="font-size: 12px; color: #666;">${c.email}</span>
              </div>
              <span style="font-size:10px; padding:4px 8px; border-radius:12px; background:#f0f0f0; font-weight: bold; white-space: nowrap;">${c.status}</span>
            </div>
            <div style="font-size:12px; margin-top:8px; padding-top: 8px; border-top: 1px solid #f0f0f0;">
              📅 Expira: <strong>${dataFormatada}</strong> | <span style="color: #9c27b0;">${c.plano || 'S/ Plano'}</span>
            </div>
            <div style="margin-top:12px; display:flex; gap:8px;">
              <button onclick="gerenciarAcesso('${c.email}', 'Ativo')" style="flex:1; padding:10px; font-size:11px; background:#e8f5e9; color:#2e7d32; border:1px solid #2e7d32; border-radius:6px; cursor:pointer; font-weight: bold;">Ativar/Renovar</button>
              <button onclick="gerenciarAcesso('${c.email}', 'Suspenso')" style="flex:1; padding:10px; font-size:11px; background:#ffebee; color:#c62828; border:1px solid #c62828; border-radius:6px; cursor:pointer; font-weight: bold;">Bloquear</button>
            </div>
          </div>
        `;
      });
    } else {
      container.innerHTML = "<p style='text-align:center; color:#666; padding: 20px;'>Nenhum cliente encontrado.</p>";
    }
  } catch (err) {
    console.error("Erro ao carregar admin:", err);
    mostrarToast("❌ Erro ao carregar painel master.", "erro");
  }
}

// ============================================
// 10. FUNÇÃO: iniciarTesteGratis
// ============================================
// LOCALIZAÇÃO: Procure por "async function iniciarTesteGratis()"
// PROPÓSITO: Ativar teste de 7 dias para novo usuário

async function iniciarTesteGratis() {
  document.getElementById('tela-trial').style.display = 'none';
  document.getElementById('tela-loading').style.display = 'flex';
  
  // Usa o nome salvo no localStorage
  const nomeReal = localStorage.getItem("user_name") || "Novo Usuário";

  try {
    const res = await chamarGoogle("ativarTesteGratis", { nome: nomeReal });
    
    if (res && res.liberado) {
      mostrarToast("🎉 Teste de 7 dias ativado!", "sucesso");
      montarApp(res.dadosIniciais);
    } else {
      mostrarToast("❌ Erro ao ativar teste. Fale com o suporte.", "erro");
      document.getElementById('tela-loading').style.display = 'none';
      document.getElementById('tela-trial').style.display = 'block';
    }
  } catch (err) {
    console.error("Erro no trial:", err);
    mostrarToast("❌ Erro de conexão.", "erro");
    document.getElementById('tela-loading').style.display = 'none';
    document.getElementById('tela-trial').style.display = 'block';
  }
}

// ============================================
// 11. FUNÇÃO: window.onload (Verificação de Login Automático)
// ============================================
// LOCALIZAÇÃO: Procure por "window.onload = () => {"
// PROPÓSITO: Verificar se usuário já está logado ao carregar a página

window.onload = () => {
  const token = localStorage.getItem("google_access_token");
  const email = localStorage.getItem("user_email");
  const nomeCompleto = localStorage.getItem("user_name");

  // Se já tem credenciais salvas, entra direto (sem mostrar a vitrine)
  if (token && email) {
    // Esconde a vitrine IMEDIATAMENTE para não piscar
    document.getElementById('tela-home').style.display = 'none';
    
    // Atualiza o nome na tela de boas-vindas
    if (nomeCompleto && nomeCompleto !== "Usuário") {
      const primeiroNome = nomeCompleto.split(" ")[0];
      const spanNome = document.getElementById('nome-usuario-loading');
      if (spanNome) spanNome.innerText = primeiroNome;
    }

    // Inicia o login automático
    handleSaaSLogin(email);
  }
};

// ============================================
// FIM DAS CORREÇÕES
// ============================================
