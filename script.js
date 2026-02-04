// ========== VARIÁVEIS GLOBAIS ==========
let usuarioLogado = null;
let semanas = [];
let semanaAtual = -1;

// Dados POR ESCOLA
let escolas = [];
let escolaAtual = null;

// Cada escola tem seus próprios dados
// Essas variáveis SEMPRE representam a escola atual
let configEscolaAtual = {
    nome: "",
    endereco: "",
    cidade: "",
    telefone: "",
    email: "",
    turno: "Matutino",
    logo: ""
};

let configHorarioAtual = {
    aulasPorPeriodo: 7,
    duracaoAula: 45,
    inicioAulas: "07:00",
    intervalo: "10:00",
    duracaoIntervalo: 20
};

let disciplinasProfessor = [];  // Disciplinas da escola atual
let turmasProfessor = [];       // Turmas da escola atual
let horarioProfessor = {};      // Horário da escola atual
let planejamentos = {};         // Planejamentos da escola atual
let horariosGerados = [];       // Horários gerados da escola atual

// Variáveis temporárias para criação de nova escola
let novaEscolaConfig = {
    turno: "Matutino",
    aulasPorPeriodo: 7,
    duracaoAula: 45,
    inicioAulas: "07:00"
};

// Superusuário
const SUPER_USUARIO = {
    usuario: "coordenacao",
    senha: "sesi@2026",
    nome: "Coordenação Pedagógica",
    email: "coordenacao@escola.com",
    tipo: "superuser"
};

// Constantes
const DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];
const DIAS_SEMANA_COMPLETO = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];

// ========== FUNÇÕES DE UTILIDADE ==========
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = '🙈';
    } else {
        input.type = 'password';
        toggle.textContent = '👁️';
    }
}

function formatarData(data) {
    if (!data) return '';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
}

function formatarDataISO(data) {
    if (!data) return '';
    const d = new Date(data);
    return d.toISOString().split('T')[0];
}

// Função auxiliar para horário padrão por turno
function getHorarioPadraoPorTurno(turno) {
    const padroes = {
        'Matutino': {
            aulasPorPeriodo: 7,
            duracaoAula: 45,
            inicioAulas: "07:00",
            intervalo: "10:00",
            duracaoIntervalo: 20
        },
        'Vespertino': {
            aulasPorPeriodo: 7,
            duracaoAula: 45,
            inicioAulas: "13:00",
            intervalo: "15:30",
            duracaoIntervalo: 20
        },
        'Noturno': {
            aulasPorPeriodo: 5,
            duracaoAula: 50,
            inicioAulas: "19:00",
            intervalo: "20:30",
            duracaoIntervalo: 15
        },
        'Integral': {
            aulasPorPeriodo: 10,
            duracaoAula: 45,
            inicioAulas: "07:00",
            intervalo: "12:00",
            duracaoIntervalo: 60
        }
    };
    
    return padroes[turno] || padroes['Matutino'];
}

function calcularHorarioFinal(config) {
    const [horaInicio, minutoInicio] = config.inicioAulas.split(':').map(Number);
    const totalMinutos = horaInicio * 60 + minutoInicio + 
                        (config.aulasPorPeriodo * config.duracaoAula) + 
                        config.duracaoIntervalo;
    
    const horaFinal = Math.floor(totalMinutos / 60);
    const minutoFinal = totalMinutos % 60;
    
    return `${String(horaFinal).padStart(2, '0')}:${String(minutoFinal).padStart(2, '0')}`;
}

// ========== FUNÇÕES DE LOGIN/CADASTRO ==========
function mostrarLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('cadastroForm').classList.add('hidden');
    document.getElementById('recuperacaoForm').classList.add('hidden');
    document.getElementById('novaSenhaForm').classList.add('hidden');
}

function mostrarCadastro() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('cadastroForm').classList.remove('hidden');
    document.getElementById('recuperacaoForm').classList.add('hidden');
    document.getElementById('novaSenhaForm').classList.add('hidden');
}

function mostrarRecuperacao() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('cadastroForm').classList.add('hidden');
    document.getElementById('recuperacaoForm').classList.remove('hidden');
    document.getElementById('novaSenhaForm').classList.add('hidden');
}

function mostrarNovaSenha() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('cadastroForm').classList.add('hidden');
    document.getElementById('recuperacaoForm').classList.add('hidden');
    document.getElementById('novaSenhaForm').classList.remove('hidden');
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
        
        // Lembrar usuário
        if (document.getElementById('lembrarUsuario').checked) {
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
        
        // Validações
        if (!nome || !usuario || !email || !senha || !confirmarSenha) {
            alert('Preencha todos os campos');
            return;
        }
        
        if (usuario === SUPER_USUARIO.usuario) {
            alert('Este nome de usuário é reservado');
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
        
        // Verificar email
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
        
        // Criar novo usuário
        const novoUsuario = { 
            nome, 
            usuario, 
            email,
            tipo: "professor",
            dataCadastro: new Date().toISOString()
        };
        
        // Salvar
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
    const email = document.getElementById('recuperacaoEmail').value.trim();
    const usuario = document.getElementById('recuperacaoUsuario').value.trim();
    
    if (!email || !usuario) {
        alert('Preencha todos os campos');
        return;
    }
    
    // Simular envio de código
    const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    localStorage.setItem('recuperacao_' + usuario, JSON.stringify({
        codigo,
        expiracao: Date.now() + 3600000,
        usuario
    }));
    
    alert(`Código de recuperação: ${codigo}\n\n(Em produção, seria enviado para: ${email})`);
    mostrarNovaSenha();
}

function definirNovaSenha() {
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
    
    // Buscar código
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
    localStorage.removeItem('recuperacao_' + usuarioRecuperacao);
    
    alert('Senha alterada com sucesso!');
    mostrarLogin();
}

function fazerLogout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('usuarioLogado');
        window.location.reload();
    }
}

// ========== FUNÇÕES DE ALTERNÂNCIA DE ESCOLAS ==========
function alternarSeletorEscola() {
    const dropdown = document.getElementById('dropdownEscolas');
    if (dropdown.classList.contains('hidden')) {
        abrirDropdownEscolas();
    } else {
        dropdown.classList.add('hidden');
    }
}

function abrirDropdownEscolas() {
    const dropdown = document.getElementById('dropdownEscolas');
    if (!dropdown) return;
    
    dropdown.innerHTML = '';
    dropdown.classList.remove('hidden');
    
    if (escolas.length === 0) {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.innerHTML = '<div style="padding: 12px; color: #666; text-align: center;">Nenhuma escola cadastrada</div>';
        dropdown.appendChild(item);
        
        const btnNova = document.createElement('div');
        btnNova.className = 'dropdown-item';
        btnNova.innerHTML = '<div style="padding: 12px; background: #f0f8ff; color: #0047B6; cursor: pointer; text-align: center; border-top: 1px solid #eee;" onclick="abrirCadastroEscola()">➕ Adicionar Escola</div>';
        dropdown.appendChild(btnNova);
        return;
    }
    
    escolas.forEach(escola => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        if (escolaAtual && escola.id === escolaAtual.id) {
            item.style.background = '#f0f8ff';
        }
        
        item.innerHTML = `
            <div style="padding: 10px 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;" 
                 onclick="selecionarEscolaRapido('${escola.id}')">
                <div style="font-size: 20px;">${escola.logo ? '🏫' : '📚'}</div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: ${escolaAtual && escola.id === escolaAtual.id ? 'bold' : 'normal'}; color: #0047B6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${escola.nome}
                    </div>
                    <div style="font-size: 11px; color: #666;">
                        ${escola.turno || 'Turno não definido'}
                    </div>
                </div>
                ${escolaAtual && escola.id === escolaAtual.id ? '<div style="color: #28a745;">✓</div>' : ''}
            </div>
        `;
        dropdown.appendChild(item);
    });
    
    const btnNova = document.createElement('div');
    btnNova.className = 'dropdown-item';
    btnNova.innerHTML = `
        <div style="padding: 12px; background: #f8f9fa; color: #0047B6; cursor: pointer; text-align: center; border-top: 1px solid #ddd; font-weight: bold;" 
             onclick="abrirCadastroEscola(); document.getElementById('dropdownEscolas').classList.add('hidden');">
            ➕ Adicionar Nova Escola
        </div>
    `;
    dropdown.appendChild(btnNova);
}

function selecionarEscolaRapido(escolaId) {
    const dropdown = document.getElementById('dropdownEscolas');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
    
    // Verificar se a escola já está selecionada
    if (escolaAtual && escolaAtual.id === escolaId) {
        return;
    }
    
    // Selecionar a escola
    selecionarEscola(escolaId);
}

