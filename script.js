// ========== CONFIGURAÇÕES INICIAIS ==========
const SENHA_PADRAO = "sesi2026"; // Senha padrão (em produção, usar autenticação real)
const USUARIOS_AUTORIZADOS = [
    "lafaiete@sesiescola.com.br",
    "professor@sesiescola.com.br",
    "coordenacao@sesiescola.com.br"
];

// Configurações do Google Drive
const DRIVE_CLIENT_ID = "SEU_CLIENT_ID_AQUI"; // Substituir pelo Client ID real
const DRIVE_API_KEY = "SUA_API_KEY_AQUI"; // Substituir pela API Key real
const DRIVE_SCOPES = "https://www.googleapis.com/auth/drive.file";

// Estado da aplicação
let usuarioLogado = null;
let driveAutenticado = false;
let drivePastaId = null;

// ========== ELEMENTOS DOM ADICIONAIS ==========
const paginaLogin = document.getElementById("paginaLogin");
const appPrincipal = document.getElementById("appPrincipal");
const loginEmail = document.getElementById("loginEmail");
const loginSenha = document.getElementById("loginSenha");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const professorNome = document.getElementById("professorNome");
const userEmail = document.getElementById("userEmail");
const btnExportarPDF = document.getElementById("btnExportarPDF");
const btnExportarDrive = document.getElementById("btnExportarDrive");
const btnExportarSemanaPDF = document.getElementById("btnExportarSemanaPDF");
const btnExportarJSON = document.getElementById("btnExportarJSON");
const modalDrive = document.getElementById("modalDrive");
const btnConectarDrive = document.getElementById("btnConectarDrive");
const btnDesconectarDrive = document.getElementById("btnDesconectarDrive");
const btnFecharDrive = document.getElementById("btnFecharDrive");
const driveConnectionStatus = document.getElementById("driveConnectionStatus");
const drivePastaInput = document.getElementById("drivePasta");
const driveStatus = document.getElementById("driveStatus");

// ========== SISTEMA DE LOGIN ==========
function verificarLogin() {
    const emailSalvo = localStorage.getItem('sesi_usuario_email');
    const senhaSalva = localStorage.getItem('sesi_usuario_senha');
    
    if (emailSalvo && senhaSalva && USUARIOS_AUTORIZADOS.includes(emailSalvo)) {
        realizarLogin(emailSalvo, senhaSalva, true);
        return true;
    }
    return false;
}

function realizarLogin(email, senha, automatico = false) {
    // Validação simples (em produção, usar servidor de autenticação)
    if (!USUARIOS_AUTORIZADOS.includes(email)) {
        if (!automatico) alert("E-mail não autorizado. Contate a coordenação.");
        return false;
    }
    
    if (senha !== SENHA_PADRAO) {
        if (!automatico) alert("Senha incorreta.");
        return false;
    }
    
    usuarioLogado = {
        email: email,
        nome: email.split('@')[0].replace('.', ' ').replace('_', ' ')
    };
    
    // Salvar credenciais se marcado "lembrar"
    const lembrar = document.getElementById("lembrarLogin").checked;
    if (lembrar || automatico) {
        localStorage.setItem('sesi_usuario_email', email);
        localStorage.setItem('sesi_usuario_senha', senha);
    }
    
    // Atualizar interface
    professorNome.textContent = usuarioLogado.nome;
    userEmail.textContent = usuarioLogado.email;
    
    // Mostrar aplicação
    paginaLogin.classList.remove("active");
    paginaLogin.classList.add("hidden");
    appPrincipal.classList.remove("hidden");
    appPrincipal.classList.add("active");
    
    // Carregar dados
    carregarDataInicio();
    atualizarEstatisticas();
    
    // Tentar conectar ao Drive
    setTimeout(() => {
        inicializarDriveAPI();
    }, 1000);
    
    return true;
}

function realizarLogout() {
    localStorage.removeItem('sesi_usuario_senha');
    usuarioLogado = null;
    
    appPrincipal.classList.remove("active");
    appPrincipal.classList.add("hidden");
    paginaLogin.classList.remove("hidden");
    paginaLogin.classList.add("active");
    
    // Limpar campos de login
    loginEmail.value = "";
    loginSenha.value = "";
}

