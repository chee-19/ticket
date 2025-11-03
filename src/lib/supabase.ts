import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lnrfpokopwwrxnsnnrhy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxucmZwb2tvcHd3cnhuc25ucmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0OTIwNTIsImV4cCI6MjA3NjA2ODA1Mn0.TNcSaNk-X3uHLbv0B2bjT9K1nQ-N_0-AF92-yFDxaNk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Ticket {
  id: string;
  ticket_number: string;
  name: string;
  email: string;
  subject: string;
  description: string;
  attachment_url?: string | string[];
  category: string;
  urgency: string;
  department: string | null;
  status: string;
  ai_suggested_reply?: string;
  assigned_agent?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  sla_deadline: string;
}
