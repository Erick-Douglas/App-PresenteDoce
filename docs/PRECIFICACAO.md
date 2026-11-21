# Precificação e fichas técnicas

Este documento descreve o comportamento do módulo. Dados e análises comerciais da confeitaria ficam na área privada, fora do código publicado.

## Cálculo

| Resultado | Regra |
| --- | --- |
| Custo de uma linha | Preço da embalagem / quantidade da embalagem × quantidade utilizada |
| Custo total | Soma dos custos das linhas |
| Custo unitário | Custo total / rendimento |
| Venda total | Preço unitário de venda × rendimento |
| Resultado unitário | Preço de venda − custo unitário |
| Markup | Preço de venda / custo unitário − 1 |
| Margem | Resultado unitário / preço de venda |

Percentagens sem denominador válido ficam sem resultado. Quantidade e rendimento precisam ser positivos; custos devem ter nome, unidade e números válidos. A apresentação monetária usa duas casas decimais, preservando precisão no cálculo.

## Fluxo do módulo

Uma ficha pode associar um produto e uma opção/tamanho. Guardar ficha e aplicar preço ao catálogo são ações separadas; aplicar preço exige confirmação e versão atual do produto. Limpar rascunho não grava na ficha anteriormente guardada.

Cada custo pode ser manual, um ingrediente cadastrado ou uma sub-receita da mesma loja. O banco resolve os valores canônicos, recalcula dependências e recusa ciclos. Alterar um ingrediente não altera custos históricos das encomendas. A ficha usada por outra não pode ser excluída antes de desvincular.

A Agenda calcula demanda de produção confirmada a partir das fichas, desconta saldo informado e indica compras. Fichas ausentes aparecem como pendência. Unidades incompatíveis não são convertidas automaticamente.

## Importação

A importação de dados comerciais é uma etapa privada de conferência. Ela deve preservar origem, vínculo, unidades e valores, apresentar prévia para revisão e permitir repetição segura sem duplicações. Nenhum dado de operação deve entrar no bundle, fixtures públicas ou logs.

[Arquitetura](ARQUITETURA.md) · [Implementação](IMPLEMENTACAO.md) · [Testes](TESTES.md).