// ========== GOOGLE DRIVE INTEGRATION ==========
function inicializarDriveAPI() {
    gapi.load('client:auth2', () => {
        gapi.client.init({
            apiKey: DRIVE_API_KEY,
            clientId: DRIVE_CLIENT_ID,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
            scope: DRIVE_SCOPES
        }).then(() => {
            console.log("Google Drive API inicializada");
            verificarAutenticacaoDrive();
        }).catch(err => {
            console.error("Erro ao inicializar Google Drive API:", err);
            driveStatus.textContent = "⚠️ Google Drive: API não disponível";
        });
    });
}

function verificarAutenticacaoDrive() {
    const authInstance = gapi.auth2.getAuthInstance();
    const user = authInstance.currentUser.get();
    
    if (user.isSignedIn()) {
        driveAutenticado = true;
        atualizarStatusDrive("🟢 Google Drive: Conectado");
        buscarPastaDrive();
    } else {
        driveAutenticado = false;
        atualizarStatusDrive("🔴 Google Drive: Não conectado");
    }
}

function conectarDrive() {
    gapi.auth2.getAuthInstance().signIn()
        .then(() => {
            driveAutenticado = true;
            atualizarStatusDrive("🟢 Google Drive: Conectado");
            buscarPastaDrive();
            alert("✅ Conectado ao Google Drive com sucesso!");
        })
        .catch(err => {
            console.error("Erro ao conectar ao Drive:", err);
            alert("❌ Erro ao conectar ao Google Drive");
        });
}

function desconectarDrive() {
    gapi.auth2.getAuthInstance().signOut()
        .then(() => {
            driveAutenticado = false;
            drivePastaId = null;
            atualizarStatusDrive("🔴 Google Drive: Desconectado");
            alert("Desconectado do Google Drive");
        })
        .catch(err => {
            console.error("Erro ao desconectar:", err);
        });
}

function atualizarStatusDrive(mensagem) {
    driveStatus.textContent = mensagem;
    driveConnectionStatus.textContent = driveAutenticado ? "🟢 Conectado" : "🔴 Não conectado";
    driveConnectionStatus.className = driveAutenticado ? "connected" : "disconnected";
}

