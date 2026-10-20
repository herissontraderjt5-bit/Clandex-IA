-- ========================================================
-- CandleX AI - Esquema de Banco de Dados Supabase (100% Cloud)
-- ========================================================
-- Execute este script no SQL Editor do seu projeto Supabase:
-- URL: https://jkpywxaxmxlqthxxhbdd.supabase.co
-- ========================================================

-- 1. Habilitar extensão pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Clientes e Administradores
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_login_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  last_login_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  expires_at BIGINT, -- NULL significa acesso Vitalício (Lifetime / Admin)
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'BLOCKED')),
  registered_via TEXT NOT NULL DEFAULT 'ADMIN_MANUAL' CHECK (registered_via IN ('HIOVE', 'ADMIN_MANUAL', 'ADMIN_MASTER')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Índices para performance instantânea
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Acesso para Aplicação Web (Chave Anon / Publishable)
DROP POLICY IF EXISTS "Permitir leitura publica de clientes" ON public.clients;
CREATE POLICY "Permitir leitura publica de clientes"
  ON public.clients
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir insercao de clientes" ON public.clients;
CREATE POLICY "Permitir insercao de clientes"
  ON public.clients
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de clientes" ON public.clients;
CREATE POLICY "Permitir atualizacao de clientes"
  ON public.clients
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusao de clientes" ON public.clients;
CREATE POLICY "Permitir exclusao de clientes"
  ON public.clients
  FOR DELETE
  USING (true);

-- 6. Inserir ou Atualizar Administrador Master do Sistema
INSERT INTO public.clients (
  email,
  first_login_at,
  last_login_at,
  expires_at,
  status,
  registered_via,
  notes
) VALUES (
  'herisson.trader.jt5@gmail.com',
  (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  NULL,
  'ACTIVE',
  'ADMIN_MASTER',
  'Administrador Master do Sistema CandleX AI'
)
ON CONFLICT (email) DO UPDATE
SET
  status = 'ACTIVE',
  expires_at = NULL,
  notes = 'Administrador Master do Sistema CandleX AI',
  last_login_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