function selecionarEscola(escolaId) {
    // Fechar modal se estiver aberto
    fecharModal();
    
    // Fechar dropdown se estiver aberto
    const dropdown = document.getElementById('dropdownEscolas');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
    
    // Verificar se escola existe
    const escola = escolas.find(e => e.id === escolaId);
    if (!escola) {
        alert('Escola não encontrada!');
        return;
    }
    
    // Mostrar loading
    const appPrincipal = document.getElementById('appPrincipal');
    const loadingHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.9); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10000;">
            <div style="font-size: 24px; margin-bottom: 20px;">🔄</div>
            <div style="font-weight: bold; color: #0047B6; margin-bottom: 10px;">Alternando para ${escola.nome}</div>
            <div style="color: #666;">Carregando dados da escola...</div>
        </div>
    `;
    appPrincipal.insertAdjacentHTML('beforeend', loadingHTML);
    
    // Pequeno delay para mostrar o loading
    setTimeout(() => {
        // Carregar dados da nova escola
        carregarDadosEscola(escolaId);
        
        // Atualizar interface
        atualizarInterface();
        
        // Atualizar banner da escola
        atualizarBannerEscola();
        
        // Atualizar nome da escola no header
        atualizarNomeEscolaHeader();
        
        // Renderizar semanas da nova escola
        renderSemanas();
        
        // Atualizar status do horário
        atualizarStatusHorario();
        
        // Remover loading
        const loading = appPrincipal.querySelector('div[style*="position: fixed"]');
        if (loading) {
            loading.remove();
        }
        
        // Mostrar confirmação
        const escolaNomeElement = document.getElementById('escolaAtualNome');
        if (escolaNomeElement) {
            const originalText = escolaNomeElement.textContent;
            escolaNomeElement.textContent = `✔ ${escola.nome}`;
            escolaNomeElement.style.color = '#28a745';
            
            setTimeout(() => {
                escolaNomeElement.textContent = originalText;
                escolaNomeElement.style.color = '';
            }, 2000);
        }
        
        // Fechar página de aulas se estiver aberta
        if (semanaAtual !== -1) {
            voltarParaSemanas();
        }
        
    }, 300);
}

function atualizarNomeEscolaHeader() {
    const elemento = document.getElementById('nomeEscolaAtualHeader');
    if (elemento) {
        if (escolaAtual) {
            const nomeCurto = escolaAtual.nome.length > 15 ? 
                escolaAtual.nome.substring(0, 15) + '...' : escolaAtual.nome;
            elemento.innerHTML = `🏫 ${nomeCurto}`;
        } else {
            elemento.innerHTML = '🏫 Selecionar Escola';
        }
    }
}

// ========== INICIALIZAÇÃO ==========
function iniciarAplicacao() {
    document.getElementById('telaLogin').classList.add('hidden');
    document.getElementById('appPrincipal').classList.remove('hidden');
    
    carregarDadosUsuario();
    atualizarInterface();
    
    // Adicionar evento para fechar dropdown ao clicar fora
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('dropdownEscolas');
        const seletor = document.getElementById('seletorEscolaHeader');
        
        if (dropdown && seletor && !dropdown.classList.contains('hidden')) {
            if (!seletor.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        }
    });
}

function carregarDadosUsuario() {
    if (!usuarioLogado) return;
    
    // Carregar dados pessoais
    const perfilSalvo = localStorage.getItem('perfil_' + usuarioLogado.usuario);
    if (perfilSalvo) {
        Object.assign(usuarioLogado, JSON.parse(perfilSalvo));
    }
    
    // Carregar escolas do usuário
    const escolasSalvas = localStorage.getItem('escolas_' + usuarioLogado.usuario);
    if (escolasSalvas) {
        escolas = JSON.parse(escolasSalvas);
        if (escolas.length > 0 && !escolaAtual) {
            escolaAtual = escolas[0];
            carregarDadosEscola(escolaAtual.id);
        }
    }
    
    // Atualizar interface
    atualizarInterface();
}

function carregarDadosEscola(escolaId) {
    const escola = escolas.find(e => e.id === escolaId);
    if (!escola) return;
    
    escolaAtual = escola;
    
    // Carregar configurações da escola
    const configSalva = localStorage.getItem(`configEscola_${usuarioLogado.usuario}_${escolaId}`);
    if (configSalva) {
        configEscolaAtual = JSON.parse(configSalva);
    } else {
        configEscolaAtual = {
            nome: escola.nome,
            endereco: escola.endereco,
            cidade: escola.cidade,
            telefone: escola.telefone,
            email: escola.email,
            turno: escola.turno,
            logo: escola.logo
        };
    }
    
    // Carregar configurações de horário
    const horarioSalvo = localStorage.getItem(`configHorario_${usuarioLogado.usuario}_${escolaId}`);
    if (horarioSalvo) {
        configHorarioAtual = JSON.parse(horarioSalvo);
    } else {
        configHorarioAtual = getHorarioPadraoPorTurno(escola.turno);
    }
    
    // Carregar disciplinas
    const disciplinasSalvas = localStorage.getItem(`disciplinas_${usuarioLogado.usuario}_${escolaId}`);
    disciplinasProfessor = disciplinasSalvas ? JSON.parse(disciplinasSalvas) : [];
    
    // Carregar turmas
    const turmasSalvas = localStorage.getItem(`turmas_${usuarioLogado.usuario}_${escolaId}`);
    turmasProfessor = turmasSalvas ? JSON.parse(turmasSalvas) : [];
    
    // Carregar horário do professor
    const horarioProfessorSalvo = localStorage.getItem(`horarioProfessor_${usuarioLogado.usuario}_${escolaId}`);
    horarioProfessor = horarioProfessorSalvo ? JSON.parse(horarioProfessorSalvo) : {};
    
    // Carregar planejamentos
    const planejamentosSalvos = localStorage.getItem(`planejamentos_${usuarioLogado.usuario}_${escolaId}`);
    planejamentos = planejamentosSalvos ? JSON.parse(planejamentosSalvos) : {};
    
    // Carregar semanas
    const semanasSalvas = localStorage.getItem(`semanas_${usuarioLogado.usuario}_${escolaId}`);
    semanas = semanasSalvas ? JSON.parse(semanasSalvas) : [];
    
    // Converter strings de data para objetos Date
    semanas.forEach(semana => {
        if (typeof semana.inicio === 'string') {
            semana.inicio = new Date(semana.inicio);
        }
        if (typeof semana.fim === 'string') {
            semana.fim = new Date(semana.fim);
        }
    });
    
    // Carregar data de início
    const dataInicioSalva = localStorage.getItem(`dataInicioLetivo_${usuarioLogado.usuario}_${escolaId}`);
    if (dataInicioSalva && document.getElementById('inicioLetivo')) {
        document.getElementById('inicioLetivo').value = dataInicioSalva;
    } else if (document.getElementById('inicioLetivo')) {
        document.getElementById('inicioLetivo').value = '';
    }
    
    // Gerar horários baseados na nova configuração
    gerarHorarios();
    
    // Atualizar nome da escola na interface
    const escolaNomeElement = document.getElementById('escolaAtualNome');
    if (escolaNomeElement) {
        escolaNomeElement.textContent = escolaAtual.nome;
    }
    
    // Atualizar contador de disciplinas
    atualizarListaDisciplinas();
    
    // Atualizar status do horário
    atualizarStatusHorario();
    
    // Atualizar nome da escola no header
    atualizarNomeEscolaHeader();
}

function atualizarInterface() {
    if (usuarioLogado) {
        document.getElementById('userCumprimento').textContent = usuarioLogado.nome.split(' ')[0];
        
        // Mostrar botão admin apenas para superusuário
        if (usuarioLogado.tipo === "superuser") {
            document.getElementById('btnAdmin').classList.remove('hidden');
        }
    }
    
    // Atualizar seletor de escola
    atualizarNomeEscolaHeader();
}

function atualizarBannerEscola() {
    const banner = document.getElementById('bannerEscolaAtual');
    const nomeEscola = document.getElementById('escolaAtualNome');
    
    if (banner && nomeEscola) {
        if (escolaAtual) {
            banner.classList.remove('hidden');
            nomeEscola.textContent = escolaAtual.nome;
            
            // Adicionar contador de escolas
            const contador = document.createElement('span');
            contador.id = 'contadorEscolas';
            contador.style.cssText = 'font-size: 12px; color: #666; margin-left: 10px; background: #e0e0e0; padding: 2px 8px; border-radius: 10px;';
            contador.textContent = `${escolas.findIndex(e => e.id === escolaAtual.id) + 1}/${escolas.length}`;
            
            // Remover contador antigo se existir
            const contadorAntigo = banner.querySelector('#contadorEscolas');
            if (contadorAntigo) {
                contadorAntigo.remove();
            }
            
            banner.querySelector('div').appendChild(contador);
        } else {
            banner.classList.add('hidden');
        }
    }
}

function atualizarListaDisciplinas() {
    const contador = disciplinasProfessor.length;
    const texto = contador === 0 ? 'Nenhuma disciplina cadastrada' : `${contador} disciplinas`;
    const element = document.getElementById('disciplinasLista');
    if (element) {
        element.textContent = texto;
    }
}

// ========== FUNÇÃO PARA MOSTRAR AVISO SEM ESCOLA ==========
function mostrarAvisoSemEscola() {
    const container = document.getElementById('listaSemanas');
    if (container && !escolaAtual) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <div style="font-size: 48px; color: #ccc; margin-bottom: 20px;">🏫</div>
                <h3 style="color: #666; margin-bottom: 10px;">Nenhuma escola selecionada</h3>
                <p style="color: #999; margin-bottom: 20px;">Selecione uma escola para ver as semanas</p>
                <button onclick="alternarSeletorEscola()" class="btn btn-primary" style="padding: 10px 20px;">
                    🏫 Selecionar Escola
                </button>
            </div>
        `;
    }
    
    // Atualizar status do horário
    const statusElement = document.getElementById('statusHorario');
    if (statusElement && !escolaAtual) {
        statusElement.innerHTML = '⚠️ Selecione uma escola primeiro';
        statusElement.className = 'status-horario vazio';
    }
}

// ========== GESTÃO DE ESCOLAS ==========
function abrirConfiguracaoEscola() {
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 800px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: #0047B6; margin: 0;">🏫 Minhas Escolas</h3>
                    <button onclick="fecharModal()" class="btn btn-secondary">Fechar</button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <p>Selecione uma escola para configurar ou adicione uma nova:</p>
                    <div id="escolasContainer"></div>
                </div>
                
                ${escolaAtual ? `
                <div class="config-section">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="color: #2A6ED4; margin: 0;">Configurando: ${escolaAtual.nome}</h4>
                        <button onclick="abrirConfiguracaoEscolaDetalhes()" class="btn btn-primary">
                            ⚙️ Configurar Esta Escola
                        </button>
                    </div>
                </div>
                ` : ''}
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px;">
                    <button onclick="abrirCadastroEscola()" class="btn btn-success">
                        ➕ Adicionar Nova Escola
                    </button>
                    <button onclick="fecharModal()" class="btn btn-secondary">Fechar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    atualizarSeletorEscolas();
}

function atualizarSeletorEscolas() {
    const container = document.getElementById('escolasContainer');
    if (!container) return;
    
    if (escolas.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">Nenhuma escola cadastrada</p>';
        return;
    }
    
    let html = '<div class="escolas-grid">';
    escolas.forEach((escola, index) => {
        html += `
            <div class="escola-card ${escolaAtual && escola.id === escolaAtual.id ? 'active' : ''}" 
                 onclick="selecionarEscola('${escola.id}')">
                ${index > 0 ? `<button class="btn-escola-remover" onclick="removerEscola(event, '${escola.id}')">×</button>` : ''}
                <div class="escola-logo-container">
                    ${escola.logo ? 
                        `<img src="${escola.logo}" class="escola-logo" alt="${escola.nome}">` : 
                        '<div style="font-size: 24px;">🏫</div>'}
                </div>
                <h4>${escola.nome}</h4>
                <p>${escola.turno || 'Turno não definido'}</p>
                <p style="font-size: 11px;">${escola.cidade || ''}</p>
            </div>
        `;
    });
    
    html += `
        <div class="escola-card" style="border-style: dashed; text-align: center;" onclick="abrirCadastroEscola()">
            <div style="font-size: 36px; color: #0047B6; margin: 10px 0;">+</div>
            <h4 style="color: #0047B6;">Nova Escola</h4>
            <p>Adicionar outra escola</p>
        </div>
    `;
    
    html += '</div>';
    container.innerHTML = html;
}

function abrirCadastroEscola() {
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 700px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: #0047B6; margin: 0;">🏫 Cadastrar Nova Escola</h3>
                    <button onclick="fecharModal()" class="btn btn-secondary">Fechar</button>
                </div>
                
                <div class="config-section">
                    <h4 style="color: #2A6ED4; margin-bottom: 15px;">📋 Dados da Escola</h4>
                    
                    <div class="input-group">
                        <label>Nome da Escola *</label>
                        <input type="text" id="novaEscolaNome" placeholder="Nome da instituição" required>
                    </div>
                    
                    <div class="input-group">
                        <label>Endereço</label>
                        <input type="text" id="novaEscolaEndereco" placeholder="Rua, número, bairro">
                    </div>
                    
                    <div class="grid-2">
                        <div class="input-group">
                            <label>Cidade</label>
                            <input type="text" id="novaEscolaCidade" placeholder="Cidade">
                        </div>
                        <div class="input-group">
                            <label>Telefone</label>
                            <input type="text" id="novaEscolaTelefone" placeholder="(11) 99999-9999">
                        </div>
                    </div>
                    
                    <div class="grid-2">
                        <div class="input-group">
                            <label>Email</label>
                            <input type="email" id="novaEscolaEmail" placeholder="escola@email.com">
                        </div>
                        <div class="input-group">
                            <label>Turno *</label>
                            <select id="novaEscolaTurno" onchange="atualizarHorarioPorTurno()">
                                <option value="Matutino">Matutino</option>
                                <option value="Vespertino">Vespertino</option>
                                <option value="Noturno">Noturno</option>
                                <option value="Integral">Integral</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="input-group">
                        <label>Logo da Escola (URL da imagem)</label>
                        <input type="text" id="novaEscolaLogo" placeholder="https://exemplo.com/logo.png">
                        <small style="color: #666;">Cole a URL de uma imagem ou deixe em branco</small>
                    </div>
                </div>
                
                <div class="config-section">
                    <h4 style="color: #2A6ED4; margin-bottom: 15px;">🕐 Configuração de Horário Padrão</h4>
                    
                    <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <p><strong>Turno selecionado:</strong> <span id="turnoSelecionado">Matutino</span></p>
                        <p><strong>Horário padrão:</strong> <span id="horarioPadrao">07:00 - 12:25 (7 aulas de 45min)</span></p>
                    </div>
                    
                    <div class="grid-2">
                        <div class="input-group">
                            <label>Aulas por período:</label>
                            <input type="number" id="novaEscolaAulas" value="7" min="4" max="12" onchange="atualizarConfigNovaEscola('aulasPorPeriodo', this.value)">
                        </div>
                        <div class="input-group">
                            <label>Duração da aula (min):</label>
                            <input type="number" id="novaEscolaDuracaoAula" value="45" min="40" max="60" onchange="atualizarConfigNovaEscola('duracaoAula', this.value)">
                        </div>
                    </div>
                    
                    <div class="grid-2">
                        <div class="input-group">
                            <label>Início das aulas:</label>
                            <input type="time" id="novaEscolaInicio" value="07:00" onchange="atualizarConfigNovaEscola('inicioAulas', this.value)">
                        </div>
                        <div class="input-group">
                            <label>Horário do recreio:</label>
                            <input type="time" id="novaEscolaRecreio" value="10:00">
                        </div>
                    </div>
                    
                    <div class="input-group">
                        <label>Duração do recreio (min):</label>
                        <input type="number" id="novaEscolaDuracaoRecreio" value="20" min="10" max="30">
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px;">
                    <button onclick="salvarNovaEscola()" class="btn btn-success">Salvar Escola</button>
                    <button onclick="fecharModal()" class="btn btn-secondary">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    atualizarHorarioPorTurno();
}

