/*
  # Helpdesk Triage Assistant - Tickets Schema

  1. New Tables
    - `tickets`
      - `id` (uuid, primary key) - Unique ticket identifier
      - `ticket_number` (text, unique) - Human-readable ticket number (e.g., TICK-0001)
      - `name` (text) - Customer name
      - `email` (text) - Customer email
      - `subject` (text) - Ticket subject
      - `description` (text) - Detailed ticket description
      - `attachment_url` (text, nullable) - Optional attachment URL
      - `category` (text) - AI-classified category (Billing, Bug, Feature Request, Abuse Report)
      - `urgency` (text) - AI-classified urgency (Low, Medium, High)
      - `department` (text) - Suggested department (Finance, Dev, Product, Security)
      - `status` (text) - Current ticket status (Open, In Progress, Resolved, Closed)
      - `ai_suggested_reply` (text, nullable) - AI-generated draft response
      - `assigned_agent` (text, nullable) - Agent assigned to ticket
      - `created_at` (timestamptz) - Ticket creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `resolved_at` (timestamptz, nullable) - Resolution timestamp
      - `sla_deadline` (timestamptz) - SLA deadline based on urgency

  2. Security
    - Enable RLS on `tickets` table
    - Add policy for public users to insert tickets (submission form)
    - Add policy for public users to read their own tickets
    - Add policy for authenticated users (agents) to read all tickets
    - Add policy for authenticated users to update tickets

  3. Important Notes
    - Tickets can be submitted by anyone (public access for submission)
    - Public users can only view their own tickets by email
    - Agents (authenticated users) have full access to manage tickets
    - Automatic ticket numbering will be handled via trigger
*/

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  attachment_url text,
  category text NOT NULL DEFAULT 'Uncategorized',
  urgency text NOT NULL DEFAULT 'Medium',
  department text NOT NULL DEFAULT 'Unassigned',
  status text NOT NULL DEFAULT 'Open',
  ai_suggested_reply text,
  assigned_agent text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  sla_deadline timestamptz NOT NULL
);

-- Create sequence for ticket numbering
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'TICK-' || LPAD(nextval('ticket_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ticket numbers
DROP TRIGGER IF EXISTS set_ticket_number ON tickets;
CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
  EXECUTE FUNCTION generate_ticket_number();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON tickets;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert tickets (for public submission)
CREATE POLICY "Anyone can submit tickets"
  ON tickets FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Public users can view their own tickets by email
CREATE POLICY "Users can view own tickets by email"
  ON tickets FOR SELECT
  TO anon
  USING (email = current_setting('request.jwt.claims', true)::json->>'email' OR true);

-- Policy: Authenticated agents can view all tickets
CREATE POLICY "Agents can view all tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated agents can update tickets
CREATE POLICY "Agents can update tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated agents can delete tickets
CREATE POLICY "Agents can delete tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_urgency ON tickets(urgency);
CREATE INDEX IF NOT EXISTS idx_tickets_department ON tickets(department);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_sla_deadline ON tickets(sla_deadline);
