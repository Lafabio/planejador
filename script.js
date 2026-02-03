let usuarioLogado = null;
let semanas = [];
let semanaAtual = -1;
let planejamentos = {};
let horarioProfessor = {};
let configuracoesEscola = {
    nome: "",
    endereco: "",
    cidade: "",
    telefone: "",
    email: "",
    turnos: [],
    diasSemana: 5
};

let DISCIPLINAS_PESSOAIS = []; // Disciplinas cadastradas pelo professor
let TURMAS_PESSOAIS = []; // Turmas cadastradas pelo professor
let CONFIG_HORARIO = {
    aulasPorPeriodo: 7,
    duracaoAula: 45,
    inicioAulas: "07:00",
    intervalo: "10:00",
    duracaoIntervalo: 20
};

const telaLogin = document.getElementById('telaLogin');
const appPrincipal = document.getElementById('appPrincipal');
const loginForm = document.getElementById('loginForm');
const cadastroForm = document.getElementById('cadastroForm');
const recuperacaoForm = document.getElementById('recuperacaoForm');
const novaSenhaForm = document.getElementById('novaSenhaForm');
const btnAdmin = document.getElementById('btnAdmin');

// SUPERUSUÁRIO (Coordenação)
const SUPER_USUARIO = {
    usuario: "coordenacao",
    senha: "sesi@2026",
    nome: "Coordenação Pedagógica",
    email: "coordenacao@escola.com",
    tipo: "superuser"
};

// Função para gerar horários baseado nas configurações pessoais
function gerarHorariosPessoais() {
    const horarios = [];
    const [horaInicio, minutoInicio] = CONFIG_HORARIO.inicioAulas.split(':').map(Number);
    const [horaIntervalo, minutoIntervalo] = CONFIG_HORARIO.intervalo.split(':').map(Number);
    
    for (let i = 0; i < CONFIG_HORARIO.aulasPorPeriodo; i++) {
        // Calcular se esta aula é antes ou depois do intervalo
        const horaAula = horaInicio + Math.floor((i * CONFIG_HORARIO.duracaoAula) / 60);
        const minutoAula = minutoInicio + ((i * CONFIG_HORARIO.duracaoAula) % 60);
        
        const horaFim = horaInicio + Math.floor(((i + 1) * CONFIG_HORARIO.duracaoAula) / 60);
        const minutoFim = minutoInicio + (((i + 1) * CONFIG_HORARIO.duracaoAula) % 60);
        
        // Se passou do intervalo, adicionar tempo do intervalo
        let horaAulaFinal = horaAula;
        let minutoAulaFinal = minutoAula;
        let horaFimFinal = horaFim;
        let minutoFimFinal = minutoFim;
        
        if (horaAula > horaIntervalo || (horaAula === horaIntervalo && minutoAula >= minutoIntervalo)) {
            horaAulaFinal += Math.floor(CONFIG_HORARIO.duracaoIntervalo / 60);
            minutoAulaFinal += CONFIG_HORARIO.duracaoIntervalo % 60;
            horaFimFinal += Math.floor(CONFIG_HORARIO.duracaoIntervalo / 60);
            minutoFimFinal += CONFIG_HORARIO.duracaoIntervalo % 60;
        }
        
        // Ajustar minutos acima de 60
        if (minutoAulaFinal >= 60) {
            horaAulaFinal += 1;
            minutoAulaFinal -= 60;
        }
        if (minutoFimFinal >= 60) {
            horaFimFinal += 1;
            minutoFimFinal -= 60;
        }
        
        horarios.push(
            `${String(horaAulaFinal).padStart(2, '0')}:${String(minutoAulaFinal).padStart(2, '0')} - ` +
            `${String(horaFimFinal).padStart(2, '0')}:${String(minutoFimFinal).padStart(2, '0')}`
        );
    }
    
    return horarios;
}

let HORARIOS_PESSOAIS = gerarHorariosPessoais();

const DIAS_SEMANA_COMPLETO = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
const DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];

