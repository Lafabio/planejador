// ========== SISTEMA DE AUTENTICAÇÃO ==========
class SistemaAutenticacao {
    constructor() {
        this.usuariosKey = 'sesi_usuarios_v4';
        this.sessaoKey = 'sesi_sessao_v4';
        this.usuarioAtual = null;
        this.usuarios = {};
    }

    inicializar() {
        this.carregarUsuarios();
        return this.verificarSessao();
    }

    carregarUsuarios() {
        const dados = localStorage.getItem(this.usuariosKey);
        if (!dados) {
            this.usuarios = {
                'professor': {
                    id: 'prof_001',
                    usuario: 'professor',
                    senha: 'sesi2024',
                    nome: 'Professor Demo',
                    email: 'professor@sesi.com',
                    unidade: 'EM Tubarão 2026',
                    dataCadastro: new Date().toISOString(),
                    chaveDados: 'professor_data_v4'
                }
            };
            this.salvarUsuarios();
        } else {
            this.usuarios = JSON.parse(dados);
        }
    }

    salvarUsuarios() {
        localStorage.setItem(this.usuariosKey, JSON.stringify(this.usuarios));
    }

    verificarSessao() {
        const sessao = localStorage.getItem(this.sessaoKey);
        if (sessao) {
            try {
                const dados = JSON.parse(sessao);
                if (dados.usuario && this.usuarios[dados.usuario]) {
                    this.usuarioAtual = dados.usuario;
                    return true;
                }
            } catch (e) {
                console.error('Erro na sessão:', e);
                localStorage.removeItem(this.sessaoKey);
            }
        }
        return false;
    }

    login(usuario, senha) {
        usuario = usuario.toLowerCase().trim();
        
        let usuarioEncontrado = null;
        let usuarioKey = null;
        
        for (const [key, user] of Object.entries(this.usuarios)) {
            if (key.toLowerCase() === usuario || user.email.toLowerCase() === usuario) {
                if (user.senha === senha) {
                    usuarioEncontrado = user;
                    usuarioKey = key;
                    break;
                }
            }
        }
        
        if (!usuarioEncontrado) {
            throw new Error('Usuário ou senha incorretos');
        }

        this.usuarioAtual = usuarioKey;
        const sessao = {
            usuario: usuarioKey,
            timestamp: Date.now(),
            data: new Date().toISOString(),
            chaveDados: usuarioEncontrado.chaveDados
        };
        localStorage.setItem(this.sessaoKey, JSON.stringify(sessao));
        
        return usuarioEncontrado;
    }

    cadastrar(dados) {
        const { nome, usuario, email, senha } = dados;
        
        if (!nome || !usuario || !email || !senha) {
            throw new Error('Preencha todos os campos');
        }
        
        if (usuario.length < 3) {
            throw new Error('Usuário muito curto (mínimo 3 caracteres)');
        }
        
        if (senha.length < 4) {
            throw new Error('Senha muito curta (mínimo 4 caracteres)');
        }
        
        if (this.usuarios[usuario]) {
            throw new Error('Usuário já existe');
        }
        
        const emailExistente = Object.values(this.usuarios).some(
            u => u.email.toLowerCase() === email.toLowerCase()
        );
        if (emailExistente) {
            throw new Error('Email já cadastrado');
        }
        
        const chaveDados = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const novoUsuario = {
            id: 'user_' + Date.now(),
            usuario: usuario,
            senha: senha,
            nome: nome,
            email: email.toLowerCase(),
            unidade: 'Não definida',
            dataCadastro: new Date().toISOString(),
            chaveDados: chaveDados
        };
        
        this.usuarios[usuario] = novoUsuario;
        this.salvarUsuarios();
        
        return novoUsuario;
    }

    logout() {
        this.usuarioAtual = null;
        localStorage.removeItem(this.sessaoKey);
    }

    getUsuarioAtual() {
        return this.usuarios[this.usuarioAtual];
    }

    getChaveDadosUsuario() {
        const usuario = this.getUsuarioAtual();
        return usuario ? usuario.chaveDados : null;
    }

    atualizarUsuario(dados) {
        const usuario = this.getUsuarioAtual();
        if (!usuario) return false;
        
        Object.assign(usuario, dados);
        this.salvarUsuarios();
        return true;
    }
}

