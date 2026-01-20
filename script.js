// Elementos DOM
const inicioInput = document.getElementById("inicioLetivo");
const listaSemanas = document.getElementById("listaSemanas");
const paginaSemanas = document.getElementById("paginaSemanas");
const paginaAulas = document.getElementById("paginaAulas");
const tituloSemana = document.getElementById("tituloSemana");
const gradeSemana = document.getElementById("gradeSemana");
const voltarBtn = document.getElementById("voltar");
const btnHoje = document.getElementById("btnHoje");
const buscarSemana = document.getElementById("buscarSemana");
const btnExportar = document.getElementById("btnExportar");
const btnSalvarSemana = document.getElementById("btnSalvarSemana");
const btnLimparSemana = document.getElementById("btnLimparSemana");
const anotacoesSemana = document.getElementById("anotacoesSemana");
const contadorSemanas = document.getElementById("contadorSemanas");
const periodoTotal = document.getElementById("periodoTotal");
const statusSalvo = document.getElementById("statusSalvo");

// Dropdown
const disciplinaDropdown = document.getElementById("disciplinaDropdown");

// Modal
const modal = document.getElementById("modal");
const modalTitulo = document.getElementById("modalTitulo");
const modalMensagem = document.getElementById("modalMensagem");
const modalConfirmar = document.getElementById("modalConfirmar");
const modalCancelar = document.getElementById("modalCancelar");

// Estado da aplicação
let semanas = [];
let semanaAtual = -1;
const planejamentos = JSON.parse(localStorage.getItem('sesi_planejamentos')) || {};

// Variáveis para controle do dropdown
let dropdownAulaAtual = null;
let dropdownDiaIndex = null;
let dropdownAulaIndex = null;

// Lista de disciplinas
const DISCIPLINAS = [
    { id: "biologia", nome: "Biologia", icone: "🧬" },
    { id: "biohackeria", nome: "Biohackeria", icone: "🔬" },
    { id: "projetos_livres", nome: "Projetos Livres", icone: "💡" },
    { id: "robotica", nome: "Robótica", icone: "🤖" },
    { id: "apps_games", nome: "Apps e Games", icone: "🎮" },
    { id: "iniciacao_cientifica", nome: "Iniciação Científica", icone: "🔍" },
    { id: "outra", nome: "Outra", icone: "📝" }
];

// Grade de horários (7 aulas de 45 minutos)
const HORARIOS = [
    "07:15 - 08:00",
    "08:00 - 08:45", 
    "08:45 - 09:30",
    "09:30 - 10:15",
    "10:30 - 11:15",
    "11:15 - 12:00",
    "12:00 - 12:45"
];

/* ========== FUNÇÕES DE DATA ========== */
function criarDataLocal(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d, 12);
}

