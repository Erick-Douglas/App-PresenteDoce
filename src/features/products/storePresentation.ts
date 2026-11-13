export interface StorePresentation {
  home_title: string;
  home_description: string;
  admin_name: string;
  about_text: string;
  revision: number;
}

export const defaultStorePresentation: StorePresentation = {
  home_title: 'Seja bem-vindo!',
  home_description: 'Bolos, doces e salgados feitos por encomenda.',
  admin_name: 'Gabriela',
  about_text: 'Somos uma confeitaria artesanal por encomenda. Preparamos bolos, doces e salgados para celebrar.',
  revision: 0,
};
