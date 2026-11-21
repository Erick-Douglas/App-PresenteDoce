# Briefing para o agente de design no Figma

**21/11/2026 · Solicitante: Erick · Fase: levantamento e protótipo editável.**  
O agente de desenvolvimento encerra a sessão. Erick ativará outro agente para criar o design do app no Figma e experimentar alternativas. **Este briefing não cria um arquivo Figma, não conecta a conta e não concede aceite ao design atual.**

## 1. Objetivo

Transformar a aplicação existente em um conjunto organizado de telas, componentes e estados editáveis. Erick precisa ajustar aparência e navegação, comparar alternativas e aprovar uma versão antes de pedir a implementação. Cobrir vitrine e gestão com a mesma identidade, incluindo módulos menos visíveis e erros dos formulários.

## 2. Leitura de entrada

1. [PRD 2.0](PRD.md): produto, regras operacionais, papéis, escopo futuro e pendências.
2. [Mapa de telas](MAPA-DE-TELAS.md): 22 vistas, elementos transversais e contextos.
3. [Design System técnico](DESIGN_SYSTEM.md) e src/design-system/tokens.css: marca e base existente.
4. [Modelo ERS/SRS](SRS.md): documento que Erick escreverá para as regras de comportamento.
5. [Roadmap](ROADMAP.md), [testes](TESTES.md) e relatórios listados no [índice](README.md), se precisar conferir uma regra ou evidência.

No diretório local da empresa: Contexto Geral em leitura, par Design System/Daily Log na raiz, manual em 00 - Kit da Marca, referências em 01 - Referencias e documento original da Gabriela em 02 - Developer. Consultar somente o necessário; não copiar dados comerciais ou pessoais para o Figma.

