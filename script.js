// ==================== VARIÁVEIS GLOBAIS ====================
let usuarioLogado = null;
let semanas = [];
let semanaAtual = -1;
let planejamentos = {};
let horarioProfessor = {};
let configEscola = null;
let minhasDisciplinas = [];

// Elementos DOM
const telaLogin = document.getElementById('telaLogin');
const appPrincipal = document.getElementById('appPrincipal');
const loginForm = document.getElementById('loginForm');
const cadastroForm = document.getElementById('cadastroForm');
const recuperacaoForm = document.getElementById('recuperacaoForm');
const novaSenhaForm = document.getElementById('novaSenhaForm');
const btnAdmin = document.getElementById('btnAdmin');
const btnMinhasDisciplinas = document.getElementById('btnMinhasDisciplinas');

// ==================== CONFIGURAÇÕES ====================
const SUPER_USUARIO = {
    usuario: "gestor",
    senha: "gestor@2026",
    nome: "Gestão Pedagógica",
    email: "gestor@escola.com",
    tipo: "superuser"
};

const TURMAS = ['101', '102', '201', '202', '301', '302'];
const DIAS_SEMANA_COMPLETO = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
const DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];

// ==================== FUNÇÕES DE CONFIGURAÇÃO DA ESCOLA ====================
function carregarConfiguracaoEscola() {
    const config = localStorage.getItem('configuracao_escola');
    if (config) {
        configEscola = JSON.parse(config);
    } else {
        // Configuração padrão
        configEscola = {
            nomeEscola: "Escola SESI",
            codigoEscola: "",
            periodos: {
                matutino: true,
                vespertino: false,
                noturno: false
            },
            numAulasPorDia: 7,
            duracaoAula: 45,
            numSemanasLetivas: 43,
            horarios: gerarHorariosAutomaticos(7, 45)
        };
        salvarConfiguracaoEscola(configEscola);
    }
    return configEscola;
}

function gerarHorariosAutomaticos(numAulas, duracao) {
    const horarios = [];
    let horaInicio = 7 * 60 + 15; // 7:15 em minutos
    
    for (let i = 0; i < numAulas; i++) {
        const inicio = minutosParaHora(horaInicio);
        const fim = minutosParaHora(horaInicio + duracao);
        horarios.push(`${inicio} - ${fim}`);
        horaInicio += duracao;
        
        // Intervalo após a 3ª aula (15 minutos)
        if (i === 2) {
            horaInicio += 15;
        }
    }
    
    return horarios;
}

