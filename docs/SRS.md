# Especificação de Requisitos de Software — ERS/SRS

**Projeto:** Presente Doce · **Modelo preparado em:** 21/11/2026  
**Estado:** A PREENCHER POR ERICK. Sem aprovação para implementação.  
**Responsável pelas decisões:** Erick, com validação operacional de Gabriela.  
**Versão aprovada/data:** a definir · **Figma aprovado/node-ids:** a preencher.

[PRD](PRD.md) · [Mapa de telas](MAPA-DE-TELAS.md) · [Briefing Figma](BRIEFING-FIGMA.md) · [Índice](README.md)

## 1. Nome e finalidade

O nome técnico abrangente é **Especificação de Requisitos de Software**, abreviado ERS ou SRS (Software Requirements Specification). Aqui, o foco é a **especificação funcional e de interação**: como o aplicativo se comporta em cada situação.

O PRD descreve produto, objetivos e escopo. O Figma representa a interface. Esta SRS liga cada interação a uma regra verificável, incluindo navegação, dados, permissões e falhas. A estrutura usa o conceito de especificação de requisitos do [glossário IREB](https://cpre.ireb.org/en/downloads-and-resources/glossary). Não exige escrever código ou definir uma tecnologia para cada botão.

## 2. Como preencher

1. Escolher uma tela do mapa e copiar a seção-modelo abaixo.
2. Inserir link do frame aprovado, versão, tema, largura e perfil de usuário.
3. Listar todos os botões, links, cards clicáveis, campos, seletores e ações por gesto.
4. Explicar condição de entrada, o que acontece, destino, dados alterados e retorno.
5. Escrever o caso feliz e os casos de erro/cancelamento/concorrência; incluir critério de teste.
6. Marcar cada decisão como Proposta, A confirmar ou Aprovada. Registrar responsável e data.
7. Vincular a regra a uma necessidade do PRD e à cobertura TEL/INT/CTX. Usar IDs estáveis; não reciclar um ID removido.

Os exemplos abaixo são somente modelos de redação. O comportamento publicado está descrito no PRD; deve ser confirmado ou alterado explicitamente por Erick. Campos A definir não autorizam inferir aprovação.

## 3. Controle e cobertura

| ID           | Tela/fluxo  | Frame e versão | Responsável | Estado      | Aprovação/data |
| ------------ | ----------- | -------------- | ----------- | ----------- | -------------- |
| RF-TEL-XX-01 | A preencher | A preencher    | Erick       | A confirmar | A preencher    |

Incluir todas as TEL-01 a TEL-22 e INT/CTX aplicáveis. Futuro/standby tem seção separada e não entra no escopo ativo sem decisão.

## 4. Modelo por tela

### TEL-XX — Nome da tela

**Objetivo do usuário:** a preencher.  
**Quem acessa:** visitante, operadora ou outro papel explicitamente definido.  
**Como chega:** tela anterior, menu, link direto ou evento externo.  
**Frame aprovado:** URL com node-id e versão; temas/larguras.  
**Pré-condições:** sessão, recurso existente, permissões, dados necessários.  
**Dados exibidos e origem:** nomes, preços, totais, indicadores, foto e estados.

#### 4.1 Elementos e ações

| ID           | Elemento/posição | Gatilho            | Disponível quando | Resultado e destino | Dado alterado/gravado | Cancelar/voltar | Erro/feedback | Critério de teste |
| ------------ | ---------------- | ------------------ | ----------------- | ------------------- | --------------------- | --------------- | ------------- | ----------------- |
| RF-TEL-XX-01 | Botão ou card    | Clique/toque/tecla | A definir         | A definir           | A definir             | A definir       | A definir     | A definir         |

Detalhar separadamente clicar na foto, no título, no +, no lápis e na lixeira. Definir se o card inteiro é clicável e como evitar ações acidentais entre elementos próximos.

#### 4.2 Campos e validações

| Campo       | Tipo/formato          | Obrigatório/condição | Valor inicial | Limites e validação | Momento da validação   | Mensagem de erro | Persistência |
| ----------- | --------------------- | -------------------- | ------------- | ------------------- | ---------------------- | ---------------- | ------------ |
| A preencher | Texto/data/moeda/etc. | A definir            | A definir     | A definir           | Digitar/sair/confirmar | A definir        | A definir    |

Moeda: indicar locale, símbolo, casas decimais e arredondamento. Data/hora: indicar fuso e antecedência. Imagem: indicar seleção, cancelamento, prévia, validação, envio e falha. Não armazenar senhas no documento.

#### 4.3 Estados e transições

| Estado atual | Evento      | Condição    | Próximo estado | Interface/ação visível | Dados preservados |
| ------------ | ----------- | ----------- | -------------- | ---------------------- | ----------------- |
| Inicial      | A preencher | A preencher | A preencher    | A preencher            | A preencher       |

Conferir: inicial, carregando, vazio, sem resultado, preenchido, inválido, gravando, concluído, erro, offline quando aplicável, sem permissão, sessão expirada e alteração concorrente. Indicar estado do botão e possibilidade de repetir.

#### 4.4 Navegação e persistência

- Destino de voltar e de cancelar; posição de rolagem/foco ao retornar.
- Fechar menu/diálogo por botão, toque fora e Esc; comportamento durante gravação.
- Dados preservados ao editar outro item, sair do módulo, voltar pelo navegador, recarregar, fechar a aba e reabrir.
- Prazo/local do rascunho e quando limpar; tratamento de dados pessoais.
- Link direto válido/inválido e comportamento de recurso excluído/oculto.

#### 4.5 Permissão e efeitos

Quem pode ler, criar, alterar ou apagar. Recurso de qual loja/conta. Confirmação necessária e possibilidade de desfazer. Efeito em estoque, capacidade, financeiro e histórico, se houver. A regra deve ser protegida no backend, além da apresentação.

#### 4.6 Aceite observável

**Dado** um contexto e dados fictícios definidos,  
**Quando** o usuário executa a ação,  
**Então** a tela e os dados devem apresentar o resultado especificado,  
**E** devem permanecer preservados os itens não envolvidos.

Incluir pelo menos: caso normal, validação inválida, cancelamento, erro/repetição e permissão. Citar ID do teste quando implementado.

## 5. Regras transversais que exigem decisão explícita

| Tema           | O que especificar                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| Navegação      | Cabeçalhos, menu, retorno, abrir página/diálogo e destino após guardar                                              |
| Carrinho       | Nova configuração vs editar, identidade de uma linha, união de quantidades, excluir, atualização de preço e recarga |
| Grupos/tópicos | Herança, override, min/máx, opções grátis/pagas, renomear/excluir e efeito no que já foi comprado                   |
| Checkout       | Campos, entrega/recolha, data/hora, 48h, capacidade, taxa, copiar/registrar/enviar e falhas externas                |
| Autenticação   | Lembrar, expirar, renovar, recuperar senha, sessão sem papel e sair                                                 |
| Gestão         | Rascunho/publicado, ordenação, exclusão/transferência e conflitos de versão                                         |
| Precificação   | Rendimento/unidades, custos, fórmula, arredondamento, guardar ficha vs publicar preço e importação                  |
| Pedidos        | Estados permitidos, reserva/expiração, confirmar/concluir/cancelar e orçamento                                      |
| Financeiro     | Sinal/saldo, recebido/estornado/despesa, editar/anular e auditoria                                                  |
| Aparência      | Tema claro/escuro/sistema, configurações por loja, contraste e alcance de cada token                                |
| Responsividade | Quebra/reordenação, scroll, teclado, ações fixas e área segura                                                      |
| Dados          | Origem, atualização, histórico, exportação/remoção e acesso por loja/cliente                                        |
| Integrações    | Serviço externo, pré-condições, custos, dados enviados, resposta/falha e repetição segura                           |

## 6. Exemplo de regra a confirmar

**ID:** EXEMPLO-RF-CART-01 · **Estado:** ilustrativo, sem aprovação final.  
**Necessidade:** comprar dois bolos do mesmo produto com escolhas diferentes.  
**Dado:** um bolo A já na sacola com uma configuração.  
**Quando:** clicar no + da vitrine para o mesmo produto e confirmar outras escolhas.  
**Então:** adicionar uma linha B sem substituir A.  
**E:** o lápis de A abre somente A; preço e quantidade de B permanecem.  
**A confirmar por Erick:** se foto/título retomam uma linha, abrem ficha nova ou pedem escolha quando há várias; o que persiste após recarregar.  
**Frame/teste:** a preencher.

## 7. Questões abertas e aprovação

| ID    | Questão                                         | Impacto/telas | Quem decide      | Situação  | Decisão e data |
| ----- | ----------------------------------------------- | ------------- | ---------------- | --------- | -------------- |
| Q-001 | Links e versões Figma finais                    | Todas         | Erick            | Em aberto | A preencher    |
| Q-002 | Persistência de carrinho/rascunhos após recarga | Compra/gestão | Erick e Gabriela | Em aberto | A preencher    |
| Q-003 | Sequência e feedback final das ações            | Cada tela     | Erick            | Em aberto | A preencher    |

Antes da retomada: mapa coberto; elementos e destinos descritos; dados/validações/erros definidos; divergências com Figma resolvidas; escopo futuro separado; requisitos testáveis; aprovação e versão registradas. A implementação pode seguir por lote aprovado, sem declarar o restante concluído.
