# Helpdesk Triage Assistant

A modern AI-powered helpdesk web application that classifies, routes, and drafts replies for support tickets.  
Built with **Vite + React + TailwindCSS**, integrated with **Supabase** (for authentication and database), and **n8n** (for automation and AI classification).

---

## ⚙️ Setup Guide

### 1. Clone the repository
```
git clone https://github.com/chee-19/ticket.git
```

### 2. Install dependencies
```
npm install
```

### 3. Configure environment variables
Edit the `.env` file in the project root and fill in your own credentials:

```
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
VITE_N8N_WEBHOOK_URL="Production URL"
```
Or you can edit here at the supabase.ts file:
```
const supabaseUrl = 'URL';
const supabaseAnonKey = 'Anon key'

```
⚠️ **Important:**  
You must replace `VITE_N8N_WEBHOOK_URL` with the **Production Webhook URL** from your deployed n8n workflow.  
Example:
```
VITE_N8N_WEBHOOK_URL="https://your-n8n-instance.cloudflare.workers.dev/webhook/helpdesk"
```

💡 **If you want to use your own AI model or API**, open your n8n workflow and edit the **HTTP Request node** — replace the current endpoint URL with your own API (e.g. OpenAI, Gemini, or HuggingFace).  
The rest of the flow will still work the same way. Additionally, enter the supabase credentials to n8n.

---

## 🧠 How It Works

1. **Customer submits** a support ticket on the public form.  
2. **Supabase** stores the ticket in the `tickets` table.  
3. **n8n workflow** is triggered via webhook:
   - Classifies the department, urgency, and category.
   - Generates a draft reply using AI.
   - Updates the ticket record in Supabase.
4. **Department staff** logs in to the dashboard:
   - Sees tickets only for their department.
   - Reviews and edits the AI-generated draft.
   - Clicks **“Open Email Draft”** to launch Gmail with the pre-filled reply.
5. After sending the email, staff should:
   - Change the **Status** to `Resolved` or `Closed`.
   - Enter their name in **Assigned Agent** to record accountability.

---

## 👩‍💻 Staff Accounts Setup

Staff accounts are managed via **Supabase Auth** and the `public.profiles` table.

1. Create the staff user in Supabase Auth:
   ```sql
   select auth.admin.create_user(
     email := 'STAFF_EMAIL',
     password := 'STAFF_PASSWORD',
     email_confirm := true
   );
   ```
2. Insert the profile record:
   ```sql
   insert into public.profiles (id, full_name, department)
   values ('STAFF_USER_ID', 'Full Name', 'Support')
   on conflict (id) do update set
     full_name = excluded.full_name,
     department = excluded.department;
   ```

Departments supported: `Finance`, `Dev`, `Product`, `Security`, `Support`, `All Departments`.

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React + TypeScript + TailwindCSS |
| Backend | Supabase (PostgreSQL + Auth) |
| AI Automation | n8n workflow |
| Hosting | Bolt.new (Vercel) |

---

## 📁 Database Schema (Supabase)

Key tables:
- **tickets** — stores all incoming tickets and AI-generated drafts  
- **profiles** — maps staff users to departments  
- **outgoing_messages** — logs sent replies for audit tracking  



---

## 🧪 Development

Start local development:
```
npm run dev
```

Build for production:
```
npm run build
```

---

## 🏁 Notes for Reviewers / Hackathon Judges

- Ensure `.env` contains your own n8n **Production Webhook URL** (`VITE_N8N_WEBHOOK_URL`).
- Ensure to activate the workflow
- You can reuse your own Supabase credentials for testing.
- The AI workflow (`classify & draft`) is modular — replaceable with any OpenAI-compatible or Gemini API.
- The n8n workflow is provided as a `.json` export file.

---

**Author:** Ng Chee Wei  
**Institution:** Singapore Polytechnic  
**Project:** Helpdesk Triage Assistant — AI-driven support ticket routing and triage system.
