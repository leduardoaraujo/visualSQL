import { TableList } from './components/TableList.js';
import { QueryBuilder } from './components/QueryBuilder.js';
import { SQLService } from './services/SQLService.js';
import { ConnectionManager } from './components/ConnectionManager.js';
import { DatabaseService } from './services/DatabaseService.js';

class App {
    constructor() {
        // Inicializa o serviço de banco de dados
        this.databaseService = new DatabaseService();
        
        // Inicializa os componentes da UI
        this.tableList = new TableList('tables-list');
        this.sqlService = new SQLService();
        this.queryBuilder = new QueryBuilder(this.sqlService);
        this.connectionManager = new ConnectionManager();
        
        // Configura a conexão padrão, se houver
        this.setupDefaultConnection();
        
        // Adiciona o evento de desconexão
        this.setupDisconnectEvent();
    }

    setupDisconnectEvent() {
        const disconnectBtn = document.getElementById('disconnect-db');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => {
                this.sqlService.disconnect();
                
                // Notifica o usuário
                new Notification({
                    type: 'info',
                    message: 'Desconectado do banco de dados',
                    duration: 3000
                }).show();
            });
        }
    }

    async setupDefaultConnection() {
        try {
            // Verifica se existe alguma conexão
            const connections = this.databaseService.getConnections();
            
            if (connections.length > 0) {
                // Define a primeira conexão como ativa
                const defaultConnection = connections[0];
                console.log('App: Configurando conexão padrão:', defaultConnection.name);
                
                // Mostra um indicador de loading
                this.connectionManager.showLoadingOverlay('Conectando ao banco de dados...');
                
                // Carrega a estrutura do banco
                try {
                    await this.sqlService.setActiveConnection(defaultConnection.name);
                    
                    // Atualiza o estado visual da conexão no gerenciador
                    if (typeof this.connectionManager.setActiveConnectionUI === 'function') {
                        this.connectionManager.setActiveConnectionUI(defaultConnection.name);
                    }
                    
                    // Mostra o botão de desconexão
                    const disconnectBtn = document.getElementById('disconnect-db');
                    if (disconnectBtn) {
                        disconnectBtn.style.display = 'block';
                    }
                    
                    // Esconde a mensagem de "sem tabelas"
                    const noTablesMessage = document.getElementById('no-tables-message');
                    if (noTablesMessage) {
                        noTablesMessage.style.display = 'none';
                    }
                } catch (connError) {
                    console.error('App: Erro ao configurar conexão padrão:', connError);
                }
                
                // Remove o overlay de loading
                this.connectionManager.hideLoadingOverlay();
            } else {
                console.log('App: Nenhuma conexão encontrada, criando conexão de exemplo');
                // Não há conexões, carrega os dados de exemplo padrão
                await this.loadDefaultExampleData();
            }
        } catch (error) {
            console.error('App: Erro ao configurar conexão padrão:', error);
            // Remove qualquer loading
            this.connectionManager.hideLoadingOverlay();
            // Carrega as tabelas padrão mesmo em caso de erro
            this.tableList.loadTables();
        }
    }
    
    async loadDefaultExampleData() {
        // Cria uma conexão de exemplo para demonstração
        const exampleConnection = {
            name: 'SQLite de Exemplo',
            type: 'sqlite',
            path: ':memory:',
            description: 'Banco de dados SQLite de exemplo com tabelas de usuários e notas'
        };
        
        try {
            // Adiciona a conexão de exemplo
            this.databaseService.createConnection(exampleConnection);
            
            // Mostra um indicador de loading
            this.connectionManager.showLoadingOverlay('Conectando à conexão de exemplo...');
            
            // Define como ativa e carrega a estrutura do banco
            await this.sqlService.setActiveConnection(exampleConnection.name);
            
            // Atualiza o estado visual
            if (typeof this.connectionManager.setActiveConnectionUI === 'function') {
                this.connectionManager.setActiveConnectionUI(exampleConnection.name);
            }
            
            // Remove o overlay de loading
            this.connectionManager.hideLoadingOverlay();
        } catch (error) {
            console.error('App: Erro ao criar conexão de exemplo:', error);
            // Remove qualquer loading
            this.connectionManager.hideLoadingOverlay();
            // Carrega as tabelas padrão mesmo sem conexão
            this.tableList.loadTables();
        }
    }

    init() {
        // Inicializa o componente de tabelas (será preenchido quando a estrutura do banco for carregada)
        this.tableList.loadTables();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
}); 