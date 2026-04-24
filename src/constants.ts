import { Product } from './types';

export const COUNTRY_CODES = [
  { code: '+351', country: 'Portugal' }, { code: '+55', country: 'Brasil' },
  { code: '+34', country: 'Espanha' }, { code: '+33', country: 'França' },
  { code: '+1', country: 'USA' }, { code: '+44', country: 'Reino Unido' },
  { code: '+39', country: 'Itália' }, { code: '+49', country: 'Alemanha' },
  { code: '+41', country: 'Suíça' }, { code: '+32', country: 'Bélgica' },
  { code: '+31', country: 'Holanda' }, { code: '+352', country: 'Luxemburgo' },
  { code: '+353', country: 'Irlanda' }, { code: '+420', country: 'Rep. Tcheca' },
  { code: '+48', country: 'Polônia' }, { code: '+244', country: 'Angola' },
  { code: '+258', country: 'Moçambique' }, { code: '+238', country: 'Cabo Verde' },
  { code: '+239', country: 'São Tomé' }, { code: '+245', country: 'Guiné-Bissau' },
  { code: '+670', country: 'Timor-Leste' },
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Croissant de Amêndoas',
    description: 'Massa folhada com creme de amêndoas doce',
    price: 4.50,
    category: 'Doces',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrIHvVGhcjxJGjk3vt_6n9CSZCLWjpxVeO1i6uvYjXXOc5aCvkeLPWuv2wH9gExyb7NZpNT9Y5OusYbplD4OQyeI8QZ07vWhEhuq6qchsEKO8lZ5-NX6_eRx9X03-_aBYOG1OFE3eJuUeMi1MwejM3FooMxTVwI9_7DYnNP126vnX2iA-ExsdBBDSN94lRWECpbnwnv66Cn0uaeTzqtvt5eKQlZKxYQdDzTyMKoC6AlCeC0gPra84aLEM0gZM1NY7MHNdmq9FCbUA',
    isNew: true,
    rating: 4.9,
    reviewsCount: 128
  },
  {
    id: '2',
    name: 'Bolo de Chocolate Belga',
    description: 'Trança de pão doce com gotas de chocolate amargo',
    price: 48.00,
    category: 'Bolos',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAk74K21rECkUtWp0mcHarwMzG5KYxyFG11e3L32gqYf5heX5QwxF3qlzQK54gXSgt7AR0DbW-6v_UYPE3602HPjrK11Ib8DSzFTnEqqF6C4jcAOrehc9rvr9xDbg-JUTiY55BOgDdnURDqFGAqUeNDys-J5mHlQtZ6W8LVG6TapvD5zvLvejlsw6G9jVfjVCKPHL5ZvOg3zs0sLc7WrytWTzT6d6GK897zEbxXwqqp4HLuAWTojktUYTgtscl19hAbX2ADZGNM6Fc',
    rating: 4.9,
    reviewsCount: 245
  },
  {
    id: '3',
    name: 'Croissant Clássico',
    description: 'Perfeição folhada e amanteigada, assada fresca todas as manhãs.',
    price: 4.50,
    category: 'Salgados',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjJ-tB4ttNAdLqSbI7-6b2yk_adT8LhCexPB71d6QDpjdQrDnVJ5P9e08zkIofc_6dcEOLHo9wCQPMXnAGhVQp2gjdZ8LsUSzWSTrmrMIl8MeWycetTbYyQBlU2oNPSpmMhU6h2vyTHZ1LjNchbtCXE7w0qJ_aWB87PVBJ8Aa-z1j_MOJLh5csonZE1CcxL_D64uoArSZ5bfla-z6T-B_8EBViGczOj1QAyNH2SUehSsOc5nDE-bkfHuFT_Lk3x1qTDoUCoulygek',
    isNew: true,
  },
  {
    id: '4',
    name: 'Pão Italiano Rústico',
    description: 'Fermentação natural com miolo macio e crosta crocante.',
    price: 8.00,
    category: 'Salgados',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvCNYzg5gH5SnS23S3-eTJkp00TsEkVOQS11VAObs6aDdrMC98JUWzhidm5z4XCO2r2CidKjRfHVDABrxgN63kAA1pAjYOQQ_2tx_2BJFfIxgkxWDiYtnNBXgeWsP05U352TXX5gRONrq7VCFvyHz-kYFXQfa8xwI_bqSy4aBQYTN6aToeEFVJfBgHIjBBuvUJ-00BW_dJp3ndsZoJusN3wUjvHKnG4Wol5q9CHblXPuFWVUXA9LNCKfeJQ3OQiKr7pETi6Upk8ok',
  },
  {
    id: '5',
    name: 'Pain au Chocolat',
    description: 'Chocolate amargo envolto em camadas de massa folhada.',
    price: 5.00,
    category: 'Doces',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCS3VafYPUvIwtjje4WTWIwEtK6f32GrAtaUywFMqEO3kheTLtVdRJYkxMt3WDau33iGK5DSRvcaYANbOZ4pcRtErw3YCVwM81m0KuH9SuyvpQuNN6ki4zyZSfvTco0P-NrgZFaBOKVEIri6ZsuoXoBG35ot2e3mhrbtr7xOiK4lE91-E3NN_eD5oNI-pMhVkxcLCBhzN1zuGQHIlIKb_Zb_dvojzdqKrYlgIcpNn_HLK5Jwr6y572naBglOEmnT9wGjIDf10xJ8Zk',
    isNew: true
  },
  {
    id: '6',
    name: 'Torta de Amêndoas',
    description: 'Massa doce recheada com frangipane e amêndoas torradas.',
    price: 6.50,
    category: 'Doces',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZAh69U3c9PWb1vT495GgHEyCWArOMolQPd-zvcKZBynZeF6OYbS5rJ_S56Qd_mgCxeTqfUgQUVgDzvvxyf1dl2grcJ-PwG0l0jInsVR5B_2MwrB-4KMs4FYiXMZBzLy8SQtnE2aYpWCSYxaHJJsAV-_nVQG7seLbbuRfNa7jhROYweUJjy5lmr5UyRpWh_4WyS4ObDvrn6voKmOwSovSHFfHMHlaf7yNe4fk6UDx_wYJe9NcAS6efvZHjr1Gps3OtwUUU77SQjr0',
  },
  {
    id: '7',
    name: 'Cupcake Colorido',
    description: 'Mini bolinho com cobertura divertida para crianças.',
    price: 3.50,
    category: 'Kit Festa',
    image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&q=80&w=800',
    isNew: true
  },
  {
    id: '8',
    name: 'Donut de Morango',
    description: 'Rosquinha macia com cobertura de morango e granulado.',
    price: 4.00,
    category: 'Kit Festa',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800',
  }
];

