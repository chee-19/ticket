# Helpdesk Triage Assistant

A modern AI-powered helpdesk web application that classifies, routes, and drafts replies for support tickets.  
Built with **Vite + React + TailwindCSS**, integrated with **Supabase** (for authentication and database), and **n8n** (for automation and AI classification).

---

## ⚙️ Setup Guide

### 1. Clone the repository
```bash
git clone https://github.com/your-username/helpdesk-triage-assistant.git
cd helpdesk-triage-assistant
2. Install dependencies
bash
Copy code
npm install
3. Configure environment variables
Create a .env file in the project root and fill in your own credentials:

bash
Copy code
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
VITE_N8N_WEBHOOK_URL="Production URL"
⚠️ Important:
You must replace VITE_N8N_WEBHOOK_URL with the Production Webhook URL from your deployed n8n workflow.
Example:

ini
Copy code
VITE_N8N_WEBHOOK_URL="https://your-n8n-instance.cloudflare.workers.dev/webhook/helpdesk"
💡 If you want to use your own AI model or API, open your n8n workflow and edit the HTTP Request node — replace the current endpoint URL with your own API (e.g. OpenAI, Gemini, or HuggingFace).
The rest of the flow will still work the same way.

🧠 How It Works
Customer submits a support ticket on the public form.

Supabase stores the ticket in the tickets table.

n8n workflow is triggered via webhook:

Classifies the department, urgency, and category.

Generates a draft reply using AI.

Updates the ticket record in Supabase.

Department staff logs in to the dashboard:

Sees tickets only for their department.

Reviews and edits the AI-generated draft.

Clicks “Open Email Draft” to launch Gmail with the pre-filled reply.

After sending the email, staff should:

Change the Status to Resolved or Closed.

Enter their name in Assigned Agent to record accountability.

👩‍💻 Staff Accounts Setup
Staff accounts are managed via Supabase Auth and the public.profiles table.

Create the staff user in Supabase Auth:

sql
Copy code
select auth.admin.create_user(
  email := 'STAFF_EMAIL',
  password := 'STAFF_PASSWORD',
  email_confirm := true
);
Insert the profile record:

sql
Copy code
insert into public.profiles (id, full_name, department)
values ('STAFF_USER_ID', 'Full Name', 'Support')
on conflict (id) do update set
  full_name = excluded.full_name,
  department = excluded.department;
Departments supported: Finance, Dev, Product, Security, Support, All Departments.

🧩 Tech Stack
Layer	Technology
Frontend	React + TypeScript + TailwindCSS
Backend	Supabase (PostgreSQL + Auth)
AI Automation	n8n workflow
Hosting	Bolt.new (Vercel)

📁 Database Schema (Supabase)
Key tables:

tickets — stores all incoming tickets and AI-generated drafts

profiles — maps staff users to departments

outgoing_messages — logs sent replies for audit tracking