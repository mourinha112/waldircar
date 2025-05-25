-- Fix for missing mechanic_id column
-- First check if the column exists to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'service_orders' 
        AND column_name = 'mechanic_id'
    ) THEN
        -- Add the mechanic_id column if it doesn't exist
        ALTER TABLE public.service_orders 
        ADD COLUMN mechanic_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Temporary fix to make mechanic_id nullable until we can set proper values
ALTER TABLE public.service_orders 
ALTER COLUMN mechanic_id DROP NOT NULL;

-- Same check and fix for appointments table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'appointments' 
        AND column_name = 'mechanic_id'
    ) THEN
        -- Add the mechanic_id column if it doesn't exist
        ALTER TABLE public.appointments 
        ADD COLUMN mechanic_id UUID REFERENCES auth.users(id);
    END IF;
END $$; 