function atualizarHorarioPorTurno() {
    const turno = document.getElementById('novaEscolaTurno').value;
    document.getElementById('turnoSelecionado').textContent = turno;
    
    const padrao = getHorarioPadraoPorTurno(turno);
    
    // Atualizar campos
    document.getElementById('novaEscolaAulas').value = padrao.aulasPorPeriodo;
    document.getElementById('novaEscolaDuracaoAula').value = padrao.duracaoAula;
    document.getElementById('novaEscolaInicio').value = padrao.inicioAulas;
    
    // Atualizar config temporária
    novaEscolaConfig = { ...padrao, turno: turno };
    
    // Calcular horário de término
    const horarioFinal = calcularHorarioFinal(padrao);
    document.getElementById('horarioPadrao').textContent = 
        `${padrao.inicioAulas} - ${horarioFinal} (${padrao.aulasPorPeriodo} aulas de ${padrao.duracaoAula}min)`;
}

function atualizarConfigNovaEscola(campo, valor) {
    novaEscolaConfig[campo] = valor;
}

function salvarNovaEscola() {
    const nome = document.getElementById('novaEscolaNome').value.trim();
    const endereco = document.getElementById('novaEscolaEndereco').value.trim();
    const cidade = document.getElementById('novaEscolaCidade').value.trim();
    const telefone = document.getElementById('novaEscolaTelefone').value.trim();
    const email = document.getElementById('novaEscolaEmail').value.trim();
    const turno = document.getElementById('novaEscolaTurno').value;
    const logo = document.getElementById('novaEscolaLogo').value.trim();
    
    if (!nome) {
        alert('Digite o nome da escola');
        return;
    }
    
    // Criar nova escola
    const novaEscola = {
        id: 'escola_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        nome: nome,
        endereco: endereco,
        cidade: cidade,
        telefone: telefone,
        email: email,
        turno: turno,
        logo: logo,
        dataCadastro: new Date().toISOString()
    };
    
    // Adicionar à lista
    escolas.push(novaEscola);
    localStorage.setItem('escolas_' + usuarioLogado.usuario, JSON.stringify(escolas));
    
    // Salvar configurações específicas desta escola
    const configHorarioCompleta = {
        aulasPorPeriodo: parseInt(document.getElementById('novaEscolaAulas').value) || novaEscolaConfig.aulasPorPeriodo,
        duracaoAula: parseInt(document.getElementById('novaEscolaDuracaoAula').value) || novaEscolaConfig.duracaoAula,
        inicioAulas: document.getElementById('novaEscolaInicio').value || novaEscolaConfig.inicioAulas,
        intervalo: document.getElementById('novaEscolaRecreio').value || "10:00",
        duracaoIntervalo: parseInt(document.getElementById('novaEscolaDuracaoRecreio').value) || 20
    };
    
    // Salvar dados iniciais da escola
    localStorage.setItem(`configEscola_${usuarioLogado.usuario}_${novaEscola.id}`, JSON.stringify({
        nome: nome,
        endereco: endereco,
        cidade: cidade,
        telefone: telefone,
        email: email,
        turno: turno,
        logo: logo
    }));
    
    localStorage.setItem(`configHorario_${usuarioLogado.usuario}_${novaEscola.id}`, JSON.stringify(configHorarioCompleta));
    
    // Inicializar arrays vazios para esta escola
    localStorage.setItem(`disciplinas_${usuarioLogado.usuario}_${novaEscola.id}`, JSON.stringify([]));
    localStorage.setItem(`turmas_${usuarioLogado.usuario}_${novaEscola.id}`, JSON.stringify([]));
    localStorage.setItem(`horarioProfessor_${usuarioLogado.usuario}_${novaEscola.id}`, JSON.stringify({}));
    localStorage.setItem(`planejamentos_${usuarioLogado.usuario}_${novaEscola.id}`, JSON.stringify({}));
    localStorage.setItem(`semanas_${usuarioLogado.usuario}_${novaEscola.id}`, JSON.stringify([]));
    
    // Selecionar a nova escola automaticamente
    escolaAtual = novaEscola;
    carregarDadosEscola(novaEscola.id);
    
    alert('Escola cadastrada com sucesso!\n\nConfigure agora as disciplinas e turmas específicas desta escola.');
    
    fecharModal();
    atualizarBannerEscola();
    atualizarNomeEscolaHeader();
    
    // Abrir configuração de horário para preencher disciplinas
    setTimeout(() => {
        abrirConfiguracaoHorario();
    }, 500);
}

function removerEscola(event, escolaId) {
    event.stopPropagation();
    
    if (escolas.length <= 1) {
        alert('Você deve ter pelo menos uma escola cadastrada');
        return;
    }
    
    if (confirm(`Tem certeza que deseja remover esta escola?\n\nTodos os dados associados a esta escola serão permanentemente excluídos:\n- Configurações de horário\n- Disciplinas e turmas\n- Planejamentos de aulas\n- Semanas geradas\n\nEsta ação não pode ser desfeita.`)) {
        // Remover escola da lista
        escolas = escolas.filter(e => e.id !== escolaId);
        localStorage.setItem('escolas_' + usuarioLogado.usuario, JSON.stringify(escolas));
        
        // Remover TODOS os dados associados a esta escola
        const prefixos = [
            'configEscola_',
            'configHorario_',
            'disciplinas_',
            'turmas_',
            'horarioProfessor_',
            'planejamentos_',
            'semanas_',
            'dataInicioLetivo_'
        ];
        
        prefixos.forEach(prefixo => {
            localStorage.removeItem(`${prefixo}${usuarioLogado.usuario}_${escolaId}`);
        });
        
        // Selecionar primeira escola
        if (escolas.length > 0) {
            escolaAtual = escolas[0];
            carregarDadosEscola(escolaAtual.id);
        } else {
            escolaAtual = null;
            configEscolaAtual = {
                nome: "",
                endereco: "",
                cidade: "",
                telefone: "",
                email: "",
                turno: "Matutino",
                logo: ""
            };
            configHorarioAtual = getHorarioPadraoPorTurno("Matutino");
            disciplinasProfessor = [];
            turmasProfessor = [];
            horarioProfessor = {};
            planejamentos = {};
            semanas = [];
        }
        
        atualizarSeletorEscolas();
        atualizarBannerEscola();
        atualizarNomeEscolaHeader();
        renderSemanas();
        alert('Escola removida com sucesso!\n\nTodos os dados específicos desta escola foram excluídos.');
    }
}

