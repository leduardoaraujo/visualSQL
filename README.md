# Visual SQL Query Builder

Um construtor visual de consultas SQL para ajudar desenvolvedores e analistas de dados a criar consultas SQL de forma intuitiva através de uma interface gráfica.

## Características Principais

- Interface gráfica intuitiva para construção de consultas SQL
- Suporte a JOINs com visualização das relações entre tabelas
- Criação de condições WHERE
- Geração automática do código SQL
- Visualização da estrutura do banco de dados
- Simulação de conexões com bancos de dados

## Como Usar

1. Abra o arquivo `index.html` em um navegador web moderno
2. Crie uma conexão ou use a conexão de exemplo
3. Selecione tabelas da barra lateral e arraste para a área de consulta
4. Adicione JOINs para relacionar tabelas
5. Adicione condições WHERE para filtrar resultados
6. Visualize e copie o SQL gerado

## Implementação

O Visual SQL Query Builder agora funciona completamente no navegador, sem necessidade de backend:

- Todo o código é executado no navegador usando JavaScript vanilla
- As conexões com bancos de dados são simuladas no lado do cliente
- Tabelas e estruturas de banco são simuladas para fins de demonstração
- Persistência de conexões usando o localStorage do navegador

## Arquitetura

- **js/services/DatabaseService.js**: Serviço que simula conexões com bancos de dados
- **js/services/ApiService.js**: Adaptador para comunicação com o DatabaseService
- **js/services/SQLService.js**: Geração de consultas SQL
- **js/components/TableList.js**: Gerenciamento da lista de tabelas
- **js/components/QueryBuilder.js**: Interface para construção de consultas
- **js/components/ConnectionManager.js**: Gerenciamento de conexões

## Personalizando o Projeto

Você pode adicionar novos tipos de bancos de dados ou estruturas de tabelas editando o arquivo `js/services/DatabaseService.js`. A função `getSimulatedTables()` contém exemplos de estruturas que podem ser expandidas.

## Funcionalidades Futuras

- Implementar conexão real com bancos de dados usando WebSQL ou outras APIs
- Adicionar suporte a expressões SQL mais complexas
- Implementar histórico de consultas
- Adicionar mais opções de exportação

## Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Licença

Este projeto é distribuído sob a licença MIT. 