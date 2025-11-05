import { createClient } from '@supabase/supabase-js';
import type { Department } from '../constants/departments';

const supabaseUrl = 'Your URL';
const supabaseAnonKey = 'Anon Key';

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
  department: Department | null;
  status: string;
  ai_suggested_reply?: string;
  assigned_agent?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  sla_deadline: string;
}
