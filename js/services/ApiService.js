import { DatabaseService } from './DatabaseService.js';

/**
 * Serviço para comunicação com o backend (agora implementado diretamente em JS)
 */
export class ApiService {
    constructor() {
        this.dbService = new DatabaseService();
    }

    /**
     * Obtém a lista de conexões cadastradas
     * @returns {Promise<Array>} - Lista de conexões
     */
    async getConnections() {
        return this.dbService.getConnections();
    }

    /**
     * Cria uma nova conexão
     * @param {Object} connectionConfig - Configuração da conexão
     * @returns {Promise<Object>} - Resposta 
     */
    async createConnection(connectionConfig) {
        return this.dbService.createConnection(connectionConfig);
    }

    /**
     * Atualiza uma conexão existente
     * @param {string} name - Nome da conexão
     * @param {Object} connectionConfig - Nova configuração
     * @returns {Promise<Object>} - Resposta 
     */
    async updateConnection(name, connectionConfig) {
        return this.dbService.updateConnection(name, connectionConfig);
    }

    /**
     * Remove uma conexão
     * @param {string} name - Nome da conexão
     * @returns {Promise<Object>} - Resposta 
     */
    async deleteConnection(name) {
        return this.dbService.deleteConnection(name);
    }

    /**
     * Testa uma configuração de conexão
     * @param {Object} connectionConfig - Configuração a testar
     * @returns {Promise<Object>} - Resultado do teste
     */
    async testConnection(connectionConfig) {
        return this.dbService.testConnection(connectionConfig);
    }

    /**
     * Obtém a estrutura de um banco de dados
     * @param {string} connectionName - Nome da conexão
     * @returns {Promise<Object>} - Estrutura do banco
     */
    async getDatabaseStructure(connectionName) {
        try {
            console.log(`ApiService: Obtendo estrutura do banco para conexão "${connectionName}"`);
            
            const result = await this.dbService.getDatabaseStructure(connectionName);
            
            // Verifica se a estrutura foi obtida corretamente
            if (!result || !result.tables || !Array.isArray(result.tables)) {
                console.error('Estrutura do banco inválida:', result);
                throw new Error('Estrutura do banco inválida');
            }
            
            console.log(`ApiService: Recebeu ${result.tables.length} tabelas para a conexão "${connectionName}"`);
            
            // Atualiza o modelo de dados da aplicação com as tabelas e colunas
            if (typeof window.updateDatabaseTables === 'function') {
                console.log('ApiService: Atualizando tabelas no modelo Database');
                window.updateDatabaseTables(result.tables);
            } else {
                console.error('ApiService: A função updateDatabaseTables não está disponível');
            }
            
            return result;
        } catch (error) {
            console.error('ApiService: Erro ao obter estrutura do banco:', error);
            throw error;
        }
    }

    /**
     * Executa uma consulta SQL
     * @param {string} connectionName - Nome da conexão a utilizar
     * @param {string} query - Consulta SQL
     * @param {Object} params - Parâmetros da consulta (opcional)
     * @returns {Promise<Object>} - Resultado da consulta
     */
    async executeQuery(connectionName, query, params = null) {
        return this.dbService.executeQuery(connectionName, query, params);
    }

    /**
     * Obtém uma conexão específica pelo nome
     * @param {string} name - Nome da conexão
     * @returns {Promise<Object>} - Detalhes da conexão
     */
    async getConnection(name) {
        const connection = this.dbService.getConnections().find(conn => conn.name === name);
        
        if (!connection) {
            throw new Error(`Conexão '${name}' não encontrada`);
        }
        
        return connection;
    }
} 