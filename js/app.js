import { TableList } from './components/TableList.js';
import { QueryBuilder } from './components/QueryBuilder.js';
import { SQLService } from './services/SQLService.js';

class App {
    constructor() {
        this.tableList = new TableList('tables-list');
        this.sqlService = new SQLService();
        this.queryBuilder = new QueryBuilder(this.sqlService);
    }

    init() {
        this.tableList.loadTables();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
}); 