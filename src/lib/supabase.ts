import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  department: string;
  status: string;
  ai_suggested_reply?: string;
  assigned_agent?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  sla_deadline: string;
}
