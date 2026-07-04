import { supabase } from './supabase.js';
import { DEFAULT_AGENTS } from './constants.js';

// ============================================================
// AGENTS
// ============================================================

export async function fetchAgents() {
	const { data, error } = await supabase
		.from('agents')
		.select('*')
		.order('created_at', { ascending: true });
	if (error) throw error;
	return data;
}

export async function createAgent(agent) {
	const { data, error } = await supabase
		.from('agents')
		.insert({
			name: agent.name,
			role: agent.role,
			description: agent.description || '',
			scope: agent.scope || '',
			system_prompt: agent.system_prompt || '',
			input_schema: agent.input_schema || {},
			output_schema: agent.output_schema || {},
			is_active: true
		})
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function updateAgent(id, updates) {
	const { data, error } = await supabase
		.from('agents')
		.update({ ...updates, updated_at: new Date().toISOString() })
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deleteAgent(id) {
	const { error } = await supabase.from('agents').delete().eq('id', id);
	if (error) throw error;
}

export async function seedDefaultAgents() {
	const existing = await fetchAgents();
	if (existing.length > 0) return existing;

	for (const agent of DEFAULT_AGENTS) {
		await createAgent(agent);
	}
	return fetchAgents();
}

// ============================================================
// API KEYS
// ============================================================

export async function fetchApiKeys() {
	const { data, error } = await supabase
		.from('api_keys')
		.select('*')
		.order('created_at', { ascending: true });
	if (error) throw error;
	return data;
}

export async function createApiKey({ provider, label, api_key, available_models }) {
	const hint = api_key.length > 8 ? `${api_key.slice(0, 4)}...${api_key.slice(-4)}` : '****';
	const { data, error } = await supabase
		.from('api_keys')
		.insert({
			provider,
			label,
			api_key_encrypted: api_key,
			api_key_hint: hint,
			available_models: available_models || []
		})
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deleteApiKey(id) {
	const { error } = await supabase.from('api_keys').delete().eq('id', id);
	if (error) throw error;
}

// ============================================================
// AGENT MODEL ASSIGNMENTS
// ============================================================

export async function fetchAssignments() {
	const { data, error } = await supabase.from('agent_model_assignments').select('*');
	if (error) throw error;
	return data;
}

export async function assignModelToAgent(agentId, apiKeyId, modelId) {
	const { data: existing } = await supabase
		.from('agent_model_assignments')
		.select('id')
		.eq('agent_id', agentId)
		.maybeSingle();

	if (existing) {
		const { data, error } = await supabase
			.from('agent_model_assignments')
			.update({ api_key_id: apiKeyId, model_id: modelId })
			.eq('id', existing.id)
			.select()
			.single();
		if (error) throw error;
		return data;
	} else {
		const { data, error } = await supabase
			.from('agent_model_assignments')
			.insert({ agent_id: agentId, api_key_id: apiKeyId, model_id: modelId })
			.select()
			.single();
		if (error) throw error;
		return data;
	}
}

export async function removeAssignment(agentId) {
	const { error } = await supabase
		.from('agent_model_assignments')
		.delete()
		.eq('agent_id', agentId);
	if (error) throw error;
}

// ============================================================
// PROJECTS
// ============================================================

export async function fetchProjects() {
	const { data, error } = await supabase
		.from('projects')
		.select('*')
		.order('created_at', { ascending: false });
	if (error) throw error;
	return data;
}

export async function createProject({ name, source_path, source_type }) {
	const { data, error } = await supabase
		.from('projects')
		.insert({
			name,
			source_path,
			source_type: source_type || 'local',
			scan_status: 'idle'
		})
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function updateProject(id, updates) {
	const { data, error } = await supabase
		.from('projects')
		.update({ ...updates, updated_at: new Date().toISOString() })
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deleteProject(id) {
	const { error } = await supabase.from('projects').delete().eq('id', id);
	if (error) throw error;
}

// ============================================================
// KNOWLEDGE CACHE
// ============================================================

export async function fetchKnowledge(projectId) {
	const { data, error } = await supabase
		.from('knowledge_cache')
		.select('*')
		.eq('project_id', projectId)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();
	if (error) throw error;
	return data;
}

export async function saveKnowledge(projectId, knowledge) {
	const existing = await fetchKnowledge(projectId);
	if (existing) {
		const { data, error } = await supabase
			.from('knowledge_cache')
			.update({
				tech_stack: knowledge.tech_stack || [],
				entry_points: knowledge.entry_points || [],
				dependency_graph: knowledge.dependency_graph || {},
				file_tree: knowledge.file_tree || {},
				documentation: knowledge.documentation || [],
				raw_summary: knowledge.raw_summary || '',
				updated_at: new Date().toISOString()
			})
			.eq('id', existing.id)
			.select()
			.single();
		if (error) throw error;
		return data;
	} else {
		const { data, error } = await supabase
			.from('knowledge_cache')
			.insert({
				project_id: projectId,
				storage_type: 'structured_json',
				tech_stack: knowledge.tech_stack || [],
				entry_points: knowledge.entry_points || [],
				dependency_graph: knowledge.dependency_graph || {},
				file_tree: knowledge.file_tree || {},
				documentation: knowledge.documentation || [],
				raw_summary: knowledge.raw_summary || ''
			})
			.select()
			.single();
		if (error) throw error;
		return data;
	}
}

// ============================================================
// RUNS
// ============================================================

export async function fetchRuns(projectId) {
	const { data, error } = await supabase
		.from('runs')
		.select('*')
		.eq('project_id', projectId)
		.order('created_at', { ascending: false });
	if (error) throw error;
	return data;
}

export async function createRun({ project_id, command, routing_strategy, validation_strategy }) {
	const { data, error } = await supabase
		.from('runs')
		.insert({
			project_id,
			command,
			routing_strategy: routing_strategy || 'rule_based',
			validation_strategy: validation_strategy || 'schema_validation',
			status: 'pending'
		})
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function updateRun(id, updates) {
	const { data, error } = await supabase
		.from('runs')
		.update(updates)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deleteRun(id) {
	const { error } = await supabase.from('runs').delete().eq('id', id);
	if (error) throw error;
}

// ============================================================
// TASKS
// ============================================================

export async function fetchTasks(runId) {
	const { data, error } = await supabase
		.from('tasks')
		.select('*')
		.eq('run_id', runId)
		.order('created_at', { ascending: true });
	if (error) throw error;
	return data;
}

export async function createTask(task) {
	const { data, error } = await supabase
		.from('tasks')
		.insert({
			run_id: task.run_id,
			agent_id: task.agent_id || null,
			title: task.title,
			description: task.description || '',
			input_payload: task.input_payload || {},
			status: 'idle',
			max_retries: task.max_retries || 3
		})
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function updateTask(id, updates) {
	const { data, error } = await supabase
		.from('tasks')
		.update(updates)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deleteTask(id) {
	const { error } = await supabase.from('tasks').delete().eq('id', id);
	if (error) throw error;
}

// ============================================================
// LOGS
// ============================================================

export async function fetchTaskLogs(taskId) {
	const { data, error } = await supabase
		.from('task_logs')
		.select('*')
		.eq('task_id', taskId)
		.order('created_at', { ascending: true });
	if (error) throw error;
	return data;
}

export async function addTaskLog(taskId, level, message, metadata = {}) {
	const { data, error } = await supabase
		.from('task_logs')
		.insert({ task_id: taskId, level, message, metadata })
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function fetchRunLogs(runId) {
	const { data, error } = await supabase
		.from('run_logs')
		.select('*')
		.eq('run_id', runId)
		.order('created_at', { ascending: true });
	if (error) throw error;
	return data;
}

export async function addRunLog(runId, level, message, metadata = {}) {
	const { data, error } = await supabase
		.from('run_logs')
		.insert({ run_id: runId, level, message, metadata })
		.select()
		.single();
	if (error) throw error;
	return data;
}

// ============================================================
// REALTIME SUBSCRIPTIONS
// ============================================================

export function subscribeToTasks(runId, callback) {
	const channel = supabase
		.channel(`tasks:${runId}`)
		.on('postgres_changes',
			{ event: '*', schema: 'public', table: 'tasks', filter: `run_id=eq.${runId}` },
			callback
		)
		.subscribe();
	return channel;
}

export function subscribeToTaskLogs(taskId, callback) {
	const channel = supabase
		.channel(`task_logs:${taskId}`)
		.on('postgres_changes',
			{ event: 'INSERT', schema: 'public', table: 'task_logs', filter: `task_id=eq.${taskId}` },
			callback
		)
		.subscribe();
	return channel;
}

export function subscribeToRunLogs(runId, callback) {
	const channel = supabase
		.channel(`run_logs:${runId}`)
		.on('postgres_changes',
			{ event: 'INSERT', schema: 'public', table: 'run_logs', filter: `run_id=eq.${runId}` },
			callback
		)
		.subscribe();
	return channel;
}

export function subscribeToRuns(projectId, callback) {
	const channel = supabase
		.channel(`runs:${projectId}`)
		.on('postgres_changes',
			{ event: '*', schema: 'public', table: 'runs', filter: `project_id=eq.${projectId}` },
			callback
		)
		.subscribe();
	return channel;
}
