import { database } from '../models/Database.js';

export class TableList {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.tables = [];
        this.initSearchBar();
        
        // Armazena referência ao componente no elemento DOM
        if (this.container) {
            this.container.__component = this;
        }
    }

    initSearchBar() {
        const searchInput = document.getElementById('table-search');
        searchInput.addEventListener('input', () => this.filterTables(searchInput.value));
    }

    filterTables(searchTerm) {
        const normalizedSearch = searchTerm.toLowerCase().trim();
        
        this.tables.forEach(tableElement => {
            const tableName = tableElement.querySelector('strong').textContent.toLowerCase();
            
            if (tableName.includes(normalizedSearch)) {
                tableElement.classList.remove('table-hidden');
            } else {
                tableElement.classList.add('table-hidden');
            }
        });
    }

    loadTables() {
        // Limpa a lista existente
        this.container.innerHTML = '';
        this.tables = [];

        console.log('TableList.loadTables: Carregando tabelas', database.tables);

        if (!Array.isArray(database.tables) || database.tables.length === 0) {
            this.container.innerHTML = `
                <div class="empty-tables-message">
                    <i class="fas fa-database"></i>
                    <p>Nenhuma tabela disponível. Conecte-se a um banco de dados para visualizar as tabelas.</p>
                </div>
            `;
            return;
        }

        // Define um limite de tabelas para decidir se deve expandir ou não
        const LIMITE_TABELAS_EXPANDIDAS = 3;
        const deveExpandir = database.tables.length <= LIMITE_TABELAS_EXPANDIDAS;

        database.tables.forEach(table => {
            // Verifica se a tabela tem o formato esperado
            if (!table || typeof table !== 'object' || !table.name) {
                console.warn('TableList.loadTables: Formato de tabela inválido', table);
                return;
            }

            // Certifica-se de que columns seja um array
            const columns = Array.isArray(table.columns) ? table.columns : [];

            const tableElement = document.createElement('div');
            tableElement.className = 'draggable-table';
            tableElement.draggable = true;
            tableElement.innerHTML = `
                <div class="table-header">
                    <div class="table-header-left">
                        <button class="expand-btn ${deveExpandir ? 'expanded' : ''}" title="Expandir/Recolher">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <strong>${table.name}</strong>
                    </div>
                    <div class="table-header-right" title="Número de colunas">
                        <i class="fas fa-columns"></i>
                        ${columns.length}
                    </div>
                </div>
                <div class="columns ${deveExpandir ? 'expanded' : ''}">
                    ${columns.map(col => `<div>${col}</div>`).join('')}
                </div>
            `;
            
            // Adiciona evento de expansão
            const expandBtn = tableElement.querySelector('.expand-btn');
            const columnsDiv = tableElement.querySelector('.columns');
            
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Previne que o evento afete o drag and drop
                expandBtn.classList.toggle('expanded');
                columnsDiv.classList.toggle('expanded');
            });
            
            tableElement.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', table.name);
            });
            
            this.container.appendChild(tableElement);
            this.tables.push(tableElement);
        });

        // Aplica o filtro atual, se houver
        const searchInput = document.getElementById('table-search');
        if (searchInput && searchInput.value) {
            this.filterTables(searchInput.value);
        }
    }
} 