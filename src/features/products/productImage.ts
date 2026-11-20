export function validateProductImage(file: Pick<File, 'name' | 'type' | 'size'>) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type) &&
      !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    throw new Error('Escolha uma fotografia JPG, PNG, WebP ou HEIC.');
  }
  if (file.size > 20 * 1024 * 1024) throw new Error('A fotografia deve ter até 20 MB.');
}