function minutosParaHora(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function salvarConfiguracaoEscola(config) {
    if (config) {
        configEscola = config;
    }
    localStorage.setItem('configuracao_escola', JSON.stringify(configEscola));
}

function carregarConfiguracoesNaInterface() {
    if (!configEscola) return;
    
    const elem = (id) => document.getElementById(id);
    
    if (elem('configNomeEscola')) elem('configNomeEscola').value = configEscola.nomeEscola || '';
    if (elem('configCodigoEscola')) elem('configCodigoEscola').value = configEscola.codigoEscola || '';
    if (elem('periodoMatutino')) elem('periodoMatutino').checked = configEscola.periodos?.matutino || false;
    if (elem('periodoVespertino')) elem('periodoVespertino').checked = configEscola.periodos?.vespertino || false;
    if (elem('periodoNoturno')) elem('periodoNoturno').checked = configEscola.periodos?.noturno || false;
    if (elem('configNumAulas')) elem('configNumAulas').value = configEscola.numAulasPorDia || 7;
    if (elem('configDuracaoAula')) elem('configDuracaoAula').value = configEscola.duracaoAula || 45;
    if (elem('configNumSemanas')) elem('configNumSemanas').value = configEscola.numSemanasLetivas || 43;
}

function salvarConfiguracaoEscolaInterface() {
    const elem = (id) => document.getElementById(id);
    
    const novaConfig = {
        nomeEscola: elem('configNomeEscola')?.value || '',
        codigoEscola: elem('configCodigoEscola')?.value || '',
        periodos: {
            matutino: elem('periodoMatutino')?.checked || false,
            vespertino: elem('periodoVespertino')?.checked || false,
            noturno: elem('periodoNoturno')?.checked || false
        },
        numAulasPorDia: parseInt(elem('configNumAulas')?.value) || 7,
        duracaoAula: parseInt(elem('configDuracaoAula')?.value) || 45,
        numSemanasLetivas: parseInt(elem('configNumSemanas')?.value) || 43,
        horarios: gerarHorariosAutomaticos(
            parseInt(elem('configNumAulas')?.value) || 7,
            parseInt(elem('configDuracaoAula')?.value) || 45
        )
    };
    
    salvarConfiguracaoEscola(novaConfig);
    alert('✅ Configurações da escola salvas com sucesso!');
    
    // Recarregar semanas se a data já estiver definida
    const dataInicio = document.getElementById('inicioLetivo')?.value;
    if (dataInicio) {
        gerarSemanas(dataInicio);
    }
}

// ==================== FUNÇÕES DE DISCIPLINAS ====================
function carregarDisciplinasSistema() {
    const disciplinas = localStorage.getItem('disciplinas_sistema');
    if (disciplinas) {
        return JSON.parse(disciplinas);
    }
    
    const disciplinasPadrao = [
        { id: "biologia", nome: "Biologia", icone: "🧬" },
        { id: "biohackeria", nome: "Biohackeria", icone: "🔬" },
        { id: "projetos_livres", nome: "Projetos Livres", icone: "💡" },
        { id: "robotica", nome: "Robótica", icone: "🤖" },
        { id: "apps_games", nome: "Apps e Games", icone: "🎮" },
        { id: "iniciacao_cientifica", nome: "Iniciação Científica", icone: "🔍" }
    ];
    
    localStorage.setItem('disciplinas_sistema', JSON.stringify(disciplinasPadrao));
    return disciplinasPadrao;
}

let DISCIPLINAS = carregarDisciplinasSistema();

function adicionarDisciplina() {
    const nome = document.getElementById('novaDisciplinaNome')?.value.trim();
    const icone = document.getElementById('novaDisciplinaIcone')?.value.trim();
    
    if (!nome) {
        alert('❌ Digite o nome da disciplina');
        return;
    }
    
    const id = nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    if (DISCIPLINAS.find(d => d.id === id)) {
        alert('❌ Já existe uma disciplina com este nome');
        return;
    }
    
    DISCIPLINAS.push({
        id: id,
        nome: nome,
        icone: icone || '📚'
    });
    
    localStorage.setItem('disciplinas_sistema', JSON.stringify(DISCIPLINAS));
    
    if (document.getElementById('novaDisciplinaNome')) {
        document.getElementById('novaDisciplinaNome').value = '';
    }
    if (document.getElementById('novaDisciplinaIcone')) {
        document.getElementById('novaDisciplinaIcone').value = '';
    }
    
    atualizarListaDisciplinasSistema();
    alert('✅ Disciplina adicionada com sucesso!');
}

function removerDisciplina(id) {
    if (confirm('⚠️ Deseja realmente remover esta disciplina?\n\nEla será removida do sistema e de todos os professores.')) {
        DISCIPLINAS = DISCIPLINAS.filter(d => d.id !== id);
        localStorage.setItem('disciplinas_sistema', JSON.stringify(DISCIPLINAS));
        atualizarListaDisciplinasSistema();
        alert('✅ Disciplina removida com sucesso!');
    }
}

function atualizarListaDisciplinasSistema() {
    const lista = document.getElementById('listaDisciplinasSistema');
    if (!lista) return;
    
    let html = '';
    DISCIPLINAS.forEach(disc => {
        html += `
            <div class="disciplina-item">
                <div class="disciplina-info">
                    <span class="disciplina-icone">${disc.icone}</span>
                    <span class="disciplina-nome">${disc.nome}</span>
                </div>
                <button class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;" onclick="removerDisciplina('${disc.id}')">
                    Remover
                </button>
            </div>
        `;
    });
    
    lista.innerHTML = html || '<p style="color: #94a3b8; text-align: center; padding: 40px;">Nenhuma disciplina cadastrada</p>';
}

// ==================== MINHAS DISCIPLINAS (PROFESSOR) ====================
function abrirMinhasDisciplinas() {
    if (usuarioLogado?.tipo === 'superuser') {
        alert('⚠️ Gestores não precisam cadastrar disciplinas.');
        return;
    }
    
    document.getElementById('paginaSemanas')?.classList.add('hidden');
    document.getElementById('paginaAulas')?.classList.add('hidden');
    document.getElementById('paginaAdmin')?.classList.add('hidden');
    document.getElementById('paginaMinhasDisciplinas')?.classList.remove('hidden');
    
    carregarMinhasDisciplinasInterface();
}

function fecharMinhasDisciplinas() {
    document.getElementById('paginaMinhasDisciplinas')?.classList.add('hidden');
    document.getElementById('paginaSemanas')?.classList.remove('hidden');
}

function carregarMinhasDisciplinasInterface() {
    const lista = document.getElementById('listaMinhasDisciplinas');
    if (!lista) return;
    
    // Carregar disciplinas do professor
    const salvas = localStorage.getItem('minhas_disciplinas_' + usuarioLogado?.usuario);
    minhasDisciplinas = salvas ? JSON.parse(salvas) : [];
    
    let html = '';
    DISCIPLINAS.forEach(disc => {
        const checked = minhasDisciplinas.includes(disc.id) ? 'checked' : '';
        html += `
            <div class="disciplina-item" style="border-left-color: ${checked ? '#28a745' : '#e2e8f0'};">
                <div class="disciplina-info">
                    <input type="checkbox" id="disc_${disc.id}" value="${disc.id}" ${checked} 
                           style="width: 20px; height: 20px; cursor: pointer; margin-right: 12px;">
                    <span class="disciplina-icone">${disc.icone}</span>
                    <label for="disc_${disc.id}" style="cursor: pointer; flex: 1;">
                        <span class="disciplina-nome">${disc.nome}</span>
                    </label>
                </div>
            </div>
        `;
    });
    
    lista.innerHTML = html || '<p style="color: #94a3b8; text-align: center; padding: 40px;">Nenhuma disciplina disponível</p>';
}

function salvarMinhasDisciplinas() {
    if (!usuarioLogado) return;
    
    const selecionadas = [];
    DISCIPLINAS.forEach(disc => {
        const checkbox = document.getElementById('disc_' + disc.id);
        if (checkbox?.checked) {
            selecionadas.push(disc.id);
        }
    });
    
    if (selecionadas.length === 0) {
        if (!confirm('⚠️ Você não selecionou nenhuma disciplina.\n\nDeseja continuar mesmo assim?')) {
            return;
        }
    }
    
    localStorage.setItem('minhas_disciplinas_' + usuarioLogado.usuario, JSON.stringify(selecionadas));
    minhasDisciplinas = selecionadas;
    
    alert('✅ Suas disciplinas foram salvas com sucesso!');
    fecharMinhasDisciplinas();
}

// ========== FUNÇÕES DE LOGIN/CADASTRO/RECUPERAÇÃO ==========
function mostrarLogin() {
    if (!loginForm || !cadastroForm || !recuperacaoForm || !novaSenhaForm) return;
    loginForm.classList.remove('hidden');
    cadastroForm.classList.add('hidden');
    recuperacaoForm.classList.add('hidden');
    novaSenhaForm.classList.add('hidden');
}

function mostrarCadastro() {
    if (!loginForm || !cadastroForm || !recuperacaoForm || !novaSenhaForm) return;
    loginForm.classList.add('hidden');
    cadastroForm.classList.remove('hidden');
    recuperacaoForm.classList.add('hidden');
    novaSenhaForm.classList.add('hidden');
}

function mostrarRecuperacao() {
    if (!loginForm || !cadastroForm || !recuperacaoForm || !novaSenhaForm) return;
    loginForm.classList.add('hidden');
    cadastroForm.classList.add('hidden');
    recuperacaoForm.classList.remove('hidden');
    novaSenhaForm.classList.add('hidden');
}

function mostrarNovaSenha() {
    if (!loginForm || !cadastroForm || !recuperacaoForm || !novaSenhaForm) return;
    loginForm.classList.add('hidden');
    cadastroForm.classList.add('hidden');
    recuperacaoForm.classList.add('hidden');
    novaSenhaForm.classList.remove('hidden');
}

function fazerLogin() {
    try {
        const usuario = document.getElementById('loginUsuario').value.trim();
        const senha = document.getElementById('loginSenha').value;
        
        if (!usuario || !senha) {
            alert('Preencha usuário e senha');
            return;
        }
        
        // Verificar superusuário
        if (usuario === SUPER_USUARIO.usuario && senha === SUPER_USUARIO.senha) {
            usuarioLogado = {
                nome: SUPER_USUARIO.nome,
                usuario: SUPER_USUARIO.usuario,
                email: SUPER_USUARIO.email,
                tipo: SUPER_USUARIO.tipo
            };
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            iniciarAplicacao();
            return;
        }
        
        // Verificar usuário comum
        const usuarioSalvo = localStorage.getItem('usuario_' + usuario);
        if (!usuarioSalvo) {
            alert('Usuário não encontrado');
            return;
        }
        
        const dadosUsuario = JSON.parse(usuarioSalvo);
        const senhaUsuario = localStorage.getItem('senha_' + usuario);
        
        if (!senhaUsuario || senhaUsuario !== senha) {
            alert('Senha incorreta');
            return;
        }
        
        usuarioLogado = dadosUsuario;
        usuarioLogado.tipo = "professor";
        
        // Lembrar usuário se marcado
        const lembrar = document.getElementById('lembrarUsuario').checked;
        if (lembrar) {
            localStorage.setItem('usuarioLembrado', usuario);
        } else {
            localStorage.removeItem('usuarioLembrado');
        }
        
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
        iniciarAplicacao();
        
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

function fazerCadastro() {
    try {
        const nome = document.getElementById('cadastroNome').value.trim();
        const usuario = document.getElementById('cadastroUsuario').value.trim();
        const email = document.getElementById('cadastroEmail').value.trim();
        const senha = document.getElementById('cadastroSenha').value;
        const confirmarSenha = document.getElementById('cadastroConfirmarSenha').value;
        const termos = document.getElementById('termosUso').checked;
        
        if (!nome || !usuario || !email || !senha || !confirmarSenha) {
            alert('Preencha todos os campos');
            return;
        }
        
        if (usuario === SUPER_USUARIO.usuario) {
            alert('Este nome de usuário é reservado para a gestão');
            return;
        }
        
        if (senha.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        
        if (senha !== confirmarSenha) {
            alert('As senhas não coincidem');
            return;
        }
        
        if (!termos) {
            alert('Aceite os termos de uso');
            return;
        }
        
        // Verificar se usuário já existe
        if (localStorage.getItem('usuario_' + usuario)) {
            alert('Este usuário já está cadastrado');
            return;
        }
        
        // Verificar se email já está cadastrado
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('usuario_')) {
                const userData = JSON.parse(localStorage.getItem(key));
                if (userData.email === email) {
                    alert('Este email já está cadastrado');
                    return;
                }
            }
        }
        
        const novoUsuario = { 
            nome, 
            usuario, 
            email,
            tipo: "professor",
            dataCadastro: new Date().toISOString()
        };
        
        // Salvar usuário e senha separadamente
        localStorage.setItem('usuario_' + usuario, JSON.stringify(novoUsuario));
        localStorage.setItem('senha_' + usuario, senha);
        
        usuarioLogado = novoUsuario;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
        
        iniciarAplicacao();
        alert('Conta criada com sucesso!');
        
    } catch (error) {
        alert('Erro no cadastro: ' + error.message);
    }
}

function iniciarRecuperacao() {
    try {
        const email = document.getElementById('recuperacaoEmail').value.trim();
        const usuario = document.getElementById('recuperacaoUsuario').value.trim();
        
        if (!email || !usuario) {
            alert('Preencha todos os campos');
            return;
        }
        
        // Verificar se usuário existe
        const usuarioSalvo = localStorage.getItem('usuario_' + usuario);
        if (!usuarioSalvo) {
            alert('Usuário não encontrado');
            return;
        }
        
        const dadosUsuario = JSON.parse(usuarioSalvo);
        
        // Verificar se email corresponde
        if (dadosUsuario.email !== email) {
            alert('Email não corresponde ao cadastrado para este usuário');
            return;
        }
        
        // Gerar código de recuperação (simulado - em produção enviaria por email)
        const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiracao = Date.now() + 3600000; // 1 hora
        
        // Salvar código de recuperação
        localStorage.setItem('recuperacao_' + usuario, JSON.stringify({
            codigo,
            expiracao,
            usuario
        }));
        
        // Em produção, aqui enviaria o código por email
        // Para demonstração, mostraremos o código
        alert(`Código de recuperação (simulação): ${codigo}\n\nEm produção, este código seria enviado para: ${email}`);
        
        mostrarNovaSenha();
        
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

function definirNovaSenha() {
    try {
        const codigo = document.getElementById('codigoVerificacao').value.trim().toUpperCase();
        const novaSenha = document.getElementById('novaSenha').value;
        const confirmarNovaSenha = document.getElementById('confirmarNovaSenha').value;
        
        if (!codigo || !novaSenha || !confirmarNovaSenha) {
            alert('Preencha todos os campos');
            return;
        }
        
        if (novaSenha.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        
        if (novaSenha !== confirmarNovaSenha) {
            alert('As senhas não coincidem');
            return;
        }
        
        // Encontrar usuário pelo código de recuperação
        let usuarioRecuperacao = null;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('recuperacao_')) {
                const dados = JSON.parse(localStorage.getItem(key));
                if (dados.codigo === codigo && dados.expiracao > Date.now()) {
                    usuarioRecuperacao = dados.usuario;
                    break;
                }
            }
        }
        
        if (!usuarioRecuperacao) {
            alert('Código inválido ou expirado');
            return;
        }
        
        // Atualizar senha
        localStorage.setItem('senha_' + usuarioRecuperacao, novaSenha);
        
        // Remover código de recuperação usado
        localStorage.removeItem('recuperacao_' + usuarioRecuperacao);
        
        alert('Senha alterada com sucesso! Faça login com sua nova senha.');
        mostrarLogin();
        
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

function fazerLogout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('usuarioLogado');
        window.location.reload();
    }
}

// ========== INICIALIZAÇÃO ==========
function iniciarAplicacao() {
    if (!telaLogin || !appPrincipal) return;
    
    telaLogin.classList.add('hidden');
    appPrincipal.classList.remove('hidden');
    
    carregarDados();
    setupEventListeners();
    atualizarInterface();
}

function carregarDados() {
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (usuarioSalvo) {
        usuarioLogado = JSON.parse(usuarioSalvo);
    }
    
    // Cada usuário tem seus próprios dados (protegidos por senha)
    if (usuarioLogado) {
        const planejamentosSalvos = localStorage.getItem('planejamentos_' + usuarioLogado.usuario);
        if (planejamentosSalvos) {
            planejamentos = JSON.parse(planejamentosSalvos);
        }
        
        const horarioSalvo = localStorage.getItem('horarioProfessor_' + usuarioLogado.usuario);
        if (horarioSalvo) {
            horarioProfessor = JSON.parse(horarioSalvo);
        }
        
        const dataInicio = localStorage.getItem('dataInicioLetivo_' + usuarioLogado.usuario);
        if (dataInicio && document.getElementById('inicioLetivo')) {
            document.getElementById('inicioLetivo').value = dataInicio;
            setTimeout(() => gerarSemanas(dataInicio), 100);
        }
    }
}

function setupEventListeners() {
    const inicioLetivo = document.getElementById('inicioLetivo');
    const btnHoje = document.getElementById('btnHoje');
    const btnVoltar = document.getElementById('voltar');
    
    if (inicioLetivo) {
        inicioLetivo.addEventListener('change', function() {
            gerarSemanas(this.value);
        });
    }
    
    if (btnHoje) {
        btnHoje.addEventListener('click', function() {
            const hoje = new Date().toISOString().split('T')[0];
            if (document.getElementById('inicioLetivo')) {
                document.getElementById('inicioLetivo').value = hoje;
                gerarSemanas(hoje);
            }
        });
    }
    
    if (btnVoltar) {
        btnVoltar.addEventListener('click', function() {
            document.getElementById('paginaAulas').classList.add('hidden');
            document.getElementById('paginaSemanas').classList.remove('hidden');
        });
    }
}

function atualizarInterface() {
    if (usuarioLogado && document.getElementById('userCumprimento')) {
        document.getElementById('userCumprimento').textContent = usuarioLogado.nome.split(' ')[0];
    }
    
    // Mostrar botão de administração apenas para superusuário
    if (usuarioLogado && usuarioLogado.tipo === "superuser" && btnAdmin) {
        btnAdmin.classList.remove('hidden');
    } else if (btnAdmin) {
        btnAdmin.classList.add('hidden');
    }
    
    atualizarStatusHorario();

// ==================== PAINEL DE ADMINISTRAÇÃO ====================
function abrirPainelAdmin() {
    if (!usuarioLogado || usuarioLogado.tipo !== "superuser") {
        alert('❌ Acesso restrito à gestão');
        return;
    }
    
    document.getElementById('paginaSemanas')?.classList.add('hidden');
    document.getElementById('paginaAulas')?.classList.add('hidden');
    document.getElementById('paginaMinhasDisciplinas')?.classList.add('hidden');
    document.getElementById('paginaAdmin')?.classList.remove('hidden');
    
    mostrarAbaAdmin(null, 'escola');
}

function fecharPainelAdmin() {
    document.getElementById('paginaAdmin')?.classList.add('hidden');
    document.getElementById('paginaSemanas')?.classList.remove('hidden');
}

function mostrarAbaAdmin(event, aba) {
    // Atualizar tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    if (event) {
        event.target.classList.add('active');
    } else {
        document.querySelector(`.admin-tab`).classList.add('active');
    }
    
    // Mostrar/ocultar abas
    document.getElementById('abaAdminEscola')?.classList.add('hidden');
    document.getElementById('abaAdminProfessores')?.classList.add('hidden');
    document.getElementById('abaAdminDisciplinas')?.classList.add('hidden');
    
    if (aba === 'escola') {
        document.getElementById('abaAdminEscola')?.classList.remove('hidden');
        carregarConfiguracoesNaInterface();
    } else if (aba === 'professores') {
        document.getElementById('abaAdminProfessores')?.classList.remove('hidden');
        carregarTabelaProfessores();
    } else if (aba === 'disciplinas') {
        document.getElementById('abaAdminDisciplinas')?.classList.remove('hidden');
        atualizarListaDisciplinasSistema();
    }
}

function carregarTabelaProfessores() {
    const tbody = document.getElementById('corpoTabelaProfessores');
    if (!tbody) return;
    
    const professores = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('usuario_')) {
            const usuario = JSON.parse(localStorage.getItem(key));
            if (usuario.tipo !== "superuser") {
                professores.push(usuario);
            }
        }
    }
    
    let html = '';
    if (professores.length === 0) {
        html = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #94a3b8;">Nenhum professor cadastrado</td></tr>';
    } else {
        professores.forEach(prof => {
            const dataCadastro = prof.dataCadastro ? new Date(prof.dataCadastro).toLocaleDateString('pt-BR') : 'Não informada';
            html += `
                <tr>
                    <td style="font-weight: 500;">${prof.nome}</td>
                    <td>${prof.usuario}</td>
                    <td>${prof.email}</td>
                    <td>${dataCadastro}</td>
                </tr>
            `;
        });
    }
    
    tbody.innerHTML = html;
}

function gerarRelatorioProfessores() {
    const professores = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('usuario_')) {
            const usuario = JSON.parse(localStorage.getItem(key));
            if (usuario.tipo !== "superuser") {
                const temHorario = localStorage.getItem('horarioProfessor_' + usuario.usuario);
                const temPlanejamentos = localStorage.getItem('planejamentos_' + usuario.usuario);
                const minhasDisciplinas = localStorage.getItem('minhas_disciplinas_' + usuario.usuario);
                
                professores.push({
                    nome: usuario.nome,
                    usuario: usuario.usuario,
                    email: usuario.email,
                    dataCadastro: usuario.dataCadastro ? new Date(usuario.dataCadastro).toLocaleDateString('pt-BR') : 'Não informada',
                    horarioConfigurado: temHorario ? 'Sim' : 'Não',
                    temPlanejamentos: temPlanejamentos ? 'Sim' : 'Não',
                    numDisciplinas: minhasDisciplinas ? JSON.parse(minhasDisciplinas).length : 0
                });
            }
        }
    }
    
    if (professores.length === 0) {
        alert('⚠️ Nenhum professor cadastrado no sistema');
        return;
    }
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Professores</title>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; line-height: 1.6; }
                h1 { color: #0047B6; text-align: center; margin-bottom: 10px; }
                .subtitulo { text-align: center; color: #64748b; margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background-color: #0047B6; color: white; padding: 14px 12px; text-align: left; font-weight: 600; }
                td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
                tr:nth-child(even) { background-color: #f8fafc; }
                .resumo { background: #e6f7ff; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #0047B6; }
                .resumo h3 { color: #0047B6; margin-top: 0; }
                .resumo p { margin: 8px 0; }
                .rodape { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 2px solid #e2e8f0; padding-top: 20px; }
            </style>
        </head>
        <body>
            <h1>📊 Relatório de Professores Cadastrados</h1>
            <p class="subtitulo">Data de geração: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Usuário</th>
                        <th>Email</th>
                        <th>Data de Cadastro</th>
                        <th>Horário Config.</th>
                        <th>Planejamentos</th>
                        <th>Nº Disciplinas</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    professores.forEach(prof => {
        html += `
            <tr>
                <td><strong>${prof.nome}</strong></td>
                <td>${prof.usuario}</td>
                <td>${prof.email}</td>
                <td>${prof.dataCadastro}</td>
                <td>${prof.horarioConfigurado}</td>
                <td>${prof.temPlanejamentos}</td>
                <td>${prof.numDisciplinas}</td>
            </tr>
        `;
    });
    
    const comHorario = professores.filter(p => p.horarioConfigurado === 'Sim').length;
    const comPlanejamentos = professores.filter(p => p.temPlanejamentos === 'Sim').length;
    const totalDisciplinas = professores.reduce((sum, p) => sum + p.numDisciplinas, 0);
    
    html += `
                </tbody>
            </table>
            
            <div class="resumo">
                <h3>📈 Resumo Geral</h3>
                <p><strong>Total de professores cadastrados:</strong> ${professores.length}</p>
                <p><strong>Professores com horário configurado:</strong> ${comHorario} (${Math.round(comHorario/professores.length*100)}%)</p>
                <p><strong>Professores com planejamentos:</strong> ${comPlanejamentos} (${Math.round(comPlanejamentos/professores.length*100)}%)</p>
                <p><strong>Total de disciplinas atribuídas:</strong> ${totalDisciplinas}</p>
                <p><strong>Média de disciplinas por professor:</strong> ${(totalDisciplinas/professores.length).toFixed(1)}</p>
            </div>
            
            <div class="rodape">
                <p><strong>Sistema Planejador de Aulas</strong></p>
                <p>Desenvolvido por Lafaiete Erkmann • @lafa.bio</p>
                <p>Escola: ${configEscola?.nomeEscola || 'Não configurada'}</p>
            </div>
        </body>
        </html>
    `;
    
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_professores_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ Relatório gerado com sucesso!');
}

function copiarEmailsProfessores() {
    const emails = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('usuario_')) {
            const usuario = JSON.parse(localStorage.getItem(key));
            if (usuario.tipo !== "superuser" && usuario.email) {
                emails.push(usuario.email);
            }
        }
    }
    
    if (emails.length === 0) {
        alert('⚠️ Nenhum email de professor encontrado');
        return;
    }
    
    const listaEmails = emails.join('; ');
    
    navigator.clipboard.writeText(listaEmails).then(() => {
        alert(`✅ ${emails.length} emails copiados para a área de transferência!\n\n${listaEmails}`);
    }).catch(err => {
        alert(`📧 Emails encontrados:\n\n${listaEmails}\n\n(Copie manualmente)`);
    });
}

        localStorage.setItem('senha_' + usuarioBuscar, novaSenha);
        alert(`Senha resetada com sucesso para o usuário "${usuarioBuscar}"`);
    }
}

function removerUsuario() {
    const usuarioBuscar = document.getElementById('usuarioBuscar').value.trim();
    if (!usuarioBuscar) {
        alert('Nenhum usuário selecionado');
        return;
    }
    
    if (usuarioBuscar === SUPER_USUARIO.usuario) {
        alert('Não é possível remover a conta da gestão');
        return;
    }
    
    const confirmar = confirm(`ATENÇÃO: Isso removerá TODOS os dados do usuário "${usuarioBuscar}"\n\n- Conta do usuário\n- Horários configurados\n- Todos os planejamentos\n\nEsta ação não pode ser desfeita. Deseja continuar?`);
    if (!confirmar) return;
    
    // Remover todos os dados do usuário
    localStorage.removeItem('usuario_' + usuarioBuscar);
    localStorage.removeItem('senha_' + usuarioBuscar);
    localStorage.removeItem('horarioProfessor_' + usuarioBuscar);
    localStorage.removeItem('planejamentos_' + usuarioBuscar);
    localStorage.removeItem('dataInicioLetivo_' + usuarioBuscar);
    
    alert(`Usuário "${usuarioBuscar}" removido com sucesso!`);
    document.getElementById('detalhesUsuario').style.display = 'none';
    carregarDadosAdmin();
}

function exportarTodosDados() {
    const dados = {};
    
    // Coletar todos os dados do sistema
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        dados[key] = localStorage.getItem(key);
    }
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_planejador_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Backup completo exportado com sucesso!');
}

