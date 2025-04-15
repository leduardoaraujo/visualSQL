import { ApiService } from '../services/ApiService.js';
import { Notification } from '../utils/Notification.js';

export class ConnectionManager {
    constructor() {
        this.apiService = new ApiService();
        this.currentConnection = null;
        this.isModalOpen = false;
        this.init();
    }

    init() {
        // Cria o botão de gerenciar conexões no cabeçalho
        this.createConnectionButton();
        
        // Cria o modal
        this.createConnectionModal();
        
        // Inicializa os eventos
        this.initEvents();
    }

    createConnectionButton() {
        const header = document.querySelector('header');
        
        // Cria o container para o botão
        const connectionContainer = document.createElement('div');
        connectionContainer.className = 'connection-container';
        
        // Adiciona o botão
        const connectionButton = document.createElement('button');
        connectionButton.id = 'manage-connections';
        connectionButton.className = 'btn connection-btn';
        connectionButton.innerHTML = `
            <i class="fas fa-database"></i>
            <span>Gerenciar Conexões</span>
        `;
        
        connectionContainer.appendChild(connectionButton);
        header.appendChild(connectionContainer);
    }

    createConnectionModal() {
        // Cria o modal de conexões
        const modal = document.createElement('div');
        modal.id = 'connection-modal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content connection-modal-content">
                <div class="modal-header">
                    <h3>Gerenciar Conexões</h3>
                    <button class="modal-close" id="close-connection-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="connection-tabs">
                    <button class="tab-btn active" data-tab="connections-list">
                        <i class="fas fa-list"></i> Conexões
                    </button>
                    <button class="tab-btn" data-tab="connection-form">
                        <i class="fas fa-plus"></i> Nova Conexão
                    </button>
                </div>
                
                <div class="tab-content">
                    <div class="tab-pane active" id="connections-list">
                        <div class="connections-container">
                            <div class="no-connections-message">
                                <i class="fas fa-database"></i>
                                <p>Nenhuma conexão encontrada. Crie uma nova conexão para começar.</p>
                            </div>
                            <div class="connections-list"></div>
                        </div>
                    </div>
                    
                    <div class="tab-pane" id="connection-form">
                        <form id="connection-form" class="connection-form">
                            <div class="form-group">
                                <label for="connection-name">Nome da Conexão</label>
                                <input type="text" id="connection-name" name="connection-name" placeholder="Meu Banco de Dados" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="connection-type">Tipo de Banco de Dados</label>
                                <select id="connection-type" name="connection-type" required>
                                    <option value="" disabled selected>Selecione o tipo</option>
                                    <option value="sqlite">SQLite</option>
                                    <option value="mysql">MySQL</option>
                                    <option value="postgresql">PostgreSQL</option>
                                    <option value="mssql">Microsoft SQL Server</option>
                                    <option value="oracle">Oracle</option>
                                </select>
                            </div>
                            
                            <div class="dynamic-fields">
                                <!-- Campos específicos para cada tipo de banco aparecerão aqui -->
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" id="test-connection" class="btn btn-secondary">
                                    <i class="fas fa-vial"></i> Testar Conexão
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    initEvents() {
        // Botão para abrir o modal
        document.getElementById('manage-connections').addEventListener('click', () => {
            this.openModal();
        });
        
        // Botão para fechar o modal
        document.getElementById('close-connection-modal').addEventListener('click', () => {
            document.getElementById('connection-modal').style.display = 'none';
            this.isModalOpen = false;
        });
        
        // Tabs do modal
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove a classe active de todos os botões
                tabButtons.forEach(btn => btn.classList.remove('active'));
                
                // Adiciona a classe active ao botão clicado
                e.target.classList.add('active');
                
                // Ativa a tab correspondente
                const tabId = e.target.dataset.tab;
                const tabPanes = document.querySelectorAll('.tab-pane');
                
                tabPanes.forEach(pane => {
                    pane.classList.remove('active');
                    if (pane.id === tabId) {
                        pane.classList.add('active');
                    }
                });
                
                // Se a tab for a lista de conexões, atualiza a lista
                if (tabId === 'connections-list') {
                    this.loadConnections();
                }
            });
        });
        
        // Evento de mudança no tipo de banco de dados
        document.getElementById('connection-type').addEventListener('change', (e) => {
            this.showDynamicFields(e.target.value);
        });
        
        // Evento de submissão do formulário
        document.getElementById('connection-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveConnection();
        });
        
        // Evento para testar conexão
        document.getElementById('test-connection').addEventListener('click', () => {
            this.testConnection();
        });
    }

    showDynamicFields(dbType) {
        const dynamicFields = document.querySelector('.dynamic-fields');
        
        // Limpa os campos atuais
        dynamicFields.innerHTML = '';
        
        // Adiciona os campos específicos para cada tipo de banco
        if (dbType === 'sqlite') {
            dynamicFields.innerHTML = `
                <div class="form-group">
                    <label for="connection-database">Caminho do Arquivo</label>
                    <input type="text" id="connection-database" name="connection-database" 
                           placeholder="/caminho/para/meu_banco.db" required>
                </div>
            `;
        } else {
            dynamicFields.innerHTML = `
                <div class="form-group">
                    <label for="connection-host">Host</label>
                    <input type="text" id="connection-host" name="connection-host" 
                           placeholder="localhost" required>
                </div>
                
                <div class="form-group">
                    <label for="connection-port">Porta</label>
                    <input type="number" id="connection-port" name="connection-port" 
                           placeholder="${this.getDefaultPort(dbType)}">
                </div>
                
                <div class="form-group">
                    <label for="connection-username">Usuário</label>
                    <input type="text" id="connection-username" name="connection-username" 
                           placeholder="usuário">
                </div>
                
                <div class="form-group">
                    <label for="connection-password">Senha</label>
                    <input type="password" id="connection-password" name="connection-password" 
                           placeholder="senha">
                </div>
                
                <div class="form-group">
                    <label for="connection-database">Banco de Dados</label>
                    <input type="text" id="connection-database" name="connection-database" 
                           placeholder="nome_do_banco" required>
                </div>
                
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="connection-ssl" name="connection-ssl">
                    <label for="connection-ssl">Usar SSL</label>
                </div>
            `;
        }
        
        // Se estiver editando, preenche os campos
        if (this.currentConnection) {
            this.fillFormWithConnection(this.currentConnection);
        }
    }

    getDefaultPort(dbType) {
        const ports = {
            'mysql': 3306,
            'postgresql': 5432,
            'mssql': 1433,
            'oracle': 1521
        };
        
        return ports[dbType] || '';
    }

    fillFormWithConnection(connection) {
        document.getElementById('connection-name').value = connection.name;
        document.getElementById('connection-type').value = connection.type;
        
        if (connection.type === 'sqlite') {
            document.getElementById('connection-database').value = connection.database;
        } else {
            if (document.getElementById('connection-host')) {
                document.getElementById('connection-host').value = connection.host || '';
            }
            
            if (document.getElementById('connection-port')) {
                document.getElementById('connection-port').value = connection.port || '';
            }
            
            if (document.getElementById('connection-username')) {
                document.getElementById('connection-username').value = connection.username || '';
            }
            
            if (document.getElementById('connection-password')) {
                document.getElementById('connection-password').value = connection.password || '';
            }
            
            if (document.getElementById('connection-database')) {
                document.getElementById('connection-database').value = connection.database || '';
            }
            
            if (document.getElementById('connection-ssl')) {
                document.getElementById('connection-ssl').checked = connection.ssl || false;
            }
        }
    }

    getConnectionFromForm() {
        const name = document.getElementById('connection-name').value;
        const type = document.getElementById('connection-type').value;
        
        const connection = {
            name,
            type,
            database: document.getElementById('connection-database').value
        };
        
        if (type !== 'sqlite') {
            connection.host = document.getElementById('connection-host').value;
            connection.port = parseInt(document.getElementById('connection-port').value) || null;
            connection.username = document.getElementById('connection-username').value || null;
            connection.password = document.getElementById('connection-password').value || null;
            connection.ssl = document.getElementById('connection-ssl').checked;
        }
        
        return connection;
    }

    async saveConnection() {
        try {
            const connection = this.getConnectionFromForm();
            
            // Verifica se os dados da conexão estão válidos
            if (!connection.name || !connection.type) {
                throw new Error('Nome e tipo de conexão são obrigatórios');
            }
            
            // Mostra o overlay de loading
            this.showLoadingOverlay('Salvando configuração da conexão...');
            
            let isNewConnection = false;
            
            if (this.currentConnection) {
                // Atualiza a conexão existente
                await this.apiService.updateConnection(this.currentConnection.name, connection);
                
                // Remove o overlay de loading
                this.hideLoadingOverlay();
                
                new Notification({
                    title: 'Sucesso', 
                    message: `Conexão "${connection.name}" atualizada com sucesso`,
                    type: 'success'
                }).show();
            } else {
                // Cria uma nova conexão
                isNewConnection = true;
                await this.apiService.createConnection(connection);
                
                // Remove o overlay de loading apenas se não for ativar a conexão imediatamente
                if (!isNewConnection) {
                    this.hideLoadingOverlay();
                }
                
                new Notification({
                    title: 'Sucesso', 
                    message: `Conexão "${connection.name}" criada com sucesso`,
                    type: 'success'
                }).show();
            }
            
            // Limpa o formulário manualmente em vez de usar reset()
            this.clearConnectionForm();
            
            // Reseta a conexão atual
            this.currentConnection = null;
            
            // Se for uma nova conexão, define como ativa automaticamente
            if (isNewConnection) {
                await this.useConnection(connection.name);
            } else {
                // Muda para a tab de lista de conexões
                document.querySelector('[data-tab="connections-list"]').click();
            }
        } catch (error) {
            // Remove o overlay de loading em caso de erro
            this.hideLoadingOverlay();
            
            console.error('Erro ao salvar conexão:', error);
            
            new Notification({
                title: 'Erro', 
                message: `Erro ao salvar conexão: ${error.message}`,
                type: 'error'
            }).show();
        }
    }

    // Método para limpar o formulário manualmente
    clearConnectionForm() {
        // Limpa o campo de nome
        const nameInput = document.getElementById('connection-name');
        if (nameInput) nameInput.value = '';
        
        // Reseta o seletor de tipo
        const typeSelect = document.getElementById('connection-type');
        if (typeSelect) typeSelect.selectedIndex = 0;
        
        // Limpa os campos dinâmicos
        const dynamicFields = document.querySelector('.dynamic-fields');
        if (dynamicFields) dynamicFields.innerHTML = '';
    }

    async testConnection() {
        try {
            const connection = this.getConnectionFromForm();
            
            // Mostra o loading
            this.showLoadingOverlay('Testando conexão...');
            
            const result = await this.apiService.testConnection(connection);
            
            // Remove o loading
            this.hideLoadingOverlay();
            
            if (result.success) {
                new Notification({
                    title: 'Sucesso',
                    message: `Conexão bem-sucedida: ${result.message}`,
                    type: 'success'
                }).show();
            } else {
                new Notification({
                    title: 'Erro',
                    message: `Falha na conexão: ${result.message}`,
                    type: 'error'
                }).show();
            }
        } catch (error) {
            // Remove o loading
            this.hideLoadingOverlay();
            
            new Notification({
                title: 'Erro',
                message: `Erro ao testar conexão: ${error.message}`,
                type: 'error'
            }).show();
        }
    }

    async loadConnections() {
        try {
            // Mostra loading
            this.showLoadingOverlay('Carregando conexões...');
            
            const connections = await this.apiService.getConnections();
            const connectionsContainer = document.querySelector('.connections-list');
            const noConnectionsMessage = document.querySelector('.no-connections-message');
            
            connectionsContainer.innerHTML = '';
            
            // Remove loading
            this.hideLoadingOverlay();
            
            if (connections.length === 0) {
                noConnectionsMessage.style.display = 'flex';
                return;
            }
            
            noConnectionsMessage.style.display = 'none';
            
            connections.forEach(connection => {
                const connectionCard = document.createElement('div');
                connectionCard.className = 'connection-card';
                
                connectionCard.innerHTML = `
                    <div class="connection-header">
                        <div class="connection-icon">
                            <i class="fas fa-database"></i>
                        </div>
                        <div class="connection-info">
                            <h4>${connection.name}</h4>
                            <p>${this.getConnectionTypeLabel(connection.type)}</p>
                        </div>
                    </div>
                    <div class="connection-actions">
                        <button class="btn-icon edit-connection" data-connection="${connection.name}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-connection" data-connection="${connection.name}">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn-icon use-connection" data-connection="${connection.name}">
                            <i class="fas fa-plug"></i>
                        </button>
                    </div>
                `;
                
                connectionsContainer.appendChild(connectionCard);
                
                // Adiciona eventos
                connectionCard.querySelector('.edit-connection').addEventListener('click', () => {
                    this.editConnection(connection.name);
                });
                
                connectionCard.querySelector('.delete-connection').addEventListener('click', () => {
                    this.deleteConnection(connection.name);
                });
                
                connectionCard.querySelector('.use-connection').addEventListener('click', () => {
                    this.useConnection(connection.name);
                });
            });
        } catch (error) {
            // Remove loading
            this.hideLoadingOverlay();
            
            console.error('Erro ao carregar conexões:', error);
            
            new Notification({
                title: 'Erro', 
                message: `Erro ao carregar conexões: ${error.message}`,
                type: 'error'
            }).show();
        }
    }

    getConnectionTypeLabel(type) {
        const labels = {
            'mysql': 'MySQL',
            'postgresql': 'PostgreSQL',
            'sqlite': 'SQLite',
            'mssql': 'Microsoft SQL Server',
            'oracle': 'Oracle'
        };
        
        return labels[type] || type;
    }

    async editConnection(connectionName) {
        try {
            // Mostra loading
            this.showLoadingOverlay('Carregando detalhes da conexão...');
            
            const connection = await this.apiService.getConnection(connectionName);
            this.currentConnection = connection;
            
            // Remove loading
            this.hideLoadingOverlay();
            
            // Muda para a tab de formulário
            document.querySelector('[data-tab="connection-form"]').click();
            
            // Ajusta o tipo de banco de dados para mostrar os campos corretos
            document.getElementById('connection-type').value = connection.type;
            this.showDynamicFields(connection.type);
            
            // Preenche o formulário
            this.fillFormWithConnection(connection);
        } catch (error) {
            // Remove loading
            this.hideLoadingOverlay();
            
            console.error('Erro ao editar conexão:', error);
            
            new Notification({
                title: 'Erro', 
                message: `Erro ao editar conexão: ${error.message}`,
                type: 'error'
            }).show();
        }
    }

    async deleteConnection(connectionName) {
        try {
            if (confirm(`Tem certeza que deseja excluir a conexão "${connectionName}"?`)) {
                // Mostra loading
                this.showLoadingOverlay('Excluindo conexão...');
                
                await this.apiService.deleteConnection(connectionName);
                
                // Remove loading
                this.hideLoadingOverlay();
                
                new Notification({
                    title: 'Sucesso',
                    message: `Conexão "${connectionName}" excluída com sucesso`,
                    type: 'success'
                }).show();
                
                // Recarrega a lista de conexões
                this.loadConnections();
            }
        } catch (error) {
            // Remove loading
            this.hideLoadingOverlay();
            
            console.error('Erro ao excluir conexão:', error);
            
            new Notification({
                title: 'Erro',
                message: `Erro ao excluir conexão: ${error.message}`,
                type: 'error'
            }).show();
        }
    }

    async useConnection(connectionName) {
        try {
            // Adiciona um overlay de loading
            this.showLoadingOverlay('Conectando ao banco de dados...');
            
            // Importa o SQLService dinamicamente para evitar dependência circular
            const { SQLService } = await import('../services/SQLService.js');
            
            // Cria uma instância temporária para usar o método
            const sqlService = new SQLService();
            
            // Define a conexão ativa e carrega a estrutura do banco
            await sqlService.setActiveConnection(connectionName);
            
            // Atualiza o botão no header
            this.setActiveConnectionUI(connectionName);
            
            // Força a atualização da lista de tabelas
            const tableListElement = document.getElementById('tables-list');
            if (tableListElement && tableListElement.__component) {
                await tableListElement.__component.loadTables();
            }
            
            // Remove o overlay de loading
            this.hideLoadingOverlay();
            
            // Notifica o usuário do sucesso
            new Notification({
                type: 'success',
                message: `Conectado com sucesso a ${connectionName}`,
                duration: 3000
            }).show();
            
            // Mostra o botão de desconexão
            const disconnectBtn = document.getElementById('disconnect-db');
            if (disconnectBtn) {
                disconnectBtn.style.display = 'block';
            }
            
            // Fecha o modal
            document.getElementById('connection-modal').style.display = 'none';
            this.isModalOpen = false;
            
            return true;
        } catch (error) {
            // Remove o overlay de loading
            this.hideLoadingOverlay();
            
            // Notifica o usuário do erro
            new Notification({
                type: 'error',
                message: `Erro ao conectar: ${error.message}`,
                duration: 5000
            }).show();
            
            return false;
        }
    }
    
    // Adiciona um overlay de loading na tela
    showLoadingOverlay(message = 'Carregando...') {
        // Remove qualquer overlay existente primeiro
        this.hideLoadingOverlay();
        
        // Cria o overlay
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-message">${message}</div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    // Remove o overlay de loading
    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // Novo método para atualizar a UI quando uma conexão é definida como ativa
    setActiveConnectionUI(connectionName) {
        // Atualiza o botão no header
        const connectionBtn = document.getElementById('manage-connections');
        if (connectionBtn) {
            connectionBtn.innerHTML = `
                <i class="fas fa-database"></i>
                <span>${connectionName}</span>
            `;
            connectionBtn.classList.add('active-connection');
        }
    }

    openModal() {
        document.getElementById('connection-modal').style.display = 'block';
        this.isModalOpen = true;
        
        // Carrega as conexões
        this.loadConnections();
    }
} 