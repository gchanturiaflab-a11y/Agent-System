export const AGENT_ROLES = {
	SCANNER: 'scanner',
	ORCHESTRATOR: 'orchestrator',
	CODER: 'coder',
	TESTER: 'tester',
	REVIEWER: 'reviewer',
	DOCUMENTER: 'documenter',
	DEBUGGER: 'debugger',
	ARCHITECT: 'architect'
};

export const AGENT_STATUS = {
	IDLE: 'idle',
	RUNNING: 'running',
	DONE: 'done',
	FAILED: 'failed',
	RETRYING: 'retrying'
};

export const SCAN_STATUS = {
	IDLE: 'idle',
	SCANNING: 'scanning',
	DONE: 'done',
	FAILED: 'failed'
};

export const RUN_STATUS = {
	PENDING: 'pending',
	DECOMPOSING: 'decomposing',
	RUNNING: 'running',
	VALIDATING: 'validating',
	COMPLETED: 'completed',
	FAILED: 'failed'
};

export const ROUTING_STRATEGIES = {
	RULE_BASED: 'rule_based',
	CLASSIFIER: 'classifier',
	LLM_DECISION: 'llm_decision'
};

export const VALIDATION_STRATEGIES = {
	SCHEMA_VALIDATION: 'schema_validation',
	TEST_EXECUTION: 'test_execution',
	ADVERSARIAL_REVIEW: 'adversarial_review'
};

export const STORAGE_TYPES = {
	STRUCTURED_JSON: 'structured_json',
	KEY_VALUE_CACHE: 'key_value_cache',
	VECTOR_DB: 'vector_db'
};

export const PROVIDERS = {
	OPENAI: 'openai',
	ANTHROPIC: 'anthropic',
	GOOGLE: 'google',
	MISTRAL: 'mistral',
	CUSTOM: 'custom'
};

export const PROVIDER_MODELS = {
	openai: [
		'gpt-4o',
		'gpt-4o-mini',
		'gpt-4-turbo',
		'gpt-4',
		'gpt-3.5-turbo',
		'o1-preview',
		'o1-mini',
		'o3-mini'
	],
	anthropic: [
		'claude-3-5-sonnet-20241022',
		'claude-3-5-haiku-20241022',
		'claude-3-opus-20240229',
		'claude-3-sonnet-20240229',
		'claude-3-haiku-20240307'
	],
	google: [
		'gemini-2.0-flash',
		'gemini-1.5-pro',
		'gemini-1.5-flash',
		'gemini-1.0-pro'
	],
	mistral: [
		'mistral-large-latest',
		'mistral-medium-latest',
		'mistral-small-latest',
		'codestral-latest'
	],
	custom: []
};

export const DEFAULT_AGENTS = [
	{
		name: 'Scanner',
		role: 'scanner',
		description: 'Scans project structure, reads manifests, extracts documentation and dependency graphs.',
		scope: 'Discovery & knowledge extraction',
		system_prompt: 'You are the Scanner agent. Analyze the provided project structure, identify the tech stack, entry points, dependency graph, and documentation. Return a structured JSON summary.',
		input_schema: { project_path: 'string', source_type: 'string' },
		output_schema: { tech_stack: 'array', entry_points: 'array', dependency_graph: 'object', documentation: 'array', file_tree: 'object' }
	},
	{
		name: 'Orchestrator',
		role: 'orchestrator',
		description: 'Decomposes user commands into tasks, routes them to specialized agents, and aggregates results.',
		scope: 'Task decomposition & routing',
		system_prompt: 'You are the Orchestrator agent. Break down the user command into atomic tasks, assign each to the most suitable worker agent, and aggregate validated outputs into a final deliverable.',
		input_schema: { command: 'string', knowledge: 'object' },
		output_schema: { tasks: 'array', routing: 'object', final_output: 'object' }
	},
	{
		name: 'Architect',
		role: 'architect',
		description: 'Designs system architecture, proposes component structure, and validates technical decisions.',
		scope: 'Architecture & design',
		system_prompt: 'You are the Architect agent. Given project knowledge and a task, propose the architecture, component breakdown, and technical approach.',
		input_schema: { task: 'object', knowledge: 'object' },
		output_schema: { architecture: 'object', components: 'array', rationale: 'string' }
	},
	{
		name: 'Coder',
		role: 'coder',
		description: 'Implements code changes, writes functions, modules, and components based on task specifications.',
		scope: 'Code implementation',
		system_prompt: 'You are the Coder agent. Implement the specified task with clean, production-ready code. Follow existing project conventions.',
		input_schema: { task: 'object', knowledge: 'object', architecture: 'object' },
		output_schema: { files: 'array', code: 'string', summary: 'string' }
	},
	{
		name: 'Tester',
		role: 'tester',
		description: 'Writes and runs tests, validates output schemas, and ensures quality gates pass.',
		scope: 'Testing & validation',
		system_prompt: 'You are the Tester agent. Write tests for the provided code, validate output against the expected schema, and report pass/fail results.',
		input_schema: { code: 'string', output_schema: 'object', validation_strategy: 'string' },
		output_schema: { tests: 'array', results: 'object', passed: 'boolean' }
	},
	{
		name: 'Reviewer',
		role: 'reviewer',
		description: 'Performs adversarial code review, identifies bugs, security issues, and improvement opportunities.',
		scope: 'Adversarial review',
		system_prompt: 'You are the Reviewer agent. Perform an adversarial review of the provided code. Identify bugs, security vulnerabilities, and improvement opportunities.',
		input_schema: { code: 'string', context: 'object' },
		output_schema: { issues: 'array', severity: 'object', recommendations: 'array', approved: 'boolean' }
	},
	{
		name: 'Documenter',
		role: 'documenter',
		description: 'Generates and updates documentation, README files, API docs, and inline comments.',
		scope: 'Documentation',
		system_prompt: 'You are the Documenter agent. Generate clear, comprehensive documentation for the provided code or architecture.',
		input_schema: { code: 'string', architecture: 'object' },
		output_schema: { documentation: 'string', files: 'array' }
	},
	{
		name: 'Debugger',
		role: 'debugger',
		description: 'Diagnoses and fixes bugs, traces errors, and resolves runtime issues.',
		scope: 'Debugging & error resolution',
		system_prompt: 'You are the Debugger agent. Analyze the error, trace the root cause, and propose a fix.',
		input_schema: { error: 'string', code: 'string', context: 'object' },
		output_schema: { root_cause: 'string', fix: 'string', patched_code: 'string' }
	}
];