export const CATEGORIES = [
  { 
    name: 'Bolos', 
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    name: 'Doces', 
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    name: 'Salgados', 
    image: 'https://images.unsplash.com/photo-1541288097308-7b8e3f58c4c6?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    name: 'Kit Festa', 
    image: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&q=80&w=800' 
  }
];

export const SPLASH_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcU-bD-fW5kjdaZ4fWds3h_Co6Ti_Y6UraFJ-2fZ4WV9DfqU6eXpvjsQ-e7SrNsDA6B-AGTogZJxVLO-ADQOCSrb2YvTBclYi-Spj0TV4N2qw1oArzgbGjeI1JLubwUiAVkkvOp8nWqVDqUlxq8myCQtUSwln3qTW4bB6B1fuCKY5l02tDQmBX05KrqYk1ugAiblD1HvPaofZmtrcjpBiR1X7Dqr0CuFf9SfzQ_MBQNfXJOyCZjsQqvMQ4WH34IRJgz9yTWcKfRfM';

export const BUSINESS_INFO = {
  whatsapp: '+351932732319',
  instagram: 'https://www.instagram.com/presentedoce.s2/',
  facebook: 'https://www.facebook.com/share/1BK8xUmdcZ/',
  address: 'Rua Miguel Ângelo, 21, 1 A, 2840-136, Casal do Marco'
};