// ========== SISTEMA DE DADOS DO USUÁRIO ==========
class SistemaDadosUsuario {
    constructor(chaveUsuario) {
        this.chaveUsuario = chaveUsuario;
        this.chavePlanejamentos = `sesi_planejamentos_${chaveUsuario}_v4`;
        this.chaveConfig = `sesi_config_${chaveUsuario}_v4`;
    }

    carregarPlanejamentos() {
        try {
            const dados = localStorage.getItem(this.chavePlanejamentos);
            return dados ? JSON.parse(dados) : {};
        } catch (e) {
            console.error('Erro ao carregar planejamentos:', e);
            return {};
        }
    }

    salvarPlanejamentos(dados) {
        try {
            localStorage.setItem(this.chavePlanejamentos, JSON.stringify(dados));
            return true;
        } catch (e) {
            console.error('Erro ao salvar planejamentos:', e);
            return false;
        }
    }

    carregarConfig() {
        try {
            const dados = localStorage.getItem(this.chaveConfig);
            return dados ? JSON.parse(dados) : { dataInicio: null };
        } catch (e) {
            console.error('Erro ao carregar config:', e);
            return { dataInicio: null };
        }
    }

    salvarConfig(dados) {
        try {
            localStorage.setItem(this.chaveConfig, JSON.stringify(dados));
            return true;
        } catch (e) {
            console.error('Erro ao salvar config:', e);
            return false;
        }
    }

    exportarTodosDados() {
        return {
            planejamentos: this.carregarPlanejamentos(),
            config: this.carregarConfig(),
            chaveUsuario: this.chaveUsuario,
            dataExportacao: new Date().toISOString()
        };
    }

    limparDados() {
        localStorage.removeItem(this.chavePlanejamentos);
        localStorage.removeItem(this.chaveConfig);
    }
}

// ========== VARIÁVEIS GLOBAIS ==========
let authSystem = null;
let dadosSystem = null;
let semanas = [];
let semanaAtual = -1;

// Disciplinas
const DISCIPLINAS = [
    { id: "biologia", nome: "Biologia", icone: "🧬" },
    { id: "biohackeria", nome: "Biohackeria", icone: "🔬" },
    { id: "projetos_livres", nome: "Projetos Livres", icone: "💡" },
    { id: "robotica", nome: "Robótica", icone: "🤖" },
    { id: "apps_games", nome: "Apps e Games", icone: "🎮" },
    { id: "iniciacao_cientifica", nome: "Iniciação Científica", icone: "🔍" },
    { id: "outra", nome: "Outra", icone: "📝" }
];

const HORARIOS = [
    "07:15 - 08:00",
    "08:00 - 08:45", 
    "08:45 - 09:30",
    "09:30 - 10:15",
    "10:30 - 11:15",
    "11:15 - 12:00",
    "12:00 - 12:45"
];

// ========== FUNÇÕES DE AUTENTICAÇÃO ==========
function mostrarLogin() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('cadastroForm').classList.remove('active');
}

function mostrarCadastro() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('cadastroForm').classList.add('active');
}

function fazerLogin() {
    try {
        const usuario = document.getElementById('loginUsuario').value;
        const senha = document.getElementById('loginSenha').value;
        
        if (!usuario || !senha) {
            mostrarMensagem('Preencha usuário e senha', 'error');
            return;
        }
        
        const usuarioObj = authSystem.login(usuario, senha);
        
        if (document.getElementById('lembrarUsuario').checked) {
            localStorage.setItem('sesi_lembrar_usuario', usuario);
        } else {
            localStorage.removeItem('sesi_lembrar_usuario');
        }
        
        const chaveDados = authSystem.getChaveDadosUsuario();
        dadosSystem = new SistemaDadosUsuario(chaveDados);
        
        mostrarMensagem(`Bem-vindo, ${usuarioObj.nome}!`, 'success');
        iniciarAplicacao();
        
    } catch (error) {
        mostrarMensagem(error.message, 'error');
    }
}