function formatar(data) {
    if (!(data instanceof Date) || isNaN(data)) return "Data inválida";
    return data.toLocaleDateString("pt-BR", {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function adicionarDias(data, dias) {
    const novaData = new Date(data);
    novaData.setDate(novaData.getDate() + dias);
    return novaData;
}

function getNomeDia(data) {
    const dias = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
    return dias[data.getDay()];
}

/* ========== GERAÇÃO DE SEMANAS ========== */
function gerarSemanas(dataISO) {
    semanas = [];
    let atual = criarDataLocal(dataISO);
    
    if (isNaN(atual.getTime())) {
        alert("Data inválida. Por favor, insira uma data válida.");
        return;
    }

    // Ajustar para segunda-feira
    const diaSemana = atual.getDay();
    const diasParaSegunda = diaSemana === 0 ? 1 : diaSemana === 6 ? 2 : 1 - diaSemana;
    atual = adicionarDias(atual, diasParaSegunda);

    for (let i = 0; i < 43; i++) {
        let inicio = new Date(atual);
        let fim = adicionarDias(inicio, 4); // Segunda a sexta

        semanas.push({
            id: i + 1,
            inicio,
            fim,
            planejado: verificarPlanejamentoExistente(i)
        });

        // Pular para próxima segunda
        atual = adicionarDias(fim, 3);
    }

    atualizarEstatisticas();
    renderSemanas();
    salvarDataInicio(dataISO);
}

function verificarPlanejamentoExistente(index) {
    const chave = `semana_${index}`;
    if (!planejamentos[chave]) return false;
    
    // Verificar se alguma aula tem conteúdo ou disciplina
    for (let dia = 0; dia < 5; dia++) {
        for (let aula = 0; aula < 7; aula++) {
            if (planejamentos[chave].aulas?.[dia]?.[aula]?.conteudo?.trim() ||
                planejamentos[chave].aulas?.[dia]?.[aula]?.disciplina) {
                return true;
            }
        }
    }
    
    // Verificar anotações
    return !!(planejamentos[chave].anotacoes && planejamentos[chave].anotacoes.trim() !== "");
}

/* ========== RENDERIZAÇÃO ========== */
function renderSemanas() {
    listaSemanas.innerHTML = "";
    
    semanas.forEach((s, i) => {
        const div = document.createElement("div");
        div.className = `semana ${s.planejado ? 'com-planejamento' : ''}`;
        div.dataset.index = i;
        div.innerHTML = `
            <strong>Semana ${s.id}</strong>
            <div class="data">${formatar(s.inicio)} a ${formatar(s.fim)}</div>
            <div class="status"></div>
            ${s.planejado ? '<div class="badge">💾 Salvo</div>' : ''}
        `;
        div.onclick = () => abrirSemana(i);
        listaSemanas.appendChild(div);
    });

    // Aplicar filtro se existir
    if (buscarSemana.value) {
        filtrarSemanas();
    }
}

function abrirSemana(index) {
    semanaAtual = index;
    const s = semanas[index];
    
    paginaSemanas.classList.remove("active");
    paginaSemanas.classList.add("hidden");
    paginaAulas.classList.remove("hidden");
    paginaAulas.classList.add("active");
    
    tituloSemana.innerHTML = `
        <span class="semana-numero">Semana ${s.id}</span>
        <span class="semana-periodo">${formatar(s.inicio)} a ${formatar(s.fim)}</span>
    `;
    
    renderGradeSemana(index);
    carregarAnotacoes(index);
}

function renderGradeSemana(index) {
    gradeSemana.innerHTML = "";
    
    const table = document.createElement("table");
    table.className = "grade-aulas";
    
    // Cabeçalho da tabela
    let thead = `<thead><tr><th>Horário</th>`;
    const dias = ["SEG", "TER", "QUA", "QUI", "SEX"];
    const s = semanas[index];
    
    dias.forEach((dia, diaIndex) => {
        const data = adicionarDias(s.inicio, diaIndex);
        thead += `<th>${dia}<br><small>${formatar(data)}</small></th>`;
    });
    thead += `</tr></thead>`;
    
    // Corpo da tabela
    let tbody = `<tbody>`;
    
    // Carregar planejamento salvo
    const chave = `semana_${index}`;
    const planejamento = planejamentos[chave] || { 
        aulas: Array(5).fill().map(() => Array(7).fill({ disciplina: null, conteudo: "" })), 
        anotacoes: "" 
    };
    
    // Para cada horário (7 aulas)
    for (let aulaIndex = 0; aulaIndex < 7; aulaIndex++) {
        tbody += `<tr>`;
        tbody += `<td class="horario-cell">
            <div>${HORARIOS[aulaIndex]}</div>
            <small style="color: #666; font-size: 0.85rem;">45 minutos</small>
        </td>`;
        
        // Para cada dia da semana
        for (let diaIndex = 0; diaIndex < 5; diaIndex++) {
            const diaNome = dias[diaIndex];
            const aula = planejamento.aulas[diaIndex]?.[aulaIndex] || { disciplina: null, conteudo: "" };
            const disciplina = aula.disciplina || null;
            const conteudo = aula.conteudo || "";
            const disciplinaObj = DISCIPLINAS.find(d => d.id === disciplina);
            
            tbody += `
                <td class="dia-cell">
                    <div class="aula-container">
                        <div class="horario-aula">
                            <span class="hora">${HORARIOS[aulaIndex].split(" - ")[0]}</span>
                            <span class="duracao">45 min</span>
                        </div>
                        
                        <div class="disciplina-selector">
                            <button 
                                class="disciplina-btn ${disciplina ? 'selecionada' : ''}"
                                data-dia="${diaIndex}"
                                data-aula="${aulaIndex}"
                                onclick="abrirDropdownDisciplina(this, ${diaIndex}, ${aulaIndex})"
                            >
                                <span class="disciplina-nome">
                                    ${disciplinaObj ? `${disciplinaObj.icone} ${disciplinaObj.nome}` : 'Selecione a disciplina'}
                                </span>
                                <span class="disciplina-icone">▼</span>
                            </button>
                        </div>
                        
                        <div class="aula-conteudo">
                            <textarea 
                                class="aula-textarea"
                                placeholder="Descreva o conteúdo da aula aqui..."
                                data-dia="${diaIndex}"
                                data-aula="${aulaIndex}"
                                oninput="salvarConteudoAula(${index}, ${diaIndex}, ${aulaIndex}, this.value)"
                                rows="3"
                            >${conteudo}</textarea>
                            
                            <div class="aula-actions">
                                <button onclick="copiarAula(${index}, ${diaIndex}, ${aulaIndex})" class="btn-copiar-aula">
                                    📋 Copiar
                                </button>
                                <button onclick="apagarAula(${index}, ${diaIndex}, ${aulaIndex})" class="btn-delete">
                                    🗑️ Apagar
                                </button>
                            </div>
                        </div>
                    </div>
                </td>
            `;
        }
        
        tbody += `</tr>`;
    }
    
    tbody += `</tbody>`;
    
    table.innerHTML = thead + tbody;
    gradeSemana.appendChild(table);
}

/* ========== DROPDOWN DE DISCIPLINAS ========== */
function abrirDropdownDisciplina(button, diaIndex, aulaIndex) {
    // Fechar dropdown anterior se existir
    if (dropdownAulaAtual === `${diaIndex}-${aulaIndex}` && !disciplinaDropdown.classList.contains('hidden')) {
        disciplinaDropdown.classList.add('hidden');
        dropdownAulaAtual = null;
        return;
    }
    
    dropdownAulaAtual = `${diaIndex}-${aulaIndex}`;
    dropdownDiaIndex = diaIndex;
    dropdownAulaIndex = aulaIndex;
    
    // Posicionar dropdown próximo ao botão
    const rect = button.getBoundingClientRect();
    disciplinaDropdown.style.left = `${rect.left}px`;
    disciplinaDropdown.style.top = `${rect.bottom + 5}px`;
    
    disciplinaDropdown.classList.remove('hidden');
    
    // Atualizar evento de clique fora
    setTimeout(() => {
        document.addEventListener('click', fecharDropdownAoClicarFora);
    }, 10);
}

function fecharDropdownAoClicarFora(event) {
    if (!disciplinaDropdown.contains(event.target) && 
        !event.target.closest('.disciplina-btn')) {
        disciplinaDropdown.classList.add('hidden');
        dropdownAulaAtual = null;
        document.removeEventListener('click', fecharDropdownAoClicarFora);
    }
}

function selecionarDisciplina(disciplinaId) {
    if (dropdownDiaIndex === null || dropdownAulaIndex === null || semanaAtual === -1) return;
    
    const disciplina = DISCIPLINAS.find(d => d.id === disciplinaId);
    if (!disciplina) return;
    
    // Atualizar botão
    const button = document.querySelector(`.disciplina-btn[data-dia="${dropdownDiaIndex}"][data-aula="${dropdownAulaIndex}"]`);
    if (button) {
        button.classList.add('selecionada');
        button.querySelector('.disciplina-nome').innerHTML = `${disciplina.icone} ${disciplina.nome}`;
    }
    
    // Salvar no estado
    salvarDisciplinaAula(semanaAtual, dropdownDiaIndex, dropdownAulaIndex, disciplinaId);
    
    // Fechar dropdown
    disciplinaDropdown.classList.add('hidden');
    dropdownAulaAtual = null;
    
    // Remover event listener
    document.removeEventListener('click', fecharDropdownAoClicarFora);
}

/* ========== PERSISTÊNCIA ========== */
function salvarDisciplinaAula(semanaIndex, diaIndex, aulaIndex, disciplinaId) {
    const chave = `semana_${semanaIndex}`;
    if (!planejamentos[chave]) {
        planejamentos[chave] = {
            aulas: Array(5).fill().map(() => Array(7).fill({ disciplina: null, conteudo: "" })),
            anotacoes: ""
        };
    }
    
    if (!planejamentos[chave].aulas[diaIndex]) {
        planejamentos[chave].aulas[diaIndex] = Array(7).fill({ disciplina: null, conteudo: "" });
    }
    
    // Manter o conteúdo existente
    const conteudoExistente = planejamentos[chave].aulas[diaIndex][aulaIndex]?.conteudo || "";
    planejamentos[chave].aulas[diaIndex][aulaIndex] = {
        disciplina: disciplinaId,
        conteudo: conteudoExistente
    };
    
    localStorage.setItem('sesi_planejamentos', JSON.stringify(planejamentos));
    
    // Atualizar status
    semanas[semanaIndex].planejado = true;
    atualizarCardSemana(semanaIndex);
    mostrarStatusSalvo();
}

function salvarConteudoAula(semanaIndex, diaIndex, aulaIndex, conteudo) {
    const chave = `semana_${semanaIndex}`;
    if (!planejamentos[chave]) {
        planejamentos[chave] = {
            aulas: Array(5).fill().map(() => Array(7).fill({ disciplina: null, conteudo: "" })),
            anotacoes: ""
        };
    }
    
    if (!planejamentos[chave].aulas[diaIndex]) {
        planejamentos[chave].aulas[diaIndex] = Array(7).fill({ disciplina: null, conteudo: "" });
    }
    
    // Manter a disciplina existente
    const disciplinaExistente = planejamentos[chave].aulas[diaIndex][aulaIndex]?.disciplina || null;
    planejamentos[chave].aulas[diaIndex][aulaIndex] = {
        disciplina: disciplinaExistente,
        conteudo: conteudo
    };
    
    localStorage.setItem('sesi_planejamentos', JSON.stringify(planejamentos));
    
    // Atualizar status
    semanas[semanaIndex].planejado = true;
    atualizarCardSemana(semanaIndex);
    mostrarStatusSalvo();
}

function salvarAnotacoes() {
    if (semanaAtual === -1) return;
    const chave = `semana_${semanaAtual}`;
    if (!planejamentos[chave]) {
        planejamentos[chave] = {
            aulas: Array(5).fill().map(() => Array(7).fill({ disciplina: null, conteudo: "" })),
            anotacoes: ""
        };
    }
    planejamentos[chave].anotacoes = anotacoesSemana.value;
    localStorage.setItem('sesi_planejamentos', JSON.stringify(planejamentos));
    mostrarStatusSalvo();
}

function carregarAnotacoes(index) {
    const chave = `semana_${index}`;
    anotacoesSemana.value = planejamentos[chave]?.anotacoes || "";
}

function mostrarStatusSalvo() {
    statusSalvo.textContent = "✓ Salvo";
    statusSalvo.classList.add("visible");
    setTimeout(() => {
        statusSalvo.classList.remove("visible");
    }, 2000);
}

function atualizarCardSemana(index) {
    const card = document.querySelector(`.semana[data-index="${index}"]`);
    if (card) {
        if (semanas[index].planejado) {
            card.classList.add('com-planejamento');
            const badge = card.querySelector('.badge') || document.createElement('div');
            badge.className = 'badge';
            badge.textContent = '💾 Salvo';
            if (!card.querySelector('.badge')) {
                card.appendChild(badge);
            }
        } else {
            card.classList.remove('com-planejamento');
            const badge = card.querySelector('.badge');
            if (badge) badge.remove();
        }
    }
}

/* ========== FUNCIONALIDADES DE AULAS ========== */
async function copiarAula(semanaIndex, diaIndex, aulaIndex) {
    const chave = `semana_${semanaIndex}`;
    const aula = planejamentos[chave]?.aulas[diaIndex]?.[aulaIndex] || 
                { disciplina: null, conteudo: "" };
    
    const disciplina = DISCIPLINAS.find(d => d.id === aula.disciplina);
    const conteudo = aula.conteudo || "";
    
    if (!conteudo.trim() && !disciplina) {
        alert("Nada para copiar! Preencha a disciplina e/ou conteúdo da aula.");
        return;
    }

    let texto = "";
    if (disciplina) {
        texto += `Disciplina: ${disciplina.nome}\n`;
    }
    texto += conteudo;

    try {
        await navigator.clipboard.writeText(texto);
        alert("✅ Conteúdo da aula copiado para a área de transferência!");
    } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert("✅ Conteúdo da aula copiado para a área de transferência!");
    }
}

async function copiarAnotacoes() {
    if (!anotacoesSemana.value.trim()) {
        alert("Nada para copiar! Digite suas anotações primeiro.");
        return;
    }

    try {
        await navigator.clipboard.writeText(anotacoesSemana.value);
        alert("✅ Anotações copiadas para a área de transferência!");
    } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = anotacoesSemana.value;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert("✅ Anotações copiadas para a área de transferência!");
    }
}

async function copiarTodaSemana() {
    if (semanaAtual === -1) return;
    
    const chave = `semana_${semanaAtual}`;
    const planejamento = planejamentos[chave];
    
    if (!planejamento) {
        alert("Nenhum planejamento para copiar!");
        return;
    }
    
    let texto = `PLANEJAMENTO DA SEMANA ${semanaAtual + 1}\n`;
    texto += `Período: ${formatar(semanas[semanaAtual].inicio)} a ${formatar(semanas[semanaAtual].fim)}\n\n`;
    
    const dias = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA"];
    
    dias.forEach((diaNome, diaIndex) => {
        texto += `\n=== ${diaNome} ===\n`;
        
        for (let aulaIndex = 0; aulaIndex < 7; aulaIndex++) {
            const aula = planejamento.aulas[diaIndex]?.[aulaIndex] || { disciplina: null, conteudo: "" };
            const disciplina = DISCIPLINAS.find(d => d.id === aula.disciplina);
            const conteudo = aula.conteudo || "";
            
            if (conteudo.trim() || disciplina) {
                texto += `\n${HORARIOS[aulaIndex]}:\n`;
                if (disciplina) {
                    texto += `Disciplina: ${disciplina.nome}\n`;
                }
                if (conteudo.trim()) {
                    texto += `Conteúdo: ${conteudo}\n`;
                }
            }
        }
    });
    
    if (planejamento.anotacoes?.trim()) {
        texto += `\n=== ANOTAÇÕES ===\n${planejamento.anotacoes}`;
    }
    
    try {
        await navigator.clipboard.writeText(texto);
        alert("✅ Planejamento completo da semana copiado para a área de transferência!");
    } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert("✅ Planejamento completo da semana copiado para a área de transferência!");
    }
}