function limparDadosAntigos() {
    const confirmar = confirm('Isso removerá todos os dados de usuários inativos (sem horário configurado). Deseja continuar?');
    if (!confirmar) return;
    
    let removidos = 0;
    const agora = Date.now();
    const umMesAtras = agora - (30 * 24 * 60 * 60 * 1000); // 30 dias
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key.startsWith('usuario_')) {
            const usuario = JSON.parse(localStorage.getItem(key));
            
            // Não remover superusuário
            if (usuario.tipo === "superuser") continue;
            
            // Verificar se tem horário configurado
            const temHorario = localStorage.getItem('horarioProfessor_' + usuario.usuario);
            
            // Verificar se é antigo (mais de 30 dias sem atividade)
            const dataCadastro = usuario.dataCadastro ? new Date(usuario.dataCadastro).getTime() : 0;
            const isAntigo = dataCadastro < umMesAtras;
            
            if (!temHorario && isAntigo) {
                localStorage.removeItem('usuario_' + usuario.usuario);
                localStorage.removeItem('senha_' + usuario.usuario);
                localStorage.removeItem('horarioProfessor_' + usuario.usuario);
                localStorage.removeItem('planejamentos_' + usuario.usuario);
                localStorage.removeItem('dataInicioLetivo_' + usuario.usuario);
                removidos++;
            }
        }
    }
    
    alert(`${removidos} usuários inativos foram removidos.`);
    carregarDadosAdmin();
}