function abrirConfiguracaoEscolaDetalhes() {
    if (!escolaAtual) {
        alert('Selecione uma escola primeiro');
        return;
    }
    
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: #0047B6; margin: 0;">⚙️ Configuração da Escola: ${escolaAtual.nome}</h3>
                    <button onclick="fecharModal()" class="btn btn-secondary">Fechar</button>
                </div>
                
                <div class="config-section">
                    <h4 style="color: #2A6ED4; margin-bottom: 15px;">📋 Dados da Escola</h4>
                    
                    <div class="input-group">
                        <label>Nome da Escola:</label>
                        <input type="text" id="modalNomeEscola" value="${configEscolaAtual.nome || escolaAtual.nome}" placeholder="Nome da instituição">
                    </div>
                    
                    <div class="input-group">
                        <label>Endereço:</label>
                        <input type="text" id="modalEnderecoEscola" value="${configEscolaAtual.endereco || escolaAtual.endereco}" placeholder="Rua, número, bairro">
                    </div>
                    
                    <div class="grid-2">
                        <div class="input-group">
                            <label>Cidade:</label>
                            <input type="text" id="modalCidadeEscola" value="${configEscolaAtual.cidade || escolaAtual.cidade}" placeholder="Cidade">
                        </div>
                        <div class="input-group">
                            <label>Telefone:</label>
                            <input type="text" id="modalTelefoneEscola" value="${configEscolaAtual.telefone || escolaAtual.telefone}" placeholder="(11) 99999-9999">
                        </div>
                    </div>
                    
                    <div class="grid-2">
                        <div class="input-group">
                            <label>Email:</label>
                            <input type="email" id="modalEmailEscola" value="${configEscolaAtual.email || escolaAtual.email}" placeholder="escola@email.com">
                        </div>
                        <div class="input-group">
                            <label>Turno:</label>
                            <select id="modalTurnoEscola">
                                <option value="Matutino" ${(configEscolaAtual.turno || escolaAtual.turno) === 'Matutino' ? 'selected' : ''}>Matutino</option>
                                <option value="Vespertino" ${(configEscolaAtual.turno || escolaAtual.turno) === 'Vespertino' ? 'selected' : ''}>Vespertino</option>
                                <option value="Noturno" ${(configEscolaAtual.turno || escolaAtual.turno) === 'Noturno' ? 'selected' : ''}>Noturno</option>
                                <option value="Integral" ${(configEscolaAtual.turno || escolaAtual.turno) === 'Integral' ? 'selected' : ''}>Integral</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="input-group">
                        <label>Logo da Escola (URL):</label>
                        <input type="text" id="modalLogoEscola" value="${configEscolaAtual.logo || escolaAtual.logo || ''}" placeholder="https://exemplo.com/logo.png">
                        <small style="color: #666;">Cole a URL de uma imagem</small>
                        ${configEscolaAtual.logo || escolaAtual.logo ? `
                        <div style="margin-top: 10px;">
                            <p>Logo atual:</p>
                            <img src="${configEscolaAtual.logo || escolaAtual.logo}" style="max-width: 100px; max-height: 60px; border: 1px solid #ddd; padding: 5px;">
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="config-section">
                    <h4 style="color: #2A6ED4; margin-bottom: 15px;">🕐 Configuração de Horário</h4>
                    
                    <div class="grid-2">
                        <div class="input-group">
                            <label>Aulas por período:</label>
                            <input type="number" id="modalAulasPeriodo" value="${configHorarioAtual.aulasPorPeriodo}" min="4" max="10">
                        </div>
                        <div class="input-group">
                            <label>Duração da aula (min):</label>
                            <input type="number" id="modalDuracaoAula" value="${configHorarioAtual.duracaoAula}" min="40" max="60">
                        </div>
                    </div>
                    
                    <div class="grid-2">
                        <div class="input-group">
                            <label>Início das aulas:</label>
                            <input type="time" id="modalInicioAulas" value="${configHorarioAtual.inicioAulas}">
                        </div>
                        <div class="input-group">
                            <label>Horário do recreio:</label>
                            <input type="time" id="modalHorarioRecreio" value="${configHorarioAtual.intervalo}">
                        </div>
                    </div>
                    
                    <div class="input-group">
                        <label>Duração do recreio (min):</label>
                        <input type="number" id="modalDuracaoRecreio" value="${configHorarioAtual.duracaoIntervalo}" min="10" max="30">
                    </div>
                    
                    <div style="margin-top: 15px; padding: 10px; background: #f0f8ff; border-radius: 6px;">
                        <p><strong>Horários gerados para esta escola:</strong></p>
                        <div id="previewHorarios" style="font-size: 12px; max-height: 100px; overflow-y: auto;">
                            ${gerarPreviewHorarios().map(h => `<div>${h}</div>`).join('')}
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px;">
                    <button onclick="salvarConfiguracaoEscolaAtual()" class="btn btn-success">Salvar Configurações</button>
                    <button onclick="fecharModal()" class="btn btn-secondary">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Adicionar listeners para preview
    document.getElementById('modalAulasPeriodo').addEventListener('input', atualizarPreview);
    document.getElementById('modalDuracaoAula').addEventListener('input', atualizarPreview);
    document.getElementById('modalInicioAulas').addEventListener('input', atualizarPreview);
    document.getElementById('modalHorarioRecreio').addEventListener('input', atualizarPreview);
    document.getElementById('modalDuracaoRecreio').addEventListener('input', atualizarPreview);
}

function atualizarPreview() {
    const tempConfig = {
        aulasPorPeriodo: parseInt(document.getElementById('modalAulasPeriodo').value) || 7,
        duracaoAula: parseInt(document.getElementById('modalDuracaoAula').value) || 45,
        inicioAulas: document.getElementById('modalInicioAulas').value || "07:00",
        intervalo: document.getElementById('modalHorarioRecreio').value || "10:00",
        duracaoIntervalo: parseInt(document.getElementById('modalDuracaoRecreio').value) || 20
    };
    
    const horarios = gerarHorariosConfig(tempConfig);
    document.getElementById('previewHorarios').innerHTML = horarios.map(h => `<div>${h}</div>`).join('');
}

function gerarPreviewHorarios() {
    return gerarHorariosConfig(configHorarioAtual);
}

function gerarHorariosConfig(config) {
    const horarios = [];
    const [horaInicio, minutoInicio] = config.inicioAulas.split(':').map(Number);
    const [horaIntervalo, minutoIntervalo] = config.intervalo.split(':').map(Number);
    
    for (let i = 0; i < config.aulasPorPeriodo; i++) {
        let horaAula = horaInicio + Math.floor((i * config.duracaoAula) / 60);
        let minutoAula = minutoInicio + ((i * config.duracaoAula) % 60);
        
        let horaFim = horaInicio + Math.floor(((i + 1) * config.duracaoAula) / 60);
        let minutoFim = minutoInicio + (((i + 1) * config.duracaoAula) % 60);
        
        // Ajustar para intervalo
        const totalMinutosAula = horaAula * 60 + minutoAula;
        const totalMinutosIntervalo = horaIntervalo * 60 + minutoIntervalo;
        
        if (totalMinutosAula >= totalMinutosIntervalo) {
            horaAula += Math.floor(config.duracaoIntervalo / 60);
            minutoAula += config.duracaoIntervalo % 60;
            horaFim += Math.floor(config.duracaoIntervalo / 60);
            minutoFim += config.duracaoIntervalo % 60;
        }
        
        // Ajustar minutos
        if (minutoAula >= 60) { horaAula += 1; minutoAula -= 60; }
        if (minutoFim >= 60) { horaFim += 1; minutoFim -= 60; }
        
        horarios.push(
            `${String(horaAula).padStart(2, '0')}:${String(minutoAula).padStart(2, '0')} - ` +
            `${String(horaFim).padStart(2, '0')}:${String(minutoFim).padStart(2, '0')}`
        );
    }
    
    return horarios;
}

function salvarConfiguracaoEscolaAtual() {
    if (!escolaAtual) return;
    
    // Salvar dados da escola
    configEscolaAtual.nome = document.getElementById('modalNomeEscola').value.trim();
    configEscolaAtual.endereco = document.getElementById('modalEnderecoEscola').value.trim();
    configEscolaAtual.cidade = document.getElementById('modalCidadeEscola').value.trim();
    configEscolaAtual.telefone = document.getElementById('modalTelefoneEscola').value.trim();
    configEscolaAtual.email = document.getElementById('modalEmailEscola').value.trim();
    configEscolaAtual.turno = document.getElementById('modalTurnoEscola').value;
    configEscolaAtual.logo = document.getElementById('modalLogoEscola').value.trim();
    
    // Salvar configurações de horário
    configHorarioAtual.aulasPorPeriodo = parseInt(document.getElementById('modalAulasPeriodo').value) || 7;
    configHorarioAtual.duracaoAula = parseInt(document.getElementById('modalDuracaoAula').value) || 45;
    configHorarioAtual.inicioAulas = document.getElementById('modalInicioAulas').value || "07:00";
    configHorarioAtual.intervalo = document.getElementById('modalHorarioRecreio').value || "10:00";
    configHorarioAtual.duracaoIntervalo = parseInt(document.getElementById('modalDuracaoRecreio').value) || 20;
    
    // Atualizar escola na lista com os novos dados
    const escolaIndex = escolas.findIndex(e => e.id === escolaAtual.id);
    if (escolaIndex !== -1) {
        escolas[escolaIndex].nome = configEscolaAtual.nome;
        escolas[escolaIndex].turno = configEscolaAtual.turno;
        localStorage.setItem('escolas_' + usuarioLogado.usuario, JSON.stringify(escolas));
    }
    
    // Salvar no localStorage com chave específica da escola
    localStorage.setItem(`configEscola_${usuarioLogado.usuario}_${escolaAtual.id}`, JSON.stringify(configEscolaAtual));
    localStorage.setItem(`configHorario_${usuarioLogado.usuario}_${escolaAtual.id}`, JSON.stringify(configHorarioAtual));
    
    // Atualizar horários
    gerarHorarios();
    
    alert('Configurações salvas com sucesso!\n\nEsta escola agora tem configuração independente.');
    fecharModal();
    atualizarBannerEscola();
    atualizarNomeEscolaHeader();
}

// ========== CONFIGURAÇÃO DE HORÁRIO ==========
function abrirConfiguracaoHorario() {
    // Verificar se escola foi selecionada
    if (!escolaAtual) {
        alert('Selecione uma escola primeiro!');
        alternarSeletorEscola();
        return;
    }
    
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 1000px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: #0047B6; margin: 0;">🕐 Configurar Horário - ${escolaAtual.nome}</h3>
                    <button onclick="fecharModal()" class="btn btn-secondary">Fechar</button>
                </div>
                
                <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <p><strong>Escola:</strong> ${escolaAtual.nome}</p>
                            <p><strong>Turno:</strong> ${configEscolaAtual.turno || escolaAtual.turno}</p>
                            <p><strong>Horário base:</strong> ${configHorarioAtual.inicioAulas} (${configHorarioAtual.aulasPorPeriodo} aulas)</p>
                        </div>
                        <div style="color: #2E7D32; font-weight: bold;">
                            <p>⚠️ Disciplinas e turmas são ESPECÍFICAS desta escola</p>
                        </div>
                    </div>
                </div>
                
                <div class="config-section">
                    <h4 style="color: #2A6ED4; margin-bottom: 15px;">📚 Disciplinas desta Escola</h4>
                    <p style="color: #666; font-size: 13px; margin-bottom: 15px;">
                        As disciplinas cadastradas aqui são usadas APENAS em ${escolaAtual.nome}.
                        Cada escola tem sua própria lista de disciplinas.
                    </p>
                    
                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <input type="text" id="novaDisciplinaNome" placeholder="Nome da disciplina" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        <select id="novaDisciplinaIcone" style="padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="📚">📚 Geral</option>
                            <option value="🧬">🧬 Biologia</option>
                            <option value="🔬">🔬 Ciências</option>
                            <option value="🧪">🧪 Química</option>
                            <option value="🧮">🧮 Matemática</option>
                            <option value="📖">📖 Português</option>
                            <option value="🌍">🌍 Geografia</option>
                            <option value="📜">📜 História</option>
                            <option value="💻">💻 Informática</option>
                            <option value="🎨">🎨 Arte</option>
                            <option value="🎵">🎵 Música</option>
                            <option value="⚽">⚽ Educação Física</option>
                            <option value="🤖">🤖 Robótica</option>
                            <option value="🔧">🔧 Técnico</option>
                            <option value="📝">📝 Outra</option>
                        </select>
                        <button onclick="adicionarDisciplina()" class="btn btn-primary">➕ Adicionar</button>
                    </div>
                    
                    <div id="listaDisciplinas" class="lista-itens">
                        ${renderDisciplinas()}
                    </div>
                    
                    ${disciplinasProfessor.length === 0 ? `
                    <div style="background: #fff8e1; padding: 15px; border-radius: 6px; margin-top: 15px;">
                        <p><strong>💡 Importante:</strong> Você precisa cadastrar pelo menos uma disciplina para ${escolaAtual.nome}.</p>
                        <p>Estas disciplinas não aparecerão em outras escolas.</p>
                    </div>
                    ` : ''}
                </div>
                
                <div class="config-section">
                    <h4 style="color: #2A6ED4; margin-bottom: 15px;">🏫 Turmas desta Escola</h4>
                    <p style="color: #666; font-size: 13px; margin-bottom: 15px;">
                        As turmas cadastradas aqui são usadas APENAS em ${escolaAtual.nome}.
                    </p>
                    
                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <input type="text" id="novaTurmaNome" placeholder="Ex: 1A, 2B, 3C, 9ºANO" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        <button onclick="adicionarTurma()" class="btn btn-primary">➕ Adicionar</button>
                    </div>
                    
                    <div id="listaTurmas" class="lista-itens">
                        ${renderTurmas()}
                    </div>
                </div>
                
                <div class="config-section">
                    <h4 style="color: #2A6ED4; margin-bottom: 15px;">📅 Grade Horária - ${escolaAtual.nome}</h4>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <p><strong>Configuração atual:</strong></p>
                                <p>Aulas: ${configHorarioAtual.aulasPorPeriodo} por dia</p>
                                <p>Duração: ${configHorarioAtual.duracaoAula} minutos</p>
                                <p>Início: ${configHorarioAtual.inicioAulas}</p>
                            </div>
                            <div>
                                <p><strong>Status:</strong></p>
                                <p>Disciplinas: ${disciplinasProfessor.length}</p>
                                <p>Turmas: ${turmasProfessor.length}</p>
                                <p>Aulas configuradas: ${contarAulasConfiguradas()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div id="gradeConfigHorario" class="grade-container">
                        ${renderGradeConfigHorario()}
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px;">
                    <button onclick="salvarConfiguracaoHorario()" class="btn btn-success">Salvar Horário</button>
                    <button onclick="fecharModal()" class="btn btn-secondary">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function renderDisciplinas() {
    if (disciplinasProfessor.length === 0) {
        return '<p style="color: #666; font-style: italic; text-align: center;">Nenhuma disciplina cadastrada para esta escola</p>';
    }
    
    let html = '';
    disciplinasProfessor.forEach((disciplina, index) => {
        html += `
            <div class="item-card">
                <div>
                    <strong>${disciplina.icone} ${disciplina.nome}</strong>
                    <div style="font-size: 10px; color: #666;">ID: ${disciplina.id.substring(0, 8)}...</div>
                </div>
                <button onclick="removerDisciplina(${index})" class="btn-remover">Remover</button>
            </div>
        `;
    });
    return html;
}

function renderTurmas() {
    if (turmasProfessor.length === 0) {
        return '<p style="color: #666; font-style: italic; text-align: center;">Nenhuma turma cadastrada para esta escola</p>';
    }
    
    let html = '';
    turmasProfessor.forEach((turma, index) => {
        html += `
            <div class="item-card">
                <div>
                    <strong>🏫 Turma ${turma}</strong>
                </div>
                <button onclick="removerTurma(${index})" class="btn-remover">Remover</button>
            </div>
        `;
    });
    return html;
}

function contarAulasConfiguradas() {
    let total = 0;
    Object.values(horarioProfessor).forEach(dia => {
        if (dia && Array.isArray(dia)) {
            dia.forEach(aula => {
                if (aula && aula.disciplina && aula.turma) total++;
            });
        }
    });
    return total;
}

function renderGradeConfigHorario() {
    let html = '<div class="grade-horario">';
    
    // Cabeçalho
    html += '<div class="grade-header">Horário</div>';
    DIAS_SEMANA.forEach(dia => {
        html += `<div class="grade-header">${dia}</div>`;
    });
    
    // Linhas das aulas
    for (let i = 0; i < configHorarioAtual.aulasPorPeriodo; i++) {
        html += `<div class="grade-header">${horariosGerados[i] || ''}</div>`;
        
        for (let j = 0; j < 5; j++) {
            const dia = DIAS_SEMANA[j];
            const aulaData = horarioProfessor[dia] && horarioProfessor[dia][i] ? horarioProfessor[dia][i] : { disciplina: '', turma: '' };
            
            const temAula = aulaData.disciplina && aulaData.turma;
            
            html += `
                <div class="${temAula ? 'grade-cell grade-cell-com-aula' : 'grade-cell grade-cell-sem-aula'}" style="${temAula ? 'min-height: 100px;' : 'min-height: 40px;'}">
            `;
            
            if (temAula) {
                const disciplina = disciplinasProfessor.find(d => d.id === aulaData.disciplina);
                html += `
                    <div style="margin-bottom: 5px;">
                        <strong style="font-size: 12px; color: #0047B6;">
                            ${disciplina ? disciplina.icone + ' ' + disciplina.nome : ''}
                        </strong>
                    </div>
                    <div style="font-size: 11px; color: #2E7D32;">
                        🏫 Turma ${aulaData.turma}
                    </div>
                `;
            }
            
            html += `
                    <select onchange="atualizarDisciplinaHorario('${dia}', ${i}, this.value)" 
                            style="width: 100%; margin-top: ${temAula ? '8px' : '5px'}; padding: 5px; border: 1px solid ${temAula ? '#2E7D32' : '#ddd'}; border-radius: 4px; font-size: 11px; ${temAula ? 'background: #f0f8f0;' : ''}">
                        <option value="">-- Sem aula --</option>
                        ${disciplinasProfessor.map(d => 
                            `<option value="${d.id}" ${aulaData.disciplina === d.id ? 'selected' : ''}>
                                ${d.icone} ${d.nome}
                            </option>`
                        ).join('')}
                    </select>
                    
                    ${aulaData.disciplina ? `
                        <select onchange="atualizarTurmaHorario('${dia}', ${i}, this.value)"
                                style="width: 100%; margin-top: 5px; padding: 5px; border: 1px solid #2E7D32; border-radius: 4px; font-size: 11px; background: #f0f8f0;">
                            <option value="">Selecione turma</option>
                            ${turmasProfessor.map(t => 
                                `<option value="${t}" ${aulaData.turma === t ? 'selected' : ''}>
                                    Turma ${t}
                                </option>`
                            ).join('')}
                        </select>
                    ` : ''}
                </div>
            `;
        }
    }
    
    html += '</div>';
    return html;
}

function adicionarDisciplina() {
    if (!escolaAtual) {
        alert('Selecione uma escola primeiro!');
        return;
    }
    
    const nome = document.getElementById('novaDisciplinaNome').value.trim();
    const icone = document.getElementById('novaDisciplinaIcone').value;
    
    if (!nome) {
        alert('Digite o nome da disciplina');
        return;
    }
    
    // Verificar se já existe (apenas nesta escola)
    const existe = disciplinasProfessor.some(d => d.nome.toLowerCase() === nome.toLowerCase());
    if (existe) {
        alert('Esta disciplina já existe nesta escola');
        return;
    }
    
    // Adicionar
    const novaDisciplina = {
        id: nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now(),
        nome: nome,
        icone: icone,
        escolaId: escolaAtual.id
    };
    
    disciplinasProfessor.push(novaDisciplina);
    localStorage.setItem(`disciplinas_${usuarioLogado.usuario}_${escolaAtual.id}`, JSON.stringify(disciplinasProfessor));
    
    // Atualizar interface
    document.getElementById('listaDisciplinas').innerHTML = renderDisciplinas();
    document.getElementById('novaDisciplinaNome').value = '';
    
    // Atualizar grade se existir
    const gradeDiv = document.getElementById('gradeConfigHorario');
    if (gradeDiv) {
        gradeDiv.innerHTML = renderGradeConfigHorario();
    }
    
    atualizarListaDisciplinas();
}

function removerDisciplina(index) {
    if (!escolaAtual) return;
    
    if (confirm('Tem certeza que deseja remover esta disciplina?')) {
        disciplinasProfessor.splice(index, 1);
        localStorage.setItem(`disciplinas_${usuarioLogado.usuario}_${escolaAtual.id}`, JSON.stringify(disciplinasProfessor));
        
        document.getElementById('listaDisciplinas').innerHTML = renderDisciplinas();
        
        const gradeDiv = document.getElementById('gradeConfigHorario');
        if (gradeDiv) {
            gradeDiv.innerHTML = renderGradeConfigHorario();
        }
        
        atualizarListaDisciplinas();
    }
}

function adicionarTurma() {
    if (!escolaAtual) {
        alert('Selecione uma escola primeiro!');
        return;
    }
    
    const nome = document.getElementById('novaTurmaNome').value.trim().toUpperCase();
    
    if (!nome) {
        alert('Digite o código da turma');
        return;
    }
    
    // Verificar se já existe (apenas nesta escola)
    if (turmasProfessor.includes(nome)) {
        alert('Esta turma já existe nesta escola');
        return;
    }
    
    // Adicionar
    turmasProfessor.push(nome);
    turmasProfessor.sort();
    localStorage.setItem(`turmas_${usuarioLogado.usuario}_${escolaAtual.id}`, JSON.stringify(turmasProfessor));
    
    // Atualizar interface
    document.getElementById('listaTurmas').innerHTML = renderTurmas();
    document.getElementById('novaTurmaNome').value = '';
    
    // Atualizar grade se existir
    const gradeDiv = document.getElementById('gradeConfigHorario');
    if (gradeDiv) {
        gradeDiv.innerHTML = renderGradeConfigHorario();
    }
}

function removerTurma(index) {
    if (!escolaAtual) return;
    
    if (confirm('Tem certeza que deseja remover esta turma?')) {
        turmasProfessor.splice(index, 1);
        localStorage.setItem(`turmas_${usuarioLogado.usuario}_${escolaAtual.id}`, JSON.stringify(turmasProfessor));
        
        document.getElementById('listaTurmas').innerHTML = renderTurmas();
        
        const gradeDiv = document.getElementById('gradeConfigHorario');
        if (gradeDiv) {
            gradeDiv.innerHTML = renderGradeConfigHorario();
        }
    }
}

function atualizarDisciplinaHorario(dia, aulaIndex, disciplinaId) {
    if (!horarioProfessor[dia]) horarioProfessor[dia] = [];
    if (!horarioProfessor[dia][aulaIndex]) horarioProfessor[dia][aulaIndex] = {};
    
    horarioProfessor[dia][aulaIndex].disciplina = disciplinaId;
    horarioProfessor[dia][aulaIndex].turma = '';
}

function atualizarTurmaHorario(dia, aulaIndex, turma) {
    if (!horarioProfessor[dia]) horarioProfessor[dia] = [];
    if (!horarioProfessor[dia][aulaIndex]) horarioProfessor[dia][aulaIndex] = {};
    
    horarioProfessor[dia][aulaIndex].turma = turma;
}

function salvarConfiguracaoHorario() {
    if (!escolaAtual) {
        alert('Selecione uma escola primeiro!');
        return;
    }
    
    if (disciplinasProfessor.length === 0) {
        alert('Cadastre pelo menos uma disciplina para esta escola!');
        return;
    }
    
    if (turmasProfessor.length === 0) {
        alert('Cadastre pelo menos uma turma para esta escola!');
        return;
    }
    
    localStorage.setItem(`horarioProfessor_${usuarioLogado.usuario}_${escolaAtual.id}`, JSON.stringify(horarioProfessor));
    
    alert(`Horário salvo com sucesso para ${escolaAtual.nome}!\n\nEsta configuração é específica desta escola.`);
    atualizarStatusHorario();
    fecharModal();
}

// ========== GERAÇÃO DE HORÁRIOS ==========
function gerarHorarios() {
    horariosGerados = gerarHorariosConfig(configHorarioAtual);
}

function gerarSemanas() {
    if (!escolaAtual) {
        alert('Selecione uma escola primeiro!');
        alternarSeletorEscola();
        return;
    }
    
    const dataInicio = document.getElementById('inicioLetivo').value;
    
    if (!dataInicio) {
        alert('Selecione a data de início do ano letivo');
        return;
    }
    
    // Verificar se horário foi configurado para ESTA escola
    let aulasConfiguradas = contarAulasConfiguradas();
    
    if (aulasConfiguradas === 0) {
        alert(`Configure seu horário primeiro para ${escolaAtual.nome}!`);
        abrirConfiguracaoHorario();
        return;
    }
    
    // Salvar data de início ESPECÍFICA desta escola
    localStorage.setItem(`dataInicioLetivo_${usuarioLogado.usuario}_${escolaAtual.id}`, dataInicio);
    
    // Gerar semanas ESPECÍFICAS desta escola
    semanas = [];
    let data = new Date(dataInicio);
    
    // Ajustar para segunda-feira
    const diaSemana = data.getDay();
    if (diaSemana !== 1) {
        const ajuste = diaSemana === 0 ? 1 : 1 - diaSemana;
        data.setDate(data.getDate() + ajuste);
    }
    
    // Gerar 43 semanas (ano letivo)
    for (let i = 0; i < 43; i++) {
        const inicio = new Date(data);
        const fim = new Date(data);
        fim.setDate(fim.getDate() + 4);
        
        semanas.push({
            id: i + 1,
            inicio: inicio,
            fim: fim,
            escolaId: escolaAtual.id
        });
        
        data.setDate(data.getDate() + 7);
    }
    
    // Salvar semanas ESPECÍFICAS desta escola
    localStorage.setItem(`semanas_${usuarioLogado.usuario}_${escolaAtual.id}`, JSON.stringify(semanas));
    
    // Inicializar planejamentos ESPECÍFICOS desta escola
    inicializarPlanejamentos();
    
    // Renderizar semanas
    renderSemanas();
    
    alert(`${semanas.length} semanas geradas com sucesso para ${escolaAtual.nome}!\n\nAs semanas são específicas desta escola.`);
}

function inicializarPlanejamentos() {
    semanas.forEach((semana, index) => {
        const chave = `semana_${index}`;
        if (!planejamentos[chave]) {
            planejamentos[chave] = {
                aulas: criarGradeVazia(),
                anotacoes: ''
            };
        }
    });
    
    localStorage.setItem(`planejamentos_${usuarioLogado.usuario}_${escolaAtual.id}`, JSON.stringify(planejamentos));
}

function criarGradeVazia() {
    const grade = [];
    for (let dia = 0; dia < 5; dia++) {
        grade[dia] = [];
        for (let aula = 0; aula < configHorarioAtual.aulasPorPeriodo; aula++) {
            const aulaData = horarioProfessor[DIAS_SEMANA[dia]] && horarioProfessor[DIAS_SEMANA[dia]][aula];
            grade[dia][aula] = {
                disciplina: aulaData ? aulaData.disciplina : null,
                turma: aulaData ? aulaData.turma : null,
                conteudo: ''
            };
        }
    }
    return grade;
}

// ========== RENDERIZAÇÃO DE SEMANAS ==========
function renderSemanas() {
    const container = document.getElementById('listaSemanas');
    if (!container) return;
    
    if (!escolaAtual) {
        mostrarAvisoSemEscola();
        return;
    }
    
    if (semanas.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <div style="font-size: 48px; color: #ccc; margin-bottom: 20px;">📅</div>
                <h3 style="color: #666; margin-bottom: 10px;">Nenhuma semana gerada para ${escolaAtual.nome}</h3>
                <p style="color: #999; margin-bottom: 20px;">Configure a data de início do ano letivo e clique em "Gerar Semanas"</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="gerarSemanas()" class="btn btn-primary">
                        📅 Gerar Semanas
                    </button>
                    <button onclick="abrirConfiguracaoHorario()" class="btn btn-secondary">
                        🕐 Configurar Horário
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    semanas.forEach((semana, index) => {
        const status = getStatusSemana(index);
        const aulasTotal = contarAulasNaSemana(index);
        const aulasPreenchidas = contarAulasComConteudo(index);
        
        const card = document.createElement('div');
        card.className = 'semana-card';
        card.onclick = () => abrirSemana(index);
        
        card.innerHTML = `
            <h4>Semana ${semana.id}</h4>
            <p>${formatarData(semana.inicio)} a ${formatarData(semana.fim)}</p>
            <small>${aulasPreenchidas}/${aulasTotal} aulas</small>
            <div class="badge-status ${getBadgeClass(status)}">${status}</div>
        `;
        
        container.appendChild(card);
    });
    
    document.getElementById('contadorSemanas').textContent = `${semanas.length} semanas geradas para ${escolaAtual.nome}`;
}

function getStatusSemana(index) {
    const total = contarAulasNaSemana(index);
    const preenchidas = contarAulasComConteudo(index);
    
    if (preenchidas === 0) return 'Vazia';
    if (preenchidas === total) return 'Completa';
    return 'Parcial';
}

function getBadgeClass(status) {
    switch(status) {
        case 'Vazia': return 'badge-vazia';
        case 'Parcial': return 'badge-parcial';
        case 'Completa': return 'badge-completa';
        default: return '';
    }
}

function contarAulasNaSemana(index) {
    const chave = `semana_${index}`;
    if (!planejamentos[chave]) return 0;
    
    let total = 0;
    const aulas = planejamentos[chave].aulas;
    
    for (let dia = 0; dia < 5; dia++) {
        for (let aula = 0; aula < configHorarioAtual.aulasPorPeriodo; aula++) {
            if (aulas[dia][aula].disciplina) {
                total++;
            }
        }
    }
    
    return total;
}

function contarAulasComConteudo(index) {
    const chave = `semana_${index}`;
    if (!planejamentos[chave]) return 0;
    
    let total = 0;
    const aulas = planejamentos[chave].aulas;
    
    for (let dia = 0; dia < 5; dia++) {
        for (let aula = 0; aula < configHorarioAtual.aulasPorPeriodo; aula++) {
            if (aulas[dia][aula].conteudo && aulas[dia][aula].conteudo.trim() !== '') {
                total++;
            }
        }
    }
    
    return total;
}

// ========== FUNÇÕES DE FILTRO ==========
function filtrarSemanas(tipo) {
    const botoes = document.querySelectorAll('.periodo-btn');
    botoes.forEach(btn => btn.classList.remove('active'));
    
    // Encontrar e ativar o botão clicado
    botoes.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tipo.toLowerCase())) {
            btn.classList.add('active');
        }
    });
    
    if (tipo === 'todas') {
        renderSemanas();
    } else {
        renderSemanasFiltradas(tipo);
    }
}

function filtrarSemanasPorBusca() {
    const termo = document.getElementById('filtroSemana').value.toLowerCase();
    renderSemanasFiltradas('busca', termo);
}

function renderSemanasFiltradas(tipo, termo = '') {
    const container = document.getElementById('listaSemanas');
    if (!container) return;
    
    if (!escolaAtual) {
        mostrarAvisoSemEscola();
        return;
    }
    
    container.innerHTML = '';
    
    const semanasFiltradas = semanas.filter((semana, index) => {
        if (tipo === 'vazias') {
            return getStatusSemana(index) === 'Vazia';
        } else if (tipo === 'parciais') {
            return getStatusSemana(index) === 'Parcial';
        } else if (tipo === 'completas') {
            return getStatusSemana(index) === 'Completa';
        } else if (tipo === 'busca') {
            return `semana ${semana.id}`.includes(termo) || 
                   formatarData(semana.inicio).includes(termo) ||
                   formatarData(semana.fim).includes(termo);
        }
        return true;
    });
    
    if (semanasFiltradas.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <div style="font-size: 48px; color: #ccc; margin-bottom: 20px;">🔍</div>
                <h3 style="color: #666; margin-bottom: 10px;">Nenhuma semana encontrada</h3>
                <p style="color: #999;">Tente outro filtro ou busque por um termo diferente</p>
            </div>
        `;
        return;
    }
    
    semanasFiltradas.forEach((semana, posicao) => {
        const index = semanas.indexOf(semana);
        const status = getStatusSemana(index);
        const aulasTotal = contarAulasNaSemana(index);
        const aulasPreenchidas = contarAulasComConteudo(index);
        
        const card = document.createElement('div');
        card.className = 'semana-card';
        card.onclick = () => abrirSemana(index);
        
        card.innerHTML = `
            <h4>Semana ${semana.id}</h4>
            <p>${formatarData(semana.inicio)} a ${formatarData(semana.fim)}</p>
            <small>${aulasPreenchidas}/${aulasTotal} aulas</small>
            <div class="badge-status ${getBadgeClass(status)}">${status}</div>
        `;
        
        container.appendChild(card);
    });
}