async function buscarPastaDrive() {
    if (!driveAutenticado) return;
    
    const nomePasta = drivePastaInput.value || "Planejamentos SESI 2026";
    
    try {
        const response = await gapi.client.drive.files.list({
            q: `name='${nomePasta}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });
        
        if (response.result.files.length > 0) {
            drivePastaId = response.result.files[0].id;
            console.log("Pasta encontrada:", drivePastaId);
        } else {
            // Criar pasta se não existir
            await criarPastaDrive(nomePasta);
        }
    } catch (err) {
        console.error("Erro ao buscar pasta:", err);
    }
}

async function criarPastaDrive(nome) {
    try {
        const fileMetadata = {
            name: nome,
            mimeType: 'application/vnd.google-apps.folder'
        };
        
        const response = await gapi.client.drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        });
        
        drivePastaId = response.result.id;
        console.log("Pasta criada:", drivePastaId);
    } catch (err) {
        console.error("Erro ao criar pasta:", err);
    }
}

async function salvarNoDrive(nomeArquivo, conteudo, mimeType = 'application/pdf') {
    if (!driveAutenticado || !drivePastaId) {
        alert("Conecte ao Google Drive primeiro!");
        abrirModalDrive();
        return false;
    }
    
    try {
        const fileMetadata = {
            name: nomeArquivo,
            parents: [drivePastaId],
            mimeType: mimeType
        };
        
        // Converter para blob se for PDF
        let blob;
        if (mimeType === 'application/pdf') {
            blob = new Blob([conteudo], { type: 'application/pdf' });
        } else {
            blob = new Blob([JSON.stringify(conteudo, null, 2)], { type: 'application/json' });
        }
        
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
        formData.append('file', blob);
        
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({
                'Authorization': `Bearer ${gapi.auth.getToken().access_token}`
            }),
            body: formData
        });
        
        if (response.ok) {
            alert(`✅ Arquivo "${nomeArquivo}" salvo no Google Drive!`);
            return true;
        } else {
            throw new Error('Erro ao salvar no Drive');
        }
    } catch (err) {
        console.error("Erro ao salvar no Drive:", err);
        alert("❌ Erro ao salvar no Google Drive");
        return false;
    }
}

function abrirModalDrive() {
    modalDrive.classList.remove('hidden');
}

// ========== EXPORTAÇÃO PDF ==========
function exportarParaPDF(tipo = 'completo', semanaIndex = null) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.setTextColor(0, 71, 182);
    doc.text('PLANEJAMENTO DE AULAS - SESI', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Professor: ${usuarioLogado.nome}`, 15, 25);
    doc.text(`Unidade: EM Tubarão 2026`, 15, 32);
    doc.text(`Data de exportação: ${new Date().toLocaleDateString('pt-BR')}`, 15, 39);
    
    if (tipo === 'semana' && semanaIndex !== null) {
        exportarSemanaPDF(doc, semanaIndex);
    } else {
        exportarCompletoPDF(doc);
    }
    
    // Gerar nome do arquivo
    const nomeArquivo = tipo === 'semana' 
        ? `planejamento_semana_${semanaIndex + 1}_${new Date().toISOString().split('T')[0]}.pdf`
        : `planejamento_completo_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Salvar localmente
    doc.save(nomeArquivo);
    
    // Opção de salvar no Drive
    setTimeout(() => {
        mostrarModal(
            "Salvar no Google Drive",
            "Deseja salvar este arquivo PDF no seu Google Drive?",
            () => {
                const pdfOutput = doc.output('blob');
                salvarNoDrive(nomeArquivo, pdfOutput, 'application/pdf');
            }
        );
    }, 500);
}

function exportarSemanaPDF(doc, semanaIndex) {
    const semana = semanas[semanaIndex];
    const planejamento = planejamentos[`semana_${semanaIndex}`] || { aulas: [], anotacoes: "" };
    
    // Título da semana
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Semana ${semana.id} - ${formatar(semana.inicio)} a ${formatar(semana.fim)}`, 105, 50, { align: 'center' });
    
    let yPos = 60;
    
    // Tabela de aulas
    const dias = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA"];
    
    dias.forEach((diaNome, diaIndex) => {
        doc.setFontSize(14);
        doc.setTextColor(0, 71, 182);
        doc.text(`${diaNome} - ${formatar(adicionarDias(semana.inicio, diaIndex))}`, 15, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        for (let aulaIndex = 0; aulaIndex < 7; aulaIndex++) {
            const aula = planejamento.aulas[diaIndex]?.[aulaIndex] || { disciplina: null, conteudo: "" };
            const disciplina = DISCIPLINAS.find(d => d.id === aula.disciplina);
            const conteudo = aula.conteudo || "";
            
            if (conteudo.trim() || disciplina) {
                doc.text(`${HORARIOS[aulaIndex]}:`, 20, yPos);
                if (disciplina) {
                    doc.text(`Disciplina: ${disciplina.nome}`, 60, yPos);
                }
                if (conteudo.trim()) {
                    yPos += 5;
                    doc.text(`Conteúdo: ${conteudo.substring(0, 100)}${conteudo.length > 100 ? '...' : ''}`, 20, yPos);
                }
                yPos += 10;
                
                // Quebra de página
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
            }
        }
        yPos += 5;
    });
    
    // Anotações
    if (planejamento.anotacoes?.trim()) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(0, 71, 182);
        doc.text('ANOTAÇÕES DA SEMANA', 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const anotacoesLines = doc.splitTextToSize(planejamento.anotacoes, 250);
        doc.text(anotacoesLines, 15, 30);
    }
}

function exportarCompletoPDF(doc) {
    let yPos = 50;
    let pagina = 1;
    
    semanas.forEach((semana, semanaIndex) => {
        const planejamento = planejamentos[`semana_${semanaIndex}`];
        if (!planejamento || !semanas[semanaIndex].planejado) return;
        
        doc.setFontSize(12);
        doc.setTextColor(0, 71, 182);
        doc.text(`Semana ${semana.id}: ${formatar(semana.inicio)} a ${formatar(semana.fim)}`, 15, yPos);
        yPos += 8;
        
        // Adicionar tabela resumo
        const tableData = [];
        const dias = ["SEG", "TER", "QUA", "QUI", "SEX"];
        
        dias.forEach((diaNome, diaIndex) => {
            const aulasDia = planejamento.aulas[diaIndex] || [];
            const disciplinas = aulasDia
                .map(aula => DISCIPLINAS.find(d => d.id === aula.disciplina)?.nome || "")
                .filter(nome => nome)
                .join(", ");
            
            if (disciplinas) {
                tableData.push([diaNome, disciplinas]);
            }
        });
        
        if (tableData.length > 0) {
            doc.autoTable({
                startY: yPos,
                head: [['Dia', 'Disciplinas']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [0, 71, 182] },
                margin: { left: 15 }
            });
            
            yPos = doc.lastAutoTable.finalY + 10;
        } else {
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text("Sem planejamento registrado", 25, yPos);
            yPos += 15;
        }
        
        // Quebra de página
        if (yPos > 270 && semanaIndex < semanas.length - 1) {
            doc.addPage();
            pagina++;
            doc.setPage(pagina);
            yPos = 20;
        }
    });
}

// ========== EVENT LISTENERS ADICIONAIS ==========
btnLogin.addEventListener('click', () => {
    if (loginEmail.value && loginSenha.value) {
        realizarLogin(loginEmail.value, loginSenha.value);
    } else {
        alert("Preencha e-mail e senha!");
    }
});

btnLogout.addEventListener('click', realizarLogout);

// Enter para login
loginSenha.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        btnLogin.click();
    }
});