function alterarSenhaSuperuser() {
    const senhaAtual = prompt('Digite a senha atual da gestão:');
    if (senhaAtual !== SUPER_USUARIO.senha) {
        alert('Senha atual incorreta');
        return;
    }
    
    const novaSenha = prompt('Digite a nova senha (mínimo 8 caracteres):');
    if (!novaSenha || novaSenha.length < 8) {
        alert('A senha deve ter pelo menos 8 caracteres');
        return;
    }
    
    const confirmarSenha = prompt('Confirme a nova senha:');
    if (novaSenha !== confirmarSenha) {
        alert('As senhas não coincidem');
        return;
    }
    
    SUPER_USUARIO.senha = novaSenha;
    alert('Senha da gestão alterada com sucesso!');
}

function fecharModalAdmin() {
    const modal = document.getElementById('modalAdmin');
    if (modal) modal.remove();
}

// ========== FUNÇÕES DE HORÁRIO (ISOLADAS POR USUÁRIO) ==========
function abrirConfiguracaoHorario() {
    const modalHTML = `
        <div id="modalHorario" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <div style="background: white; padding: 20px; border-radius: 10px; max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h3 style="color: #0047B6;">🕐 Configurar Meu Horário</h3>
                <p>Configure seu horário semanal. Este horário será usado como template para todas as semanas.</p>
                <div id="gradeHorario" style="margin: 20px 0;"></div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="salvarHorario()" style="background: #2E7D32; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Salvar</button>
                    <button onclick="fecharModalHorario()" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    renderGradeHorario();
}

function renderGradeHorario() {
    const container = document.getElementById('gradeHorario');
    if (!container) return;
    
    const dias = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];
    let html = '<div style="display: grid; grid-template-columns: 80px repeat(5, 1fr); gap: 2px;">';
    
    html += '<div style="background: #0047B6; color: white; padding: 10px; text-align: center;">Horário</div>';
    dias.forEach(dia => {
        html += `<div style="background: #2A6ED4; color: white; padding: 10px; text-align: center;">${dia}</div>`;
    });
    
    for (let i = 0; i < 7; i++) {
        html += `<div style="background: #0047B6; color: white; padding: 10px; text-align: center;">${HORARIOS[i]}</div>`;
        
        for (let j = 0; j < 5; j++) {
            const dia = dias[j];
            const aulaData = horarioProfessor[dia] && horarioProfessor[dia][i] ? horarioProfessor[dia][i] : { disciplina: '', turma: '' };
            
            html += `
                <div style="padding: 5px; border: 1px solid #ddd; background: white;">
                    <select style="width: 100%; margin-bottom: 5px;" onchange="atualizarDisciplinaHorario('${dia}', ${i}, this.value)">
                        <option value="">-- Sem aula --</option>
                        ${DISCIPLINAS.map(d => `<option value="${d.id}" ${aulaData.disciplina === d.id ? 'selected' : ''}>${d.icone} ${d.nome}</option>`).join('')}
                    </select>
                    ${aulaData.disciplina ? `
                        <select style="width: 100%;" onchange="atualizarTurmaHorario('${dia}', ${i}, this.value)">
                            <option value="">Selecione turma</option>
                            ${TURMAS.map(t => `<option value="${t}" ${aulaData.turma === t ? 'selected' : ''}>Turma ${t}</option>`).join('')}
                        </select>
                    ` : ''}
                </div>
            `;
        }
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function atualizarDisciplinaHorario(dia, aulaIndex, disciplina) {
    if (!horarioProfessor[dia]) horarioProfessor[dia] = [];
    if (!horarioProfessor[dia][aulaIndex]) horarioProfessor[dia][aulaIndex] = {};
    
    horarioProfessor[dia][aulaIndex].disciplina = disciplina;
    horarioProfessor[dia][aulaIndex].turma = '';
    
    renderGradeHorario();
}

function atualizarTurmaHorario(dia, aulaIndex, turma) {
    if (!horarioProfessor[dia]) horarioProfessor[dia] = [];
    if (!horarioProfessor[dia][aulaIndex]) horarioProfessor[dia][aulaIndex] = {};
    
    horarioProfessor[dia][aulaIndex].turma = turma;
}

function salvarHorario() {
    if (!usuarioLogado) return;
    
    localStorage.setItem('horarioProfessor_' + usuarioLogado.usuario, JSON.stringify(horarioProfessor));
    alert('Horário salvo com sucesso!');
    fecharModalHorario();
    atualizarStatusHorario();
    
    if (semanas.length > 0) {
        aplicarHorarioNasSemanas();
        renderSemanas();
    }
}

function aplicarHorarioNasSemanas() {
    semanas.forEach((semana, index) => {
        const chave = `semana_${index}`;
        if (planejamentos[chave]) {
            const novaGrade = criarGradeBaseadaNoHorario();
            const gradeAntiga = planejamentos[chave].aulas;
            
            for (let dia = 0; dia < 5; dia++) {
                for (let aula = 0; aula < 7; aula++) {
                    if (gradeAntiga[dia] && gradeAntiga[dia][aula] && gradeAntiga[dia][aula].conteudo) {
                        novaGrade[dia][aula].conteudo = gradeAntiga[dia][aula].conteudo;
                    }
                }
            }
            
            planejamentos[chave].aulas = novaGrade;
        }
    });
    localStorage.setItem('planejamentos_' + usuarioLogado.usuario, JSON.stringify(planejamentos));
}

function fecharModalHorario() {
    const modal = document.getElementById('modalHorario');
    if (modal) modal.remove();
}

function atualizarStatusHorario() {
    const statusElement = document.getElementById('statusHorario');
    if (!statusElement) return;
    
    let totalAulas = 0;
    Object.keys(horarioProfessor).forEach(dia => {
        if (horarioProfessor[dia]) {
            horarioProfessor[dia].forEach(aula => {
                if (aula && aula.disciplina && aula.turma) totalAulas++;
            });
        }
    });
    
    if (totalAulas === 0) {
        statusElement.innerHTML = '⚠️ Configure seu horário primeiro';
        statusElement.style.color = '#d32f2f';
    } else {
        statusElement.innerHTML = `✅ Horário configurado: ${totalAulas} aulas por semana`;
        statusElement.style.color = '#2E7D32';
    }
}

// ========== FUNÇÕES DE PLANEJAMENTO (ISOLADAS POR USUÁRIO) ==========
function gerarSemanas(dataISO) {
    if (!dataISO) return;
    
    if (Object.keys(horarioProfessor).length === 0) {
        alert('Configure seu horário primeiro! Clique em "Meu Horário"');
        abrirConfiguracaoHorario();
        return;
    }
    
    semanas = [];
    const data = new Date(dataISO);
    
    const diaSemana = data.getDay();
    if (diaSemana !== 1) {
        const ajuste = diaSemana === 0 ? 1 : 1 - diaSemana;
        data.setDate(data.getDate() + ajuste);
    }
    
    for (let i = 0; i < 43; i++) {
        const inicio = new Date(data);
        const fim = new Date(data);
        fim.setDate(fim.getDate() + 4);
        
        semanas.push({
            id: i + 1,
            inicio: new Date(inicio),
            fim: new Date(fim)
        });
        
        data.setDate(data.getDate() + 7);
    }
    
    if (usuarioLogado) {
        localStorage.setItem('dataInicioLetivo_' + usuarioLogado.usuario, dataISO);
    }
    inicializarPlanejamentos();
    renderSemanas();
}

function inicializarPlanejamentos() {
    semanas.forEach((semana, index) => {
        const chave = `semana_${index}`;
        if (!planejamentos[chave]) {
            planejamentos[chave] = {
                aulas: criarGradeBaseadaNoHorario(),
                anotacoes: ''
            };
        }
    });
    if (usuarioLogado) {
        localStorage.setItem('planejamentos_' + usuarioLogado.usuario, JSON.stringify(planejamentos));
    }
}

function criarGradeBaseadaNoHorario() {
    const dias = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];
    const grade = Array(5).fill().map(() => Array(7).fill({ 
        disciplina: null, 
        turma: null,
        conteudo: '' 
    }));
    
    dias.forEach((dia, diaIndex) => {
        if (horarioProfessor[dia]) {
            horarioProfessor[dia].forEach((aulaData, aulaIndex) => {
                if (aulaData && aulaData.disciplina && aulaData.turma) {
                    grade[diaIndex][aulaIndex] = {
                        disciplina: aulaData.disciplina,
                        turma: aulaData.turma,
                        conteudo: ''
                    };
                }
            });
        }
    });
    
    return grade;
}

function renderSemanas() {
    const container = document.getElementById('listaSemanas');
    if (!container) return;
    
    container.innerHTML = '';
    
    semanas.forEach((semana, index) => {
        const div = document.createElement('div');
        div.style.cssText = `
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #0047B6;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        `;
        
        div.onclick = () => abrirSemana(index);
        
        const formatarData = (data) => data.toLocaleDateString('pt-BR');
        
        div.innerHTML = `
            <h3 style="margin: 0 0 5px 0; color: #0047B6;">Semana ${semana.id}</h3>
            <p style="margin: 0; color: #666; font-size: 14px;">${formatarData(semana.inicio)} a ${formatarData(semana.fim)}</p>
        `;
        
        container.appendChild(div);
    });
    
    const contador = document.getElementById('contadorSemanas');
    if (contador) {
        contador.textContent = `${semanas.length} semanas geradas`;
    }
}

