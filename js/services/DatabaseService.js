/**
 * Serviço para gerenciar conexões de banco de dados e executar consultas SQL diretamente no navegador
 * Utiliza o SQLite.js como driver para o SQL no browser
 */
export class DatabaseService {
    constructor() {
        this.connections = [];
        this.activeConnection = null;
        this.loadConnections();
    }

    /**
     * Carrega as conexões salvas no localStorage
     */
    loadConnections() {
        try {
            const saved = localStorage.getItem('db_connections');
            if (saved) {
                this.connections = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Erro ao carregar conexões:', error);
            this.connections = [];
        }
    }

    /**
     * Salva as conexões no localStorage
     */
    saveConnections() {
        try {
            localStorage.setItem('db_connections', JSON.stringify(this.connections));
        } catch (error) {
            console.error('Erro ao salvar conexões:', error);
        }
    }

    /**
     * Obtém todas as conexões cadastradas
     * @returns {Array} Lista de conexões
     */
    getConnections() {
        return this.connections;
    }

    /**
     * Cria uma nova conexão
     * @param {Object} connectionConfig Configuração da conexão
     * @returns {Object} Nova conexão
     */
    createConnection(connectionConfig) {
        // Verifica se já existe uma conexão com este nome
        if (this.connections.some(conn => conn.name === connectionConfig.name)) {
            throw new Error(`Já existe uma conexão com o nome '${connectionConfig.name}'`);
        }

        // Adiciona a nova conexão
        this.connections.push(connectionConfig);
        this.saveConnections();
        return connectionConfig;
    }

    /**
     * Atualiza uma conexão existente
     * @param {string} name Nome da conexão a atualizar
     * @param {Object} connectionConfig Nova configuração
     * @returns {Object} Conexão atualizada
     */
    updateConnection(name, connectionConfig) {
        const index = this.connections.findIndex(conn => conn.name === name);
        if (index === -1) {
            throw new Error(`Conexão '${name}' não encontrada`);
        }

        this.connections[index] = connectionConfig;
        this.saveConnections();
        return connectionConfig;
    }

    /**
     * Remove uma conexão
     * @param {string} name Nome da conexão a remover
     * @returns {boolean} true se removida com sucesso
     */
    deleteConnection(name) {
        const initialLength = this.connections.length;
        this.connections = this.connections.filter(conn => conn.name !== name);
        
        if (this.connections.length === initialLength) {
            throw new Error(`Conexão '${name}' não encontrada`);
        }

        // Se a conexão ativa foi removida, desativa
        if (this.activeConnection && this.activeConnection.name === name) {
            this.activeConnection = null;
        }

        this.saveConnections();
        return true;
    }

    /**
     * Define a conexão ativa
     * @param {string} name Nome da conexão
     * @returns {Object} Conexão ativa
     */
    setActiveConnection(name) {
        const connection = this.connections.find(conn => conn.name === name);
        if (!connection) {
            throw new Error(`Conexão '${name}' não encontrada`);
        }

        this.activeConnection = connection;
        return connection;
    }

    /**
     * Testa uma configuração de conexão (simulada)
     * @param {Object} connectionConfig Configuração a testar
     * @returns {Object} Resultado do teste
     */
    async testConnection(connectionConfig) {
        // Como estamos simulando conexões, sempre retorna sucesso
        return {
            success: true,
            message: 'Conexão estabelecida com sucesso'
        };
    }

    /**
     * Obtém a estrutura do banco de dados
     * @param {string} connectionName Nome da conexão
     * @returns {Object} Estrutura do banco (tabelas e colunas)
     */
    async getDatabaseStructure(connectionName) {
        // Para fins de demonstração, retorna dados simulados
        // Em uma implementação real, isso conectaria ao banco e obteria a estrutura
        
        console.log(`DatabaseService: Obtendo estrutura para conexão: ${connectionName}`);
        
        // Obtém as tabelas simuladas
        const tables = this.getSimulatedTables();
        
        // Certifica-se de que as tabelas tenham o formato correto
        const formattedTables = tables.map(table => {
            return {
                name: table.name,
                columns: table.columns
            };
        });
        
        console.log(`DatabaseService: Retornando ${formattedTables.length} tabelas para a conexão "${connectionName}"`);
        
        // Simula um atraso na rede para mostrar o loading
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return {
            tables: formattedTables
        };
    }

    /**
     * Retorna um conjunto de tabelas simuladas com base no tipo de exemplo
     * @param {string} exampleType Tipo de exemplo (loja, rh, padrao)
     * @returns {Array} Lista de tabelas simuladas
     */
    getSimulatedTables(exampleType = 'padrao') {
        // Agora temos apenas um conjunto de tabelas de exemplo para SQLite
        return [
            {
                name: 'usuarios',
                columns: [
                    { name: 'id', type: 'INTEGER', primary_key: true },
                    { name: 'nome', type: 'TEXT' },
                    { name: 'email', type: 'TEXT' },
                    { name: 'senha', type: 'TEXT' },
                    { name: 'data_criacao', type: 'DATETIME' }
                ]
            },
            {
                name: 'notas',
                columns: [
                    { name: 'id', type: 'INTEGER', primary_key: true },
                    { name: 'titulo', type: 'TEXT' },
                    { name: 'conteudo', type: 'TEXT' },
                    { name: 'usuario_id', type: 'INTEGER', foreign_key: true, references: 'usuarios.id' },
                    { name: 'data_criacao', type: 'DATETIME' },
                    { name: 'data_atualizacao', type: 'DATETIME' }
                ]
            }
        ];
    }

    /**
     * Executa uma consulta SQL (simulada)
     * @param {string} connectionName Nome da conexão a utilizar
     * @param {string} query Consulta SQL
     * @param {Object} params Parâmetros da consulta (opcional)
     * @returns {Object} Resultado simulado da consulta
     */
    async executeQuery(connectionName, query, params = null) {
        // Análise simples do SQL para decidir o que retornar
        query = query.toLowerCase();
        
        if (query.includes('select') && !query.includes('count(')) {
            // É uma consulta SELECT (retorna múltiplas linhas)
            return {
                success: true,
                rows: this.generateMockData(query, 10),
                rowCount: 10,
                fields: this.extractFieldsFromQuery(query)
            };
        } else if (query.includes('select') && query.includes('count(')) {
            // É uma consulta COUNT
            return {
                success: true,
                rows: [{ count: Math.floor(Math.random() * 100) + 1 }],
                rowCount: 1,
                fields: [{ name: 'count', type: 'INTEGER' }]
            };
        } else if (query.includes('insert') || query.includes('update') || query.includes('delete')) {
            // É uma operação de modificação
            return {
                success: true,
                rowsAffected: Math.floor(Math.random() * 5) + 1,
                message: 'Operação executada com sucesso'
            };
        } else {
            // Outros tipos de consulta
            return {
                success: true,
                message: 'Consulta executada com sucesso'
            };
        }
    }

    /**
     * Extrai os campos da consulta SQL para simular as colunas retornadas
     * @param {string} query Consulta SQL
     * @returns {Array} Lista de campos
     */
    extractFieldsFromQuery(query) {
        // Análise simples para extrair colunas 
        const selectMatch = query.match(/select\s+(.+?)\s+from/i);
        if (!selectMatch) return [];
        
        let columns = selectMatch[1].split(',').map(col => col.trim());
        
        // Substitui '*' por colunas simuladas
        if (columns.includes('*')) {
            const tableMatch = query.match(/from\s+([a-z0-9_]+)/i);
            if (tableMatch) {
                const tableName = tableMatch[1];
                // Procura a tabela nas tabelas simuladas
                for (const exampleType in ['loja', 'rh', 'padrao']) {
                    const tables = this.getSimulatedTables(exampleType);
                    const table = tables.find(t => t.name === tableName);
                    if (table) {
                        columns = table.columns.map(col => col.name);
                        break;
                    }
                }
            }
            
            // Se não encontrou uma tabela específica, usa colunas genéricas
            if (columns.includes('*')) {
                columns = ['id', 'nome', 'descricao', 'data_criacao'];
            }
        }
        
        // Converte para formato de campos
        return columns.map(col => {
            const colName = col.split(' as ').pop().split('.').pop();
            return { 
                name: colName,
                type: colName.includes('id') ? 'INTEGER' : 
                      colName.includes('data') ? 'DATETIME' :
                      colName.includes('preco') || colName.includes('valor') ? 'DECIMAL' :
                      'VARCHAR'
            };
        });
    }

    /**
     * Gera dados simulados para uma consulta
     * @param {string} query Consulta SQL 
     * @param {number} count Número de linhas a gerar
     * @returns {Array} Linhas de dados simulados
     */
    generateMockData(query, count) {
        const fields = this.extractFieldsFromQuery(query);
        const rows = [];
        
        for (let i = 0; i < count; i++) {
            const row = {};
            fields.forEach(field => {
                switch (field.type) {
                    case 'INTEGER':
                        row[field.name] = i + 1;
                        break;
                    case 'DECIMAL':
                        row[field.name] = parseFloat((Math.random() * 1000).toFixed(2));
                        break;
                    case 'DATETIME':
                    case 'DATE':
                        const date = new Date();
                        date.setDate(date.getDate() - Math.floor(Math.random() * 100));
                        row[field.name] = date.toISOString().split('T')[0];
                        break;
                    default:
                        // VARCHAR ou TEXT
                        row[field.name] = `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} ${i + 1}`;
                }
            });
            rows.push(row);
        }
        
        return rows;
    }

    /**
     * Obtém uma conexão específica pelo nome
     * @param {string} name Nome da conexão
     * @returns {Object} Detalhes da conexão
     */
    getConnection(name) {
        const connection = this.connections.find(conn => conn.name === name);
        if (!connection) {
            throw new Error(`Conexão '${name}' não encontrada`);
        }
        return connection;
    }
} 