btnExportarPDF.addEventListener('click', () => {
    exportarParaPDF('completo');
});

btnExportarJSON.addEventListener('click', () => {
    exportarPlanejamentos(); // Função original mantida
});

btnExportarDrive.addEventListener('click', () => {
    if (!driveAutenticado) {
        abrirModalDrive();
    } else {
        mostrarModal(
            "Salvar no Google Drive",
            "Escolha o formato para salvar no Drive:",
            () => {
                // Exportar como JSON
                const exportData = prepararDadosExportacao();
                const nomeArquivo = `planejamento_sesi_${new Date().toISOString().split('T')[0]}.json`;
                salvarNoDrive(nomeArquivo, exportData, 'application/json');
            },
            "JSON",
            () => {
                // Exportar como PDF
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                exportarCompletoPDF(doc);
                const pdfOutput = doc.output('blob');
                const nomeArquivo = `planejamento_sesi_${new Date().toISOString().split('T')[0]}.pdf`;
                salvarNoDrive(nomeArquivo, pdfOutput, 'application/pdf');
            },
            "PDF"
        );
    }
});

btnExportarSemanaPDF.addEventListener('click', () => {
    if (semanaAtual !== -1) {
        exportarParaPDF('semana', semanaAtual);
    }
});

btnConectarDrive.addEventListener('click', conectarDrive);
btnDesconectarDrive.addEventListener('click', desconectarDrive);
btnFecharDrive.addEventListener('click', () => {
    modalDrive.classList.add('hidden');
});

// ========== FUNÇÃO MODAL MODIFICADA ==========
function mostrarModal(titulo, mensagem, callbackConfirmar, textoConfirmar = "Confirmar", callbackAlternativo = null, textoAlternativo = null) {
    modalTitulo.textContent = titulo;
    modalMensagem.textContent = mensagem;
    modal.classList.remove('hidden');
    
    // Limpar botões anteriores
    modalConfirmar.textContent = textoConfirmar;
    modalCancelar.textContent = textoAlternativo ? textoAlternativo : "Cancelar";
    
    const handler = () => {
        callbackConfirmar();
        modal.classList.add('hidden');
        modalConfirmar.removeEventListener('click', handler);
        modalCancelar.removeEventListener('click', cancelHandler);
    };
    
    const cancelHandler = () => {
        if (callbackAlternativo) {
            callbackAlternativo();
        }
        modal.classList.add('hidden');
        modalConfirmar.removeEventListener('click', handler);
        modalCancelar.removeEventListener('click', cancelHandler);
    };
    
    modalConfirmar.onclick = handler;
    modalCancelar.onclick = cancelHandler;
}

// ========== INICIALIZAÇÃO MODIFICADA ==========
document.addEventListener('DOMContentLoaded', () => {
    // Verificar login automático
    if (!verificarLogin()) {
        // Mostrar página de login
        paginaLogin.classList.add("active");
        appPrincipal.classList.add("hidden");
    }
    
    // Configurar data padrão no input
    const hoje = new Date();
    inicioInput.value = hoje.toISOString().split('T')[0];
});
