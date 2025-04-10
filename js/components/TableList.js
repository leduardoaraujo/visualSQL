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

        database.tables.forEach(table => {
            const tableElement = document.createElement('div');
            tableElement.className = 'draggable-table';
            tableElement.draggable = true;
            tableElement.innerHTML = `
                <strong>${table.name}</strong>
                <div class="columns">
                    ${table.columns.map(col => `<div>${col}</div>`).join('')}
                </div>
            `;
            
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