function fazerCadastro() {
    try {
        const nome = document.getElementById('cadastroNome').value;
        const usuario = document.getElementById('cadastroUsuario').value;
        const email = document.getElementById('cadastroEmail').value;
        const senha = document.getElementById('cadastroSenha').value;
        const confirmarSenha = document.getElementById('cadastroConfirmarSenha').value;
        const termos = document.getElementById('termosUso').checked;
        
        if (!nome || !usuario || !email || !senha || !confirmarSenha) {
            throw new Error('Preencha todos os campos');
        }
        
        if (senha !== confirmarSenha) {
            throw new Error('As senhas não coincidem');
        }
        
        if (!termos) {
            throw new Error('Aceite os termos de uso');
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Email inválido');
        }
        
        const dados = { nome, usuario, email, senha };
        const novoUsuario = authSystem.cadastrar(dados);
        
        dadosSystem = new SistemaDadosUsuario(novoUsuario.chaveDados);
        authSystem.login(usuario, senha);
        
        mostrarMensagem(`Conta criada com sucesso, ${nome}!`, 'success');
        setTimeout(() => iniciarAplicacao(), 1000);
        
    } catch (error) {
        mostrarMensagem(error.message, 'error');
    }
}

function fazerLogout() {
    if (confirm('Deseja realmente sair?')) {
        authSystem.logout();
        window.location.reload();
    }
}

// ========== INICIALIZAÇÃO ==========
function iniciarAplicacao() {
    document.getElementById('telaLogin').classList.add('hidden');
    document.getElementById('appPrincipal').classList.remove('hidden');
    
    const usuario = authSystem.getUsuarioAtual();
    if (usuario) {
        document.getElementById('userNome').textContent = usuario.nome;
        document.getElementById('userEmail').textContent = usuario.email;
        document.getElementById('userCumprimento').textContent = usuario.nome.split(' ')[0];
        document.getElementById('professorNome').textContent = usuario.nome;
        document.getElementById('professorUnidade').textContent = usuario.unidade;
        document.getElementById('footerUsuario').textContent = usuario.usuario;
    }
    
    configurarEventos();
    carregarDadosUsuario();
}

function carregarDadosUsuario() {
    if (!dadosSystem) return;
    
    const config = dadosSystem.carregarConfig();
    const inicioLetivo = document.getElementById('inicioLetivo');
    
    if (config.dataInicio) {
        inicioLetivo.value = config.dataInicio;
        gerarSemanas(config.dataInicio);
    } else {
        const hoje = new Date();
        const dataPadrao = hoje.toISOString().split('T')[0];
        inicioLetivo.value = dataPadrao;
        gerarSemanas(dataPadrao);
    }
}

function configurarEventos() {
    document.getElementById('inicioLetivo').addEventListener('change', function() {
        gerarSemanas(this.value);
    });
    
    document.getElementById('btnHoje').addEventListener('click', function() {
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('inicioLetivo').value = hoje;
        gerarSemanas(hoje);
    });
    
    document.getElementById('voltar').addEventListener('click', function() {
        document.getElementById('paginaAulas').classList.add('hidden');
        document.getElementById('paginaSemanas').classList.remove('hidden');
    });
    
    document.getElementById('btnExportar').addEventListener('click', exportarPlanejamentos);
    
    document.getElementById('buscarSemana').addEventListener('input', function() {
        filtrarSemanas(this.value);
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fecharConfiguracoes();
        }
    });
}

// ========== FUNÇÕES DE PLANEJAMENTO ==========
function gerarSemanas(dataISO) {
    if (!dataISO || !dadosSystem) return;
    
    semanas = [];
    
    let data = new Date(dataISO);
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
    
    const config = dadosSystem.carregarConfig();
    config.dataInicio = dataISO;
    dadosSystem.salvarConfig(config);
    
    renderSemanas();
    
    const primeira = semanas[0];
    const ultima = semanas[semanas.length - 1];
    const periodoTotal = document.getElementById('periodoTotal');
    if (periodoTotal) {
        periodoTotal.textContent = `${formatarData(primeira.inicio)} - ${formatarData(ultima.fim)}`;
    }
}

function formatarData(data) {
    return data.toLocaleDateString('pt-BR');
}

