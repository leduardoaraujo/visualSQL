export const database = {
    tables: []
};

/**
 * Atualiza as tabelas do banco de dados com dados da API
 * @param {Array} tables - Lista de tabelas obtidas da API
 */
window.updateDatabaseTables = function(tables) {
    console.log('Database: Atualizando tabelas do banco de dados:', tables);
    
    if (!Array.isArray(tables)) {
        console.error('Database: updateDatabaseTables - o parâmetro tables deve ser um array');
        database.tables = [];
        return;
    }
    
    // Converte as tabelas do formato da API para o formato interno
    const formattedTables = tables.map(table => {
        // Verifica se a tabela tem o formato correto
        if (!table || typeof table !== 'object') {
            console.warn('Database: updateDatabaseTables - formato de tabela inválido', table);
            return null;
        }
        
        // Se columns for um array de objetos, extrai apenas os nomes
        let columns = [];
        if (Array.isArray(table.columns)) {
            columns = table.columns.map(col => {
                if (typeof col === 'string') {
                    return col;
                } else if (typeof col === 'object' && col !== null && 'name' in col) {
                    return col.name;
                } else {
                    console.warn('Database: formato de coluna inválido', col);
                    return 'coluna_desconhecida';
                }
            });
        }
        
        return {
            name: table.name || 'tabela_sem_nome',
            columns: columns
        };
    }).filter(table => table !== null); // Remove tabelas inválidas
    
    console.log('Database: Tabelas formatadas:', formattedTables);
    
    // Atualiza as tabelas no objeto database
    database.tables = formattedTables;
    
    // Atualiza a UI, se o componente TableList estiver disponível
    setTimeout(() => {
        const tableListElement = document.getElementById('tables-list');
        if (tableListElement && tableListElement.__component && tableListElement.__component.loadTables) {
            console.log('Database: Atualizando UI da lista de tabelas');
            tableListElement.__component.loadTables();
        } else {
            console.warn('Database: Não foi possível atualizar a UI da lista de tabelas');
        }
    }, 0);
};

// Quando o componente TableList é inicializado, armazena a referência ao componente no elemento DOM
document.addEventListener('DOMContentLoaded', () => {
    const tableListElement = document.getElementById('tables-list');
    if (tableListElement) {
        // Observa a criação do componente TableList
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && tableListElement.__component) {
                    // Já existe uma referência, não precisa fazer nada
                    return;
                }
            });
        });
        
        observer.observe(tableListElement, { childList: true });
    }
}); 