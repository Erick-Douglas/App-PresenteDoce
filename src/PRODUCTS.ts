import { IMG_BOLO } from './constants';
import { Product } from './types';


export const PRODUCTS: Product[] = [
    // ── KIT FESTAS ─────────────────────────────────────────────────────────────
    {
        id: 'kt-1',
        name: 'Box Café da Manhã',
        description: 'Um box completo para um café da manhã delicioso e especial.',
        price: 74.99,
        category: 'Boxes Surpresa',
        image: '/products/kt-1.jpg',
        isNew: false,
    },
    {
        id: 'kt-2',
        name: 'Box Aniversário',
        description: 'Um box completo para um aniversário delicioso e especial. Contém 5 docinhos, 5 salgadinhos, 1 mini bolo e 1 refrigerante.',
        price: 39.99,
        category: 'Boxes Surpresa',
        image: '/products/kt-2.jpg',
        isNew: false,
    },


    // ── CASEIRINHOS ───────────────────────────────────────────────────────────────
    {
        id: 'bc-1',
        name: 'Bolo de Iogurte com Limão',
        description: 'Bolo fofinho de iogurte com raspas de limão fresco, levinho e refrescante. Ideal para qualquer hora do dia.',
        price: 12.00,
        category: 'Caseirinhos',
        image: '/products/bc-1.jpg',
        simples: true,
    },

    {
        id: 'bc-3',
        name: 'Bolo de Milho com Queijo e Goiabada',
        description: 'Combinação irresistível do milho cremoso com queijo derretido e goiabada, puro conforto.',
        price: 13.00,
        category: 'Caseirinhos',
        image: '/products/bc-3.jpg',
        simples: true,
    },
    {
        id: 'bc-4',
        name: 'Bolo de Cenoura com Chocolate',
        description: 'Clássico bolo de cenoura fofinho coberto com uma generosa camada de ganache de chocolate.',
        price: 18.00,
        category: 'Caseirinhos',
        image: '/products/bc-4.jpg',
        simples: true,
        topSeller: 1,
    },
    {
        id: 'bc-5',
        name: 'Bolo Amanteigado com Doce de Leite',
        description: 'Massa rica e amanteigada recheada e coberta com doce de leite artesanal.',
        price: 20.00,
        category: 'Caseirinhos',
        image: '/products/bc-5.jpg',
        simples: true,
    },
    {
        id: 'bc-6',
        name: 'Bolo de Nido com Morango',
        description: 'Bolo suave com creme de Leite Ninho e morangos frescos, delicioso e visualmente lindo.',
        price: 20.00,
        category: 'Caseirinhos',
        image: '/products/bc-6.jpg',
        simples: true,
        topSeller: 2,
    },
    {
        id: 'bc-7',
        name: 'Bolo de Chocolate',
        description: 'O favorito de todos! Massa de chocolate intensa com recheio e cobertura de brigadeiro.',
        price: 20.00,
        category: 'Caseirinhos',
        image: '/products/bc-7.jpg',
        simples: true,
    },
    {
        id: 'bc-8',
        name: 'Bolo Pudim',
        description: 'A incrível fusão do bolo de massa fofinha com o pudim cremoso numa única forma.',
        price: 25.00,
        category: 'Caseirinhos',
        image: '/products/bc-8.jpg',
        simples: true,
        topSeller: 3,
    },

    // ── BOLOS TEMÁTICOS ────────────────────────────────────────────────────────
    {
        id: 'bt-1',
        name: 'Bolo Temático Personalizado',
        description: 'Monte o seu bolo de sonho! Escolha a massa, o recheio e o tamanho. Feito sob encomenda com carinho e atenção ao detalhe.',
        price: 19.99,
        category: 'Bolos Temáticos',
        image: '/products/bt-1.jpg',
        configuravel: true,
    },

    // ── BRIGADEIROS ──────────────────────────────────────────────────────────────────
    {
        id: 'br-1',
        name: 'Brigadeiros Artesanais',
        description: 'O clássico brasileiro que não pode faltar na sua festa! Feito com ingredientes de qualidade e muito carinho.',
        price: 5.00,
        category: 'Brigadeiros',
        image: '/products/br-1.jpg',
        isNew: true,
        rating: 4.9,
        reviewsCount: 128,
        configuravel: true,
        variants: [
            { label: 'Caixa com 6', price: 5 },
            { label: 'Caixa com 12', price: 8 },
            { label: 'Caixa com 25', price: 15 },
            { label: 'Caixa com 50', price: 30 },
            { label: 'Caixa com 100', price: 55 },
        ],
        flavors: [
            'Chocolate ao Leite', 'Ninho (Nido)', 'Amendoim', 'Coco',
            'Casadinho', 'Dark (Meio Amargo)', 'Prestígio', 'Sensação'
        ],
    },
    {
        id: 'br-2',
        name: 'Brigadeiros Gourmets',
        description: 'O clássico brasileiro que não pode faltar na sua festa! Feito com ingredientes de qualidade e muito carinho.',
        price: 7.00,
        category: 'Brigadeiros',
        image: '/products/br-2.jpg',
        isNew: true,
        rating: 4.9,
        reviewsCount: 128,
        configuravel: true,
        variants: [
            { label: 'Caixa com 6', price: 7 },
            { label: 'Caixa com 12', price: 10 },
            { label: 'Caixa com 25', price: 18 },
            { label: 'Caixa com 50', price: 35 },
            { label: 'Caixa com 100', price: 65 },
        ],
        flavors: [
            'Churros', 'Limão', 'Óreo', 'Maracujá',
            'Morango', "MM's", 'Ninho com Nutella', 'Red Velvet',
            'Pistache', 'Biscoff'
        ],
    },


    // ── SALGADOS ───────────────────────────────────────────────────────────────
    {
        id: 'sl-1',
        name: 'Salgados Fritos',
        description: 'Deliciosos salgados fritos na hora. Escolha o tamanho e as opções (ou tudo misturado).',
        price: 0,
        category: 'Salgados',
        image: '/products/sl-1.jpg',
        isNew: true,
        configuravel: true,
        variants: [
            { label: '25 unidades', price: 14.99 },
            { label: '50 unidades', price: 24.99 },
            { label: '100 unidades', price: 39.99 },
        ],
        flavors: [
            'Tudo misturado',
            'Bolinha de queijo',
            'Croquete de carne',
            'Risole de carne',
            'Risole de camarão',
            'Coxinha de frango',
            'Kibe',
            'Enroladinho de salsicha'
        ],
    },

];
