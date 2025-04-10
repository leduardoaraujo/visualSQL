export const database = {
    tables: [
        {
            name: 'clientes',
            columns: ['id', 'nome', 'email', 'telefone', 'data_cadastro']
        },
        {
            name: 'pedidos',
            columns: ['id', 'cliente_id', 'data_pedido', 'valor_total', 'status']
        },
        {
            name: 'produtos',
            columns: ['id', 'nome', 'preco', 'estoque', 'categoria']
        },
        {
            name: 'endereços',
            columns: ['id', 'rua', 'cep', 'cidade', 'estado']
        }
    ]
}; 