// ========== FUNÇÃO DE VISUALIZAÇÃO DE SENHA ==========
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
            alert('Este nome de usuário é reservado para a coordenação');
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
    
    if (usuarioLogado) {
        // Carregar configurações da escola do professor
        const configEscolaSalva = localStorage.getItem('configEscola_' + usuarioLogado.usuario);
        if (configEscolaSalva) {
            try {
                Object.assign(configuracoesEscola, JSON.parse(configEscolaSalva));
            } catch (e) {
                console.error('Erro ao carregar configurações da escola:', e);
            }
        }
        
        // Carregar configurações de horário do professor
        const configHorarioSalva = localStorage.getItem('configHorario_' + usuarioLogado.usuario);
        if (configHorarioSalva) {
            try {
                Object.assign(CONFIG_HORARIO, JSON.parse(configHorarioSalva));
                HORARIOS_PESSOAIS = gerarHorariosPessoais();
            } catch (e) {
                console.error('Erro ao carregar configurações de horário:', e);
            }
        }
        
        // Carregar disciplinas pessoais do professor
        const disciplinasSalvas = localStorage.getItem('disciplinas_' + usuarioLogado.usuario);
        if (disciplinasSalvas) {
            try {
                DISCIPLINAS_PESSOAIS = JSON.parse(disciplinasSalvas);
            } catch (e) {
                console.error('Erro ao carregar disciplinas:', e);
            }
        }
        
        // Carregar turmas pessoais do professor
        const turmasSalvas = localStorage.getItem('turmas_' + usuarioLogado.usuario);
        if (turmasSalvas) {
            try {
                TURMAS_PESSOAIS = JSON.parse(turmasSalvas);
            } catch (e) {
                console.error('Erro ao carregar turmas:', e);
            }
        }
        
        // Atualizar lista de disciplinas na interface
        atualizarListaDisciplinas();
        
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
    const btnVoltar = document.getElementById('voltar');
    
    if (inicioLetivo) {
        inicioLetivo.addEventListener('change', function() {
            gerarSemanas(this.value);
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
}

function atualizarListaDisciplinas() {
    const disciplinasLista = document.getElementById('disciplinasLista');
    if (disciplinasLista) {
        const nomesDisciplinas = DISCIPLINAS_PESSOAIS.map(d => d.nome).join(', ');
        const contador = DISCIPLINAS_PESSOAIS.length;
        disciplinasLista.textContent = contador === 0 ? 'Nenhuma disciplina cadastrada' : `${contador} disciplinas: ${nomesDisciplinas}`;
    }
}

// ========== CONFIGURAÇÃO DA ESCOLA ==========
function abrirConfiguracaoEscola() {
    const modalHTML = `
        <div id="modalEscola" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <div style="background: white; padding: 25px; border-radius: 10px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
                <h3 style="color: #0047B6; margin-bottom: 20px;">🏫 Configuração da Escola</h3>
                
                <div class="config-section">
                    <h4 style="color: #2A6ED4; margin-bottom: 15px;">📋 Dados da Escola</h4>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nome da Escola:</label>
                        <input type="text" id="nomeEscola" value="${configuracoesEscola.nome || ''}" placeholder="Nome da instituição" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Endereço:</label>
                        <input type="text" id="enderecoEscola" value="${configuracoesEscola.endereco || ''}" placeholder="Rua, número, bairro" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Cidade:</label>
                            <input type="text" id="cidadeEscola" value="${configuracoesEscola.cidade || ''}" placeholder="Cidade" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Telefone:</label>
                            <input type="text" id="telefoneEscola" value="${configuracoesEscola.telefone || ''}" placeholder="(11) 99999-9999" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email:</label>
                        <input type="email" id="emailEscola" value="${configuracoesEscola.email || ''}" placeholder="escola@email.com" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                </div>
                
                <div class="config-section">
                    <h4 style="color: #2A6ED4; margin-bottom: 15px;">🕐 Configuração de Horário</h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Aulas por período:</label>
                            <input type="number" id="aulasPeriodo" value="${CONFIG_HORARIO.aulasPorPeriodo}" min="4" max="10" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Duração da aula (min):</label>
                            <input type="number" id="duracaoAula" value="${CONFIG_HORARIO.duracaoAula}" min="40" max="60" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Início das aulas:</label>
                            <input type="time" id="inicioAulas" value="${CONFIG_HORARIO.inicioAulas}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Horário do recreio:</label>
                            <input type="time" id="horarioRecreio" value="${CONFIG_HORARIO.intervalo}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Duração do recreio (min):</label>
                        <input type="number" id="duracaoRecreio" value="${CONFIG_HORARIO.duracaoIntervalo}" min="10" max="30" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                    
                    <div style="margin-top: 15px; padding: 10px; background: #f0f8ff; border-radius: 6px;">
                        <p><strong>Horários gerados:</strong></p>
                        <div id="previewHorarios" style="font-size: 12px; max-height: 100px; overflow-y: auto;">
                            ${HORARIOS_PESSOAIS.map(h => `<div>${h}</div>`).join('')}
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px;">
                    <button onclick="salvarConfiguracaoEscola()" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        Salvar Configurações
                    </button>
                    <button onclick="fecharModalEscola()" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Adicionar listeners para atualizar preview
    document.getElementById('aulasPeriodo').addEventListener('input', atualizarPreviewHorarios);
    document.getElementById('duracaoAula').addEventListener('input', atualizarPreviewHorarios);
    document.getElementById('inicioAulas').addEventListener('input', atualizarPreviewHorarios);
    document.getElementById('horarioRecreio').addEventListener('input', atualizarPreviewHorarios);
    document.getElementById('duracaoRecreio').addEventListener('input', atualizarPreviewHorarios);
}

function atualizarPreviewHorarios() {
    const aulasPorPeriodo = parseInt(document.getElementById('aulasPeriodo').value) || 7;
    const duracaoAula = parseInt(document.getElementById('duracaoAula').value) || 45;
    const inicioAulas = document.getElementById('inicioAulas').value || "07:00";
    const intervalo = document.getElementById('horarioRecreio').value || "10:00";
    const duracaoIntervalo = parseInt(document.getElementById('duracaoRecreio').value) || 20;
    
    const tempConfig = {
        aulasPorPeriodo,
        duracaoAula,
        inicioAulas,
        intervalo,
        duracaoIntervalo
    };
    
    const horarios = gerarHorariosPreview(tempConfig);
    
    const previewDiv = document.getElementById('previewHorarios');
    if (previewDiv) {
        previewDiv.innerHTML = horarios.map(h => `<div>${h}</div>`).join('');
    }
}

function gerarHorariosPreview(config) {
    const horarios = [];
    const [horaInicio, minutoInicio] = config.inicioAulas.split(':').map(Number);
    const [horaIntervalo, minutoIntervalo] = config.intervalo.split(':').map(Number);
    
    for (let i = 0; i < config.aulasPorPeriodo; i++) {
        const horaAula = horaInicio + Math.floor((i * config.duracaoAula) / 60);
        const minutoAula = minutoInicio + ((i * config.duracaoAula) % 60);
        
        const horaFim = horaInicio + Math.floor(((i + 1) * config.duracaoAula) / 60);
        const minutoFim = minutoInicio + (((i + 1) * config.duracaoAula) % 60);
        
        // Ajustar para intervalo
        let horaAulaFinal = horaAula;
        let minutoAulaFinal = minutoAula;
        let horaFimFinal = horaFim;
        let minutoFimFinal = minutoFim;
        
        if (horaAula > horaIntervalo || (horaAula === horaIntervalo && minutoAula >= minutoIntervalo)) {
            horaAulaFinal += Math.floor(config.duracaoIntervalo / 60);
            minutoAulaFinal += config.duracaoIntervalo % 60;
            horaFimFinal += Math.floor(config.duracaoIntervalo / 60);
            minutoFimFinal += config.duracaoIntervalo % 60;
        }
        
        // Ajustar minutos acima de 60
        if (minutoAulaFinal >= 60) {
            horaAulaFinal += 1;
            minutoAulaFinal -= 60;
        }
        if (minutoFimFinal >= 60) {
            horaFimFinal += 1;
            minutoFimFinal -= 60;
        }
        
        horarios.push(
            `${String(horaAulaFinal).padStart(2, '0')}:${String(minutoAulaFinal).padStart(2, '0')} - ` +
            `${String(horaFimFinal).padStart(2, '0')}:${String(minutoFimFinal).padStart(2, '0')}`
        );
    }
    
    return horarios;
}

function salvarConfiguracaoEscola() {
    if (!usuarioLogado) return;
    
    // Salvar dados da escola
    configuracoesEscola.nome = document.getElementById('nomeEscola').value.trim();
    configuracoesEscola.endereco = document.getElementById('enderecoEscola').value.trim();
    configuracoesEscola.cidade = document.getElementById('cidadeEscola').value.trim();
    configuracoesEscola.telefone = document.getElementById('telefoneEscola').value.trim();
    configuracoesEscola.email = document.getElementById('emailEscola').value.trim();
    
    // Salvar configurações de horário
    CONFIG_HORARIO.aulasPorPeriodo = parseInt(document.getElementById('aulasPeriodo').value) || 7;
    CONFIG_HORARIO.duracaoAula = parseInt(document.getElementById('duracaoAula').value) || 45;
    CONFIG_HORARIO.inicioAulas = document.getElementById('inicioAulas').value || "07:00";
    CONFIG_HORARIO.intervalo = document.getElementById('horarioRecreio').value || "10:00";
    CONFIG_HORARIO.duracaoIntervalo = parseInt(document.getElementById('duracaoRecreio').value) || 20;
    
    // Atualizar horários gerados
    HORARIOS_PESSOAIS = gerarHorariosPessoais();
    
    // Salvar no localStorage
    localStorage.setItem('configEscola_' + usuarioLogado.usuario, JSON.stringify(configuracoesEscola));
    localStorage.setItem('configHorario_' + usuarioLogado.usuario, JSON.stringify(CONFIG_HORARIO));
    
    alert('Configurações da escola salvas com sucesso!');
    fecharModalEscola();
}

function fecharModalEscola() {
    const modal = document.getElementById('modalEscola');
    if (modal) modal.remove();
}

// ========== CONFIGURAÇÃO DE HORÁRIO E DISCIPLINAS ==========
function abrirConfiguracaoHorario() {
    // Verificar se a escola foi configurada
    if (!configuracoesEscola.nome) {
        alert('Configure primeiro os dados da sua escola!');
        abrirConfiguracaoEscola();
        return;
    }
    
    const modalHTML = `
        <div id="modalHorario" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <div style="background: white; padding: 25px; border-radius: 10px; max-width: 1200px; width: 95%; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: #0047B6; margin: 0;">🕐 Configurar Meu Horário</h3>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="abrirCadastroDisciplina()" style="background: #17a2b8; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 13px;">
                            ➕ Nova Disciplina
                        </button>
                        <button onclick="abrirCadastroTurma()" style="background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 13px;">
                            🏫 Nova Turma
                        </button>
                    </div>
                </div>
                
                <div class="config-section" style="margin-bottom: 20px;">
                    <h4 style="color: #2A6ED4; margin-bottom: 15px;">📚 Minhas Disciplinas</h4>
                    <div id="listaDisciplinasPessoais" style="max-height: 150px; overflow-y: auto;">
                        ${renderDisciplinasPessoais()}
                    </div>
                </div>
                
                <div class="config-section" style="margin-bottom: 20px;">
                    <h4 style="color: #2A6ED4; margin-bottom: 15px;">🏫 Minhas Turmas</h4>
                    <div id="listaTurmasPessoais" style="max-height: 150px; overflow-y: auto;">
                        ${renderTurmasPessoais()}
                    </div>
                </div>
                
                <div class="config-section">
                    <h4 style="color: #2A6ED4; margin-bottom: 15px;">📅 Grade Horária</h4>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <p><strong>Escola:</strong> ${configuracoesEscola.nome || 'Não configurada'}</p>
                        <p><strong>Horários:</strong> ${HORARIOS_PESSOAIS.length} aulas por dia</p>
                        <p><strong>Duração:</strong> ${CONFIG_HORARIO.duracaoAula} minutos por aula</p>
                    </div>
                    
                    <div id="gradeHorario" style="margin: 20px 0;"></div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px;">
                    <button onclick="salvarHorario()" style="background: #2E7D32; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        Salvar Horário
                    </button>
                    <button onclick="fecharModalHorario()" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    renderGradeHorario();
}

function renderDisciplinasPessoais() {
    if (DISCIPLINAS_PESSOAIS.length === 0) {
        return '<p style="color: #666; font-style: italic;">Nenhuma disciplina cadastrada. Clique em "Nova Disciplina" para adicionar.</p>';
    }
    
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">';
    DISCIPLINAS_PESSOAIS.forEach((disciplina, index) => {
        html += `
            <div class="disciplina-item">
                <div>
                    <strong>${disciplina.icone} ${disciplina.nome}</strong>
                    <div style="font-size: 11px; color: #666;">${disciplina.descricao || 'Sem descrição'}</div>
                </div>
                <button onclick="removerDisciplinaPessoal(${index})" style="background: #dc3545; color: white; border: none; padding: 3px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                    Remover
                </button>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function renderTurmasPessoais() {
    if (TURMAS_PESSOAIS.length === 0) {
        return '<p style="color: #666; font-style: italic;">Nenhuma turma cadastrada. Clique em "Nova Turma" para adicionar.</p>';
    }
    
    let html = '<div style="display: flex; flex-wrap: wrap; gap: 10px;">';
    TURMAS_PESSOAIS.forEach((turma, index) => {
        html += `
            <div class="disciplina-item">
                <div>
                    <strong>🏫 Turma ${turma}</strong>
                </div>
                <button onclick="removerTurmaPessoal(${index})" style="background: #dc3545; color: white; border: none; padding: 3px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                    Remover
                </button>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function abrirCadastroDisciplina() {
    const modalHTML = `
        <div id="modalCadastroDisciplina" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1100;">
            <div style="background: white; padding: 25px; border-radius: 10px; max-width: 500px; width: 90%;">
                <h3 style="color: #0047B6; margin-bottom: 20px;">➕ Cadastrar Nova Disciplina</h3>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nome da Disciplina:</label>
                    <input type="text" id="nomeDisciplinaNova" placeholder="Ex: Matemática, Português, Ciências" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Descrição (opcional):</label>
                    <textarea id="descricaoDisciplina" placeholder="Breve descrição da disciplina" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; height: 60px;"></textarea>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Ícone:</label>
                    <select id="iconeDisciplina" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        <option value="📚">📚 Livro</option>
                        <option value="🧬">🧬 Biologia</option>
                        <option value="🔬">🔬 Ciências</option>
                        <option value="💡">💡 Projetos</option>
                        <option value="🤖">🤖 Robótica</option>
                        <option value="🎮">🎮 Games</option>
                        <option value="🔍">🔍 Pesquisa</option>
                        <option value="📝">📝 Outra</option>
                        <option value="🧪">🧪 Química</option>
                        <option value="📐">📐 Matemática</option>
                        <option value="🌍">🌍 Geografia</option>
                        <option value="📖">📖 Literatura</option>
                        <option value="🎨">🎨 Arte</option>
                        <option value="🏀">🏀 Educação Física</option>
                        <option value="🎵">🎵 Música</option>
                        <option value="💻">💻 Informática</option>
                        <option value="🌐">🌐 História</option>
                        <option value="🔢">🔢 Física</option>
                    </select>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px;">
                    <button onclick="salvarDisciplinaPessoal()" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        Salvar Disciplina
                    </button>
                    <button onclick="fecharModalCadastroDisciplina()" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function salvarDisciplinaPessoal() {
    const nome = document.getElementById('nomeDisciplinaNova').value.trim();
    const descricao = document.getElementById('descricaoDisciplina').value.trim();
    const icone = document.getElementById('iconeDisciplina').value;
    
    if (!nome) {
        alert('Digite o nome da disciplina');
        return;
    }
    
    // Verificar se já existe disciplina com mesmo nome
    const disciplinaExistente = DISCIPLINAS_PESSOAIS.find(d => d.nome.toLowerCase() === nome.toLowerCase());
    if (disciplinaExistente) {
        alert('Já existe uma disciplina com este nome');
        return;
    }
    
    // Gerar ID único
    const id = nome.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Adicionar nova disciplina
    const novaDisciplina = {
        id: id,
        nome: nome,
        descricao: descricao,
        icone: icone
    };
    
    DISCIPLINAS_PESSOAIS.push(novaDisciplina);
    
    // Salvar no localStorage
    localStorage.setItem('disciplinas_' + usuarioLogado.usuario, JSON.stringify(DISCIPLINAS_PESSOAIS));
    
    // Atualizar interface
    atualizarListaDisciplinas();
    
    // Atualizar modal de horário se estiver aberto
    const listaDiv = document.getElementById('listaDisciplinasPessoais');
    if (listaDiv) {
        listaDiv.innerHTML = renderDisciplinasPessoais();
    }
    
    // Fechar modal
    fecharModalCadastroDisciplina();
    
    alert(`Disciplina "${nome}" cadastrada com sucesso!`);
}

function removerDisciplinaPessoal(index) {
    if (confirm('Tem certeza que deseja remover esta disciplina?')) {
        const disciplinaRemovida = DISCIPLINAS_PESSOAIS[index];
        
        // Remover disciplina
        DISCIPLINAS_PESSOAIS.splice(index, 1);
        
        // Salvar no localStorage
        localStorage.setItem('disciplinas_' + usuarioLogado.usuario, JSON.stringify(DISCIPLINAS_PESSOAIS));
        
        // Atualizar interface
        atualizarListaDisciplinas();
        
        // Atualizar modal de horário se estiver aberto
        const listaDiv = document.getElementById('listaDisciplinasPessoais');
        if (listaDiv) {
            listaDiv.innerHTML = renderDisciplinasPessoais();
        }
        
        // Atualizar grade de horário se estiver aberta
        if (document.getElementById('gradeHorario')) {
            renderGradeHorario();
        }
        
        alert(`Disciplina "${disciplinaRemovida.nome}" removida com sucesso!`);
    }
}

function fecharModalCadastroDisciplina() {
    const modal = document.getElementById('modalCadastroDisciplina');
    if (modal) modal.remove();
}

function abrirCadastroTurma() {
    const modalHTML = `
        <div id="modalCadastroTurma" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1100;">
            <div style="background: white; padding: 25px; border-radius: 10px; max-width: 500px; width: 90%;">
                <h3 style="color: #0047B6; margin-bottom: 20px;">🏫 Cadastrar Nova Turma</h3>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Código da Turma:</label>
                    <input type="text" id="codigoTurmaNova" placeholder="Ex: 101, 1A, 2B, 3ºEM" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px;">
                    <button onclick="salvarTurmaPessoal()" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        Salvar Turma
                    </button>
                    <button onclick="fecharModalCadastroTurma()" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function salvarTurmaPessoal() {
    const codigo = document.getElementById('codigoTurmaNova').value.trim().toUpperCase();
    
    if (!codigo) {
        alert('Digite o código da turma');
        return;
    }
    
    // Verificar se já existe turma com mesmo código
    if (TURMAS_PESSOAIS.includes(codigo)) {
        alert('Já existe uma turma com este código');
        return;
    }
    
    // Adicionar nova turma
    TURMAS_PESSOAIS.push(codigo);
    
    // Ordenar turmas
    TURMAS_PESSOAIS.sort();
    
    // Salvar no localStorage
    localStorage.setItem('turmas_' + usuarioLogado.usuario, JSON.stringify(TURMAS_PESSOAIS));
    
    // Atualizar modal de horário se estiver aberto
    const listaDiv = document.getElementById('listaTurmasPessoais');
    if (listaDiv) {
        listaDiv.innerHTML = renderTurmasPessoais();
    }
    
    // Fechar modal
    fecharModalCadastroTurma();
    
    alert(`Turma "${codigo}" cadastrada com sucesso!`);
}

function removerTurmaPessoal(index) {
    if (confirm('Tem certeza que deseja remover esta turma?')) {
        const turmaRemovida = TURMAS_PESSOAIS[index];
        
        // Remover turma
        TURMAS_PESSOAIS.splice(index, 1);
        
        // Salvar no localStorage
        localStorage.setItem('turmas_' + usuarioLogado.usuario, JSON.stringify(TURMAS_PESSOAIS));
        
        // Atualizar modal de horário se estiver aberto
        const listaDiv = document.getElementById('listaTurmasPessoais');
        if (listaDiv) {
            listaDiv.innerHTML = renderTurmasPessoais();
        }
        
        // Atualizar grade de horário se estiver aberta
        if (document.getElementById('gradeHorario')) {
            renderGradeHorario();
        }
        
        alert(`Turma "${turmaRemovida}" removida com sucesso!`);
    }
}

function fecharModalCadastroTurma() {
    const modal = document.getElementById('modalCadastroTurma');
    if (modal) modal.remove();
}

function renderGradeHorario() {
    const container = document.getElementById('gradeHorario');
    if (!container) return;
    
    const dias = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];
    let html = '<div style="overflow-x: auto;">';
    html += '<div style="display: grid; grid-template-columns: 100px repeat(5, 1fr); gap: 2px; min-width: 800px;">';
    
    html += '<div style="background: #0047B6; color: white; padding: 10px; text-align: center; font-weight: bold;">Horário</div>';
    dias.forEach(dia => {
        html += `<div style="background: #2A6ED4; color: white; padding: 10px; text-align: center; font-weight: bold;">${dia}</div>`;
    });
    
    for (let i = 0; i < CONFIG_HORARIO.aulasPorPeriodo; i++) {
        html += `<div style="background: #0047B6; color: white; padding: 10px; text-align: center; font-weight: bold;">${HORARIOS_PESSOAIS[i]}</div>`;
        
        for (let j = 0; j < 5; j++) {
            const dia = dias[j];
            const aulaData = horarioProfessor[dia] && horarioProfessor[dia][i] ? horarioProfessor[dia][i] : { disciplina: '', turma: '' };
            
            html += `
                <div style="padding: 8px; border: 1px solid #ddd; background: white; min-height: 80px;">
                    <select style="width: 100%; margin-bottom: 5px; padding: 5px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;" 
                            onchange="atualizarDisciplinaHorario('${dia}', ${i}, this.value)">
                        <option value="">-- Sem aula --</option>
                        ${DISCIPLINAS_PESSOAIS.map(d => `<option value="${d.id}" ${aulaData.disciplina === d.id ? 'selected' : ''}>${d.icone} ${d.nome}</option>`).join('')}
                    </select>
                    ${aulaData.disciplina ? `
                        <select style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;" 
                                onchange="atualizarTurmaHorario('${dia}', ${i}, this.value)">
                            <option value="">Selecione turma</option>
                            ${TURMAS_PESSOAIS.map(t => `<option value="${t}" ${aulaData.turma === t ? 'selected' : ''}>Turma ${t}</option>`).join('')}
                        </select>
                    ` : ''}
                </div>
            `;
        }
    }
    
    html += '</div></div>';
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
    
    // Verificar se tem disciplinas cadastradas
    if (DISCIPLINAS_PESSOAIS.length === 0) {
        alert('Cadastre pelo menos uma disciplina antes de salvar o horário!');
        return;
    }
    
    // Verificar se tem turmas cadastradas
    if (TURMAS_PESSOAIS.length === 0) {
        alert('Cadastre pelo menos uma turma antes de salvar o horário!');
        return;
    }
    
    localStorage.setItem('horarioProfessor_' + usuarioLogado.usuario, JSON.stringify(horarioProfessor));
    alert('Horário salvo com sucesso!');
    fecharModalHorario();
    atualizarStatusHorario();
    
    if (semanas.length > 0) {
        aplicarHorarioNasSemanas();
        renderSemanas();
    }
}

function fecharModalHorario() {
    const modal = document.getElementById('modalHorario');
    if (modal) modal.remove();
}

function atualizarStatusHorario() {
    const statusElement = document.getElementById('statusHorario');
    if (!statusElement) return;
    
    let totalAulas = 0;
    let aulasConfiguradas = 0;
    
    Object.keys(horarioProfessor).forEach(dia => {
        if (horarioProfessor[dia]) {
            horarioProfessor[dia].forEach(aula => {
                totalAulas++;
                if (aula && aula.disciplina && aula.turma) aulasConfiguradas++;
            });
        }
    });
    
    if (aulasConfiguradas === 0) {
        statusElement.innerHTML = '⚠️ Configure seu horário primeiro';
        statusElement.style.color = '#d32f2f';
    } else {
        const percentual = Math.round((aulasConfiguradas / totalAulas) * 100);
        statusElement.innerHTML = `✅ Horário configurado: ${aulasConfiguradas}/${totalAulas} aulas (${percentual}%)`;
        statusElement.style.color = '#2E7D32';
    }
}

// ========== FUNÇÕES DE FILTRAGEM E EXIBIÇÃO DE SEMANAS ==========
function filtrarSemanas(tipo) {
    const botoes = document.querySelectorAll('.periodo-btn');
    botoes.forEach(btn => btn.classList.remove('active'));
    
    if (tipo === 'todas') {
        botoes[0].classList.add('active');
        renderSemanas();
    } else {
        // Encontrar e ativar o botão correspondente
        for (let btn of botoes) {
            if (btn.textContent.toLowerCase().includes(tipo.toLowerCase())) {
                btn.classList.add('active');
                break;
            }
        }
        renderSemanasFiltradas(tipo);
    }
}

function filtrarSemanasPorBusca() {
    const termo = document.getElementById('filtroSemana').value.toLowerCase();
    renderSemanasFiltradas('busca', termo);
}

function renderSemanasFiltradas(tipo, termo = '') {
    const container = document.getElementById('listaSemanas');
    if (!container || !semanas.length) return;
    
    container.innerHTML = '';
    
    const semanasFiltradas = semanas.filter((semana, index) => {
        if (tipo === 'vazias') {
            return estaSemanaVazia(index);
        } else if (tipo === 'parciais') {
            return estaSemanaParcial(index);
        } else if (tipo === 'completas') {
            return estaSemanaCompleta(index);
        } else if (tipo === 'busca') {
            return `semana ${semana.id}`.includes(termo) || 
                   formatarData(semana.inicio).includes(termo) ||
                   formatarData(semana.fim).includes(termo);
        }
        return true;
    });
    
    semanasFiltradas.forEach((semana, posicao) => {
        const index = semanas.indexOf(semana);
        const div = document.createElement('div');
        div.className = 'semana-card';
        div.onclick = () => abrirSemana(index);
        
        const status = getStatusSemana(index);
        const badgeClass = status === 'vazia' ? 'badge-vazia' : 
                          status === 'parcial' ? 'badge-parcial' : 'badge-completa';
        const badgeText = status === 'vazia' ? 'Vazia' : 
                         status === 'parcial' ? 'Parcial' : 'Completa';
        
        div.innerHTML = `
            <h4>Semana ${semana.id}</h4>
            <p>${formatarData(semana.inicio)} a ${formatarData(semana.fim)}</p>
            <small>${contarAulasComConteudoSemana(index)}/${contarAulasNaSemana(index)} aulas</small>
            <div class="badge-status ${badgeClass}">${badgeText}</div>
        `;
        
        container.appendChild(div);
    });
}

function getStatusSemana(index) {
    const totalAulas = contarAulasNaSemana(index);
    const aulasComConteudo = contarAulasComConteudoSemana(index);
    
    if (aulasComConteudo === 0) return 'vazia';
    if (aulasComConteudo === totalAulas) return 'completa';
    return 'parcial';
}

function estaSemanaVazia(index) {
    return contarAulasComConteudoSemana(index) === 0;
}

function estaSemanaParcial(index) {
    const total = contarAulasNaSemana(index);
    const comConteudo = contarAulasComConteudoSemana(index);
    return comConteudo > 0 && comConteudo < total;
}

function estaSemanaCompleta(index) {
    const total = contarAulasNaSemana(index);
    const comConteudo = contarAulasComConteudoSemana(index);
    return comConteudo === total && total > 0;
}

function contarAulasNaSemana(index) {
    const chave = `semana_${index}`;
    if (!planejamentos[chave]) return 0;
    
    let total = 0;
    const aulas = planejamentos[chave].aulas;
    
    for (let dia = 0; dia < 5; dia++) {
        for (let aula = 0; aula < CONFIG_HORARIO.aulasPorPeriodo; aula++) {
            if (aulas[dia] && aulas[dia][aula] && aulas[dia][aula].disciplina) {
                total++;
            }
        }
    }
    
    return total;
}

function contarAulasComConteudoSemana(index) {
    const chave = `semana_${index}`;
    if (!planejamentos[chave]) return 0;
    
    let total = 0;
    const aulas = planejamentos[chave].aulas;
    
    for (let dia = 0; dia < 5; dia++) {
        for (let aula = 0; aula < CONFIG_HORARIO.aulasPorPeriodo; aula++) {
            if (aulas[dia] && aulas[dia][aula] && aulas[dia][aula].conteudo && 
                aulas[dia][aula].conteudo.trim() !== '') {
                total++;
            }
        }
    }
    
    return total;
}

// ========== FUNÇÕES DE PLANEJAMENTO ==========
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
    const grade = Array(5).fill().map(() => Array(CONFIG_HORARIO.aulasPorPeriodo).fill({ 
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

function formatarData(data) {
    return data.toLocaleDateString('pt-BR');
}

function renderSemanas() {
    const container = document.getElementById('listaSemanas');
    if (!container) return;
    
    container.innerHTML = '';
    
    semanas.forEach((semana, index) => {
        const div = document.createElement('div');
        div.className = 'semana-card';
        div.onclick = () => abrirSemana(index);
        
        const status = getStatusSemana(index);
        const badgeClass = status === 'vazia' ? 'badge-vazia' : 
                          status === 'parcial' ? 'badge-parcial' : 'badge-completa';
        const badgeText = status === 'vazia' ? 'Vazia' : 
                         status === 'parcial' ? 'Parcial' : 'Completa';
        
        div.innerHTML = `
            <h4>Semana ${semana.id}</h4>
            <p>${formatarData(semana.inicio)} a ${formatarData(semana.fim)}</p>
            <small>${contarAulasComConteudoSemana(index)}/${contarAulasNaSemana(index)} aulas</small>
            <div class="badge-status ${badgeClass}">${badgeText}</div>
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
        <div style="overflow-x: auto;">
        <div style="display: grid; grid-template-columns: 100px repeat(5, 1fr); gap: 1px; background: #f0f0f0; border: 1px solid #f0f0f0; min-width: 800px;">
            <div style="background: #0047B6; color: white; padding: 10px; text-align: center; font-weight: bold;">Horário</div>
    `;
    
    dias.forEach((dia, i) => {
        const data = new Date(semana.inicio);
        data.setDate(data.getDate() + i);
        html += `<div style="background: #0047B6; color: white; padding: 10px; text-align: center; font-weight: bold;">
            ${DIAS_SEMANA_COMPLETO[i]}<br><small>${data.toLocaleDateString('pt-BR')}</small>
        </div>`;
    });
    
    for (let aula = 0; aula < CONFIG_HORARIO.aulasPorPeriodo; aula++) {
        html += `<div style="background: white; padding: 10px; text-align: center; font-weight: bold; color: #0047B6;">
            ${HORARIOS_PESSOAIS[aula]}<br><small>${CONFIG_HORARIO.duracaoAula} min</small>
        </div>`;
        
        for (let dia = 0; dia < 5; dia++) {
            const aulaData = planejamentoSemana.aulas[dia][aula] || { disciplina: null, turma: null, conteudo: '' };
            const temAula = aulaData.disciplina && aulaData.turma;
            const disciplina = DISCIPLINAS_PESSOAIS.find(d => d.id === aulaData.disciplina);
            
            html += `
                <div style="background: white; padding: 10px; min-height: 120px; ${!temAula ? 'background: #f9f9f9;' : ''}">
                    ${temAula ? `
                        <div style="margin-bottom: 5px;">
                            <strong style="font-size: 13px;">${disciplina?.icone || ''} ${disciplina?.nome || ''}</strong>
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
    
    html += `</div></div>`;
    
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

function aplicarHorarioNasSemanas() {
    semanas.forEach((semana, index) => {
        const chave = `semana_${index}`;
        if (planejamentos[chave]) {
            const novaGrade = criarGradeBaseadaNoHorario();
            const gradeAntiga = planejamentos[chave].aulas;
            
            for (let dia = 0; dia < 5; dia++) {
                for (let aula = 0; aula < CONFIG_HORARIO.aulasPorPeriodo; aula++) {
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

// ========== FUNÇÕES DE SALVAMENTO E APAGAR ==========
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
                for (let aula = 0; aula < CONFIG_HORARIO.aulasPorPeriodo; aula++) {
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
    
    const disciplina = DISCIPLINAS_PESSOAIS.find(d => d.id === aula.disciplina);
    const texto = `Conteúdo da aula (${disciplina?.nome || ''} - Turma ${aula.turma}):\n\n${aula.conteudo}`;
    
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
                <p><strong>Escola:</strong> ${configuracoesEscola.nome || 'Não informada'}</p>
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
    for (let aula = 0; aula < CONFIG_HORARIO.aulasPorPeriodo; aula++) {
        html += `<tr><td class="coluna-horario">${HORARIOS_PESSOAIS[aula]}<br><small>${CONFIG_HORARIO.duracaoAula} min</small></td>`;
        
        for (let dia = 0; dia < 5; dia++) {
            const aulaData = planejamento.aulas[dia]?.[aula] || { disciplina: null, turma: null, conteudo: '' };
            
            if (aulaData.disciplina && aulaData.turma) {
                const disciplina = DISCIPLINAS_PESSOAIS.find(d => d.id === aulaData.disciplina);
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
            <p>Desenvolvido por Lafaiete Erkmann • Contato: @lafa.bio</p>
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
});

// ========== FUNÇÕES DO ADMIN (manter as existentes) ==========
// As funções do painel de administração permanecem como no código anterior
// (abrirPainelAdmin, carregarDadosAdmin, etc.)