Base do app: [endereço público](https://presente-doce.vercel.app/) e [commit e79ff700](https://github.com/Erick-Douglas/App-PresenteDoce/tree/e79ff700e168527f28f9b5534e9de91e42e2ad3a). O endereço pode evoluir; comparar com a base do briefing ao iniciar.

## 3. Referências e identidade

- Coffee/Kopi Kap: composição limpa, hierarquia, fotos, categorias, cards e ritmo. Print local **Print UI app Coffee.png**.
- Gestly: organização de gestão, métricas, cards, atalhos, ações e navegação. [Referência fornecida por Erick](https://play.google.com/store/apps/details?id=com.gestly.erp&hl=pt_PT).
- Mobius: composição do avatar e superfícies escuras. Usar somente a referência visual; capturas contêm dados privados que devem ficar fora dos frames.
- [Manual e tokens descritos no Design System](DESIGN_SYSTEM.md): Lato, Great Vibes, bordô #800000, dourado #FBCE00, creme #FFF6DB; neutros e semânticas em claro/escuro.

Essas referências orientam decisões, não são ativos para copiar. As URLs de Coffee/BakeThatBatter e demais fontes são referências, não o arquivo Figma do nosso app.

## 4. Estrutura sugerida do arquivo Figma

| Página                           | Conteúdo                                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| 00 — Leia-me e decisões          | Links, base, estado das versões, responsáveis e decisões abertas                                   |
| 01 — Foundations                 | Cores semânticas, tipos, escala, espaços, bordas, sombras, vidro, ícones e modos                   |
| 02 — Componentes                 | Botões, campos, seletor, avatar, menu, cards, grupos, quantidade, sacola, alertas, diálogos e abas |
| 03 — Vitrine                     | TEL-01 a TEL-09 e variantes públicas                                                               |
| 04 — Gestão                      | TEL-10 a TEL-22 e formulários/detalhes associados                                                  |
| 05 — Fluxos e estados            | Auth/perfil, compra, criação/edição, erro/recuperação, vazio/carregamento e prévia                 |
| 06 — Futuro e standby            | Pronta entrega, conta de clientes, onboarding/assinatura e outras hipóteses separadas              |
| 07 — Aprovado para implementação | Frames aprovados com data/versão; alternativas permanecem nas páginas de trabalho                  |

O próximo agente pode propor outra organização se preservar rastreabilidade. Usar Auto Layout, componentes reutilizáveis, variantes e estilos/variáveis semânticos. Nomear frames com ID, perfil, estado, tema e largura, por exemplo TEL-05 / Visitante / Entrega / Claro / 390.

## 5. Levantamento e proposta

Primeiro registrar a versão existente com seus estados e limitações. Em seguida propor o novo layout em uma versão separada. O design atual foi testado parcialmente, mas Erick apontou insatisfação e pendências; não tratá-lo como solução final aprovada.

O levantamento completo não exige aprovar tudo de uma vez. Recomenda-se validar o sistema visual em home → ficha de bolo → checkout e em catálogo → produto/categoria → precificação/agenda. Após a aprovação desses padrões, aplicá-los a todos os módulos. Registrar as alternativas com os mesmos dados fictícios para a comparação ser justa.

## 6. Regras que o desenho deve preservar

- Operação atual por encomenda, mínimo real de 48 horas, data/hora e morada/recolha no checkout; pronta entrega em standby.
- Tópicos como grupos com título, limites e opções grátis/pagas. Mostrar produto herdando grupos da categoria e produto com grupos próprios.
- Dois bolos do mesmo produto com escolhas diferentes; editar uma linha e adicionar outra são ações distinguíveis.
- Checkout com itens, dados, entrega/recolha, preferência de pagamento e resumo. Nome/WhatsApp e nascimento/e-mail opcionais; sem cobrança por gateway ativa.
- Abertura no WhatsApp é externa. Não desenhar um chat pessoal de WhatsApp integrado como se já existisse.
- Edição na vitrine e módulos de gestão na mesma aplicação; pré-visualizar como cliente mantém a sessão.
- Tokens centrais, modos claro/escuro/sistema, contraste e componentes equivalentes. Fotografias não são invertidas no escuro.
- Avatar à esquerda/menu à direita na base atual; qualquer mudança proposta precisa ficar registrada para aprovação.
- Assistente flutuante retirada; não reintroduzir como requisito herdado de um relatório antigo.
- Separar guardar ficha, simular preço e publicar preço; cancelar/excluir/confirmar com hierarquia. A cor e posição finais serão aprovadas por Erick.
- Estado de erro preserva campos. Cancelar escolha de imagem não fecha o cadastro. Considerar conflito de versão, sessão expirada e gravação pendente.

## 7. Responsividade e estados

Representar pelo menos mobile 390, tablet 768 e desktop 1440 como frames principais; conferir comportamento em 320, 1024 e 1920. Definir reflow, largura máxima, áreas com scroll, ações fixas, teclado móvel e área segura. Não resolver desktop apenas ampliando a tela do celular.

Cobrir visitante e administrador, menu aberto/fechado, seleção/quantidade, foco/pressionado/desativado/ocupado, vazio, carregando, sucesso, erro, ausência de permissão e conflito. O modo sistema usa a variante correspondente ao sistema, não uma terceira paleta.

Cada botão/card deve indicar destino ou ação em anotação de fluxo. Persistência, idempotência, cálculo, autorização e mensagens externas precisam de regra escrita; um hotspot do Figma não implementa esses comportamentos.

## 8. Protótipos obrigatórios

1. Descobrir produto → escolher opções → adicionar → outro bolo diferente → editar só uma linha → checkout → retorno sem perder dados.
2. Favoritar → consultar favoritos → remover.
3. Entrar → menu de gestão → prévia de cliente → voltar à gestão → sair; incluir recuperação/erro de sessão.
4. Criar categoria/grupos → criar produto/foto → publicar/rascunho → reabrir/editar; cancelar seletor e erro de upload.
5. Precificar → guardar ficha → reabrir → mudar custo → confirmar publicação de preço; limpar rascunho sem perder a ficha.
6. Nova encomenda/orçamento → agenda/produção → recebimento/saldo → correção financeira e histórico.
7. Clientes e configurações: cadastro/edição, dados opcionais, marca/contraste e retorno à vitrine.

Usar dados fictícios. Respeitar as pendências operacionais; o desenho de um caminho não é prova de execução no backend.

## 9. Entrega para Erick e para o executor

- Link do arquivo Figma na conta indicada por Erick, com acesso conferido.
- Matriz TEL/INT/CTX preenchida com frames/node-ids, estados, temas e larguras.
- Biblioteca de componentes e tokens com nomes mapeáveis ao código.
- Fluxos navegáveis e notas de comportamento/questões abertas.
- Registro por versão: proposto, em revisão ou aprovado por Erick. Aprovação não pode ser emitida pelo próprio agente.
- Lista de diferenças entre a base e o novo desenho.
- Página Aprovado para implementação e links a copiar para a SRS.
- Resumo no Daily Log da Presente Doce, na subseção atribuída ao agente; fechar somente por comando de Erick.

Critério de entrega do design: cobertura do mapa, edição possível por Erick, consistência entre telas e componentes, ligações testadas e aceite registrado. Não escrever na base de dados, alterar produção, cobrar, enviar mensagens ou abrir cadastro para criar o protótipo.

## 10. Próxima passagem

Erick preencherá [SRS.md](SRS.md) com as regras. O agente executor retomará comparando PRD, frames aprovados e SRS. Questões sem decisão devem continuar visíveis; nenhuma ambiguidade vira comportamento final por suposição.
