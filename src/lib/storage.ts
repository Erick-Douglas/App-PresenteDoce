import { supabase } from './supabase';

const ALLOWED_TYPES = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_SIZE_MB = 2;

/**
 * Faz upload do avatar do utilizador para o Supabase Storage.
 * Guarda o ficheiro como `{userId}.{ext}` no bucket `avatars`.
 * Retorna o URL público permanente da imagem.
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';

  if (!ALLOWED_TYPES.includes(ext)) {
    throw new Error('Formato não suportado. Use JPG, PNG ou WebP.');
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`A imagem não pode ter mais de ${MAX_SIZE_MB}MB.`);
  }

  const fileName = `${userId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true, contentType: file.type });

  if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
  return data.publicUrl;
}
