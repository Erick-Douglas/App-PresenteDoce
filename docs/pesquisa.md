# Pesquisa de produto e segurança

**Presente Doce · 11/11/2026**

## Pergunta e escopo

Como uma confeitaria artesanal de produção pequena pode receber encomendas pela internet e manter o catálogo atualizado pelo celular? A pesquisa compara operações artesanais com pedidos sob encomenda, vitrines para pequenos produtores e atendimento corporativo. A comparação cobre descoberta do produto, composição do pedido, entrega, confirmação e autonomia do operador. As fontes públicas descrevem as experiências visíveis. A estrutura de produção e os resultados comerciais só são atribuídos quando a fonte os declara.

## Terminologia

**Loja online de encomendas de confeitaria artesanal** descreve o produto para o público. **Single-vendor storefront** descreve a arquitetura no PRD. A Presente Doce é a única vendedora, mantém seu próprio catálogo e atende o pedido pelo WhatsApp. **Catálogo com checkout via WhatsApp** descreve o fluxo atual. O manifesto do projeto habilita metadados de app web. Instalação, funcionamento offline e demais características de PWA devem ser avaliados separadamente. [MDN sobre PWAs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

## Referências de mercado

| Referência | Observação pública | Aplicação na Presente Doce |
| --- | --- | --- |
| [Larrysa’s Bakery](https://www.larrysasbakery.com/) | Pastelaria caseira na Pontinha com montra, categorias e WhatsApp. | Abrir o catálogo a partir do link principal e dar acesso claro a atendimento. |
| [Saborella](https://saborella.pt/) | Confeitaria familiar. O site organiza o catálogo e encaminha encomendas ao WhatsApp. | Enviar um resumo pronto para conferência e comunicar que o atendimento confirma o pedido. |
| [Badu Confeitaria](https://baduconfeitaria.com/) | Explica escolha, confirmação e entrega/recolha em passos separados. | Mostrar a etapa seguinte e evitar prometer preço de entrega ou disponibilidade sem confirmação. |
| [BRUTA](https://www.bruta.store/contact) | Eventos corporativos têm fluxo de contacto com data e número de pessoas. | Referência de pesquisa. A entrega atual prioriza o catálogo e o checkout geral. |
| [Hotplate](https://www.hotplate.com/) | Ferramenta de venda online para pequenos negócios de comida, com encomendas em janelas de venda. | Considerar agenda e limites de produção quando Gabriela confirmar a necessidade. |

## Navegação e atendimento no celular · 12/11/2026

- A pesquisa da Baymard observou que mensagens de chat iniciadas pelo site e botões fixos podem interromper a compra e cobrir o conteúdo móvel. Na Presente Doce, o contato aparece no fim do menu e abre quando a pessoa toca em **Falar com a confeitaria**. [Pesquisa da Baymard](https://baymard.com/research-articles/live-chat-usability-issues)
- A Nielsen Norman Group recomenda concentrar a interface nas ações relevantes e tornar visível o estado do sistema. A loja concentra a entrada no menu e confirma a sessão administrativa com uma saudação na vitrine. [Heurísticas de usabilidade](https://www.nngroup.com/articles/usability-heuristics-complex-applications/)
- O menu usa Instrument Serif no título, Manrope no texto e uma superfície marfim com divisórias finas. O contato usa um retrato ilustrativo circular de 44 px, a palavra **WhatsApp** e uma seta que indica a abertura do canal.

## Segurança e arquitetura

- Manter Vite e React na Vercel. Supabase oferece autenticação, catálogo persistente e imagens em uma mesma base de permissões. O navegador usa a chave pública, e as regras no banco limitam leitura e gravação. [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite) · [Chaves do Supabase](https://supabase.com/docs/guides/api/api-keys) · [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Controlar administração por uma lista de usuários mantida no banco, sem cadastro público no app. Testar permissões na camada de dados. Aplicar HTTPS, restrições de origem e cabeçalhos de segurança para limitar os recursos carregados. [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- Aceitar imagens raster com limites, reprocessá-las antes do envio e dar acesso de gravação apenas a administradores. O bucket serve imagens do catálogo por URL. Documentos privados devem usar armazenamento separado. [Supabase Storage](https://supabase.com/docs/guides/storage/security/access-control) · [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- Para pagamento futuro, comparar checkout hospedado, notificações assinadas, idempotência e conciliação. O backend calculará e validará o total antes de iniciar um pagamento. A decisão sobre provedor e requisitos em Portugal será tomada nessa fase. [Stripe Checkout](https://docs.stripe.com/payments/checkout) · [Webhooks](https://docs.stripe.com/webhooks)
