# Imagens dos Produtos — Presente Doce

## Como adicionar fotos dos produtos

Coloque as imagens dos produtos nesta pasta (`public/products/`).

### Convenção de nomes

Use o **ID do produto** como nome do arquivo:

```
public/
  products/
    1.jpg       ← produto com id: '1'
    2.jpg       ← produto com id: '2'
    3.webp      ← aceita .jpg, .jpeg, .png, .webp
    ...
```

### Como referenciar no código

Em `src/constants.ts`, use o caminho relativo a partir de `public/`:

```ts
{
  id: '1',
  name: 'Croissant de Amêndoas',
  image: '/products/1.jpg',   // ← assim
}
```

### Tamanho recomendado

- **Proporção:** 1:1 (quadrado) ou 4:3
- **Tamanho mínimo:** 600×600px
- **Formato ideal:** `.webp` (menor tamanho, melhor qualidade)
- **Peso máximo:** 500KB por imagem

### Dica: Converter para WebP

Se tiver imagens .jpg ou .png, pode converter gratuitamente em:
- https://squoosh.app
- https://convertio.co
