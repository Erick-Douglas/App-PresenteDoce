# Correções da jornada e do catálogo · 21/11/2026

## Escopo e referência

Retomada dos IDs PD-REV-02/03/04/05/07/08 após a fiscalização da liderança e os relatos de Erick. React/Vite, Supabase e projeto Vercel existentes preservados. Coffee orienta composição compacta da vitrine/ficha/checkout; Gestly orienta hierarquia dos módulos. Não há nova API de endereços, cobrança ou automação WhatsApp.

## Comportamento entregue

- Card com preço legível e controle visual de 32 px dentro de alvo de toque de 44 px; cor primária segue o tema. Edição e stock na mesma linha compacta. Adicionar confirma pela sacola; a ficha retorna à origem. Editar um item retorna ao checkout.
- Um acesso de menu por contexto: hambúrguer para visitante; Mais/rail para gestão. Retorno à esquerda separado do favorito à direita; confirmações à direita. Cabeçalhos, campos, cards e títulos usam componentes/tokens partilhados. Cores semânticas discretas no menu, feedback e ações destrutivas.
- Tópicos: criar diretamente no produto confirma a definição na categoria e seleciona o tópico nesse produto. Guardar produto persiste o vínculo. A gestão avançada distingue confirmar linha de guardar categoria. Renomeação conserva ID; exclusão remove só esse vínculo. A ficha mostra os tópicos associados; a vitrine não recebe uma segunda faixa de tópicos.
- Checkout em produtos, dados, entrega/recolha, pagamento e resumo. Rua, porta/andar, código postal, localidade e referência têm campos próprios. Dados ficam em memória durante a navegação, sem gravar informação pessoal em localStorage. Editar/cancelar item preserva dados e opções.
- Data inicial procura o primeiro dia elegível, com antecedência, bloqueios e capacidade pública agregada. Mudança de disponibilidade é revalidada no banco; falha preserva formulário. O cliente não define preços finais.
- Copiar mensagem copia um rascunho sem gravar pedido/reserva. Continuar no WhatsApp valida e reserva, conserva a chave de repetição e oferece link de abertura alternativo. Não ocorre envio automático de mensagens.
- Precificação tem etapas numeradas e explica rascunho local, ficha guardada e preço publicado. Gravar ficha não publica preço; aplicação exige confirmação própria.

## Banco e segurança

A migração checkout_public_capacity mantém stock e bloqueios e acrescenta apenas vagas agregadas para hoje + 120 dias. Não expõe identificadores de pedidos/clientes. Respeita loja visível, fuso da loja e reservas pendentes expiradas. Reserva e capacidade continuam transacionais; as vagas públicas são orientação, não garantia de aceitação.

A migração store_relationship_indexes adiciona dez índices de apoio a onze relações, incluindo store_id/categoria, produto, cliente, receitas, movimentos, membros e auditoria. Não altera dados ou políticas. Dez índices novos ainda sem uso medido são informativos, não motivo para apagá-los. As sete ocorrências de políticas permissivas sobrepostas continuam registradas para otimização; não constituem novas permissões. As 17 tabelas públicas mantêm RLS.

Auth da conta real, configuração nativa da CLI e CAPTCHA continuam com os limites de SEGURANCA.md. A proteção nativa contra senhas vazadas depende do Pro; Erick manteve Free. Não foram declaradas ativas configurações que não foram aplicadas.

## Evidências e limites

- TypeScript cliente/servidor, build, 56 testes de regras/contratos/banco.
- tests/catalog-journey.mjs: criar/reabrir/associar/renomear/excluir tópicos; criar categoria/produto/foto/publicação; renomear e ordenar categorias/produtos; rascunho e transferência ao excluir categoria.
- tests/checkout-journey.mjs: preservar todos os campos ao editar/cancelar/voltar; endereço composto; bloqueios/capacidade; copiar sem reserva; disponibilidade alterada durante compra; pedido único e alternativa WhatsApp; seis larguras.
- tests/pricing-journey.mjs: custo €2,00 e €0,50 por unidade, guardar/reabrir/editar e publicar preço somente após confirmação.
- tests/buyer-admin-flows.mjs: compra simples/configurável/pronta entrega, sacola e pontos de toque, seleção acessível, encomenda, financeiro e tema.
- tests/admin-workflows.mjs e tests/public-layout.mjs: páginas/editores, imagem rejeitada e nova tentativa, sessão e seis larguras de 320 a 1920 px.
- tests/review-captures.mjs: Home, ficha, sacola, checkout, menu e módulos em 390 px; comparativo antes/depois na cache local ignorada.

Nos ensaios integrados, o navegador passa pelo gateway/handler reais e PostgreSQL isolado com todas as migrações; somente a identidade Auth e o transporte do provedor são simulados. Storage usa bytes processados no browser e políticas SQL isoladas, sem upload operacional. Não se equipara a autenticação hospedada, teste físico ou aceite de Gabriela. A suíte administrativa antiga usa respostas simuladas e é complementar, não prova de persistência no Supabase real.

Os testes não criam pedidos, clientes, preços ou fotos de operação. A projeção de disponibilidade e os índices foram aplicados no projeto dedicado, com definição anterior preservada para recuperação. A comparação das receitas reais com a planilha aprovada, a importação dos dados antigos, SDKs/assinatura de lojas móveis e o aceite visual por Erick/Gabriela permanecem etapas distintas.