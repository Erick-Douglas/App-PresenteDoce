/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://ihlrkscljoyfjyxgpyid.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_Asi48sy242Ynh2-GrJz_NA_zTlutMFo';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error(
    '⚠️ AVISO: Variáveis de ambiente do Supabase não encontradas.\n' +
    'O app pode não funcionar corretamente. Crie um ficheiro .env para produção.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