function renderSemanas() {
    const container = document.getElementById('listaSemanas');
    if (!container) return;
    
    const planejamentos = dadosSystem.carregarPlanejamentos();
    container.innerHTML = '';
    
    semanas.forEach((semana, index) => {
        const chaveSemana = `semana_${index}`;
        const temPlanejamento = planejamentos[chaveSemana] && 
            (planejamentos[chaveSemana].aulas?.some(dia => 
                dia.some(aula => aula?.disciplina || aula?.conteudo)
            ) || planejamentos[chaveSemana].anotacoes);
        
        const div = document.createElement('div');
        div.className = 'semana-card';
        div.style.borderLeftColor = temPlanejamento ? '#2E7D32' : '#0047B6';
        
        if (temPlanejamento) {
            div.innerHTML = `<span style="position: absolute; top: 10px; right: 10px; background: #2E7D32; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px;">💾 Salvo</span>`;
        }
        
        div.innerHTML += `
            <h3>Semana ${semana.id}</h3>
            <p>${formatarData(semana.inicio)} a ${formatarData(semana.fim)}</p>
        `;
        
        div.onclick = () => abrirSemana(index);
        container.appendChild(div);
    });
    
    document.getElementById('contadorSemanas').textContent = `${semanas.length} semanas geradas`;
}

function filtrarSemanas(termo) {
    const semanasCards = document.querySelectorAll('.semana-card');
    if (!termo) {
        semanasCards.forEach(card => card.style.display = 'block');
        return;
    }
    
    const termoLower = termo.toLowerCase();
    semanasCards.forEach((card, index) => {
        const texto = `semana ${semanas[index].id} ${formatarData(semanas[index].inicio)} ${formatarData(semanas[index].fim)}`.toLowerCase();
        card.style.display = texto.includes(termoLower) ? 'block' : 'none';
    });
}

function abrirSemana(index) {
    if (!dadosSystem) return;
    
    semanaAtual = index;
    const semana = semanas[index];
    
    document.getElementById('paginaSemanas').classList.add('hidden');
    document.getElementById('paginaAulas').classList.remove('hidden');
    
    document.getElementById('tituloSemana').textContent = 
        `Semana ${semana.id} - ${formatarData(semana.inicio)} a ${formatarData(semana.fim)}`;
    
    renderGradeSemana(index);
}

