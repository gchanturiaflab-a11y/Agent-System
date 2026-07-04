<script>
	import { activeProject, knowledgeCache, activeRun, runs, tasks, runLogs, addToast } from '../stores.js';
	import { runFullPipeline } from '../orchestrator.js';
	import { fetchRuns, fetchTasks, fetchRunLogs } from '../api.js';
	import { ROUTING_STRATEGIES, VALIDATION_STRATEGIES } from '../constants.js';
	import StatusBadge from './StatusBadge.svelte';

	let command = $state('');
	let routingStrategy = $state(ROUTING_STRATEGIES.RULE_BASED);
	let validationStrategy = $state(VALIDATION_STRATEGIES.SCHEMA_VALIDATION);
	let concurrency = $state(3);
	let running = $state(false);
	let showAdvanced = $state(false);

	const routingOptions = [
		{ value: ROUTING_STRATEGIES.RULE_BASED, label: 'Rule-Based', description: 'Tasks routed by keyword matching to agent roles. Fast, deterministic, no LLM cost.' },
		{ value: ROUTING_STRATEGIES.CLASSIFIER, label: 'Classifier-Based', description: 'A lightweight classifier model decides which agent handles each task.' },
		{ value: ROUTING_STRATEGIES.LLM_DECISION, label: 'LLM Decision', description: 'The orchestrator LLM decomposes and routes tasks intelligently. Most flexible, highest cost.' }
	];

	const validationOptions = [
		{ value: VALIDATION_STRATEGIES.SCHEMA_VALIDATION, label: 'Schema Validation', description: 'Validate each output against the expected JSON schema. Fast and deterministic.' },
		{ value: VALIDATION_STRATEGIES.TEST_EXECUTION, label: 'Test Execution', description: 'Run automated tests against the generated output. Requires test infrastructure.' },
		{ value: VALIDATION_STRATEGIES.ADVERSARIAL_REVIEW, label: 'Adversarial Review', description: 'A reviewer agent critically inspects outputs for correctness and security.' }
	];

	async function handleRun() {
		if (!command.trim()) {
			addToast('Command is required', 'error');
			return;
		}
		if (!$activeProject) {
			addToast('Select a project first', 'error');
			return;
		}
		if (!$knowledgeCache) {
			addToast('Scan the project first to build knowledge cache', 'error');
			return;
		}

		running = true;
		tasks.set([]);
		runLogs.set([]);
		try {
			const { run, finalOutput } = await runFullPipeline($activeProject, command.trim(), {
				routing_strategy: routingStrategy,
				validation_strategy: validationStrategy,
				concurrency
			});
			activeRun.set(run);
			const allRuns = await fetchRuns($activeProject.id);
			runs.set(allRuns);
			const allTasks = await fetchTasks(run.id);
			tasks.set(allTasks);
			const logs = await fetchRunLogs(run.id);
			runLogs.set(logs);
			addToast('Run completed', 'success');
		} catch (err) {
			addToast(`Run failed: ${err.message}`, 'error');
		} finally {
			running = false;
		}
	}

	async function loadRun(run) {
		activeRun.set(run);
		const allTasks = await fetchTasks(run.id);
		tasks.set(allTasks);
		const logs = await fetchRunLogs(run.id);
		runLogs.set(logs);
	}
</script>

<div class="kceva-card p-5 kceva-glow">
	<div class="kceva-section-header">
		<div class="kceva-section-number">4</div>
		<h3 class="text-base font-semibold text-kceva-text">Orchestrator</h3>
		{#if $activeRun}
			<div class="ml-auto">
				<StatusBadge status={$activeRun.status} />
			</div>
		{/if}
	</div>

	{#if !$activeProject}
		<div class="text-center py-6 text-kceva-text-dim text-sm">Select a project to run the orchestrator.</div>
	{:else if !$knowledgeCache}
		<div class="text-center py-6 text-kceva-text-dim text-sm">Scan the project first to build the knowledge cache.</div>
	{:else}
		<div class="space-y-3">
			<div>
				<label class="kceva-label block mb-1.5">Command (Natural Language)</label>
				<textarea
					class="kceva-input"
					rows="2"
					placeholder="e.g. Build a REST API endpoint for user authentication with JWT"
					bind:value={command}
				></textarea>
			</div>

			<button class="text-xs text-kceva-green hover:text-kceva-green-bright transition-colors" onclick={() => showAdvanced = !showAdvanced}>
				{showAdvanced ? 'Hide' : 'Show'} advanced options
			</button>

			{#if showAdvanced}
				<div class="kceva-card p-4 space-y-4 kceva-fade-in" style="background-color: var(--color-kceva-surface-2)">
					<div>
						<label class="kceva-label block mb-2">Routing Strategy</label>
						<div class="space-y-1.5">
							{#each routingOptions as opt}
								<label class="flex items-start gap-2 cursor-pointer">
									<input type="radio" bind:group={routingStrategy} value={opt.value} class="mt-0.5" />
									<div>
										<span class="text-sm text-kceva-text">{opt.label}</span>
										<span class="text-xs text-kceva-text-dim block">{opt.description}</span>
									</div>
								</label>
							{/each}
						</div>
					</div>

					<div>
						<label class="kceva-label block mb-2">Validation Strategy</label>
						<div class="space-y-1.5">
							{#each validationOptions as opt}
								<label class="flex items-start gap-2 cursor-pointer">
									<input type="radio" bind:group={validationStrategy} value={opt.value} class="mt-0.5" />
									<div>
										<span class="text-sm text-kceva-text">{opt.label}</span>
										<span class="text-xs text-kceva-text-dim block">{opt.description}</span>
									</div>
								</label>
							{/each}
						</div>
					</div>

					<div>
						<label class="kceva-label block mb-1.5">Concurrency: {concurrency} parallel agents</label>
						<input type="range" min="1" max="8" bind:value={concurrency} class="w-full" />
					</div>
				</div>
			{/if}

			<button class="kceva-btn kceva-btn-primary w-full" onclick={handleRun} disabled={running}>
				{running ? 'Running pipeline...' : 'Execute Pipeline'}
			</button>
		</div>

		<!-- Run History -->
		{#if $runs.length > 0}
			<div class="kceva-divider my-4"></div>
			<div class="kceva-label mb-2">Run History</div>
			<div class="space-y-1.5 max-h-48 overflow-y-auto">
				{#each $runs as run (run.id)}
					<button
						class="w-full text-left flex items-center gap-3 p-2.5 rounded-lg transition-colors"
						style="background-color: {$activeRun?.id === run.id ? 'rgba(74,222,128,0.06)' : 'var(--color-kceva-surface-2)'}"
						onclick={() => loadRun(run)}
					>
						<StatusBadge status={run.status} />
						<span class="text-sm text-kceva-text-dim truncate flex-1">{run.command}</span>
						<span class="text-xs text-kceva-text-faint font-mono">{run.total_tokens}t</span>
					</button>
				{/each}
			</div>
		{/if}
	{/if}
</div>
