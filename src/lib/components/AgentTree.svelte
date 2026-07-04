<script>
	import StatusBadge from './StatusBadge.svelte';

	let { agents = [], tasks = [], selectedTaskId = null, onSelectTask = null } = $props();

	// Group tasks by agent
	const tasksByAgent = $derived.by(() => {
		const map = {};
		for (const task of tasks) {
			if (!map[task.agent_id]) map[task.agent_id] = [];
			map[task.agent_id].push(task);
		}
		return map;
	});

	function agentStatus(agentId) {
		const agentTasks = tasks.filter(t => t.agent_id === agentId);
		if (agentTasks.length === 0) return 'idle';
		if (agentTasks.some(t => t.status === 'running' || t.status === 'retrying')) return 'running';
		if (agentTasks.some(t => t.status === 'failed')) return 'failed';
		if (agentTasks.every(t => t.status === 'done')) return 'done';
		return 'idle';
	}

	function isAgentActive(agentId) {
		return tasks.some(t => t.agent_id === agentId && (t.status === 'running' || t.status === 'retrying'));
	}

	const roleIcons = {
		scanner: 'scan',
		orchestrator: 'orchestrate',
		architect: 'architect',
		coder: 'code',
		tester: 'test',
		reviewer: 'review',
		documenter: 'doc',
		debugger: 'debug'
	};
</script>

<div class="kceva-card p-5 kceva-glow">
	<div class="flex items-center gap-2 mb-4">
		<svg class="w-5 h-5 text-kceva-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
			<path d="M12 2L12 22 M12 2C12 2 8 6 8 10 M12 2C12 2 16 6 16 10 M12 8C12 8 9 10 9 13 M12 8C12 8 15 10 15 13 M12 14C12 14 10 16 10 18 M12 14C12 14 14 16 14 18" />
		</svg>
		<h3 class="text-base font-semibold text-kceva-text">Agent Tree</h3>
		<span class="text-xs text-kceva-text-dim ml-auto">{agents.length} agents</span>
	</div>

	<div class="space-y-1">
		{#each agents as agent, i (agent.id)}
			{@const status = agentStatus(agent.id)}
			{@const active = isAgentActive(agent.id)}
			{@const agentTasks = tasks.filter(t => t.agent_id === agent.id)}

			<div class="relative pl-8 kceva-tree-line">
				<div class="absolute left-3 top-3 w-2 h-2 rounded-full" style="background-color: var(--color-kceva-green-dim); z-index: 1"></div>

				<div
					class="kceva-card p-3 {active ? 'kceva-active-border kceva-glow-active' : ''}"
					style="background-color: var(--color-kceva-surface-2); {active ? 'border-color: transparent' : ''}"
				>
					<div class="flex items-center justify-between gap-2">
						<div class="flex items-center gap-2 min-w-0">
							<span class="kceva-badge kceva-badge-dim" style="font-size: 0.65rem; padding: 0.15rem 0.4rem">{agent.role}</span>
							<span class="text-sm font-medium text-kceva-text truncate">{agent.name}</span>
						</div>
						<StatusBadge status={status} />
					</div>

					{#if agentTasks.length > 0}
						<div class="mt-2 ml-1 space-y-1">
							{#each agentTasks as task (task.id)}
								<button
									class="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors"
									style="background-color: {selectedTaskId === task.id ? 'rgba(74,222,128,0.08)' : 'transparent'}"
									onclick={() => onSelectTask?.(task.id)}
								>
									<span class="kceva-status-dot kceva-status-{task.status}"></span>
									<span class="text-xs text-kceva-text-dim truncate flex-1">{task.title}</span>
									{#if task.tokens_used > 0}
										<span class="text-xs text-kceva-text-faint font-mono">{task.tokens_used}t</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
