import { ApiService } from './ApiService.js';

export class SQLService {
    constructor() {
        this.joins = [];
        this.conditions = [];
        this.activeConnection = null;
        this.apiService = new ApiService();
    }

    generateSQL() {
        const tables = document.querySelectorAll('.query-element');

        if (tables.length === 0) {
            return 'Selecione tabelas para construir sua consulta';
        }

        let sql = 'SELECT ';

        // Coleta as colunas selecionadas
        const selectedColumns = [];
        tables.forEach(table => {
            const tableName = table.querySelector('strong').textContent;
            const checkboxes = table.querySelectorAll('input[type="checkbox"]:checked');

            checkboxes.forEach(checkbox => {
                selectedColumns.push(`${tableName}.${checkbox.value}`);
            });
        });

        if (selectedColumns.length === 0) {
            sql += '*';
        } else {
            sql += selectedColumns.join(', ');
        }

        sql += '\nFROM ';
        sql += Array.from(tables).map(table => table.querySelector('strong').textContent).join(', ');

        // Adiciona JOINs
        if (this.joins.length > 0) {
            this.joins.forEach(join => {
                // Verifica se o join usa o novo formato com múltiplas condições
                if (join.conditions && Array.isArray(join.conditions)) {
                    const conditionsString = join.conditions.map(cond =>
                        `${join.table1}.${cond.table1Column} = ${join.table2}.${cond.table2Column}`
                    ).join(' AND ');

                    sql += `\n${join.type} JOIN ${join.table2} ON ${conditionsString}`;
                } else {
                    // Compatibilidade com formato antigo
                    sql += `\n${join.type} JOIN ${join.table2} ON ${join.table1}.${join.column1} = ${join.table2}.${join.column2}`;
                }
            });
        }

        // Adiciona condições WHERE
        if (this.conditions.length > 0) {
            sql += '\nWHERE ';
            sql += this.conditions.map(cond =>
                `${cond.table}.${cond.column} ${cond.operator} '${cond.value}'`
            ).join(' AND ');
        }

        return sql;
    }

    addJoin(joinData) {
        this.joins.push(joinData);
    }

    removeJoin(joinId) {
        this.joins = this.joins.filter(join => join.id !== joinId);
    }

    addCondition(conditionData) {
        this.conditions.push(conditionData);
    }

    removeCondition(conditionId) {
        this.conditions = this.conditions.filter(condition => condition.id !== conditionId);
    }

    clearAll() {
        this.joins = [];
        this.conditions = [];
    }
    
    // Métodos para integração com a API
    
    async setActiveConnection(connectionName) {
        // Se já houver uma conexão ativa, desconecta primeiro
        if (this.activeConnection) {
            this.disconnect();
        }
        
        this.activeConnection = connectionName;
        
        // Mostra o botão de desconexão
        const disconnectBtn = document.getElementById('disconnect-db');
        if (disconnectBtn) {
            disconnectBtn.style.display = 'block';
        }
        
        // Carrega a estrutura do banco ao definir a conexão e retorna uma promessa
        return this.loadDatabaseStructure(connectionName);
    }
    
    // Novo método para carregar a estrutura do banco
    async loadDatabaseStructure(connectionName) {
        try {
            console.log(`SQLService: Carregando estrutura do banco para conexão "${connectionName}"`);
            
            // Obtém a estrutura do banco através da API
            const result = await this.apiService.getDatabaseStructure(connectionName);
            
            // Verifica se a estrutura foi obtida com sucesso
            if (!result || !result.tables) {
                console.error('SQLService: Estrutura do banco inválida:', result);
                throw new Error('Não foi possível obter a estrutura do banco de dados');
            }
            
            console.log(`SQLService: Estrutura carregada com sucesso (${result.tables.length} tabelas)`);
            
            // Força atualização da interface
            setTimeout(() => {
                const tableListElement = document.getElementById('tables-list');
                if (tableListElement && tableListElement.__component && typeof tableListElement.__component.loadTables === 'function') {
                    console.log('SQLService: Forçando atualização da UI da lista de tabelas');
                    tableListElement.__component.loadTables();
                }
            }, 100);
            
            return result;
        } catch (error) {
            console.error('SQLService: Erro ao carregar estrutura do banco:', error);
            throw error;
        }
    }
    
    async executeQuery(query = null) {
        if (!this.activeConnection) {
            throw new Error('Nenhuma conexão ativa. Por favor, conecte-se a um banco de dados.');
        }
        
        // Se nenhuma consulta foi fornecida, usa a gerada pelo builder
        const sqlQuery = query || this.generateSQL();
        
        try {
            return await this.apiService.executeQuery(this.activeConnection, sqlQuery);
        } catch (error) {
            console.error('Erro ao executar consulta:', error);
            throw error;
        }
    }

    disconnect() {
        this.activeConnection = null;
        this.joins = [];
        this.conditions = [];
        
        // Limpa as tabelas da interface
        const tableListElement = document.getElementById('tables-list');
        if (tableListElement && tableListElement.__component) {
            // Limpa o modelo de dados
            if (window.updateDatabaseTables) {
                window.updateDatabaseTables([]);
            }
            
            // Força atualização da interface
            tableListElement.__component.loadTables();
        }
        
        // Esconde o botão de desconexão
        const disconnectBtn = document.getElementById('disconnect-db');
        if (disconnectBtn) {
            disconnectBtn.style.display = 'none';
        }
        
        // Limpa a área de construção de query
        const queryCanvas = document.getElementById('query-canvas');
        if (queryCanvas) {
            queryCanvas.innerHTML = '';
        }
        
        // Limpa a prévia SQL
        const sqlPreview = document.getElementById('sql-preview');
        if (sqlPreview) {
            sqlPreview.textContent = '';
        }
        
        // Mostra a mensagem de "sem tabelas"
        const noTablesMessage = document.getElementById('no-tables-message');
        if (noTablesMessage) {
            noTablesMessage.style.display = 'flex';
        }
        
        return true;
    }
} 