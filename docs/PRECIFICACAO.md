# Precificação e preparação da migração

Conferência da planilha da Presente Doce em 20/11/2026. O arquivo de origem foi consultado em leitura. A importação dos dados comerciais depende da revisão das inconsistências abaixo. Os dados de receitas e ingredientes ficam restritos à conta da confeitaria.

## Estrutura encontrada

- 26 abas, incluindo configurações, grupos de ingredientes e 21 fichas de receita.
- 62 registros de ingredientes em sete grupos, com nome, marca, quantidade comprada, unidade e preço de compra.
- Uma entrada de ingrediente com preço ausente.
- Seis linhas de receita com ingrediente sem correspondência ou custo não calculado.
- As abas REC 24 e Cópia de REC 24 têm o valor de venda total digitado manualmente. Ele diverge do rendimento multiplicado pelo preço unitário.
- A configuração da moeda é Euro. Algumas células mantêm formatação de Real. A migração deve usar os valores numéricos e a moeda confirmada para cada ficha.
- O cálculo de custos, lucro, margem e markup nas 21 fichas segue a mesma relação matemática implementada no app. A comparação deve distinguir o resultado de uma fórmula do valor manual usado na célula de venda total.

## Fórmulas preservadas

| Resultado | Cálculo |
| --- | --- |
| Custo de um ingrediente na receita | Preço de compra / quantidade comprada × quantidade utilizada |
| Custo total | Soma dos custos das linhas |
| Custo por unidade | Custo total / rendimento |
| Venda total | Preço de venda por unidade × rendimento |
| Lucro por unidade | Preço de venda por unidade − custo por unidade |
| Lucro total | Lucro por unidade × rendimento |
| Markup | Preço de venda por unidade / custo por unidade − 1 |
| Margem | Lucro por unidade / preço de venda por unidade |

Custos ou preços iguais a zero deixam a percentagem correspondente sem resultado. Os cálculos usam precisão completa e o valor monetário é apresentado com duas casas decimais. O rendimento e as quantidades usam a mesma unidade informada.

## Integração no painel

A precificação permite associar um produto, escolher uma opção de tamanho quando existir, calcular e guardar uma ficha na base da confeitaria. A atualização do preço do catálogo exige confirmação própria. A edição confere a versão atual para evitar sobrescrever uma alteração concorrente.

O rascunho local anterior continua disponível no navegador em que foi guardado. As novas fichas guardadas na conta são acessíveis em outro dispositivo após a autenticação. A aplicação não inclui os dados internos da planilha nos arquivos públicos de frontend.

## Migração dos dados existentes

1. Conferir os ingredientes sem preço e as linhas sem correspondência.
2. Definir identificadores estáveis por ingrediente e ficha, mantendo aba e linha como origem.
3. Confirmar o preço unitário e os valores de venda total digitados manualmente.
4. Associar cada ficha ao produto e à opção corretos. Preservar fichas de massa e recheio como componentes reutilizáveis.
5. Importar em ambiente de teste, comparar os custos por linha e os totais e apresentar as divergências antes da publicação.
6. Importar com identificação de origem para permitir repetição segura sem duplicações.

[Planilha de origem](https://docs.google.com/spreadsheets/d/11UOmWSIBbFDcd4nr12fA8blRLeFOAGSXEAfkN1U_VxA/edit)