function abrirSemana(index) {
    semanaAtual = index;
    const semana = semanas[index];
    
    document.getElementById('paginaSemanas').classList.add('hidden');
    document.getElementById('paginaAulas').classList.remove('hidden');
    
    const titulo = document.getElementById('tituloSemana');
    if (titulo) {
        const formatarData = (data) => data.toLocaleDateString('pt-BR');
        titulo.textContent = `Semana ${semana.id} - ${formatarData(semana.inicio)} a ${formatarData(semana.fim)}`;
    }
    
    renderGradeSemana(index);
}

function renderGradeSemana(index) {
    const container = document.getElementById('gradeSemana');
    if (!container) return;
    
    const semana = semanas[index];
    const dias = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];
    
    const chave = `semana_${index}`;
    const planejamentoSemana = planejamentos[chave] || {
        aulas: criarGradeBaseadaNoHorario(),
        anotacoes: ''
    };
    
    let html = `
        <div style="display: grid; grid-template-columns: 100px repeat(5, 1fr); gap: 1px; background: #f0f0f0; border: 1px solid #f0f0f0;">
            <div style="background: #0047B6; color: white; padding: 10px; text-align: center; font-weight: bold;">Horário</div>
    `;
    
    dias.forEach((dia, i) => {
        const data = new Date(semana.inicio);
        data.setDate(data.getDate() + i);
        html += `<div style="background: #0047B6; color: white; padding: 10px; text-align: center; font-weight: bold;">
            ${DIAS_SEMANA_COMPLETO[i]}<br><small>${data.toLocaleDateString('pt-BR')}</small>
        </div>`;
    });
    
    for (let aula = 0; aula < 7; aula++) {
        html += `<div style="background: white; padding: 10px; text-align: center; font-weight: bold; color: #0047B6;">
            ${HORARIOS[aula]}<br><small>45 min</small>
        </div>`;
        
        for (let dia = 0; dia < 5; dia++) {
            const aulaData = planejamentoSemana.aulas[dia][aula] || { disciplina: null, turma: null, conteudo: '' };
            const temAula = aulaData.disciplina && aulaData.turma;
            
            html += `
                <div style="background: white; padding: 10px; min-height: 120px; ${!temAula ? 'background: #f9f9f9;' : ''}">
                    ${temAula ? `
                        <div style="margin-bottom: 5px;">
                            <strong style="font-size: 13px;">${DISCIPLINAS.find(d => d.id === aulaData.disciplina)?.nome || ''}</strong>
                            <div style="font-size: 12px; color: #0047B6;">🏫 Turma ${aulaData.turma}</div>
                        </div>
                        <textarea 
                            style="width: 100%; height: 70px; padding: 5px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;"
                            placeholder="Conteúdo da aula..."
                            oninput="salvarConteudoAula(${index}, ${dia}, ${aula}, this.value)"
                        >${aulaData.conteudo || ''}</textarea>
                        <div class="botoes-aula">
                            <button class="btn-copiar" onclick="copiarConteudo(${index}, ${dia}, ${aula})">
                                📋 Copiar
                            </button>
                            <button class="btn-apagar" onclick="apagarConteudoAula(${index}, ${dia}, ${aula})">
                                🗑️ Apagar
                            </button>
                        </div>
                    ` : `
                        <div style="color: #999; font-style: italic; text-align: center; padding: 20px 0;">Sem aula</div>
                    `}
                </div>
            `;
        }
    }
    
    html += `</div>`;
    
    html += `
        <div style="margin-top: 20px;">
            <h3>📝 Anotações da Semana</h3>
            <textarea id="anotacoesSemana" 
                      style="width: 100%; height: 80px; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"
                      placeholder="Anotações gerais..."
                      oninput="salvarAnotacoesSemana(${index}, this.value)">${planejamentoSemana.anotacoes || ''}</textarea>
            <div style="margin-top: 10px; display: flex; gap: 10px;">
                <button onclick="apagarAnotacoesSemana(${index})" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
                    🗑️ Apagar Anotações
                </button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ========== FUNÇÕES DE SALVAMENTO E APAGAR (ISOLADAS POR USUÁRIO) ==========
function salvarConteudoAula(semanaIndex, diaIndex, aulaIndex, conteudo) {
    if (!usuarioLogado) return;
    
    const chave = `semana_${semanaIndex}`;
    if (!planejamentos[chave]) {
        planejamentos[chave] = {
            aulas: criarGradeBaseadaNoHorario(),
            anotacoes: ''
        };
    }
    
    planejamentos[chave].aulas[diaIndex][aulaIndex].conteudo = conteudo;
    localStorage.setItem('planejamentos_' + usuarioLogado.usuario, JSON.stringify(planejamentos));
}

function apagarConteudoAula(semanaIndex, diaIndex, aulaIndex) {
    if (confirm('Tem certeza que deseja apagar o conteúdo desta aula?')) {
        const chave = `semana_${semanaIndex}`;
        if (planejamentos[chave]) {
            planejamentos[chave].aulas[diaIndex][aulaIndex].conteudo = '';
            if (usuarioLogado) {
                localStorage.setItem('planejamentos_' + usuarioLogado.usuario, JSON.stringify(planejamentos));
            }
            
            renderGradeSemana(semanaIndex);
            alert('Conteúdo apagado com sucesso!');

// ==================== LAYOUT MELHORADO DE SEMANAS ====================
function renderizarSemanas() {
    const lista = document.getElementById('listaSemanas');
    if (!lista) return;
    
    let html = '';
    
    semanas.forEach((semana, index) => {
        const chave = `semana_${index}`;
        const planejamento = planejamentos[chave];
        const temPlanejamento = planejamento && contarAulasNaSemana(planejamento.aulas) > 0;
        const classeExtra = temPlanejamento ? 'planejada' : '';
        
        const dataInicio = new Date(semana.inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const dataFim = new Date(semana.fim).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        
        html += `
            <div class="semana-card ${classeExtra}" onclick="abrirSemana(${index})">
                <div class="semana-numero">S${semana.id}</div>
                <div class="semana-datas">${dataInicio} - ${dataFim}</div>
                <div class="semana-status ${temPlanejamento ? '' : 'vazia'}">
                    ${temPlanejamento ? '✓ Planejada' : '○ Vazia'}
                </div>
            </div>
        `;
    });
    
    lista.innerHTML = html;
    
    // Atualizar contador
    const contador = document.getElementById('contadorSemanas');
    if (contador) {
        const planejadas = semanas.filter((_, i) => {
            const p = planejamentos[`semana_${i}`];
            return p && contarAulasNaSemana(p.aulas) > 0;
        }).length;
        
        contador.innerHTML = `${semanas.length} semanas • ${planejadas} planejadas`;
    }
}

function contarAulasNaSemana(aulas) {
    if (!aulas) return 0;
    let total = 0;
    const numAulas = configEscola?.numAulasPorDia || 7;
    
    for (let dia = 0; dia < 5; dia++) {
        for (let aula = 0; aula < numAulas; aula++) {
            const aulaData = aulas[dia]?.[aula];
            if (aulaData && aulaData.disciplina && aulaData.turma) {
                total++;
            }
        }
    }
    return total;
}

function voltarParaSemanas() {
    document.getElementById('paginaAulas')?.classList.add('hidden');
    document.getElementById('paginaSemanas')?.classList.remove('hidden');
}

// ==================== ATUALIZAÇÃO DA INTERFACE ====================
function atualizarInterface() {
    if (usuarioLogado && document.getElementById('userCumprimento')) {
        document.getElementById('userCumprimento').textContent = usuarioLogado.nome.split(' ')[0];
    }
    
    // Mostrar/ocultar botões baseado no tipo de usuário
    if (usuarioLogado && usuarioLogado.tipo === "superuser") {
        btnAdmin?.classList.remove('hidden');
        btnMinhasDisciplinas?.classList.add('hidden');
    } else {
        btnAdmin?.classList.add('hidden');
        btnMinhasDisciplinas?.classList.remove('hidden');
    }
    
    atualizarStatusHorario();
}

function atualizarStatusHorario() {
    const status = document.getElementById('statusHorario');
    if (!status) return;
    
    if (usuarioLogado?.tipo === 'superuser') {
        status.textContent = 'ℹ️ Gestores não precisam configurar horário';
        status.className = 'alert-info';
        status.style.padding = '8px 16px';
        status.style.borderRadius = '6px';
        status.style.display = 'inline-block';
        status.style.fontSize = '14px';
        return;
    }
    
    const temHorario = horarioProfessor && Object.keys(horarioProfessor).length > 0;
    
    if (temHorario) {
        const totalAulas = Object.values(horarioProfessor).reduce((sum, dia) => sum + dia.length, 0);
        status.textContent = `✓ Horário configurado (${totalAulas} aulas/semana)`;
        status.className = 'alert-success';
    } else {
        status.textContent = '⚠️ Configure seu horário primeiro';
        status.className = 'alert-warning';
    }
    
    status.style.padding = '8px 16px';
    status.style.borderRadius = '6px';
    status.style.display = 'inline-block';
    status.style.fontSize = '14px';
}

// ==================== INICIALIZAÇÃO ====================
function iniciarAplicacao() {
    if (!telaLogin || !appPrincipal) return;
    
    telaLogin.classList.add('hidden');
    appPrincipal.classList.remove('hidden');
    
    carregarDados();
    setupEventListeners();
    atualizarInterface();
}

function carregarDados() {
    // Carregar configuração da escola
    configEscola = carregarConfiguracaoEscola();
    
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (usuarioSalvo) {
        usuarioLogado = JSON.parse(usuarioSalvo);
    }
    
    // Cada usuário tem seus próprios dados
    if (usuarioLogado && usuarioLogado.tipo !== 'superuser') {
        const planejamentosSalvos = localStorage.getItem('planejamentos_' + usuarioLogado.usuario);
        if (planejamentosSalvos) {
            planejamentos = JSON.parse(planejamentosSalvos);
        }
        
        const horarioSalvo = localStorage.getItem('horarioProfessor_' + usuarioLogado.usuario);
        if (horarioSalvo) {
            horarioProfessor = JSON.parse(horarioSalvo);
        }
        
        const minhasDisciplinasSalvas = localStorage.getItem('minhas_disciplinas_' + usuarioLogado.usuario);
        if (minhasDisciplinasSalvas) {
            minhasDisciplinas = JSON.parse(minhasDisciplinasSalvas);
        }
        
        const dataInicio = localStorage.getItem('dataInicioLetivo_' + usuarioLogado.usuario);
        if (dataInicio && document.getElementById('inicioLetivo')) {
            document.getElementById('inicioLetivo').value = dataInicio;
            setTimeout(() => gerarSemanas(dataInicio), 100);
        }
    }
}

function setupEventListeners() {
    const inicioLetivo = document.getElementById('inicioLetivo');
    
    if (inicioLetivo) {
        inicioLetivo.addEventListener('change', function() {
            gerarSemanas(this.value);
        });
    }
}

// ==================== INICIALIZAÇÃO NO CARREGAMENTO ====================
document.addEventListener('DOMContentLoaded', function() {
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (usuarioSalvo) {
        try {
            usuarioLogado = JSON.parse(usuarioSalvo);
            iniciarAplicacao();
        } catch (e) {
            console.error('Erro ao carregar usuário:', e);
        }
    }
    
    if (document.getElementById('lembrarUsuario')) {
        const usuarioLembrado = localStorage.getItem('usuarioLembrado');
        if (usuarioLembrado) {
            document.getElementById('loginUsuario').value = usuarioLembrado;
            document.getElementById('lembrarUsuario').checked = true;
        }
    }
    
    mostrarLogin();
});

            alert('Conteúdo apagado com sucesso!');
        }
    }
}

function apagarTodaSemana() {
    if (semanaAtual === -1) {
        alert('Nenhuma semana selecionada!');
        return;
    }
    
    if (confirm('⚠️ ATENÇÃO: Isso apagará TODOS os conteúdos e anotações desta semana. Esta ação não pode ser desfeita. Continuar?')) {
        const chave = `semana_${semanaAtual}`;
        if (planejamentos[chave]) {
            // Limpar todos os conteúdos das aulas
            for (let dia = 0; dia < 5; dia++) {
                for (let aula = 0; aula < 7; aula++) {
                    planejamentos[chave].aulas[dia][aula].conteudo = '';
                }
            }
            
            // Limpar anotações
            planejamentos[chave].anotacoes = '';
            
            if (usuarioLogado) {
                localStorage.setItem('planejamentos_' + usuarioLogado.usuario, JSON.stringify(planejamentos));
            }
            
            renderGradeSemana(semanaAtual);
            alert('Toda a semana foi apagada com sucesso!');
        }
    }
}

function salvarAnotacoesSemana(semanaIndex, anotacoes) {
    if (!usuarioLogado) return;
    
    const chave = `semana_${semanaIndex}`;
    if (!planejamentos[chave]) {
        planejamentos[chave] = {
            aulas: criarGradeBaseadaNoHorario(),
            anotacoes: ''
        };
    }
    
    planejamentos[chave].anotacoes = anotacoes;
    localStorage.setItem('planejamentos_' + usuarioLogado.usuario, JSON.stringify(planejamentos));
}

function apagarAnotacoesSemana(semanaIndex) {
    if (confirm('Tem certeza que deseja apagar todas as anotações desta semana?')) {
        const chave = `semana_${semanaIndex}`;
        if (planejamentos[chave]) {
            planejamentos[chave].anotacoes = '';
            if (usuarioLogado) {
                localStorage.setItem('planejamentos_' + usuarioLogado.usuario, JSON.stringify(planejamentos));
            }
            
            renderGradeSemana(semanaIndex);
            alert('Anotações apagadas com sucesso!');
        }
    }
}

function copiarConteudo(semanaIndex, diaIndex, aulaIndex) {
    const chave = `semana_${semanaIndex}`;
    const aula = planejamentos[chave]?.aulas[diaIndex]?.[aulaIndex];
    
    if (!aula || !aula.conteudo) {
        alert('Nada para copiar!');
        return;
    }
    
    const texto = `Conteúdo da aula (${DISCIPLINAS.find(d => d.id === aula.disciplina)?.nome || ''} - Turma ${aula.turma}):\n\n${aula.conteudo}`;
    
    navigator.clipboard.writeText(texto).then(() => {
        alert('Conteúdo copiado para a área de transferência!');
    });
}

// ========== FUNÇÕES DE EXPORTAÇÃO DOC ==========
function exportarSemanaDOC() {
    if (semanaAtual === -1) {
        alert('Nenhuma semana selecionada!');
        return;
    }
    
    const semana = semanas[semanaAtual];
    const chave = `semana_${semanaAtual}`;
    const planejamento = planejamentos[chave] || { aulas: [], anotacoes: '' };
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>Planejamento Semanal - Semana ${semana.id}</title>
            <style>
                @page { size: landscape; margin: 2cm 1cm 1cm 1cm; }
                body { font-family: 'Calibri', 'Arial', sans-serif; margin: 0; padding: 0; font-size: 10.5pt; }
                .tabela-planejamento { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9.5pt; }
                .tabela-planejamento thead th { background-color: #0047B6; color: #FFFFFF; padding: 8px 4px; text-align: center; }
                .coluna-horario { width: 10% !important; background-color: #e6f0ff !important; color: #0047B6 !important; }
                .tabela-planejamento tbody td { padding: 6px 4px; border: 1px solid #cccccc; height: 85px; }
            </style>
        </head>
        <body>
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #0047B6;">📚 PLANEJAMENTO SEMANAL DE AULAS</h1>
                <h3>Semana ${semana.id} • ${formatarDataDOC(semana.inicio)} a ${formatarDataDOC(semana.fim)}</h3>
                <p><strong>Professor:</strong> ${usuarioLogado?.nome || 'Não informado'}</p>
            </div>
            
            <table class="tabela-planejamento">
                <thead>
                    <tr>
                        <th class="coluna-horario">HORÁRIO</th>
    `;
    
    // Cabeçalho dos dias
    for (let dia = 0; dia < 5; dia++) {
        const dataDia = new Date(semana.inicio);
        dataDia.setDate(dataDia.getDate() + dia);
        html += `<th>${DIAS_SEMANA_COMPLETO[dia]}<br>${formatarDataDOC(dataDia)}</th>`;
    }
    
    html += `</tr></thead><tbody>`;
    
    // Linhas das aulas
    for (let aula = 0; aula < 7; aula++) {
        html += `<tr><td class="coluna-horario">${HORARIOS[aula]}<br><small>45 min</small></td>`;
        
        for (let dia = 0; dia < 5; dia++) {
            const aulaData = planejamento.aulas[dia]?.[aula] || { disciplina: null, turma: null, conteudo: '' };
            
            if (aulaData.disciplina && aulaData.turma) {
                const disciplina = DISCIPLINAS.find(d => d.id === aulaData.disciplina);
                const conteudoFormatado = formatarConteudoCompletoDOC(aulaData.conteudo || '');
                
                html += `<td>
                    <div><strong>${disciplina?.nome || ''}</strong></div>
                    <div><small>Turma ${aulaData.turma}</small></div>
                    <div style="margin-top: 5px; font-size: 9pt;">${conteudoFormatado}</div>
                </td>`;
            } else {
                html += `<td style="color: #999; font-style: italic;">Sem aula</td>`;
            }
        }
        
        html += `</tr>`;
    }
    
    html += `</tbody></table>`;
    
    // Anotações
    if (planejamento.anotacoes && planejamento.anotacoes.trim() !== '') {
        html += `
            <div style="margin-top: 30px; padding: 15px; border: 2px solid #F2B817; background: #fff8e1;">
                <h3 style="color: #d48806;">📝 ANOTAÇÕES DA SEMANA</h3>
                <p>${planejamento.anotacoes.replace(/\n/g, '<br>')}</p>
            </div>
        `;
    }
    
    // Rodapé
    html += `
        <div style="margin-top: 30px; text-align: center; font-size: 9pt; color: #666; border-top: 1px solid #ddd; padding-top: 10px;">
            <p>Documento gerado pelo Sistema Planejador de Aulas • ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        </body>
        </html>
    `;
    
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planejamento_semana_${semana.id}_${formatarDataDOC(semana.inicio)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Documento Word exportado com sucesso!');
}