// ========== PÁGINA DE AULAS ==========
function abrirSemana(index) {
    semanaAtual = index;
    const semana = semanas[index];
    
    // Alternar páginas
    document.getElementById('paginaSemanas').classList.add('hidden');
    document.getElementById('paginaAulas').classList.remove('hidden');
    
    // Atualizar título
    document.getElementById('tituloSemana').textContent = 
        `Semana ${semana.id} - ${formatarData(semana.inicio)} a ${formatarData(semana.fim)}`;
    
    // Renderizar grade
    renderGradeSemana();
}

function voltarParaSemanas() {
    document.getElementById('paginaAulas').classList.add('hidden');
    document.getElementById('paginaSemanas').classList.remove('hidden');
    semanaAtual = -1;
}

function renderGradeSemana() {
    if (semanaAtual === -1) return;
    
    const container = document.getElementById('gradeSemana');
    const chave = `semana_${semanaAtual}`;
    const planejamento = planejamentos[chave] || { aulas: criarGradeVazia(), anotacoes: '' };
    
    let html = `
        <div style="margin-bottom: 20px;">
            <h3>📅 Grade de Aulas - ${configEscolaAtual.nome || escolaAtual.nome}</h3>
            <p style="color: #666; font-size: 14px; margin-top: 5px;">
                Células com aula são expandidas para melhor visualização
            </p>
        </div>
        
        <div class="grade-container">
            <div class="grade-horario">
                <div class="grade-header">Horário</div>
    `;
    
    // Cabeçalho dos dias
    DIAS_SEMANA_COMPLETO.forEach((dia, i) => {
        const data = new Date(semanas[semanaAtual].inicio);
        data.setDate(data.getDate() + i);
        html += `<div class="grade-header">${dia}<br><small>${formatarData(data)}</small></div>`;
    });
    
    // Linhas das aulas
    for (let aula = 0; aula < configHorarioAtual.aulasPorPeriodo; aula++) {
        html += `<div class="grade-header">${horariosGerados[aula]}<br><small>${configHorarioAtual.duracaoAula} min</small></div>`;
        
        for (let dia = 0; dia < 5; dia++) {
            const aulaData = planejamento.aulas[dia][aula];
            const disciplina = disciplinasProfessor.find(d => d.id === aulaData.disciplina);
            
            if (aulaData.disciplina && aulaData.turma) {
                // CÉLULA COM AULA - AMPLIADA
                const conteudoAtual = aulaData.conteudo || '';
                const caracteres = conteudoAtual.length;
                const alturaTextarea = Math.min(Math.max(80, Math.ceil(caracteres / 40) * 20), 200);
                
                html += `
                    <div class="grade-cell grade-cell-com-aula">
                        <div class="info-aula">
                            <div class="disciplina">
                                ${disciplina ? disciplina.icone : '📚'} 
                                ${disciplina ? disciplina.nome : 'Disciplina'}
                            </div>
                            <div class="turma">
                                🏫 Turma ${aulaData.turma}
                            </div>
                        </div>
                        
                        <textarea 
                            style="height: ${alturaTextarea}px;"
                            placeholder="Digite o conteúdo da aula..."
                            oninput="salvarConteudoAula(${dia}, ${aula}, this.value); ajustarAlturaTextarea(this)"
                            onfocus="this.style.borderColor='#0047B6'; this.style.boxShadow='0 0 0 2px rgba(0, 71, 182, 0.1)'"
                            onblur="this.style.borderColor='#ddd'; this.style.boxShadow='none'"
                        >${conteudoAtual}</textarea>
                        
                        <div class="btn-acoes">
                            <button onclick="copiarConteudo(${dia}, ${aula})" class="btn-acao">
                                📋 Copiar
                            </button>
                            <button onclick="apagarConteudoAula(${dia}, ${aula})" class="btn-acao btn-apagar">
                                🗑️ Apagar
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // CÉLULA SEM AULA - REDUZIDA
                html += `
                    <div class="grade-cell grade-cell-sem-aula" title="Nenhuma aula agendada para este horário">
                        Sem aula
                    </div>
                `;
            }
        }
    }
    
    html += `</div></div>`;
    
    // Anotações
    html += `
        <div style="margin-top: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3>📝 Anotações da Semana</h3>
                <button onclick="apagarAnotacoesSemana()" class="btn btn-danger btn-sm">
                    🗑️ Apagar
                </button>
            </div>
            <textarea id="anotacoesSemana" 
                      style="width: 100%; height: 100px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;"
                      placeholder="Anotações gerais para esta semana..."
                      oninput="salvarAnotacoesSemana(this.value)"
                      onfocus="this.style.borderColor='#0047B6'; this.style.boxShadow='0 0 0 2px rgba(0, 71, 182, 0.1)'"
                      onblur="this.style.borderColor='#ddd'; this.style.boxShadow='none'">${planejamento.anotacoes || ''}</textarea>
        </div>
    `;
    
    container.innerHTML = html;
}

function ajustarAlturaTextarea(textarea) {
    const conteudo = textarea.value;
    const caracteres = conteudo.length;
    const linhas = Math.max(3, Math.ceil(caracteres / 40));
    const novaAltura = Math.min(Math.max(80, linhas * 20), 300);
    
    textarea.style.height = novaAltura + 'px';
}

// ========== FUNÇÕES DE SALVAMENTO ==========
function salvarConteudoAula(dia, aula, conteudo) {
    if (!escolaAtual) return;
    
    const chave = `semana_${semanaAtual}`;
    if (!planejamentos[chave]) {
        planejamentos[chave] = {
            aulas: criarGradeVazia(),
            anotacoes: ''
        };
    }
    
    planejamentos[chave].aulas[dia][aula].conteudo = conteudo;
    localStorage.setItem(`planejamentos_${usuarioLogado.usuario}_${escolaAtual.id}`, JSON.stringify(planejamentos));
}

function salvarAnotacoesSemana(anotacoes) {
    if (!escolaAtual) return;
    
    const chave = `semana_${semanaAtual}`;
    if (!planejamentos[chave]) {
        planejamentos[chave] = {
            aulas: criarGradeVazia(),
            anotacoes: ''
        };
    }
    
    planejamentos[chave].anotacoes = anotacoes;
    localStorage.setItem(`planejamentos_${usuarioLogado.usuario}_${escolaAtual.id}`, JSON.stringify(planejamentos));
}

function apagarConteudoAula(dia, aula) {
    if (confirm('Apagar conteúdo desta aula?')) {
        const chave = `semana_${semanaAtual}`;
        if (planejamentos[chave]) {
            planejamentos[chave].aulas[dia][aula].conteudo = '';
            localStorage.setItem(`planejamentos_${usuarioLogado.usuario}_${escolaAtual.id}`, JSON.stringify(planejamentos));
            renderGradeSemana();
            alert('Conteúdo apagado!');
        }
    }
}

function apagarAnotacoesSemana() {
    if (confirm('Apagar todas as anotações desta semana?')) {
        const chave = `semana_${semanaAtual}`;
        if (planejamentos[chave]) {
            planejamentos[chave].anotacoes = '';
            localStorage.setItem(`planejamentos_${usuarioLogado.usuario}_${escolaAtual.id}`, JSON.stringify(planejamentos));
            renderGradeSemana();
            alert('Anotações apagadas!');
        }
    }
}

function apagarTodaSemana() {
    if (confirm('⚠️ Apagar TODOS os conteúdos desta semana?\n\nEsta ação não pode ser desfeita.')) {
        const chave = `semana_${semanaAtual}`;
        if (planejamentos[chave]) {
            // Limpar conteúdos
            for (let dia = 0; dia < 5; dia++) {
                for (let aula = 0; aula < configHorarioAtual.aulasPorPeriodo; aula++) {
                    planejamentos[chave].aulas[dia][aula].conteudo = '';
                }
            }
            
            // Limpar anotações
            planejamentos[chave].anotacoes = '';
            
            localStorage.setItem(`planejamentos_${usuarioLogado.usuario}_${escolaAtual.id}`, JSON.stringify(planejamentos));
            renderGradeSemana();
            alert('Semana apagada com sucesso!');
        }
    }
}

function copiarConteudo(dia, aula) {
    const chave = `semana_${semanaAtual}`;
    const aulaData = planejamentos[chave].aulas[dia][aula];
    
    if (!aulaData.conteudo || aulaData.conteudo.trim() === '') {
        alert('Nada para copiar!');
        return;
    }
    
    const disciplina = disciplinasProfessor.find(d => d.id === aulaData.disciplina);
    const texto = `Conteúdo da aula (${disciplina ? disciplina.nome : ''} - Turma ${aulaData.turma}):\n\n${aulaData.conteudo}`;
    
    navigator.clipboard.writeText(texto).then(() => {
        alert('Copiado para área de transferência!');
    });
}

// ========== STATUS DO HORÁRIO ==========
function atualizarStatusHorario() {
    const element = document.getElementById('statusHorario');
    if (!element) return;
    
    if (!escolaAtual) {
        element.innerHTML = `⚠️ Selecione uma escola primeiro`;
        element.className = 'status-horario vazio';
        return;
    }
    
    let aulasConfiguradas = contarAulasConfiguradas();
    let totalAulas = configHorarioAtual.aulasPorPeriodo * 5;
    
    if (aulasConfiguradas === 0) {
        element.innerHTML = `⚠️ Configure seu horário para ${escolaAtual.nome} primeiro`;
        element.className = 'status-horario vazio';
    } else {
        const percentual = Math.round((aulasConfiguradas / totalAulas) * 100);
        element.innerHTML = `✅ Horário de ${escolaAtual.nome} configurado: ${aulasConfiguradas}/${totalAulas} aulas (${percentual}%)`;
        element.className = 'status-horario configurado';
    }
}

// ========== EXPORTAÇÃO DOC ==========
function exportarSemanaDOC() {
    if (semanaAtual === -1) {
        alert('Nenhuma semana selecionada!');
        return;
    }
    
    if (!escolaAtual) {
        alert('Nenhuma escola selecionada!');
        return;
    }
    
    const semana = semanas[semanaAtual];
    const chave = `semana_${semanaAtual}`;
    const planejamento = planejamentos[chave] || { aulas: criarGradeVazia(), anotacoes: '' };
    
    // Contar células com aula para otimizar layout
    let celulasComAula = 0;
    for (let dia = 0; dia < 5; dia++) {
        for (let aula = 0; aula < configHorarioAtual.aulasPorPeriodo; aula++) {
            const aulaData = planejamento.aulas[dia][aula];
            if (aulaData.disciplina && aulaData.turma) {
                celulasComAula++;
            }
        }
    }
    
    // Determinar altura das linhas baseado no conteúdo
    const alturaLinha = celulasComAula > 15 ? "auto" : "60px";
    
    let logoHTML = '';
    if (configEscolaAtual.logo) {
        logoHTML = `<div class="logo-container"><img src="${configEscolaAtual.logo}" class="logo-documento" alt="${configEscolaAtual.nome}"></div>`;
    }
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>Planejamento Semanal - Semana ${semana.id}</title>
            <style>
                body { 
                    font-family: 'Calibri', 'Arial', sans-serif; 
                    margin: 25px; 
                    font-size: 11pt; 
                    line-height: 1.4;
                }
                h1 { 
                    color: #0047B6; 
                    text-align: center; 
                    margin-bottom: 10px;
                    font-size: 24pt;
                }
                h3 { 
                    color: #2A6ED4; 
                    text-align: center; 
                    margin-top: 5px;
                    margin-bottom: 20px;
                    font-size: 14pt;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 25px;
                    table-layout: fixed;
                }
                th, td { 
                    border: 1px solid #ccc; 
                    padding: 8px; 
                    text-align: left;
                    vertical-align: top;
                }
                th { 
                    background-color: #0047B6; 
                    color: white; 
                    font-weight: bold;
                    text-align: center;
                    font-size: 10pt;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px;
                    page-break-after: avoid;
                }
                .info { 
                    margin: 15px 0; 
                    text-align: center;
                    font-size: 10pt;
                    color: #444;
                }
                .logo-container { 
                    text-align: center; 
                    margin: 15px 0; 
                }
                .logo-documento { 
                    max-width: 150px; 
                    height: auto; 
                }
                .celula-com-aula {
                    background: #f8f9fa;
                    min-height: ${alturaLinha};
                }
                .celula-sem-aula {
                    background: #f5f5f5;
                    color: #888;
                    font-style: italic;
                    text-align: center;
                    font-size: 9pt;
                    padding: 4px !important;
                    height: 30px;
                }
                .disciplina-nome {
                    font-weight: bold;
                    color: #0047B6;
                    font-size: 10pt;
                    margin-bottom: 3px;
                }
                .turma-info {
                    font-size: 9pt;
                    color: #666;
                    margin-bottom: 5px;
                }
                .conteudo-aula {
                    font-size: 10pt;
                    line-height: 1.3;
                    margin-top: 5px;
                }
                .conteudo-vazio {
                    color: #999;
                    font-style: italic;
                    font-size: 9pt;
                }
                .anotacoes { 
                    background: #fff8e1; 
                    padding: 20px; 
                    border: 2px solid #F2B817; 
                    margin-top: 30px;
                    page-break-inside: avoid;
                }
                .anotacoes h4 {
                    color: #e0a800;
                    margin-top: 0;
                }
                .rodape { 
                    text-align: center; 
                    margin-top: 30px; 
                    font-size: 8pt; 
                    color: #666;
                    page-break-before: always;
                }
                .periodo {
                    font-weight: bold;
                    color: #333;
                    font-size: 9pt;
                    text-align: center;
                }
                @media print {
                    .page-break {
                        page-break-before: always;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                ${logoHTML}
                <h1>📚 PLANEJAMENTO SEMANAL DE AULAS</h1>
                <h3>${configEscolaAtual.nome || escolaAtual.nome}</h3>
                <h3>Semana ${semana.id} • ${formatarData(semana.inicio)} a ${formatarData(semana.fim)}</h3>
                <div class="info">
                    <p><strong>Professor:</strong> ${usuarioLogado.nome} &nbsp;|&nbsp; 
                       <strong>Turno:</strong> ${configEscolaAtual.turno || escolaAtual.turno} &nbsp;|&nbsp;
                       <strong>Data de geração:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th style="width: 100px;">Horário</th>
    `;
    
    // Cabeçalho dos dias
    DIAS_SEMANA_COMPLETO.forEach((dia, i) => {
        const data = new Date(semana.inicio);
        data.setDate(data.getDate() + i);
        html += `<th style="width: 18%;">${dia}<br><small>${formatarData(data)}</small></th>`;
    });
    
    html += `</tr></thead><tbody>`;
    
    // Conteúdo das aulas
    for (let aula = 0; aula < configHorarioAtual.aulasPorPeriodo; aula++) {
        html += `<tr><td class="periodo"><strong>${horariosGerados[aula]}</strong><br>${configHorarioAtual.duracaoAula} min</td>`;
        
        for (let dia = 0; dia < 5; dia++) {
            const aulaData = planejamento.aulas[dia][aula];
            const disciplina = disciplinasProfessor.find(d => d.id === aulaData.disciplina);
            
            if (aulaData.disciplina && aulaData.turma) {
                // CÉLULA COM AULA - FORMATO AMPLIADO
                const conteudo = aulaData.conteudo ? aulaData.conteudo.replace(/\n/g, '<br>') : '<span class="conteudo-vazio">Sem conteúdo definido</span>';
                
                html += `
                    <td class="celula-com-aula">
                        <div class="disciplina-nome">${disciplina ? disciplina.nome : ''}</div>
                        <div class="turma-info">Turma ${aulaData.turma}</div>
                        <div class="conteudo-aula">${conteudo}</div>
                    </td>
                `;
            } else {
                // CÉLULA SEM AULA - FORMATO REDUZIDO
                html += `<td class="celula-sem-aula">Sem aula</td>`;
            }
        }
        
        html += `</tr>`;
    }
    
    html += `</tbody></table>`;
    
    // Anotações (se houver)
    if (planejamento.anotacoes && planejamento.anotacoes.trim() !== '') {
        html += `
            <div class="anotacoes">
                <h4>📝 ANOTAÇÕES DA SEMANA</h4>
                <p>${planejamento.anotacoes.replace(/\n/g, '<br>')}</p>
            </div>
        `;
    }
    
    // Resumo das disciplinas utilizadas na semana
    const disciplinasUtilizadas = new Set();
    for (let dia = 0; dia < 5; dia++) {
        for (let aula = 0; aula < configHorarioAtual.aulasPorPeriodo; aula++) {
            const aulaData = planejamento.aulas[dia][aula];
            if (aulaData.disciplina) {
                const disciplina = disciplinasProfessor.find(d => d.id === aulaData.disciplina);
                if (disciplina) {
                    disciplinasUtilizadas.add(`${disciplina.icone} ${disciplina.nome}`);
                }
            }
        }
    }
    
    if (disciplinasUtilizadas.size > 0) {
        html += `
            <div style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 4px; font-size: 10pt;">
                <p><strong>Disciplinas desta semana:</strong> ${Array.from(disciplinasUtilizadas).join(', ')}</p>
            </div>
        `;
    }
    
    // Rodapé
    html += `
        <div class="rodape">
            <p>Documento gerado pelo Sistema Planejador de Aulas • ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
            <p>${configEscolaAtual.endereco || escolaAtual.endereco || ''} • ${configEscolaAtual.cidade || escolaAtual.cidade || ''} • ${configEscolaAtual.telefone || escolaAtual.telefone || ''}</p>
            <p>Desenvolvido por Lafaiete Erkmann • Contato: @lafa.bio</p>
        </div>
        </body>
        </html>
    `;
    
    // Download
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Planejamento_${configEscolaAtual.nome.replace(/[^a-z0-9]/gi, '_')}_Semana_${semana.id}_${formatarDataISO(semana.inicio)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Documento exportado com sucesso!\n\nCélulas com aula são destacadas e ampliadas.\nCélulas sem aula são reduzidas para melhor visualização.');
}

function exportarParaDOC() {
    if (semanaAtual === -1) {
        alert('Selecione uma semana primeiro!');
        return;
    }
    
    exportarSemanaDOC();
}

// ========== EDIÇÃO DE PERFIL ==========
function abrirEditarPerfil() {
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 600px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: #0047B6; margin: 0;">👤 Meu Perfil</h3>
                    <button onclick="fecharModal()" class="btn btn-secondary">Fechar</button>
                </div>
                
                <div class="config-section">
                    <div class="profile-section">
                        <div class="avatar-container">
                            ${usuarioLogado.avatar ? 
                                `<img src="${usuarioLogado.avatar}" class="avatar-preview" alt="Avatar">` : 
                                '<div class="avatar-placeholder">👤</div>'}
                        </div>
                        <div class="profile-info">
                            <h4>${usuarioLogado.nome}</h4>
                            <p>${usuarioLogado.email}</p>
                            <p><small>Usuário: ${usuarioLogado.usuario}</small></p>
                            <input type="text" id="perfilAvatar" placeholder="URL da sua foto" value="${usuarioLogado.avatar || ''}" 
                                   style="width: 100%; padding: 8px; margin-top: 10px; border: 1px solid #ddd; border-radius: 4px;">
                            <small style="color: #666;">Cole a URL de uma imagem para seu avatar</small>
                        </div>
                    </div>
                    
                    <div class="input-group">
                        <label>Nome completo:</label>
                        <input type="text" id="perfilNome" value="${usuarioLogado.nome}" placeholder="Seu nome completo">
                    </div>
                    
                    <div class="input-group">
                        <label>Email:</label>
                        <input type="email" id="perfilEmail" value="${usuarioLogado.email}" placeholder="seu@email.com">
                    </div>
                    
                    <div class="input-group">
                        <label>Telefone:</label>
                        <input type="text" id="perfilTelefone" value="${usuarioLogado.telefone || ''}" placeholder="(11) 99999-9999">
                    </div>
                    
                    <div class="input-group">
                        <label>Alterar senha:</label>
                        <input type="password" id="perfilNovaSenha" placeholder="Nova senha (deixe em branco para não alterar)">
                        <span class="password-toggle" onclick="togglePassword('perfilNovaSenha')">👁️</span>
                    </div>
                    
                    <div class="input-group">
                        <label>Confirmar senha:</label>
                        <input type="password" id="perfilConfirmarSenha" placeholder="Confirme a nova senha">
                        <span class="password-toggle" onclick="togglePassword('perfilConfirmarSenha')">👁️</span>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px;">
                    <button onclick="salvarPerfil()" class="btn btn-success">Salvar Alterações</button>
                    <button onclick="fecharModal()" class="btn btn-secondary">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function salvarPerfil() {
    const nome = document.getElementById('perfilNome').value.trim();
    const email = document.getElementById('perfilEmail').value.trim();
    const telefone = document.getElementById('perfilTelefone').value.trim();
    const avatar = document.getElementById('perfilAvatar').value.trim();
    const novaSenha = document.getElementById('perfilNovaSenha').value;
    const confirmarSenha = document.getElementById('perfilConfirmarSenha').value;
    
    if (!nome || !email) {
        alert('Nome e email são obrigatórios');
        return;
    }
    
    // Verificar senha
    if (novaSenha) {
        if (novaSenha.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        
        if (novaSenha !== confirmarSenha) {
            alert('As senhas não coincidem');
            return;
        }
        
        // Alterar senha
        localStorage.setItem('senha_' + usuarioLogado.usuario, novaSenha);
    }
    
    // Atualizar dados do usuário
    usuarioLogado.nome = nome;
    usuarioLogado.email = email;
    usuarioLogado.telefone = telefone;
    usuarioLogado.avatar = avatar;
    
    // Salvar perfil
    localStorage.setItem('perfil_' + usuarioLogado.usuario, JSON.stringify({
        nome: nome,
        email: email,
        telefone: telefone,
        avatar: avatar
    }));
    
    // Atualizar usuário no localStorage
    localStorage.setItem('usuario_' + usuarioLogado.usuario, JSON.stringify(usuarioLogado));
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
    
    alert('Perfil atualizado com sucesso!');
    atualizarInterface();
    fecharModal();
}

// ========== FUNÇÕES DO ADMIN ==========
function abrirPainelAdmin() {
    if (usuarioLogado.tipo !== "superuser") {
        alert('Acesso restrito!');
        return;
    }
    
    // Coletar estatísticas
    let totalUsuarios = 0;
    let professoresAtivos = 0;
    const emails = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('usuario_') && key !== 'usuario_' + SUPER_USUARIO.usuario) {
            totalUsuarios++;
            const usuario = JSON.parse(localStorage.getItem(key));
            emails.push(usuario.email);
            
            // Verificar se tem escolas cadastradas
            const escolasUsuario = localStorage.getItem('escolas_' + usuario.usuario);
            if (escolasUsuario && JSON.parse(escolasUsuario).length > 0) {
                professoresAtivos++;
            }
        }
    }
    
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 800px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: #0047B6; margin: 0;">⚙️ Painel de Administração</h3>
                    <button onclick="fecharModal()" class="btn btn-secondary">Fechar</button>
                </div>
                
                <div class="config-section">
                    <h4 style="color: #2A6ED4; margin-bottom: 15px;">📊 Estatísticas do Sistema</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                            <p><strong>Total de usuários:</strong> ${totalUsuarios}</p>
                            <p><strong>Professores ativos:</strong> ${professoresAtivos}</p>
                            <p><strong>Armazenamento:</strong> ${(JSON.stringify(localStorage).length / 1024).toFixed(2)} KB</p>
                        </div>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                            <p><strong>Emails coletados:</strong> ${emails.length}</p>
                            <textarea id="emailsColetados" style="width: 100%; height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; margin-top: 10px;" readonly>${emails.join(', ')}</textarea>
                            <button onclick="copiarEmails()" class="btn btn-primary" style="margin-top: 10px; width: 100%;">📋 Copiar Emails</button>
                        </div>
                    </div>
                </div>
                
                <div class="config-section">
                    <h4 style="color: #2A6ED4; margin-bottom: 15px;">🛠️ Ações Administrativas</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button onclick="exportarBackup()" class="btn btn-success">💾 Exportar Backup</button>
                        <button onclick="limparDadosAntigos()" class="btn btn-danger">🗑️ Limpar Dados Antigos</button>
                        <button onclick="alterarSenhaAdmin()" class="btn btn-primary">🔐 Alterar Senha Admin</button>
                        <button onclick="gerarRelatorio()" class="btn btn-primary">📄 Gerar Relatório</button>
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
                    <p style="font-size: 12px; color: #666;">
                        <strong>Superusuário:</strong> ${SUPER_USUARIO.usuario}<br>
                        <strong>Desenvolvido por:</strong> Lafaiete Erkmann • @lafa.bio
                    </p>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function copiarEmails() {
    const textarea = document.getElementById('emailsColetados');
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
        alert('Emails copiados para área de transferência!');
    });
}

function exportarBackup() {
    const dados = {};
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
    
    alert('Backup exportado com sucesso!');
}

function alterarSenhaAdmin() {
    const novaSenha = prompt('Digite a nova senha para a coordenação (mínimo 8 caracteres):');
    if (novaSenha && novaSenha.length >= 8) {
        SUPER_USUARIO.senha = novaSenha;
        alert('Senha alterada com sucesso!');
    } else {
        alert('A senha deve ter pelo menos 8 caracteres');
    }
}

function gerarRelatorio() {
    alert('Relatório gerado no console do navegador (F12)');
    console.log('=== RELATÓRIO DO SISTEMA ===');
    console.log('Usuários cadastrados:', Object.keys(localStorage)
        .filter(k => k.startsWith('usuario_') && k !== 'usuario_' + SUPER_USUARIO.usuario)
        .map(k => JSON.parse(localStorage.getItem(k))));
    console.log('Total de armazenamento:', (JSON.stringify(localStorage).length / 1024).toFixed(2), 'KB');
}

function limparDadosAntigos() {
    if (confirm('Isso removerá dados de usuários inativos (sem login há mais de 30 dias).\n\nDeseja continuar?')) {
        let removidos = 0;
        const trintaDiasAtras = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('usuario_') && key !== 'usuario_' + SUPER_USUARIO.usuario) {
                const usuario = JSON.parse(localStorage.getItem(key));
                const dataCadastro = new Date(usuario.dataCadastro).getTime();
                
                if (dataCadastro < trintaDiasAtras) {
                    // Verificar se tem dados recentes
                    const temDadosRecentes = localStorage.getItem('escolas_' + usuario.usuario);
                    
                    if (!temDadosRecentes) {
                        // Remover usuário inativo
                        localStorage.removeItem(key);
                        localStorage.removeItem('senha_' + usuario.usuario);
                        localStorage.removeItem('perfil_' + usuario.usuario);
                        
                        // Remover dados específicos do usuário
                        for (let j = 0; j < localStorage.length; j++) {
                            const userKey = localStorage.key(j);
                            if (userKey && userKey.includes(usuario.usuario)) {
                                localStorage.removeItem(userKey);
                            }
                        }
                        
                        removidos++;
                    }
                }
            }
        }
        
        alert(`${removidos} usuários inativos foram removidos.`);
    }
}

// ========== FUNÇÕES AUXILIARES ==========
function fecharModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se há usuário salvo
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (usuarioSalvo) {
        try {
            usuarioLogado = JSON.parse(usuarioSalvo);
            iniciarAplicacao();
        } catch (e) {
            console.error('Erro ao carregar usuário:', e);
        }
    }
    
    // Lembrar usuário
    const usuarioLembrado = localStorage.getItem('usuarioLembrado');
    if (usuarioLembrado) {
        document.getElementById('loginUsuario').value = usuarioLembrado;
        document.getElementById('lembrarUsuario').checked = true;
    }
    
    // Mostrar login por padrão
    mostrarLogin();
});
