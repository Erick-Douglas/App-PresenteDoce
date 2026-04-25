# Supabase SQL Setup

Execute este SQL no **SQL Editor** do Supabase Dashboard.

## 1. Tabelas

```sql
-- Tabela de perfis
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  birthday TEXT,
  sex TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  apartment TEXT,
  reference TEXT,
  is_admin BOOLEAN DEFAULT false,
  profile_pic TEXT,  -- URL do Supabase Storage (NÃO Base64)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sex TEXT;

-- Sequência para IDs de pedido legíveis
DROP SEQUENCE IF EXISTS orders_seq;
CREATE SEQUENCE orders_seq START 1;

-- Tabela de pedidos
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  id TEXT PRIMARY KEY DEFAULT 'CLI' || to_char(nextval('orders_seq'), 'FM000'),
  user_id UUID REFERENCES auth.users(id),
  guest_name TEXT,
  guest_phone TEXT,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  delivery_method TEXT,
  payment_method TEXT,
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_postal_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## 2. RLS — Row Level Security (SEGURO)

```sql
-- ── PROFILES ──────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Utilizadores só vêem o seu próprio perfil
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ── ORDERS ────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Utilizadores vêem os seus próprios pedidos
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT USING (auth.uid() = user_id);

-- Qualquer pessoa (incluindo visitantes) pode criar pedido
CREATE POLICY "Anyone can create order"
  ON orders FOR INSERT WITH CHECK (true);

-- Admins vêem e atualizam todos os pedidos
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

## 3. Storage — Bucket de Avatars

```sql
-- Criar bucket público para avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Qualquer pessoa pode ver avatars (bucket público)
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Utilizador autenticado pode fazer upload do seu próprio avatar
-- (o ficheiro é nomeado {user_id}.{ext})
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = split_part(name, '.', 1)
  );

-- Utilizador pode atualizar/substituir o seu avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = split_part(name, '.', 1)
  );

-- Utilizador pode apagar o seu próprio avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = split_part(name, '.', 1)
  );
```

## 4. Tornar utilizador admin

```sql
-- Substitua pelo email do administrador
UPDATE profiles SET is_admin = true WHERE email = 'admin@presentedoce.com';
```

## Notas de Segurança
- A política antiga `"Public profiles are viewable by everyone."` foi **removida** — os perfis são agora privados.
- As fotos de perfil são guardadas no **Supabase Storage** (URL) e não como Base64 na base de dados.
- O bucket `avatars` é público para leitura mas apenas o dono pode escrever o seu próprio ficheiro.

## 5. Automação de Perfis (Trigger)

Execute este SQL para garantir que cada novo utilizador registado no Auth tenha automaticamente um registo na tabela `profiles`.

```sql
-- Função para criar o perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função após a criação de um usuário no Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
