import { database } from '../models/Database.js';
import { Notification } from '../utils/Notification.js';

export class QueryBuilder {
    constructor(sqlService) {
        this.sqlService = sqlService;
        this.joins = [];
        this.conditions = [];
        this.initQueryCanvas();
        this.initEventListeners();
        this.updateButtonsState();
    }

    initQueryCanvas() {
        const queryCanvas = document.getElementById('query-canvas');

        queryCanvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            queryCanvas.classList.add('drag-over');
        });

        queryCanvas.addEventListener('dragleave', () => {
            queryCanvas.classList.remove('drag-over');
        });

        queryCanvas.addEventListener('drop', (e) => {
            e.preventDefault();
            queryCanvas.classList.remove('drag-over');

            const tableName = e.dataTransfer.getData('text/plain');
            const table = database.tables.find(t => t.name === tableName);

            if (table) {
                this.addTableToQuery(table);
            }
        });
    }

    initEventListeners() {
        document.getElementById('add-join').onclick = () => this.showJoinModal();
        document.getElementById('add-where').onclick = () => this.showWhereModal();
        document.getElementById('clear-query').onclick = () => this.clearQuery();
        document.getElementById('copy-sql').onclick = () => this.copySQL();
        document.getElementById('export-sql').onclick = () => this.exportSQL();

        // Eventos para o modal de JOIN
        document.getElementById('close-join-modal').onclick = () => {
            document.getElementById('join-modal').style.display = 'none';
        };

        document.getElementById('cancel-join').onclick = () => {
            document.getElementById('join-modal').style.display = 'none';
        };

        document.getElementById('join-table1').onchange = () => {
            this.updateColumnSelects(
                document.getElementById('join-table1').value,
                document.getElementById('join-table2').value
            );
        };

        document.getElementById('join-table2').onchange = () => {
            this.updateColumnSelects(
                document.getElementById('join-table1').value,
                document.getElementById('join-table2').value
            );
        };

        document.getElementById('confirm-join').onclick = () => {
            const selectedType = document.querySelector('input[name="join-type"]:checked');
            if (!selectedType) {
                new Notification('Erro', 'Selecione um tipo de JOIN', 'error');
                return;
            }

            const joinData = {
                id: `join-${Date.now()}`,
                type: selectedType.value,
                table1: document.getElementById('join-table1').value,
                table2: document.getElementById('join-table2').value,
                column1: document.getElementById('join-column1').value,
                column2: document.getElementById('join-column2').value
            };

            if (!joinData.table1 || !joinData.table2 || !joinData.column1 || !joinData.column2) {
                new Notification('Erro', 'Preencha todos os campos do JOIN', 'error');
                return;
            }

            this.addJoin(joinData);
            document.getElementById('join-modal').style.display = 'none';
            new Notification('JOIN Adicionado', 'JOIN configurado com sucesso');
        };

        // Eventos para o modal de WHERE
        document.getElementById('cancel-where').onclick = () => {
            document.getElementById('where-modal').style.display = 'none';
        };

        document.getElementById('where-table').onchange = () => {
            this.updateWhereColumns(document.getElementById('where-table').value);
        };

        document.getElementById('confirm-where').onclick = () => {
            const conditionData = {
                id: `condition-${Date.now()}`,
                table: document.getElementById('where-table').value,
                column: document.getElementById('where-column').value,
                operator: document.getElementById('where-operator').value,
                value: document.getElementById('where-value').value
            };

            this.addCondition(conditionData);
            document.getElementById('where-modal').style.display = 'none';
            new Notification('Condição Adicionada', 'Condição WHERE adicionada com sucesso');
        };
    }

    updateButtonsState() {
        const hasElements = document.querySelectorAll('.query-element').length > 0;
        
        // Botões que devem ser desabilitados quando não há elementos
        const buttons = [
            'add-join',
            'add-where',
            'clear-query',
            'copy-sql',
            'export-sql'
        ];
        
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = !hasElements;
                button.classList.toggle('btn-disabled', !hasElements);
            }
        });
    }

    addTableToQuery(table) {
        const queryCanvas = document.getElementById('query-canvas');

        const existingTable = document.querySelector(`[data-table-name="${table.name}"]`);
        if (existingTable) {
            new Notification('Tabela Duplicada', `A tabela ${table.name} já está presente na consulta`, 'warning');
            return;
        }

        let timelineContainer = queryCanvas.querySelector('.timeline-container');
        if (!timelineContainer) {
            timelineContainer = document.createElement('div');
            timelineContainer.className = 'timeline-container';
            queryCanvas.appendChild(timelineContainer);
        }

        const tableElement = this.createTableElement(table);
        timelineContainer.appendChild(tableElement);
        this.updateSQLPreview();
        this.updateButtonsState();
    }

    createTableElement(table) {
        const tableElement = document.createElement('div');
        tableElement.className = 'query-element';
        tableElement.dataset.tableName = table.name;
        tableElement.innerHTML = `
            <div class="table-header">
                <strong>${table.name}</strong>
                <div class="table-header-actions">
                    <button class="table-action-btn select-all-btn" title="Selecionar todas as colunas">
                        <i class="fas fa-asterisk"></i>
                    </button>
                    <button class="table-action-btn remove-btn" title="Remover tabela">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="columns">
                ${table.columns.map(col => `
                    <label>
                        <input type="checkbox" value="${col}">
                        ${col}
                    </label>
                `).join('')}
            </div>
        `;

        const removeBtn = tableElement.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => this.removeTable(table.name, tableElement));

        const selectAllBtn = tableElement.querySelector('.select-all-btn');
        selectAllBtn.addEventListener('click', () => {
            const checkboxes = tableElement.querySelectorAll('input[type="checkbox"]');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = !allChecked;
            });
            
            this.updateSQLPreview();
            
            new Notification(
                !allChecked ? 'Todas as colunas selecionadas' : 'Todas as colunas desmarcadas',
                `${!allChecked ? 'Selecionadas' : 'Desmarcadas'} todas as colunas da tabela ${table.name}`
            );
        });

        const checkboxes = tableElement.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSQLPreview());
        });

        return tableElement;
    }

    removeTable(tableName, element) {
        // Remove JOINs associados a esta tabela
        const relatedJoins = this.sqlService.joins.filter(join =>
            join.table1 === tableName || join.table2 === tableName
        );

        relatedJoins.forEach(join => {
            const joinElement = document.getElementById(join.id);
            if (joinElement) joinElement.remove();
            this.sqlService.removeJoin(join.id);
        });

        // Remove as condições WHERE associadas a esta tabela
        const relatedConditions = this.sqlService.conditions.filter(condition =>
            condition.table === tableName
        );

        relatedConditions.forEach(condition => {
            const conditionElement = document.getElementById(condition.id);
            if (conditionElement) conditionElement.remove();
            this.sqlService.removeCondition(condition.id);
        });

        element.remove();
        this.updateSQLPreview();
        this.updateButtonsState();
        new Notification('Tabela Removida', `A tabela ${tableName} e suas dependências foram removidas`);
    }

    showJoinModal() {
        const modal = document.getElementById('join-modal');
        const table1Select = document.getElementById('join-table1');
        const table2Select = document.getElementById('join-table2');

        // Limpa selects
        table1Select.innerHTML = '';
        table2Select.innerHTML = '';

        // Preenche selects com tabelas disponíveis
        const tables = Array.from(document.querySelectorAll('.query-element')).map(el => el.dataset.tableName);

        if (tables.length < 2) {
            new Notification('Erro', 'Você precisa adicionar pelo menos duas tabelas antes de criar um JOIN', 'error');
            return;
        }

        tables.forEach(table => {
            table1Select.add(new Option(table, table));
            table2Select.add(new Option(table, table));
        });

        // Seleciona tabelas diferentes por padrão se possível
        if (tables.length >= 2) {
            table2Select.selectedIndex = 1;
        }

        this.updateColumnSelects(tables[0], tables[1]);
        modal.style.display = 'block';

        // Reseta a seleção do tipo de JOIN
        const innerJoinRadio = document.querySelector('input[name="join-type"][value="INNER"]');
        if (innerJoinRadio) {
            innerJoinRadio.checked = true;
        }
    }

    updateColumnSelects(table1, table2) {
        const column1Select = document.getElementById('join-column1');
        const column2Select = document.getElementById('join-column2');

        column1Select.innerHTML = '';
        column2Select.innerHTML = '';

        const table1Data = database.tables.find(t => t.name === table1);
        const table2Data = database.tables.find(t => t.name === table2);

        if (table1Data) {
            table1Data.columns.forEach(col => {
                const option = document.createElement('option');
                option.value = col;
                option.textContent = col;
                column1Select.appendChild(option);
            });
        }

        if (table2Data) {
            table2Data.columns.forEach(col => {
                const option = document.createElement('option');
                option.value = col;
                option.textContent = col;
                column2Select.appendChild(option);
            });
        }
    }

    showWhereModal() {
        const modal = document.getElementById('where-modal');
        const tableSelect = document.getElementById('where-table');

        tableSelect.innerHTML = '';

        const tables = Array.from(document.querySelectorAll('.query-element')).map(el => el.dataset.tableName);
        tables.forEach(table => {
            const option = document.createElement('option');
            option.value = table;
            option.textContent = table;
            tableSelect.appendChild(option);
        });

        this.updateWhereColumns(tableSelect.value);
        modal.style.display = 'block';
    }

    updateWhereColumns(tableName) {
        const columnSelect = document.getElementById('where-column');
        columnSelect.innerHTML = '';

        const tableData = database.tables.find(t => t.name === tableName);
        if (tableData) {
            tableData.columns.forEach(col => {
                const option = document.createElement('option');
                option.value = col;
                option.textContent = col;
                columnSelect.appendChild(option);
            });
        }
    }

    addJoin(joinData) {
        this.sqlService.addJoin(joinData);

        const timelineContainer = document.querySelector('.timeline-container');
        const joinLine = document.createElement('div');
        joinLine.className = 'join-line';
        joinLine.id = joinData.id;
        joinLine.innerHTML = `
            <div class="join-info">
                ${joinData.type} JOIN: ${joinData.table1}.${joinData.column1} = ${joinData.table2}.${joinData.column2}
                <button class="remove-join" onclick="document.querySelector('.query-builder').removeJoin('${joinData.id}')" aria-label="Remover JOIN">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        timelineContainer.appendChild(joinLine);
        this.updateSQLPreview();
    }

    removeJoin(joinId) {
        const joinElement = document.getElementById(joinId);
        if (joinElement) {
            joinElement.remove();
            this.sqlService.removeJoin(joinId);
            this.updateSQLPreview();
            new Notification('JOIN Removido', 'JOIN removido com sucesso');
        }
    }

    addCondition(conditionData) {
        this.sqlService.addCondition(conditionData);

        const timelineContainer = document.querySelector('.timeline-container');
        const conditionElement = document.createElement('div');
        conditionElement.className = 'where-condition';
        conditionElement.id = conditionData.id;
        conditionElement.innerHTML = `
            <span class="condition-text">
                ${conditionData.table}.${conditionData.column} ${conditionData.operator} '${conditionData.value}'
            </span>
            <button class="remove-condition" onclick="document.querySelector('.query-builder').removeCondition('${conditionData.id}')" aria-label="Remover condição">
                <i class="fas fa-times"></i>
            </button>
        `;

        timelineContainer.appendChild(conditionElement);
        this.updateSQLPreview();
    }

    removeCondition(conditionId) {
        const conditionElement = document.getElementById(conditionId);
        if (conditionElement) {
            conditionElement.remove();
            this.sqlService.removeCondition(conditionId);
            this.updateSQLPreview();
            new Notification('Condição Removida', 'Condição WHERE removida com sucesso');
        }
    }

    clearQuery() {
        const queryCanvas = document.getElementById('query-canvas');
        queryCanvas.innerHTML = '';
        this.sqlService.clearAll();
        this.updateSQLPreview();
        this.updateButtonsState();
        new Notification('Consulta Limpa', 'Todos os elementos foram removidos');
    }

    copySQL() {
        const sql = this.sqlService.generateSQL();

        // Verifica se há duas ou mais tabelas e nenhum JOIN
        const tables = document.querySelectorAll('.query-element');
        if (tables.length >= 2 && this.sqlService.joins.length === 0) {
            new Notification(
                'Atenção!',
                'Você está tentando consultar múltiplas tabelas sem um JOIN. Isso pode resultar em um produto cartesiano indesejado. Considere adicionar um JOIN para relacionar as tabelas corretamente.',
                'warning'
            );
            return;
        }

        navigator.clipboard.writeText(sql).then(() => {
            new Notification('Copiado!', 'SQL copiado para a área de transferência');
        }).catch(() => {
            new Notification('Erro', 'Não foi possível copiar o SQL', 'error');
        });
    }

    exportSQL() {
        const sql = this.sqlService.generateSQL();
        const blob = new Blob([sql], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = 'consulta.sql';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        new Notification('Exportado!', 'SQL exportado com sucesso');
    }

    updateSQLPreview() {
        const sqlPreview = document.getElementById('sql-preview');
        sqlPreview.textContent = this.sqlService.generateSQL();
    }
} 