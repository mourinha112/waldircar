-- Schema for Admin System

-- Available scheduling days table
CREATE TABLE IF NOT EXISTS scheduling_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  interval_minutes INTEGER NOT NULL DEFAULT 30,
  max_appointments INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- User subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  interval VARCHAR(20) NOT NULL CHECK (interval IN ('monthly', 'quarterly', 'biannual', 'annual')),
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User plan subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
  payment_method VARCHAR(50),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User appointments/scheduling
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  availability_id UUID REFERENCES scheduling_availability(id) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  mechanic_id UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles for admin/mechanic
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'mechanic', 'user')),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE (user_id, role)
);

-- Service checklists templates
CREATE TABLE IF NOT EXISTS service_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  items JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Completed service orders
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  appointment_id UUID REFERENCES appointments(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  mechanic_id UUID REFERENCES auth.users(id) NOT NULL,
  vehicle_id UUID REFERENCES profiles(id),
  checklist_id UUID REFERENCES service_checklists(id),
  completed_checklist JSONB,
  diagnosis TEXT,
  recommendations TEXT,
  total_cost DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'invoiced', 'paid')),
  photos JSONB,
  is_published BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies

-- Admin and mechanics can read all scheduling availabilities
CREATE POLICY "Admin and mechanics can read all scheduling availabilities"
ON scheduling_availability
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role IN ('admin', 'mechanic') AND is_active = TRUE
  )
);

-- Only admins can create/update scheduling availabilities
CREATE POLICY "Only admins can create scheduling availabilities"
ON scheduling_availability
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin' AND is_active = TRUE
  )
);

CREATE POLICY "Only admins can update scheduling availabilities"
ON scheduling_availability
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin' AND is_active = TRUE
  )
);

-- Only admins can manage subscription plans
CREATE POLICY "Only admins can manage subscription plans"
ON subscription_plans
FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin' AND is_active = TRUE
  )
);

-- Users can see active subscription plans
CREATE POLICY "Users can see active subscription plans"
ON subscription_plans
FOR SELECT
USING (is_active = TRUE);

-- Users can see their own subscriptions
CREATE POLICY "Users can see their own subscriptions"
ON user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Admin can see all subscriptions
CREATE POLICY "Admin can see all subscriptions"
ON user_subscriptions
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin' AND is_active = TRUE
  )
);

-- Admin can manage all appointments
CREATE POLICY "Admin can manage all appointments"
ON appointments
FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin' AND is_active = TRUE
  )
);

-- Mechanics can view and update assigned appointments
CREATE POLICY "Mechanics can view and update assigned appointments"
ON appointments
FOR SELECT
USING (
  auth.uid() = mechanic_id OR
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'mechanic' AND is_active = TRUE
  )
);

CREATE POLICY "Mechanics can update assigned appointments"
ON appointments
FOR UPDATE
USING (
  auth.uid() = mechanic_id AND
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'mechanic' AND is_active = TRUE
  )
);

-- Users can see their own appointments
CREATE POLICY "Users can see their own appointments"
ON appointments
FOR SELECT
USING (auth.uid() = user_id);

-- Only admin can manage user roles
CREATE POLICY "Only admin can manage user roles"
ON user_roles
FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin' AND is_active = TRUE
  )
);

-- Admin and mechanics can manage service checklists
CREATE POLICY "Admin and mechanics can view service checklists"
ON service_checklists
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role IN ('admin', 'mechanic') AND is_active = TRUE
  )
);

CREATE POLICY "Only admin can manage service checklists"
ON service_checklists
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin' AND is_active = TRUE
  )
);

-- Admin and assigned mechanics can manage service orders
CREATE POLICY "Admin and assigned mechanics can manage service orders"
ON service_orders
FOR ALL
USING (
  auth.uid() = mechanic_id OR
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin' AND is_active = TRUE
  )
);

-- Users can view their own service orders
CREATE POLICY "Users can view their own service orders"
ON service_orders
FOR SELECT
USING (auth.uid() = user_id AND is_published = TRUE); 