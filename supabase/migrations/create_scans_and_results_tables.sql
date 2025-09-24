/*
  # Create Scans & Scan Results Tables

  This migration sets up the necessary tables for storing scan jobs and their findings,
  with full Row Level Security to ensure users can only access their own data.

  1.  **New Tables**:
      - `scans`: Tracks each scan request (domain, status, user_id).
      - `scan_results`: Stores individual vulnerabilities found during a scan.

  2.  **Relationships**:
      - `scan_results` is linked to `scans` via a foreign key.
      - Both tables are linked to `auth.users` via `user_id`.

  3.  **Security**:
      - RLS is enabled on both tables.
      - Policies are added to allow users to perform CRUD operations only on their own records.
*/

-- Create a type for scan status for better data integrity
CREATE TYPE scan_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- Create the scans table
CREATE TABLE IF NOT EXISTS public.scans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    domain text NOT NULL,
    status scan_status DEFAULT 'pending' NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS scans_user_id_idx ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS scans_status_idx ON public.scans(status);

-- Enable RLS
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scans table
DROP POLICY IF EXISTS "Users can view their own scans" ON public.scans;
CREATE POLICY "Users can view their own scans"
    ON public.scans FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create scans for themselves" ON public.scans;
CREATE POLICY "Users can create scans for themselves"
    ON public.scans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own scans" ON public.scans;
CREATE POLICY "Users can update their own scans"
    ON public.scans FOR UPDATE
    USING (auth.uid() = user_id);

-- Create the scan_results table
CREATE TABLE IF NOT EXISTS public.scan_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id uuid REFERENCES public.scans(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    url text NOT NULL,
    description text NOT NULL,
    severity text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS scan_results_scan_id_idx ON public.scan_results(scan_id);
CREATE INDEX IF NOT EXISTS scan_results_user_id_idx ON public.scan_results(user_id);

-- Enable RLS
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scan_results table
DROP POLICY IF EXISTS "Users can view their own scan results" ON public.scan_results;
CREATE POLICY "Users can view their own scan results"
    ON public.scan_results FOR SELECT
    USING (auth.uid() = user_id);

-- Grant usage on the new type to supabase roles
GRANT USAGE ON TYPE public.scan_status TO anon, authenticated, service_role;