function formatarDataDOC(data) {
    if (!data) return '';
    const d = new Date(data);
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function formatarConteudoCompletoDOC(conteudo) {
    if (!conteudo || conteudo.trim() === '') {
        return '<span style="color: #999; font-style: italic;">Sem conteúdo planejado</span>';
    }
    
    return conteudo.replace(/\n/g, '<br>')
                   .replace(/  /g, ' &nbsp;');
}

function contarAulasNaSemana(aulas) {
    if (!aulas) return 0;
    let total = 0;
    for (let dia = 0; dia < 5; dia++) {
        for (let aula = 0; aula < 7; aula++) {
            const aulaData = aulas[dia]?.[aula];
            if (aulaData && aulaData.disciplina && aulaData.turma) {
                total++;
            }
        }
    }
    return total;
}

function contarAulasComConteudo(aulas) {
    if (!aulas) return 0;
    let total = 0;
    for (let dia = 0; dia < 5; dia++) {
        for (let aula = 0; aula < 7; aula++) {
            const aulaData = aulas[dia]?.[aula];
            if (aulaData && aulaData.disciplina && aulaData.turma && aulaData.conteudo && aulaData.conteudo.trim() !== '') {
                total++;
            }
        }
    }
    return total;
}

function exportarParaDOC() {
    if (semanas.length === 0) {
        alert('Nenhuma semana gerada! Configure o horário e a data de início primeiro.');
        return;
    }
    
    const opcao = prompt('Escolha o tipo de exportação:\n1 - Semana atual (DOC/Word)\n2 - Semana específica (DOC/Word)\n\nDigite o número:');
    
    switch(opcao) {
        case '1':
            if (semanaAtual !== -1) {
                exportarSemanaDOC();
            } else {
                alert('Nenhuma semana selecionada!');
            }
            break;
        case '2':
            const semanaNum = prompt(`Digite o número da semana (1 a ${semanas.length}):`);
            const num = parseInt(semanaNum);
            if (num >= 1 && num <= semanas.length) {
                const index = num - 1;
                const temp = semanaAtual;
                semanaAtual = index;
                exportarSemanaDOC();
                semanaAtual = temp;
            } else {
                alert('Número de semana inválido!');
            }
            break;
        default:
            alert('Opção inválida!');
    }
}

// ========== INICIALIZAÇÃO DO SISTEMA ==========
document.addEventListener('DOMContentLoaded', function() {
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (usuarioSalvo) {
        try {
            usuarioLogado = JSON.parse(usuarioSalvo);
            iniciarAplicacao();
        } catch (e) {
            console.error('Erro ao carregar usuário:', e);
        }
    }
    
    if (document.getElementById('lembrarUsuario')) {
        const usuarioLembrado = localStorage.getItem('usuarioLembrado');
        if (usuarioLembrado) {
            document.getElementById('loginUsuario').value = usuarioLembrado;
            document.getElementById('lembrarUsuario').checked = true;
        }
    }
    
    mostrarLogin();
});// ========== GERENCIAMENTO DE DISCIPLINAS ==========
function carregarDisciplinas() {
    const disciplinasSalvas = localStorage.getItem('disciplinas_sistema');
    if (disciplinasSalvas) {
        return JSON.parse(disciplinasSalvas);
    }
    
    const disciplinasPadrao = [
        { id: "biologia", nome: "Biologia", icone: "🧬" },
        { id: "biohackeria", nome: "Biohackeria", icone: "🔬" },
        { id: "projetos_livres", nome: "Projetos Livres", icone: "💡" },
        { id: "robotica", nome: "Robótica", icone: "🤖" },
        { id: "apps_games", nome: "Apps e Games", icone: "🎮" },
        { id: "iniciacao_cientifica", nome: "Iniciação Científica", icone: "🔍" },
        { id: "outra", nome: "Outra", icone: "📝" }
    ];
    
    localStorage.setItem('disciplinas_sistema', JSON.stringify(disciplinasPadrao));
    return disciplinasPadrao;
}

function salvarDisciplinas(disciplinas) {
    localStorage.setItem('disciplinas_sistema', JSON.stringify(disciplinas));
    DISCIPLINAS = disciplinas;
}

function adicionarDisciplina() {
    const nome = document.getElementById('novaDisciplinaNome').value.trim();
    const icone = document.getElementById('novaDisciplinaIcone').value.trim();
    
    if (!nome) {
        alert('Digite o nome da disciplina');
        return;
    }
    
    const id = nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    // Verificar se já existe
    if (DISCIPLINAS.find(d => d.id === id)) {
        alert('Já existe uma disciplina com este nome');
        return;
    }
    
    DISCIPLINAS.push({
        id: id,
        nome: nome,
        icone: icone || '📚'
    });
    
    salvarDisciplinas(DISCIPLINAS);
    document.getElementById('novaDisciplinaNome').value = '';
    document.getElementById('novaDisciplinaIcone').value = '';
    
    atualizarListaDisciplinas();
    atualizarDisciplinasInterface();
    alert('Disciplina adicionada com sucesso!');
}

function removerDisciplina(id) {
    if (confirm('Deseja realmente remover esta disciplina?')) {
        DISCIPLINAS = DISCIPLINAS.filter(d => d.id !== id);
        salvarDisciplinas(DISCIPLINAS);
        atualizarListaDisciplinas();
        atualizarDisciplinasInterface();
        alert('Disciplina removida com sucesso!');
    }
}

function atualizarListaDisciplinas() {
    const lista = document.getElementById('listaDisciplinas');
    if (!lista) return;
    
    let html = '';
    DISCIPLINAS.forEach(disc => {
        const removivel = !['biologia', 'biohackeria'].includes(disc.id);
        html += `
            <div class="disciplina-item">
                <div>
                    <span style="font-size: 20px; margin-right: 8px;">${disc.icone}</span>
                    <strong>${disc.nome}</strong>
                </div>
                ${removivel ? `<button class="btn-remover-disciplina" onclick="removerDisciplina('${disc.id}')">Remover</button>` : ''}
            </div>
        `;
    });
    
    lista.innerHTML = html;
}

function atualizarDisciplinasInterface() {
    const span = document.getElementById('disciplinasLista');
    if (span) {
        span.textContent = DISCIPLINAS.map(d => d.nome).join(', ');
    }
}

// ========== PAINEL DE ADMINISTRAÇÃO ==========
function abrirPainelAdmin() {
    if (!usuarioLogado || usuarioLogado.tipo !== "superuser") {
        alert('Acesso restrito à coordenação');
        return;
    }
    
    document.getElementById('paginaSemanas').classList.add('hidden');
    document.getElementById('paginaAulas').classList.add('hidden');
    document.getElementById('paginaAdmin').classList.remove('hidden');
    
    mostrarAbaAdmin('professores');
}

function fecharPainelAdmin() {
    document.getElementById('paginaAdmin').classList.add('hidden');
    document.getElementById('paginaSemanas').classList.remove('hidden');
}

function mostrarAbaAdmin(aba) {
    // Atualizar tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Mostrar/ocultar abas
    if (aba === 'professores') {
        document.getElementById('abaAdminProfessores').classList.remove('hidden');
        document.getElementById('abaAdminDisciplinas').classList.add('hidden');
        carregarTabelaProfessores();
    } else if (aba === 'disciplinas') {
        document.getElementById('abaAdminProfessores').classList.add('hidden');
        document.getElementById('abaAdminDisciplinas').classList.remove('hidden');
        atualizarListaDisciplinas();
    }
}

function carregarTabelaProfessores() {
    const tbody = document.getElementById('corpoTabelaProfessores');
    if (!tbody) return;
    
    const professores = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('usuario_')) {
            const usuario = JSON.parse(localStorage.getItem(key));
            if (usuario.tipo !== "superuser") {
                professores.push(usuario);
            }
        }
    }
    
    let html = '';
    if (professores.length === 0) {
        html = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #999;">Nenhum professor cadastrado</td></tr>';
    } else {
        professores.forEach(prof => {
            const dataCadastro = prof.dataCadastro ? new Date(prof.dataCadastro).toLocaleDateString('pt-BR') : 'Não informada';
            html += `
                <tr>
                    <td>${prof.nome}</td>
                    <td>${prof.usuario}</td>
                    <td>${prof.email}</td>
                    <td>${dataCadastro}</td>
                </tr>
            `;
        });
    }
    
    tbody.innerHTML = html;
}

