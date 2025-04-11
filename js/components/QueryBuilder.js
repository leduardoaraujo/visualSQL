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

        // Eventos para os botões de tipo de JOIN
        const joinTypeButtons = document.querySelectorAll('.join-type-btn');
        joinTypeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove a classe active de todos os botões
                joinTypeButtons.forEach(btn => btn.classList.remove('active'));
                // Adiciona a classe active ao botão clicado
                button.classList.add('active');
                // Atualiza o tipo de JOIN no indicador
                const joinType = button.getAttribute('data-join-type');
                document.getElementById('join-type-indicator').textContent = joinType + ' JOIN';
                // Atualiza a visualização se houver colunas selecionadas
                this.updateJoinPreview();
            });
        });

        document.getElementById('confirm-join').onclick = () => {
            // Obtém o tipo de JOIN selecionado
            const selectedType = document.querySelector('.join-type-btn.active');
            if (!selectedType) {
                new Notification('Erro', 'Selecione um tipo de JOIN', 'error');
                return;
            }

            // Obtém as colunas selecionadas
            const table1ColElement = document.querySelector('#table1-columns .table-column.selected');
            const table2ColElement = document.querySelector('#table2-columns .table-column.selected');

            if (!table1ColElement || !table2ColElement) {
                new Notification('Erro', 'Selecione uma coluna de cada tabela para o JOIN', 'error');
                return;
            }

            const joinData = {
                id: `join-${Date.now()}`,
                type: selectedType.getAttribute('data-join-type'),
                table1: document.getElementById('join-table1').value,
                table2: document.getElementById('join-table2').value,
                column1: table1ColElement.getAttribute('data-column'),
                column2: table2ColElement.getAttribute('data-column')
            };

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

        // Atualiza as colunas nas tabelas visuais
        this.updateColumnSelects(tables[0], tables[1]);
        
        // Reinicia seleção do tipo de JOIN
        const innerJoinBtn = document.querySelector('.join-type-btn[data-join-type="INNER"]');
        if (innerJoinBtn) {
            document.querySelectorAll('.join-type-btn').forEach(btn => btn.classList.remove('active'));
            innerJoinBtn.classList.add('active');
            document.getElementById('join-type-indicator').textContent = 'INNER JOIN';
        }
        
        // Limpa seleções anteriores
        document.querySelectorAll('.table-column').forEach(col => col.classList.remove('selected'));
        document.getElementById('join-preview-text').textContent = 'Selecione as colunas para conectar as tabelas';
        
        modal.style.display = 'block';
    }

    updateColumnSelects(table1, table2) {
        // Referências aos containers de colunas
        const table1Columns = document.getElementById('table1-columns');
        const table2Columns = document.getElementById('table2-columns');
        
        // Limpa os containers
        table1Columns.innerHTML = '';
        table2Columns.innerHTML = '';
        
        // Atualiza a prévia de JOIN
        document.getElementById('join-preview-text').textContent = 'Selecione as colunas para conectar as tabelas';
        
        if (!table1 || !table2) return;
        
        // Obtém as colunas da tabela 1
        const table1Data = database.tables.find(t => t.name === table1);
        if (table1Data) {
            table1Data.columns.forEach(column => {
                const columnElement = this.createColumnElement(column, 'table1');
                table1Columns.appendChild(columnElement);
            });
        }
        
        // Obtém as colunas da tabela 2
        const table2Data = database.tables.find(t => t.name === table2);
        if (table2Data) {
            table2Data.columns.forEach(column => {
                const columnElement = this.createColumnElement(column, 'table2');
                table2Columns.appendChild(columnElement);
            });
        }
    }
    
    createColumnElement(column, tableId) {
        const columnElement = document.createElement('div');
        columnElement.className = 'table-column';
        columnElement.setAttribute('data-column', column);
        
        // Tenta identificar o tipo de coluna (simplificado para este exemplo)
        let columnType = 'texto';
        if (column.includes('id') || column.endsWith('_id')) columnType = 'número/id';
        if (column.includes('data')) columnType = 'data';
        
        columnElement.innerHTML = `
            <span class="table-column-name">${column}</span>
            <span class="table-column-type">${columnType}</span>
        `;
        
        // Evento de clique
        columnElement.addEventListener('click', () => {
            // Remove a seleção anterior no mesmo lado da tabela
            document.querySelectorAll(`#${tableId}-columns .table-column`).forEach(col => {
                col.classList.remove('selected');
            });
            
            // Seleciona esta coluna
            columnElement.classList.add('selected');
            
            // Atualiza a prévia do JOIN
            this.updateJoinPreview();
        });
        
        return columnElement;
    }
    
    updateJoinPreview() {
        const table1ColElement = document.querySelector('#table1-columns .table-column.selected');
        const table2ColElement = document.querySelector('#table2-columns .table-column.selected');
        
        if (!table1ColElement || !table2ColElement) return;
        
        const table1 = document.getElementById('join-table1').value;
        const table2 = document.getElementById('join-table2').value;
        const column1 = table1ColElement.getAttribute('data-column');
        const column2 = table2ColElement.getAttribute('data-column');
        const joinType = document.querySelector('.join-type-btn.active').getAttribute('data-join-type');
        
        document.getElementById('join-preview-text').innerHTML = `
            <code>${table1}.${column1} ${joinType} JOIN ${table2}.${column2}</code>
        `;
        
        // Desenha a linha de conexão visual
        this.drawColumnConnector(table1ColElement, table2ColElement);
    }
    
    drawColumnConnector(leftCol, rightCol) {
        // Remove conectores existentes
        const existingConnectors = document.querySelectorAll('.column-connector');
        existingConnectors.forEach(conn => conn.remove());
        
        if (!leftCol || !rightCol) return;
        
        // Obtém as posições dos elementos
        const leftRect = leftCol.getBoundingClientRect();
        const rightRect = rightCol.getBoundingClientRect();
        const containerRect = document.querySelector('.tables-visual-container').getBoundingClientRect();
        
        // Cria o elemento conector
        const connector = document.createElement('div');
        connector.className = 'column-connector';
        
        // Posiciona o conector
        const startX = leftRect.right - containerRect.left;
        const startY = leftRect.top + (leftRect.height / 2) - containerRect.top;
        const endX = rightRect.left - containerRect.left;
        const endY = rightRect.top + (rightRect.height / 2) - containerRect.top;
        
        // Define a largura e posição
        const width = endX - startX;
        connector.style.width = `${width}px`;
        connector.style.left = `${startX}px`;
        
        // Se as linhas estão alinhadas, é uma linha reta
        if (Math.abs(startY - endY) < 10) {
            connector.style.top = `${startY}px`;
            connector.style.height = '2px';
        } else {
            // Para linhas não alinhadas, cria um caminho mais complexo (usando pseudo-elementos no CSS)
            connector.setAttribute('data-start-y', startY);
            connector.setAttribute('data-end-y', endY);
            
            // O ponto médio X
            const midX = startX + (width / 2);
            
            // Adiciona elementos de linha personalizados para criar o caminho
            connector.innerHTML = `
                <div class="connector-start" style="top: ${startY - startX}px; height: 2px;"></div>
                <div class="connector-middle" style="top: ${startY}px; height: ${endY - startY}px; left: ${midX - startX}px;"></div>
                <div class="connector-end" style="top: ${endY - startX}px; height: 2px;"></div>
            `;
        }
        
        // Adiciona ao contêiner
        document.querySelector('.join-connector').appendChild(connector);
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
                <button class="remove-join" data-join-id="${joinData.id}" aria-label="Remover JOIN">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Botão de remover join
        const removeBtn = joinLine.querySelector('.remove-join');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeJoin(joinData.id);
            });
        }

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