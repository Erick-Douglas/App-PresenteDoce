# Carrinho personalizado e checkout · 21/11/2026

> **Leitura em 21/11/2026.** Referência técnica da base existente. O [PRD](PRD.md) consolida o escopo atual; o novo design e comportamento serão definidos no [Figma](BRIEFING-FIGMA.md) e na [ERS/SRS](SRS.md), com aprovação. Procedimentos históricos abaixo não são instrução para reaplicar migrações ou ativar integrações. [Índice](README.md).

Pedido de Erick: comprar mais de um bolo do mesmo catálogo com escolhas independentes, refinar a ficha/checkout e retirar o atendimento flutuante.

## Comportamento vigente

- O **+ da vitrine inicia uma nova configuração**, inclusive nos bolos temáticos antigos. A imagem/título pode retomar a última linha do produto. Na ficha retomada, **Adicionar outro com novas escolhas** limpa o formulário e preserva o item anterior.
- O lápis do checkout edita exclusivamente a linha escolhida. Produto, opções, tema, observações e preço unitário compõem a identidade da linha; quantidade não faz parte dela. Combinações idênticas somam quantidade. Grupos/IDs são normalizados, sem depender da ordem da seleção.
- Uma alteração que coincide com outra linha junta as quantidades. Escolhas diferentes nunca substituem outra personalização. O servidor continua calculando preços/extras e validando obrigatoriedade, limites e IDs.
- A sacola dá o retorno global; o + também mostra +1/sucesso local durante 1,1 s. O sinal + permanece igual para todos os produtos. Animação respeita movimento reduzido.
- Favorito usa coração vermelho, estado pressionado e mensagem de guardar/remover. Preferências persistem por loja no navegador; indisponibilidade de armazenamento mantém a sessão utilizável. Sem conta, isso não representa sincronização entre aparelhos.
- Voltar e coração usam vidro com fundo branco a 7%, contorno translúcido e blur; retorno branco/cinza com sombra de leitura. A ficha sobe 16 px e não mostra o badge Personalizável.
- Assistente flutuante retirada da aplicação. Contactos e a finalização por WhatsApp permanecem disponíveis.

## Checkout

Cabeçalho compacto com título central e retorno separado. Os seus produtos tem ícone de sacola, título e contagem total de unidades. Cada item apresenta foto/informação à esquerda, editar/apagar no topo direito, valor da linha maior e quantidade abaixo à direita. Tema/observações ajudam a distinguir bolos. Sem Por encomenda repetido; subtotal dos produtos fecha o card.

Os seus dados tem título próprio e ícone à direita. Nome e WhatsApp obrigatórios; data de nascimento e e-mail opcionais. O rascunho mantém os campos ao editar e voltar. Nascimento não é acrescentado à mensagem do WhatsApp.

Recolha/entrega, morada estruturada, data e horário ficam no checkout. Mantidos mínimo real de 48 horas, agenda/capacidade, preços canônicos, reserva transacional e idempotência. Pronta entrega segue em standby.

## Banco e segurança

Migração aditiva **20261121173213_checkout_customer_birth_date.sql**: customers.birth_date anulável, validação de data, concessões limitadas à coluna para INSERT/UPDATE autenticados e RLS da loja preservada. create_order grava o campo no novo contacto e no snapshot. Entrada pública não sobrescreve o CRM anterior. Valores ausentes não são inventados nem importados.

Edge store-api **v7**, Zod valida formato/calendário e recusa datas futuras. Sem novas chaves ou permissões públicas. Cliente autorizado pode consultar/editar/apagar a data no CRM. Não é atributo de autenticação.

## Área superior e aparência

Tokens novos em **src/design-system/tokens.css**; composições em **cart.css**, importadas pelo índice e usadas nos dois temas. Removidos pseudo-elemento fixo de área segura, pintura pelo scroll e theme_color do manifesto. Meta HTML solicita transparent. Cabeçalhos secundários deixam de ser sticky/com fundo borrado; espaçamento da área segura pertence à página, cujo fundo continua até o topo.

O navegador/SO controla a área física de hora/Wi-Fi e pode ignorar transparência. Sem afirmação de equivalência universal com navegação nativa ou validação em iPhone físico. Splash e ícones de instalação continuam na identidade da marca.

## Verificação

- **68 testes Node/SQL**: incluindo datas válidas, opcionais, inválidas/futuras, transação sem gravação parcial e isolamento do cliente.
- **cart-variants-journey.mjs**, claro e escuro: duas configurações do mesmo produto, edição isolada, nova configuração explícita, soma de escolhas iguais, checkout com duas linhas canônicas, repetição segura, remoção isolada e bolos temáticos legados.
- Favoritos guardar/remover/recarregar; +1 local; ausência de assistente e camada fixa no topo; meta sem mutação ao rolar.
- Checkout com seis larguras (320,390,768,1024,1440,1920), posições de editar/valor/quantidade e rascunho com nascimento. CRM consulta, altera e limpa o campo pelo navegador → gateway → Edge → PostgreSQL.
- Regressões de grupos, checkout/morada/agenda, compra/financeiro/configurações, gestão de produto/imagens/sessão, 20 vistas públicas e aparência/perfil. Dez módulos × dois temas × quatro larguras no teste de aparência.
- Tipagem cliente/servidor e build aprovadas. Capacitor sincronizado; sem build assinada ou teste físico.

Gravações dos testes usam PostgreSQL isolado; somente identidade Auth/transporte do provedor são simulados. Não são pedidos/clientes reais. Depois da migração: 17 produtos,7 categorias,2 pedidos,2 clientes,0 movimentos; nascimento histórico não preenchido. A contagem 2/2 já existia antes da aplicação desta migração e foi preservada.

Aceite visual e parecer da liderança: pendentes de verificação; não emitidos pelo executor. Sessão não encerrada automaticamente. Segurança Auth/Stripe/WhatsApp API mantém dependências registradas em [Segurança](SEGURANCA.md) e [Integrações](INTEGRACOES.md).

## Referências

[Shopify Cart API](https://shopify.dev/docs/api/ajax/reference/cart) documenta linhas separadas para propriedades diferentes e atualização pela chave da linha. Aplicado como padrão de interação, sem integração com Shopify.
[MDN theme-color](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/theme-color) descreve a preferência de cor do agente de navegação.
[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) orienta os limites por linha; não confiar apenas no filtro do cliente. Coffee/Gestly continuam guiando composição e hierarquia.