function gerarRelatorioProfessores() {
    const professores = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('usuario_')) {
            const usuario = JSON.parse(localStorage.getItem(key));
            if (usuario.tipo !== "superuser") {
                const temHorario = localStorage.getItem('horarioProfessor_' + usuario.usuario);
                const temPlanejamentos = localStorage.getItem('planejamentos_' + usuario.usuario);
                
                professores.push({
                    nome: usuario.nome,
                    usuario: usuario.usuario,
                    email: usuario.email,
                    dataCadastro: usuario.dataCadastro ? new Date(usuario.dataCadastro).toLocaleDateString('pt-BR') : 'Não informada',
                    horarioConfigurado: temHorario ? 'Sim' : 'Não',
                    temPlanejamentos: temPlanejamentos ? 'Sim' : 'Não'
                });
            }
        }
    }
    
    if (professores.length === 0) {
        alert('Nenhum professor cadastrado no sistema');
        return;
    }
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Professores</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #0047B6; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background-color: #0047B6; color: white; padding: 12px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #ddd; }
                tr:hover { background-color: #f5f7fa; }
                .totais { background: #f5f7fa; padding: 15px; border-radius: 8px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <h1>📊 Relatório de Professores Cadastrados</h1>
            <p style="text-align: center;">Data de geração: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Usuário</th>
                        <th>Email</th>
                        <th>Data de Cadastro</th>
                        <th>Horário Configurado</th>
                        <th>Tem Planejamentos</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    professores.forEach(prof => {
        html += `
            <tr>
                <td>${prof.nome}</td>
                <td>${prof.usuario}</td>
                <td>${prof.email}</td>
                <td>${prof.dataCadastro}</td>
                <td>${prof.horarioConfigurado}</td>
                <td>${prof.temPlanejamentos}</td>
            </tr>
        `;
    });
    
    const comHorario = professores.filter(p => p.horarioConfigurado === 'Sim').length;
    const comPlanejamentos = professores.filter(p => p.temPlanejamentos === 'Sim').length;
    
    html += `
                </tbody>
            </table>
            
            <div class="totais">
                <h3>Resumo</h3>
                <p><strong>Total de professores cadastrados:</strong> ${professores.length}</p>
                <p><strong>Professores com horário configurado:</strong> ${comHorario}</p>
                <p><strong>Professores com planejamentos:</strong> ${comPlanejamentos}</p>
            </div>
            
            <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
                <p>Relatório gerado pelo Sistema Planejador de Aulas</p>
                <p>Desenvolvido por Lafaiete Erkmann • @lafa.bio</p>
            </div>
        </body>
        </html>
    `;
    
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_professores_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Relatório gerado com sucesso!');
}

function copiarEmailsProfessores() {
    const emails = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('usuario_')) {
            const usuario = JSON.parse(localStorage.getItem(key));
            if (usuario.tipo !== "superuser" && usuario.email) {
                emails.push(usuario.email);
            }
        }
    }
    
    if (emails.length === 0) {
        alert('Nenhum email de professor encontrado');
        return;
    }
    
    const listaEmails = emails.join('; ');
    
    navigator.clipboard.writeText(listaEmails).then(() => {
        alert(`${emails.length} emails copiados para a área de transferência!\n\nEmails: ${listaEmails}`);
    }).catch(err => {
        alert(`Emails encontrados:\n\n${listaEmails}\n\nCopie manualmente (não foi possível copiar automaticamente)`);
    });
}