function renderGradeSemana(index) {
    const container = document.getElementById('gradeSemana');
    if (!container) return;
    
    const semana = semanas[index];
    const dias = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];
    
    const planejamentos = dadosSystem.carregarPlanejamentos();
    const chaveSemana = `semana_${index}`;
    const planejamentoSemana = planejamentos[chaveSemana] || {
        aulas: Array(5).fill().map(() => Array(7).fill({ disciplina: null, conteudo: '' })),
        anotacoes: ''
    };
    
    let html = `
        <div class="grade-header">
            <div class="horario-header">Horário</div>
    `;
    
    dias.forEach((dia, i) => {
        const data = new Date(semana.inicio);
        data.setDate(data.getDate() + i);
        html += `
            <div class="dia-header">
                ${dia}<br>
                <small>${formatarData(data)}</small>
            </div>
        `;
    });
    
    html += `</div>`;
    
    for (let aula = 0; aula < 7; aula++) {
        html += `<div class="grade-row">`;
        html += `<div class="horario-cell">${HORARIOS[aula]}<br><small>45 min</small></div>`;
        
        for (let dia = 0; dia < 5; dia++) {
            const aulaData = planejamentoSemana.aulas[dia]?.[aula] || { disciplina: null, conteudo: '' };
            const disciplinaSelecionada = DISCIPLINAS.find(d => d.id === aulaData.disciplina);
            
            html += `
                <div class="aula-cell">
                    <select class="disciplina-select" 
                            onchange="salvarDisciplina(${index}, ${dia}, ${aula}, this.value)">
                        <option value="">Selecione...</option>
                        ${DISCIPLINAS.map(d => `
                            <option value="${d.id}" ${aulaData.disciplina === d.id ? 'selected' : ''}>
                                ${d.icone} ${d.nome}
                            </option>
                        `).join('')}
                    </select>
                    <textarea 
                        class="aula-textarea"
                        placeholder="Conteúdo da aula..."
                        oninput="salvarConteudo(${index}, ${dia}, ${aula}, this.value)"
                    >${aulaData.conteudo || ''}</textarea>
                    <div class="aula-actions">
                        <button class="btn-copy" onclick="copiarConteudo(${index}, ${dia}, ${aula})">
                            📋 Copiar
                        </button>
                        <button class="btn-apagar" onclick="apagarAula(${index}, ${dia}, ${aula})">
                            🗑️ Apagar
                        </button>
                    </div>
                </div>
            `;
        }
        
        html += `</div>`;
    }
    
    html += `
        <div class="anotacoes-container" style="margin-top: 30px;">
            <h3>📝 Anotações da Semana</h3>
            <textarea id="anotacoesSemana" 
                      class="anotacoes-textarea"
                      placeholder="Anotações gerais para esta semana..."
                      oninput="salvarAnotacoes(${index}, this.value)">${planejamentoSemana.anotacoes || ''}</textarea>
            <div style="margin-top: 10px;">
                <button class="btn-copy" onclick="copiarAnotacoes(${index})">📋 Copiar Anotações</button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ========== FUNÇÕES DE PERSISTÊNCIA ==========
function salvarDisciplina(semanaIndex, diaIndex, aulaIndex, disciplina) {
    if (!dadosSystem) return;
    
    const planejamentos = dadosSystem.carregarPlanejamentos();
    const chave = `semana_${semanaIndex}`;
    
    if (!planejamentos[chave]) {
        planejamentos[chave] = {
            aulas: Array(5).fill().map(() => Array(7).fill({ disciplina: null, conteudo: '' })),
            anotacoes: ''
        };
    }
    
    planejamentos[chave].aulas[diaIndex][aulaIndex].disciplina = disciplina || null;
    dadosSystem.salvarPlanejamentos(planejamentos);
    
    mostrarMensagem('Disciplina salva!', 'success');
}

function salvarConteudo(semanaIndex, diaIndex, aulaIndex, conteudo) {
    if (!dadosSystem) return;
    
    const planejamentos = dadosSystem.carregarPlanejamentos();
    const chave = `semana_${semanaIndex}`;
    
    if (!planejamentos[chave]) {
        planejamentos[chave] = {
            aulas: Array(5).fill().map(() => Array(7).fill({ disciplina: null, conteudo: '' })),
            anotacoes: ''
        };
    }
    
    const aulaAtual = planejamentos[chave].aulas[diaIndex][aulaIndex] || { disciplina: null, conteudo: '' };
    planejamentos[chave].aulas[diaIndex][aulaIndex] = {
        disciplina: aulaAtual.disciplina,
        conteudo: conteudo
    };
    
    dadosSystem.salvarPlanejamentos(planejamentos);
}

function salvarAnotacoes(semanaIndex, anotacoes) {
    if (!dadosSystem) return;
    
    const planejamentos = dadosSystem.carregarPlanejamentos();
    const chave = `semana_${semanaIndex}`;
    
    if (!planejamentos[chave]) {
        planejamentos[chave] = {
            aulas: Array(5).fill().map(() => Array(7).fill({ disciplina: null, conteudo: '' })),
            anotacoes: ''
        };
    }
    
    planejamentos[chave].anotacoes = anotacoes;
    dadosSystem.salvarPlanejamentos(planejamentos);
}

// ========== FUNÇÕES UTILITÁRIAS ==========
async function copiarConteudo(semanaIndex, diaIndex, aulaIndex) {
    if (!dadosSystem) return;
    
    const planejamentos = dadosSystem.carregarPlanejamentos();
    const chave = `semana_${semanaIndex}`;
    const aula = planejamentos[chave]?.aulas[diaIndex]?.[aulaIndex];
    
    if (!aula || (!aula.disciplina && !aula.conteudo)) {
        mostrarMensagem('Nada para copiar!', 'error');
        return;
    }
    
    let texto = '';
    if (aula.disciplina) {
        const disciplina = DISCIPLINAS.find(d => d.id === aula.disciplina);
        texto += `Disciplina: ${disciplina?.nome || aula.disciplina}\n`;
    }
    if (aula.conteudo) {
        texto += aula.conteudo;
    }
    
    try {
        await navigator.clipboard.writeText(texto);
        mostrarMensagem('Conteúdo copiado!', 'success');
    } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        mostrarMensagem('Conteúdo copiado!', 'success');
    }
}

async function copiarAnotacoes(semanaIndex) {
    if (!dadosSystem) return;
    
    const planejamentos = dadosSystem.carregarPlanejamentos();
    const chave = `semana_${semanaIndex}`;
    const anotacoes = planejamentos[chave]?.anotacoes || '';
    
    if (!anotacoes.trim()) {
        mostrarMensagem('Nenhuma anotação para copiar!', 'error');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(anotacoes);
        mostrarMensagem('Anotações copiadas!', 'success');
    } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = anotacoes;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        mostrarMensagem('Anotações copiadas!', 'success');
    }
}

async function copiarTodaSemana() {
    if (!dadosSystem || semanaAtual === -1) return;
    
    const planejamentos = dadosSystem.carregarPlanejamentos();
    const chave = `semana_${semanaAtual}`;
    const semanaPlanejamento = planejamentos[chave];
    const semana = semanas[semanaAtual];
    
    if (!semanaPlanejamento) {
        mostrarMensagem('Nada para copiar nesta semana!', 'error');
        return;
    }
    
    let texto = `PLANEJAMENTO DA SEMANA ${semana.id}\n`;
    texto += `Período: ${formatarData(semana.inicio)} a ${formatarData(semana.fim)}\n\n`;
    
    const dias = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];
    
    dias.forEach((diaNome, diaIndex) => {
        texto += `\n=== ${diaNome} ===\n`;
        for (let aulaIndex = 0; aulaIndex < 7; aulaIndex++) {
            const aula = semanaPlanejamento.aulas[diaIndex]?.[aulaIndex] || { disciplina: null, conteudo: '' };
            if (aula.disciplina || aula.conteudo) {
                texto += `\n${HORARIOS[aulaIndex]}:\n`;
                if (aula.disciplina) {
                    const disciplina = DISCIPLINAS.find(d => d.id === aula.disciplina);
                    texto += `Disciplina: ${disciplina?.nome || aula.disciplina}\n`;
                }
                if (aula.conteudo) {
                    texto += `Conteúdo: ${aula.conteudo}\n`;
                }
            }
        }
    });
    
    if (semanaPlanejamento.anotacoes) {
        texto += `\n=== ANOTAÇÕES ===\n${semanaPlanejamento.anotacoes}`;
    }
    
    try {
        await navigator.clipboard.writeText(texto);
        mostrarMensagem('Semana inteira copiada!', 'success');
    } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        mostrarMensagem('Semana inteira copiada!', 'success');
    }
}

function apagarAula(semanaIndex, diaIndex, aulaIndex) {
    if (!confirm('Apagar esta aula?')) return;
    
    if (dadosSystem) {
        const planejamentos = dadosSystem.carregarPlanejamentos();
        const chave = `semana_${semanaIndex}`;
        
        if (planejamentos[chave]) {
            planejamentos[chave].aulas[diaIndex][aulaIndex] = { disciplina: null, conteudo: '' };
            dadosSystem.salvarPlanejamentos(planejamentos);
            renderGradeSemana(semanaIndex);
            mostrarMensagem('Aula apagada!', 'success');
        }
    }
}

// ========== CONFIGURAÇÕES DO USUÁRIO ==========
function mostrarConfiguracoes() {
    const usuario = authSystem.getUsuarioAtual();
    if (!usuario) return;
    
    const modal = document.getElementById('modalConfig');
    if (!modal) {
        console.error('Modal de configurações não encontrado');
        return;
    }
    
    document.getElementById('configNome').value = usuario.nome || '';
    document.getElementById('configEmail').value = usuario.email || '';
    document.getElementById('configUnidade').value = usuario.unidade || '';
    
    const espacoUsado = calcularEspacoUsado();
    document.getElementById('espacoUsado').textContent = espacoUsado;
    
    modal.classList.add('active');
}

function fecharConfiguracoes() {
    const modal = document.getElementById('modalConfig');
    if (modal) {
        modal.classList.remove('active');
    }
}

function salvarConfiguracoes() {
    try {
        const usuario = authSystem.getUsuarioAtual();
        if (!usuario) throw new Error('Usuário não encontrado');
        
        const nome = document.getElementById('configNome').value.trim();
        const email = document.getElementById('configEmail').value.trim();
        const unidade = document.getElementById('configUnidade').value.trim();
        
        if (!nome) throw new Error('Nome é obrigatório');
        if (!email) throw new Error('Email é obrigatório');
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) throw new Error('Email inválido');
        
        const dadosAtualizados = {
            nome: nome,
            email: email.toLowerCase(),
            unidade: unidade
        };
        
        if (authSystem.atualizarUsuario(dadosAtualizados)) {
            document.getElementById('userNome').textContent = nome;
            document.getElementById('userEmail').textContent = email;
            document.getElementById('userCumprimento').textContent = nome.split(' ')[0];
            document.getElementById('professorNome').textContent = nome;
            document.getElementById('professorUnidade').textContent = unidade;
            
            mostrarMensagem('Configurações salvas com sucesso!', 'success');
            fecharConfiguracoes();
        } else {
            throw new Error('Erro ao salvar configurações');
        }
        
    } catch (error) {
        mostrarMensagem(error.message, 'error');
    }
}

function calcularEspacoUsado() {
    if (!dadosSystem) return '0 KB';
    
    let totalBytes = 0;
    
    const planejamentos = localStorage.getItem(dadosSystem.chavePlanejamentos);
    if (planejamentos) totalBytes += new Blob([planejamentos]).size;
    
    const config = localStorage.getItem(dadosSystem.chaveConfig);
    if (config) totalBytes += new Blob([config]).size;
    
    if (totalBytes < 1024) return totalBytes + ' bytes';
    if (totalBytes < 1048576) return (totalBytes / 1024).toFixed(2) + ' KB';
    return (totalBytes / 1048576).toFixed(2) + ' MB';
}

function exportarPlanejamentos() {
    if (!dadosSystem) return;
    
    const usuario = authSystem.getUsuarioAtual();
    const dadosExport = dadosSystem.exportarTodosDados();
    
    const dadosCompletos = {
        ...dadosExport,
        usuario: {
            nome: usuario.nome,
            email: usuario.email,
            unidade: usuario.unidade,
            usuario: usuario.usuario
        },
        sistema: 'Planejador SESI v4.0',
        dataExportacao: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dadosCompletos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planejamento-sesi-${usuario.usuario}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    mostrarMensagem('Planejamentos exportados com sucesso!', 'success');
}

function limparDadosUsuario() {
    if (!confirm('⚠️ ATENÇÃO: Isso apagará TODOS os seus planejamentos e configurações. Esta ação não pode ser desfeita. Continuar?')) {
        return;
    }
    
    if (dadosSystem) {
        dadosSystem.limparDados();
        semanas = [];
        semanaAtual = -1;
        
        document.getElementById('listaSemanas').innerHTML = '';
        document.getElementById('contadorSemanas').textContent = '0 semanas geradas';
        document.getElementById('periodoTotal').textContent = '';
        
        mostrarMensagem('Todos os seus dados foram apagados!', 'success');
        fecharConfiguracoes();
    }
}

// ========== SISTEMA DE MENSAGENS ==========
function mostrarMensagem(texto, tipo = 'info') {
    const cores = {
        success: '#2E7D32',
        error: '#D32F2F',
        warning: '#F57C00',
        info: '#1976D2'
    };
    
    const icones = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    let container = document.getElementById('mensagensContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'mensagensContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
    
    const mensagem = document.createElement('div');
    mensagem.style.cssText = `
        background: ${cores[tipo] || '#1976D2'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
    `;
    
    mensagem.innerHTML = `${icones[tipo] || 'ℹ️'} ${texto}`;
    container.appendChild(mensagem);
    
    setTimeout(() => {
        mensagem.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (mensagem.parentNode) {
                mensagem.parentNode.removeChild(mensagem);
            }
        }, 300);
    }, 3000);
}

// ========== INICIALIZAR APLICAÇÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema iniciando...');
    
    authSystem = new SistemaAutenticacao();
    
    const estilos = document.createElement('style');
    estilos.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100px); opacity: 0; }
        }
        .btn-apagar {
            background: #dc3545;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        .anotacoes-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-top: 20px;
        }
        .anotacoes-textarea {
            width: 100%;
            height: 100px;
            padding: 15px;
            border: 2px solid #eee;
            border-radius: 8px;
            resize: vertical;
            font-family: inherit;
        }
    `;
    document.head.appendChild(estilos);
    
    if (authSystem.inicializar()) {
        console.log('Usuário já logado:', authSystem.usuarioAtual);
        const chaveDados = authSystem.getChaveDadosUsuario();
        dadosSystem = new SistemaDadosUsuario(chaveDados);
        iniciarAplicacao();
    } else {
        console.log('Mostrando tela de login');
        const usuarioLembrado = localStorage.getItem('sesi_lembrar_usuario');
        if (usuarioLembrado) {
            document.getElementById('loginUsuario').value = usuarioLembrado;
            document.getElementById('lembrarUsuario').checked = true;
        }
    }
    
    if (typeof localStorage === 'undefined') {
        alert('Seu navegador não suporta localStorage. O sistema não funcionará corretamente.');
    }
});
