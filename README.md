# Planejador de Aulas - Versão Atualizada

## 📋 Modificações Implementadas

### 1. ✅ Cadastro de Disciplinas para Horário
- **Nova funcionalidade**: Painel de administração permite adicionar, editar e remover disciplinas
- **Acesso**: Coordenação (usuário: coordenacao, senha: sesi@2026)
- **Localização**: Botão "⚙️ Administração" → Aba "Disciplinas"
- **Funcionalidades**:
  - Adicionar novas disciplinas com nome personalizado e ícone (emoji)
  - Remover disciplinas (exceto Biologia e Biohackeria - protegidas)
  - As disciplinas são salvas no sistema e ficam disponíveis para todos os professores
  - Atualização automática em toda interface

### 2. ✅ Painel do Gestor
- **Relatório de Professores**: Gera documento Word com lista completa de professores cadastrados
- **Coleta de Emails**: Botão para copiar todos os emails dos professores de uma vez
- **Acesso**: Botão "⚙️ Administração" (visível apenas para gestão)
- **Recursos**:
  - Tabela com todos os professores cadastrados
  - Informações: Nome, Usuário, Email, Data de Cadastro
  - Botão "📊 Gerar Relatório" - exporta DOC com dados completos
  - Botão "📧 Copiar Emails" - copia todos os emails separados por ponto-e-vírgula

### 3. ✅ Rodapé com Informações do Autor
- **Desenvolvedor**: Lafaiete Erkmann
- **Contato**: @lafa.bio (Instagram)
- **Localização**: Rodapé de todas as páginas do sistema
- **Estilo**: Elegante, discreto, com link clicável para o Instagram

### 4. ✅ Remoção do Botão "Usar Hoje"
- Botão removido da interface
- Código relacionado também removido do JavaScript
- Interface mais limpa e focada

## 🎯 Como Usar as Novas Funcionalidades

### Gerenciar Disciplinas (Gestão)
1. Faça login como gestor (usuário: `gestor`, senha: `gestor@2026`)
2. Clique em "⚙️ Administração"
3. Selecione a aba "📚 Disciplinas"
4. Para adicionar: Digite o nome, escolha um ícone e clique em "➕ Adicionar"
5. Para remover: Clique em "Remover" ao lado da disciplina

### Gerar Relatório de Professores (Gestão)
1. Acesse "⚙️ Administração"
2. Na aba "👥 Professores", clique em "📊 Gerar Relatório"
3. O arquivo DOC será baixado automaticamente

### Copiar Emails dos Professores (Gestão)
1. Acesse "⚙️ Administração"
2. Na aba "👥 Professores", clique em "📧 Copiar Emails"
3. Cole onde desejar (já está no formato email1; email2; email3)

## 🔐 Credenciais de Acesso

### Gestão (Superusuário)
- **Usuário**: `gestor`
- **Senha**: `gestor@2026`
- **Permissões**: Acesso total ao sistema, incluindo painel administrativo

### Professores
- Podem se cadastrar normalmente pelo sistema
- Têm acesso apenas às suas próprias aulas e planejamentos

## 📁 Estrutura de Arquivos

- `index.html` - Interface do sistema (atualizada)
- `script.js` - Lógica do sistema (com novas funcionalidades)
- `style.css` - Estilos do sistema (inalterado)

## 🚀 Novos Recursos Técnicos

### Armazenamento de Disciplinas
- As disciplinas são salvas em `localStorage` com a chave `disciplinas_sistema`
- Formato JSON: `[{ id, nome, icone }]`
- Disciplinas padrão são criadas automaticamente no primeiro acesso

### Funções JavaScript Adicionadas
- `carregarDisciplinasInicial()` - Carrega disciplinas do localStorage
- `salvarDisciplinas()` - Salva disciplinas no localStorage
- `adicionarDisciplina()` - Adiciona nova disciplina
- `removerDisciplina()` - Remove disciplina existente
- `atualizarListaDisciplinas()` - Atualiza lista visual
- `atualizarDisciplinasInterface()` - Atualiza interface geral
- `abrirPainelAdmin()` - Abre painel administrativo
- `fecharPainelAdmin()` - Fecha painel administrativo
- `mostrarAbaAdmin()` - Alterna entre abas do painel
- `carregarTabelaProfessores()` - Carrega dados dos professores
- `gerarRelatorioProfessores()` - Gera relatório em DOC
- `copiarEmailsProfessores()` - Copia emails para clipboard

## 💡 Dicas de Uso

1. **Backup**: Exporte seus dados regularmente usando o painel de administração
2. **Disciplinas**: Adicione apenas as disciplinas que realmente serão usadas
3. **Emails**: O botão de copiar emails facilita envios em massa
4. **Relatórios**: Gere relatórios periodicamente para acompanhamento

## 🎨 Melhorias de Interface

- Painel administrativo com design moderno e responsivo
- Abas organizadas para melhor navegação
- Tabelas estilizadas para melhor visualização
- Rodapé informativo e profissional

## 📞 Suporte

Para dúvidas ou sugestões, entre em contato com:
**Lafaiete Erkmann** - [@lafa.bio](https://instagram.com/lafa.bio)

---
*Sistema Planejador de Aulas © 2024*