function apagarAula(semanaIndex, diaIndex, aulaIndex) {
    mostrarModal(
        "Apagar Aula",
        "Tem certeza que deseja apagar o planejamento desta aula?",
        () => {
            const chave = `semana_${semanaIndex}`;
            if (planejamentos[chave]?.aulas[diaIndex]?.[aulaIndex]) {
                // Resetar aula
                planejamentos[chave].aulas[diaIndex][aulaIndex] = { disciplina: null, conteudo: "" };
                localStorage.setItem('sesi_planejamentos', JSON.stringify(planejamentos));
                
                // Atualizar interface
                const button = document.querySelector(`.disciplina-btn[data-dia="${diaIndex}"][data-aula="${aulaIndex}"]`);
                if (button) {
                    button.classList.remove('selecionada');
                    button.querySelector('.disciplina-nome').textContent = 'Selecione a disciplina';
                }
                
                const textarea = document.querySelector(`textarea[data-dia="${diaIndex}"][data-aula="${aulaIndex}"]`);
                if (textarea) {
                    textarea.value = "";
                }
                
                // Verificar se a semana ainda tem conteúdo
                semanas[semanaIndex].planejado = verificarPlanejamentoExistente(semanaIndex);
                atualizarCardSemana(semanaIndex);
                
                alert("Aula apagada com sucesso!");
            }
        }
    );
}

