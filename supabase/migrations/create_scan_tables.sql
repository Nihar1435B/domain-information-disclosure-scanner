/*
  # Initial Schema for VulnScan Backend

  This migration sets up the core tables for the application.

  ## New Tables:
  1. `scans`: Stores information about each scan initiated by a user, including the target domain and the scan's status.
  2. `scan_results`: Stores the specific vulnerabilities found during a scan, linked back to the parent scan.

  ## New Types:
  1. `scan_status`: An ENUM to represent the state of a scan ('pending', 'running', 'completed', 'failed').
  2. `severity_level`: An ENUM for vulnerability severity ('High', 'Medium', 'Low').

  ## Security:
  - Row Level Security (RLS) is enabled on both tables.
  - Policies are created to ensure users can only access and manage their own data.
*/

-- Create custom types for status and severity
CREATE TYPE public.scan_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE public.severity_level AS ENUM ('High', 'Medium', 'Low');

-- Create the scans table
CREATE TABLE IF NOT EXISTS public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text NOT NULL,
  status public.scan_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  
  CONSTRAINT domain_length CHECK (char_length(domain) > 0 AND char_length(domain) <= 255)
);
COMMENT ON TABLE public.scans IS 'Stores information about each scan initiated by a user.';

-- Create the scan_results table
CREATE TABLE IF NOT EXISTS public.scan_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  url text NOT NULL,
  description text NOT NULL,
  severity public.severity_level NOT NULL,
  found_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.scan_results IS 'Stores the specific vulnerabilities found during a scan.';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS scans_user_id_idx ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS scan_results_scan_id_idx ON public.scan_results(scan_id);

-- Enable Row Level Security
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the scans table
CREATE POLICY "Users can view their own scans"
  ON public.scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scans"
  ON public.scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans"
  ON public.scans FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for the scan_results table
CREATE POLICY "Users can view results for their own scans"
  ON public.scan_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.scans
      WHERE scans.id = scan_results.scan_id AND scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert results for their own scans"
  ON public.scan_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.scans
      WHERE scans.id = scan_results.scan_id AND scans.user_id = auth.uid()
    )
  );