// ========== SISTEMA DE AUTENTICAÇÃO SIMPLES ==========
class SistemaAutenticacao {
    constructor() {
        this.usuariosKey = 'sesi_usuarios_v2';
        this.sessaoKey = 'sesi_sessao_v2';
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
            // Criar usuário demo
            this.usuarios = {
                'professor': {
                    id: 'prof_001',
                    usuario: 'professor',
                    senha: 'sesi2024', // Senha em texto simples para facilidade
                    nome: 'Professor Demo',
                    email: 'professor@sesi.com',
                    unidade: 'EM Tubarão 2026',
                    dataCadastro: new Date().toISOString()
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
            }
        }
        return false;
    }

    login(usuario, senha) {
        usuario = usuario.toLowerCase().trim();
        
        // Procurar usuário
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

        // Criar sessão
        this.usuarioAtual = usuarioKey;
        const sessao = {
            usuario: usuarioKey,
            timestamp: Date.now(),
            data: new Date().toISOString()
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
        
        // Criar novo usuário
        const novoUsuario = {
            id: 'user_' + Date.now(),
            usuario: usuario,
            senha: senha, // Texto simples para facilitar
            nome: nome,
            email: email.toLowerCase(),
            unidade: 'Não definida',
            dataCadastro: new Date().toISOString()
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
}

// ========== SISTEMA PRINCIPAL ==========
let authSystem = new SistemaAutenticacao();
let semanas = [];
let semanaAtual = -1;
let planejamentos = JSON.parse(localStorage.getItem('sesi_planejamentos')) || {};

// Elementos DOM
const telaLogin = document.getElementById('telaLogin');
const appPrincipal = document.getElementById('appPrincipal');
const loginForm = document.getElementById('loginForm');
const cadastroForm = document.getElementById('cadastroForm');

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
    loginForm.classList.remove('hidden');
    cadastroForm.classList.add('hidden');
}

function mostrarCadastro() {
    loginForm.classList.add('hidden');
    cadastroForm.classList.remove('hidden');
}

function fazerLogin() {
    try {
        const usuario = document.getElementById('loginUsuario').value;
        const senha = document.getElementById('loginSenha').value;
        
        if (!usuario || !senha) {
            alert('Preencha usuário e senha');
            return;
        }
        
        const usuarioObj = authSystem.login(usuario, senha);
        
        // Lembrar usuário
        if (document.getElementById('lembrarUsuario').checked) {
            localStorage.setItem('sesi_lembrar_usuario', usuario);
        }
        
        iniciarAplicacao();
        mostrarMensagem('Login realizado com sucesso!');
        
    } catch (error) {
        alert('Erro: ' + error.message);
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
        
        // Validações
        if (!nome || !usuario || !email || !senha || !confirmarSenha) {
            throw new Error('Preencha todos os campos');
        }
        
        if (senha !== confirmarSenha) {
            throw new Error('As senhas não coincidem');
        }
        
        if (!termos) {
            throw new Error('Aceite os termos de uso');
        }
        
        const dados = { nome, usuario, email, senha };
        const novoUsuario = authSystem.cadastrar(dados);
        
        // Login automático
        authSystem.login(usuario, senha);
        iniciarAplicacao();
        mostrarMensagem('Conta criada com sucesso!');
        
    } catch (error) {
        alert('Erro no cadastro: ' + error.message);
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
    telaLogin.classList.add('hidden');
    appPrincipal.classList.remove('hidden');
    
    const usuario = authSystem.getUsuarioAtual();
    if (usuario) {
        document.getElementById('userCumprimento').textContent = usuario.nome.split(' ')[0];
    }
    
    // Configurar eventos
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
    
    // Configurar data inicial
    const dataSalva = localStorage.getItem('sesi_data_inicio');
    if (dataSalva) {
        document.getElementById('inicioLetivo').value = dataSalva;
        gerarSemanas(dataSalva);
    } else {
        const hoje = new Date();
        const dataPadrao = hoje.toISOString().split('T')[0];
        document.getElementById('inicioLetivo').value = dataPadrao;
        gerarSemanas(dataPadrao);
    }
}

// ========== FUNÇÕES DE PLANEJAMENTO ==========
function gerarSemanas(dataISO) {
    if (!dataISO) return;
    
    semanas = [];
    planejamentos = JSON.parse(localStorage.getItem('sesi_planejamentos')) || {};
    
    let data = new Date(dataISO);
    
    // Ajustar para segunda-feira
    const diaSemana = data.getDay();
    if (diaSemana !== 1) { // 1 = segunda-feira
        const ajuste = diaSemana === 0 ? 1 : 1 - diaSemana;
        data.setDate(data.getDate() + ajuste);
    }
    
    // Gerar 43 semanas
    for (let i = 0; i < 43; i++) {
        const inicio = new Date(data);
        const fim = new Date(data);
        fim.setDate(fim.getDate() + 4); // Segunda a sexta
        
        semanas.push({
            id: i + 1,
            inicio: new Date(inicio),
            fim: new Date(fim)
        });
        
        // Próxima segunda
        data.setDate(data.getDate() + 7);
    }
    
    // Salvar data
    localStorage.setItem('sesi_data_inicio', dataISO);
    
    renderSemanas();
}

function renderSemanas() {
    const container = document.getElementById('listaSemanas');
    container.innerHTML = '';
    
    semanas.forEach((semana, index) => {
        const div = document.createElement('div');
        div.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 10px;
            border-left: 6px solid #0047B6;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.3s;
        `;
        
        div.onmouseover = () => {
            div.style.transform = 'translateY(-3px)';
            div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        };
        
        div.onmouseout = () => {
            div.style.transform = 'translateY(0)';
            div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        };
        
        div.onclick = () => abrirSemana(index);
        
        const dataFormatada = (data) => {
            return data.toLocaleDateString('pt-BR');
        };
        
        div.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #0047B6;">Semana ${semana.id}</h3>
            <p style="margin: 0; color: #666;">${dataFormatada(semana.inicio)} a ${dataFormatada(semana.fim)}</p>
        `;
        
        container.appendChild(div);
    });
    
    document.getElementById('contadorSemanas').textContent = `${semanas.length} semanas geradas`;
}

function abrirSemana(index) {
    semanaAtual = index;
    const semana = semanas[index];
    
    // Mostrar página de aulas
    document.getElementById('paginaSemanas').classList.add('hidden');
    document.getElementById('paginaAulas').classList.remove('hidden');
    
    // Atualizar título
    const formatarData = (data) => data.toLocaleDateString('pt-BR');
    document.getElementById('tituloSemana').textContent = 
        `Semana ${semana.id} - ${formatarData(semana.inicio)} a ${formatarData(semana.fim)}`;
    
    // Renderizar grade
    renderGradeSemana(index);
}

function renderGradeSemana(index) {
    const container = document.getElementById('gradeSemana');
    container.innerHTML = '';
    
    const semana = semanas[index];
    const dias = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];
    
    // Carregar planejamentos existentes
    const chave = `semana_${index}`;
    const planejamentoSemana = planejamentos[chave] || {
        aulas: Array(5).fill().map(() => Array(7).fill({ disciplina: null, conteudo: '' })),
        anotacoes: ''
    };
    
    // Criar grade
    let html = `
        <div style="
            display: grid;
            grid-template-columns: 100px repeat(5, 1fr);
            gap: 1px;
            background: #f0f0f0;
            border: 1px solid #f0f0f0;
        ">
    `;
    
    // Cabeçalho
    html += `<div style="background: #0047B6; color: white; padding: 15px; text-align: center; font-weight: bold;">Horário</div>`;
    dias.forEach((dia, i) => {
        const data = new Date(semana.inicio);
        data.setDate(data.getDate() + i);
        html += `<div style="background: #0047B6; color: white; padding: 15px; text-align: center; font-weight: bold;">
            ${dia}<br><small>${data.toLocaleDateString('pt-BR')}</small>
        </div>`;
    });
    
    // Linhas (aulas)
    for (let aula = 0; aula < 7; aula++) {
        html += `<div style="background: white; padding: 10px; text-align: center; font-weight: bold; color: #0047B6;">
            ${HORARIOS[aula]}<br><small>45 min</small>
        </div>`;
        
        for (let dia = 0; dia < 5; dia++) {
            const aulaData = planejamentoSemana.aulas[dia][aula];
            html += `
                <div style="background: white; padding: 10px; min-height: 150px;">
                    <div style="margin-bottom: 10px;">
                        <select style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                                onchange="salvarDisciplina(${index}, ${dia}, ${aula}, this.value)">
                            <option value="">Selecione a disciplina</option>
                            ${DISCIPLINAS.map(d => `
                                <option value="${d.id}" ${aulaData.disciplina === d.id ? 'selected' : ''}>
                                    ${d.icone} ${d.nome}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <textarea 
                        style="width: 100%; height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                        placeholder="Conteúdo da aula..."
                        oninput="salvarConteudo(${index}, ${dia}, ${aula}, this.value)"
                    >${aulaData.conteudo || ''}</textarea>
                    <div style="margin-top: 10px;">
                        <button style="background: #F2B817; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;"
                                onclick="copiarConteudo(${index}, ${dia}, ${aula})">
                            📋 Copiar
                        </button>
                        <button style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-left: 5px;"
                                onclick="apagarAula(${index}, ${dia}, ${aula})">
                            🗑️ Apagar
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    html += `</div>`;
    
    // Anotações
    html += `
        <div style="margin-top: 30px;">
            <h3>📝 Anotações da Semana</h3>
            <textarea id="anotacoesSemana" 
                      style="width: 100%; height: 100px; padding: 15px; border: 2px solid #eee; border-radius: 8px;"
                      placeholder="Anotações gerais para esta semana..."
                      oninput="salvarAnotacoes(${index}, this.value)">${planejamentoSemana.anotacoes || ''}</textarea>
        </div>
    `;
    
    container.innerHTML = html;
}

// ========== FUNÇÕES DE PERSISTÊNCIA ==========
function salvarDisciplina(semanaIndex, diaIndex, aulaIndex, disciplina) {
    const chave = `semana_${semanaIndex}`;
    if (!planejamentos[chave]) {
        planejamentos[chave] = {
            aulas: Array(5).fill().map(() => Array(7).fill({ disciplina: null, conteudo: '' })),
            anotacoes: ''
        };
    }
    
    planejamentos[chave].aulas[diaIndex][aulaIndex].disciplina = disciplina || null;
    localStorage.setItem('sesi_planejamentos', JSON.stringify(planejamentos));
    mostrarMensagem('Disciplina salva!');
}

function salvarConteudo(semanaIndex, diaIndex, aulaIndex, conteudo) {
    const chave = `semana_${semanaIndex}`;
    if (!planejamentos[chave]) {
        planejamentos[chave] = {
            aulas: Array(5).fill().map(() => Array(7).fill({ disciplina: null, conteudo: '' })),
            anotacoes: ''
        };
    }
    
    planejamentos[chave].aulas[diaIndex][aulaIndex].conteudo = conteudo;
    localStorage.setItem('sesi_planejamentos', JSON.stringify(planejamentos));
}

function salvarAnotacoes(semanaIndex, anotacoes) {
    const chave = `semana_${semanaIndex}`;
    if (!planejamentos[chave]) {
        planejamentos[chave] = {
            aulas: Array(5).fill().map(() => Array(7).fill({ disciplina: null, conteudo: '' })),
            anotacoes: ''
        };
    }
    
    planejamentos[chave].anotacoes = anotacoes;
    localStorage.setItem('sesi_planejamentos', JSON.stringify(planejamentos));
}

// ========== FUNÇÕES UTILITÁRIAS ==========
function copiarConteudo(semanaIndex, diaIndex, aulaIndex) {
    const chave = `semana_${semanaIndex}`;
    const aula = planejamentos[chave]?.aulas[diaIndex]?.[aulaIndex];
    
    if (!aula || (!aula.disciplina && !aula.conteudo)) {
        alert('Nada para copiar!');
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
    
    navigator.clipboard.writeText(texto).then(() => {
        mostrarMensagem('Conteúdo copiado para a área de transferência!');
    });
}

function apagarAula(semanaIndex, diaIndex, aulaIndex) {
    if (confirm('Apagar esta aula?')) {
        const chave = `semana_${semanaIndex}`;
        if (planejamentos[chave]) {
            planejamentos[chave].aulas[diaIndex][aulaIndex] = { disciplina: null, conteudo: '' };
            localStorage.setItem('sesi_planejamentos', JSON.stringify(planejamentos));
            
            // Atualizar interface
            renderGradeSemana(semanaIndex);
            mostrarMensagem('Aula apagada!');
        }
    }
}

function exportarPlanejamentos() {
    const dados = {
        dataExportacao: new Date().toISOString(),
        semanas: semanas,
        planejamentos: planejamentos,
        usuario: authSystem.getUsuarioAtual()
    };
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planejamento-sesi-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    mostrarMensagem('Planejamentos exportados!');
}

function mostrarMensagem(texto) {
    // Criar mensagem flutuante
    const mensagem = document.createElement('div');
    mensagem.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2E7D32;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    mensagem.textContent = texto;
    document.body.appendChild(mensagem);
    
    setTimeout(() => {
        mensagem.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(mensagem);
        }, 300);
    }, 3000);
    
    // Adicionar animações CSS
    if (!document.getElementById('animacoes-css')) {
        const style = document.createElement('style');
        style.id = 'animacoes-css';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ========== INICIALIZAR APLICAÇÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema iniciando...');
    
    // Verificar se há usuário logado
    if (authSystem.inicializar()) {
        console.log('Usuário já logado:', authSystem.usuarioAtual);
        iniciarAplicacao();
    } else {
        console.log('Mostrando tela de login');
        // Preencher com usuário lembrado
        const usuarioLembrado = localStorage.getItem('sesi_lembrar_usuario');
        if (usuarioLembrado) {
            document.getElementById('loginUsuario').value = usuarioLembrado;
            document.getElementById('lembrarUsuario').checked = true;
        }
    }
    
    // Testar localStorage
    if (typeof localStorage === 'undefined') {
        alert('Seu navegador não suporta localStorage. O sistema não funcionará corretamente.');
    }
});
