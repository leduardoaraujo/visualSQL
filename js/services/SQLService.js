export class SQLService {
    constructor() {
        this.joins = [];
        this.conditions = [];
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
                sql += `\n${join.type} JOIN ${join.table2} ON ${join.table1}.${join.column1} = ${join.table2}.${join.column2}`;
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
} 