/* ========== EXPORTAÇÃO ========== */
function exportarPlanejamentos() {
    if (Object.keys(planejamentos).length === 0) {
        alert("Nenhum planejamento para exportar!");
        return;
    }

    const exportData = {
        dataInicio: inicioInput.value,
        dataExportacao: new Date().toISOString(),
        professor: "Lafaiete Teixeira Pereira Erkmann",
        unidade: "EM Tubarão 2026",
        horarios: HORARIOS,
        semanas: semanas.map((s, i) => {
            const chave = `semana_${i}`;
            const p = planejamentos[chave];
            return {
                semana: s.id,
                periodo: `${formatar(s.inicio)} a ${formatar(s.fim)}`,
                planejado: !!p,
                aulas: p?.aulas || Array(5).fill().map(() => Array(7).fill({ disciplina: null, conteudo: "" })),
                anotacoes: p?.anotacoes || ""
            };
        })
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planejamento-sesi-semanal-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert("✅ Planejamentos exportados com sucesso!");
}

function limparPlanejamentoSemana() {
    mostrarModal(
        "Limpar Planejamento",
        "Tem certeza que deseja limpar TODOS os planejamentos desta semana? Esta ação não pode ser desfeita.",
        () => {
            const chave = `semana_${semanaAtual}`;
            delete planejamentos[chave];
            localStorage.setItem('sesi_planejamentos', JSON.stringify(planejamentos));
            
            // Limpar campos
            document.querySelectorAll('.disciplina-btn').forEach(button => {
                button.classList.remove('selecionada');
                button.querySelector('.disciplina-nome').textContent = 'Selecione a disciplina';
            });
            
            document.querySelectorAll('.aula-textarea').forEach(textarea => {
                textarea.value = "";
            });
            
            anotacoesSemana.value = "";
            
            // Atualizar estado
            semanas[semanaAtual].planejado = false;
            mostrarStatusSalvo();
            alert("Planejamento da semana limpo com sucesso!");
        }
    );
}

/* ========== FILTRO E BUSCA ========== */
function filtrarSemanas() {
    const termo = buscarSemana.value.toLowerCase().trim();
    if (!termo) {
        document.querySelectorAll('.semana').forEach(card => {
            card.style.display = 'block';
        });
        return;
    }

    document.querySelectorAll('.semana').forEach(card => {
        const index = parseInt(card.dataset.index);
        const semana = semanas[index];
        const textoCard = `semana ${semana.id} ${formatar(semana.inicio)} ${formatar(semana.fim)}`.toLowerCase();
        
        if (textoCard.includes(termo)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function atualizarEstatisticas() {
    const semanasComPlanejamento = semanas.filter(s => s.planejado).length;
    contadorSemanas.textContent = `${semanasComPlanejamento}/${semanas.length} semanas com planejamento`;
    
    if (semanas.length > 0) {
        const primeira = semanas[0];
        const ultima = semanas[semanas.length - 1];
        periodoTotal.textContent = `${formatar(primeira.inicio)} - ${formatar(ultima.fim)}`;
    }
}

/* ========== MODAL ========== */
function mostrarModal(titulo, mensagem, callbackConfirmar) {
    modalTitulo.textContent = titulo;
    modalMensagem.textContent = mensagem;
    modal.classList.remove('hidden');
    
    const handler = () => {
        callbackConfirmar();
        modal.classList.add('hidden');
        modalConfirmar.removeEventListener('click', handler);
        modalCancelar.removeEventListener('click', cancelHandler);
    };
    
    const cancelHandler = () => {
        modal.classList.add('hidden');
        modalConfirmar.removeEventListener('click', handler);
        modalCancelar.removeEventListener('click', cancelHandler);
    };
    
    modalConfirmar.onclick = handler;
    modalCancelar.onclick = cancelHandler;
}

/* ========== CONFIGURAÇÃO INICIAL ========== */
function salvarDataInicio(dataISO) {
    localStorage.setItem('sesi_data_inicio', dataISO);
}

function carregarDataInicio() {
    const salva = localStorage.getItem('sesi_data_inicio');
    if (salva) {
        inicioInput.value = salva;
        gerarSemanas(salva);
    } else {
        // Data padrão: primeira segunda-feira de fevereiro de 2026
        const hoje = new Date();
        const fevereiro2026 = new Date(2026, 1, 1); // 1 de fevereiro de 2026
        const diaSemana = fevereiro2026.getDay();
        const diasParaSegunda = diaSemana === 0 ? 1 : diaSemana === 6 ? 2 : 1 - diaSemana;
        const primeiraSegunda = adicionarDias(fevereiro2026, diasParaSegunda);
        
        const dataPadrao = primeiraSegunda.toISOString().split('T')[0];
        inicioInput.value = dataPadrao;
        gerarSemanas(dataPadrao);
    }
}

/* ========== EVENT LISTENERS ========== */
inicioInput.addEventListener('change', () => {
    gerarSemanas(inicioInput.value);
});

btnHoje.addEventListener('click', () => {
    const hoje = new Date();
    inicioInput.value = hoje.toISOString().split('T')[0];
    gerarSemanas(inicioInput.value);
});

buscarSemana.addEventListener('input', filtrarSemanas);

btnExportar.addEventListener('click', exportarPlanejamentos);

btnSalvarSemana.addEventListener('click', () => {
    // Forçar salvamento de todos os campos
    document.querySelectorAll('.aula-textarea').forEach((textarea) => {
        const diaIndex = parseInt(textarea.dataset.dia);
        const aulaIndex = parseInt(textarea.dataset.aula);
        salvarConteudoAula(semanaAtual, diaIndex, aulaIndex, textarea.value);
    });
    salvarAnotacoes();
    alert("✅ Todos os planejamentos da semana foram salvos!");
});

btnLimparSemana.addEventListener('click', limparPlanejamentoSemana);

voltarBtn.addEventListener('click', () => {
    paginaAulas.classList.remove("active");
    paginaAulas.classList.add("hidden");
    paginaSemanas.classList.remove("hidden");
    paginaSemanas.classList.add("active");
    semanaAtual = -1;
    atualizarEstatisticas();
});

anotacoesSemana.addEventListener('input', () => {
    clearTimeout(anotacoesSemana.debounce);
    anotacoesSemana.debounce = setTimeout(salvarAnotacoes, 1000);
});

// Configurar eventos do dropdown
document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
        selecionarDisciplina(item.dataset.disciplina);
    });
});

// Fechar modal ao clicar fora
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});

/* ========== INICIALIZAÇÃO ========== */
document.addEventListener('DOMContentLoaded', () => {
    carregarDataInicio();
    atualizarEstatisticas();
});

// Adicionar métodos globais para acesso pelos event handlers
window.copiarAula = copiarAula;
window.copiarAnotacoes = copiarAnotacoes;
window.copiarTodaSemana = copiarTodaSemana;
window.salvarConteudoAula = salvarConteudoAula;
window.apagarAula = apagarAula;
window.abrirDropdownDisciplina = abrirDropdownDisciplina;