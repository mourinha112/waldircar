-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de funções de usuário
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'mechanic', 'client')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Tabela de veículos
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year TEXT NOT NULL,
  color TEXT,
  license_plate TEXT UNIQUE NOT NULL,
  vin TEXT UNIQUE,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de planos
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('monthly', 'quarterly', 'semiannual', 'annual')),
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de assinaturas de planos
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('active', 'canceled', 'expired', 'pending')),
  payment_status TEXT CHECK (payment_status IN ('paid', 'pending', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  service_type TEXT NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'confirmed', 'completed', 'canceled', 'missed')),
  notes TEXT,
  assigned_mechanic UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de ordens de serviço
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'canceled')),
  total_cost DECIMAL(10, 2),
  start_date TIMESTAMP WITH TIME ZONE,
  completion_date TIMESTAMP WITH TIME ZONE,
  assigned_mechanic UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens de ordem de serviço
CREATE TABLE IF NOT EXISTS service_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  item_type TEXT CHECK (item_type IN ('part', 'service', 'labor', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de manutenção
CREATE TABLE IF NOT EXISTS maintenance_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  service_order_id UUID REFERENCES service_orders(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  service_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  odometer_reading INTEGER,
  next_service_date TIMESTAMP WITH TIME ZONE,
  next_service_odometer INTEGER,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('appointment', 'service', 'promotion', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de promoções e ofertas
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage DECIMAL(5, 2),
  discount_amount DECIMAL(10, 2),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de avaliações e comentários
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de segurança (RLS)
-- Ativar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Funções para verificar papel do usuário
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_mechanic() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'mechanic'
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_client() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'client'
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para usuários
CREATE POLICY "Usuários podem ver seus próprios dados" 
ON users FOR SELECT 
USING (id = auth.uid() OR is_admin() OR is_mechanic());

CREATE POLICY "Admins podem criar usuários" 
ON users FOR INSERT 
TO authenticated 
WITH CHECK (is_admin());

CREATE POLICY "Usuários podem atualizar seus próprios dados" 
ON users FOR UPDATE 
USING (id = auth.uid() OR is_admin()) 
WITH CHECK (id = auth.uid() OR is_admin());

-- Políticas para veículos
CREATE POLICY "Usuários podem ver seus próprios veículos" 
ON vehicles FOR SELECT 
USING (user_id = auth.uid() OR is_admin() OR is_mechanic());

CREATE POLICY "Usuários podem criar seus próprios veículos" 
ON vehicles FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "Usuários podem atualizar seus próprios veículos" 
ON vehicles FOR UPDATE 
USING (user_id = auth.uid() OR is_admin() OR is_mechanic()) 
WITH CHECK (user_id = auth.uid() OR is_admin() OR is_mechanic());

-- Políticas para agendamentos
CREATE POLICY "Usuários podem ver seus próprios agendamentos" 
ON appointments FOR SELECT 
USING (user_id = auth.uid() OR is_admin() OR is_mechanic());

CREATE POLICY "Usuários podem criar seus próprios agendamentos" 
ON appointments FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins e mecânicos podem atualizar agendamentos" 
ON appointments FOR UPDATE 
USING (user_id = auth.uid() OR is_admin() OR is_mechanic()) 
WITH CHECK (user_id = auth.uid() OR is_admin() OR is_mechanic());

-- Políticas para ordens de serviço
CREATE POLICY "Usuários podem ver suas próprias ordens de serviço" 
ON service_orders FOR SELECT 
USING (user_id = auth.uid() OR is_admin() OR is_mechanic());

CREATE POLICY "Admins e mecânicos podem criar ordens de serviço" 
ON service_orders FOR INSERT 
TO authenticated 
WITH CHECK (is_admin() OR is_mechanic());

CREATE POLICY "Admins e mecânicos podem atualizar ordens de serviço" 
ON service_orders FOR UPDATE 
USING (is_admin() OR is_mechanic()) 
WITH CHECK (is_admin() OR is_mechanic());

-- Funções de API para sincronização

-- Função para listar agendamentos do usuário
CREATE OR REPLACE FUNCTION get_user_appointments(
  user_id UUID DEFAULT auth.uid()
) RETURNS SETOF appointments AS $$
BEGIN
  IF auth.uid() = user_id OR is_admin() OR is_mechanic() THEN
    RETURN QUERY
    SELECT * FROM appointments
    WHERE appointments.user_id = user_id
    ORDER BY scheduled_date DESC;
  ELSE
    RAISE EXCEPTION 'Não autorizado';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para listar ordens de serviço do usuário
CREATE OR REPLACE FUNCTION get_user_service_orders(
  user_id UUID DEFAULT auth.uid()
) RETURNS SETOF service_orders AS $$
BEGIN
  IF auth.uid() = user_id OR is_admin() OR is_mechanic() THEN
    RETURN QUERY
    SELECT * FROM service_orders
    WHERE service_orders.user_id = user_id
    ORDER BY created_at DESC;
  ELSE
    RAISE EXCEPTION 'Não autorizado';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter histórico de manutenção de um veículo
CREATE OR REPLACE FUNCTION get_vehicle_maintenance_history(
  vehicle_id UUID
) RETURNS SETOF maintenance_history AS $$
DECLARE
  vehicle_owner UUID;
BEGIN
  SELECT user_id INTO vehicle_owner FROM vehicles WHERE id = vehicle_id;
  
  IF auth.uid() = vehicle_owner OR is_admin() OR is_mechanic() THEN
    RETURN QUERY
    SELECT * FROM maintenance_history
    WHERE maintenance_history.vehicle_id = vehicle_id
    ORDER BY service_date DESC;
  ELSE
    RAISE EXCEPTION 'Não autorizado';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter todas as notificações não lidas do usuário
CREATE OR REPLACE FUNCTION get_unread_notifications() 
RETURNS SETOF notifications AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM notifications
  WHERE user_id = auth.uid() AND is_read = FALSE
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilhos para notificações automáticas

-- Função para criar notificação quando um agendamento é confirmado
CREATE OR REPLACE FUNCTION notify_appointment_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Agendamento Confirmado',
      'Seu agendamento para ' || to_char(NEW.scheduled_date, 'DD/MM/YYYY às HH24:MI') || ' foi confirmado.',
      'appointment'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER appointment_confirmed_trigger
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION notify_appointment_confirmed();

-- Função para criar notificação quando uma ordem de serviço é concluída
CREATE OR REPLACE FUNCTION notify_service_order_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Serviço Concluído',
      'Seu serviço "' || NEW.title || '" foi concluído.',
      'service'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER service_order_completed_trigger
AFTER INSERT OR UPDATE ON service_orders
FOR EACH ROW
EXECUTE FUNCTION notify_service_order_completed();

-- Dados iniciais

-- Inserir planos padrão
INSERT INTO plans (name, description, price, interval, features, is_active)
VALUES 
('Básico', 'Plano básico de manutenção', 49.90, 'monthly', '{"features": ["Inspeção mensal", "Desconto em peças", "Suporte 24/7"]}', true),
('Premium', 'Plano premium com benefícios exclusivos', 99.90, 'monthly', '{"features": ["Inspeção semanal", "Desconto em peças", "Suporte 24/7", "Guincho grátis", "Prioridade no agendamento"]}', true)
ON CONFLICT DO NOTHING;

-- Inserir configurações iniciais do sistema
INSERT INTO system_settings (key, value, description)
VALUES 
('business_hours', '{"weekdays": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "08:00", "close": "12:00"}, "sunday": {"open": null, "close": null}}', 'Horário de funcionamento'),
('appointment_duration', '60', 'Duração padrão de agendamentos em minutos'),
('max_daily_appointments', '20', 'Número máximo de agendamentos por dia')
ON CONFLICT DO NOTHING; 