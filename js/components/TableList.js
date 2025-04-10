import { database } from '../models/Database.js';

export class TableList {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.tables = [];
        this.initSearchBar();
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

        // Define um limite de tabelas para decidir se deve expandir ou não
        const LIMITE_TABELAS_EXPANDIDAS = 3;
        const deveExpandir = database.tables.length <= LIMITE_TABELAS_EXPANDIDAS;

        database.tables.forEach(table => {
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
                        ${table.columns.length}
                    </div>
                </div>
                <div class="columns ${deveExpandir ? 'expanded' : ''}">
                    ${table.columns.map(col => `<div>${col}</div>`).join('')}
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
        if (searchInput.value) {
            this.filterTables(searchInput.value);
        }
    }
} 