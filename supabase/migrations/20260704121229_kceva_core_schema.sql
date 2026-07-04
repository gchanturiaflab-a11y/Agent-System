/*
# Kceva — Agent Orchestration Control Panel Schema

## Overview
Creates the full data model for the Kceva agent-orchestration workflow control panel.
This is a single-tenant app (no sign-in screen), so all policies use `TO anon, authenticated`
with `USING (true)` because the data is intentionally shared/public within the control panel.

## New Tables
1. `api_keys` — Stores LLM provider API keys (OpenAI, Anthropic, etc.) and their model lists.
2. `agents` — Defines specialized worker agents (scanner, orchestrator, coder, tester, reviewer, etc.).
3. `agent_model_assignments` — Links an agent to a specific API key + model for execution.
4. `projects` — Target projects (local path or repo URL) with scan status.
5. `knowledge_cache` — Structured knowledge extracted by the scanner, reusable across runs.
6. `runs` — A single orchestration run (user command → final output).
7. `tasks` — Individual tasks decomposed by the orchestrator, assigned to worker agents.
8. `task_logs` — Per-task execution logs (status changes, token usage, errors).
9. `run_logs` — Aggregated run-level logs for the delivery section.

## Security
- RLS enabled on every table.
- All tables allow anon + authenticated CRUD (single-tenant, intentionally shared data).
*/

-- ============================================================
-- 1. API KEYS
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  label text NOT NULL,
  api_key_encrypted text NOT NULL,
  api_key_hint text NOT NULL,
  available_models jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_api_keys" ON api_keys;
CREATE POLICY "anon_select_api_keys" ON api_keys FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_api_keys" ON api_keys;
CREATE POLICY "anon_insert_api_keys" ON api_keys FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_api_keys" ON api_keys;
CREATE POLICY "anon_update_api_keys" ON api_keys FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_api_keys" ON api_keys;
CREATE POLICY "anon_delete_api_keys" ON api_keys FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 2. AGENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  description text NOT NULL DEFAULT '',
  scope text NOT NULL DEFAULT '',
  input_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  system_prompt text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_agents" ON agents;
CREATE POLICY "anon_select_agents" ON agents FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_agents" ON agents;
CREATE POLICY "anon_insert_agents" ON agents FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_agents" ON agents;
CREATE POLICY "anon_update_agents" ON agents FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_agents" ON agents;
CREATE POLICY "anon_delete_agents" ON agents FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 3. AGENT MODEL ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_model_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  api_key_id uuid NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  model_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(agent_id)
);

ALTER TABLE agent_model_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_assignments" ON agent_model_assignments;
CREATE POLICY "anon_select_assignments" ON agent_model_assignments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_assignments" ON agent_model_assignments;
CREATE POLICY "anon_insert_assignments" ON agent_model_assignments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_assignments" ON agent_model_assignments;
CREATE POLICY "anon_update_assignments" ON agent_model_assignments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_assignments" ON agent_model_assignments;
CREATE POLICY "anon_delete_assignments" ON agent_model_assignments FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 4. PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source_path text NOT NULL,
  source_type text NOT NULL DEFAULT 'local',
  scan_status text NOT NULL DEFAULT 'idle',
  scan_summary jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 5. KNOWLEDGE CACHE
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  storage_type text NOT NULL DEFAULT 'structured_json',
  tech_stack jsonb NOT NULL DEFAULT '[]'::jsonb,
  entry_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  dependency_graph jsonb NOT NULL DEFAULT '{}'::jsonb,
  file_tree jsonb NOT NULL DEFAULT '{}'::jsonb,
  documentation jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_summary text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_knowledge" ON knowledge_cache;
CREATE POLICY "anon_select_knowledge" ON knowledge_cache FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_knowledge" ON knowledge_cache;
CREATE POLICY "anon_insert_knowledge" ON knowledge_cache FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_knowledge" ON knowledge_cache;
CREATE POLICY "anon_update_knowledge" ON knowledge_cache FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_knowledge" ON knowledge_cache;
CREATE POLICY "anon_delete_knowledge" ON knowledge_cache FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 6. RUNS
-- ============================================================
CREATE TABLE IF NOT EXISTS runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  command text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  routing_strategy text NOT NULL DEFAULT 'rule_based',
  validation_strategy text NOT NULL DEFAULT 'schema_validation',
  final_output jsonb,
  total_tokens integer NOT NULL DEFAULT 0,
  total_cost numeric(12,6) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_runs" ON runs;
CREATE POLICY "anon_select_runs" ON runs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_runs" ON runs;
CREATE POLICY "anon_insert_runs" ON runs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_runs" ON runs;
CREATE POLICY "anon_update_runs" ON runs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_runs" ON runs;
CREATE POLICY "anon_delete_runs" ON runs FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 7. TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_payload jsonb,
  status text NOT NULL DEFAULT 'idle',
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  tokens_used integer NOT NULL DEFAULT 0,
  cost numeric(12,6) NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 8. TASK LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS task_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_task_logs" ON task_logs;
CREATE POLICY "anon_select_task_logs" ON task_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_task_logs" ON task_logs;
CREATE POLICY "anon_insert_task_logs" ON task_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_task_logs" ON task_logs;
CREATE POLICY "anon_delete_task_logs" ON task_logs FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 9. RUN LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS run_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE run_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_run_logs" ON run_logs;
CREATE POLICY "anon_select_run_logs" ON run_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_run_logs" ON run_logs;
CREATE POLICY "anon_insert_run_logs" ON run_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_run_logs" ON run_logs;
CREATE POLICY "anon_delete_run_logs" ON run_logs FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tasks_run_id ON tasks(run_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_run_logs_run_id ON run_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_runs_project_id ON runs(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_project_id ON knowledge_cache(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_agent_id ON agent_model_assignments(agent_id);
