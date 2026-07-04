<script>
	import { tasks, taskLogs, runLogs, activeRun, selectedTaskId, activeTask, addToast } from '../stores.js';
	import { fetchTaskLogs, addTaskLog, updateTask } from '../api.js';
	import StatusBadge from './StatusBadge.svelte';

	let logPolling = $state(null);

	// Load task logs when a task is selected
	$effect(() => {
		if ($selectedTaskId) {
			loadTaskLogs($selectedTaskId);
		}
	});

	async function loadTaskLogs(taskId) {
		const logs = await fetchTaskLogs(taskId);
		taskLogs.set({ ...$taskLogs, [taskId]: logs });
	}

	async function handleRetry(task) {
		try {
			await updateTask(task.id, {
				status: 'idle',
				error_message: null,
				retry_count: 0
			});
			await addTaskLog(task.id, 'info', 'Manual retry triggered');
			addToast('Task queued for retry', 'success');
		} catch (err) {
			addToast(`Failed to retry: ${err.message}`, 'error');
		}
	}

	function formatTime(timestamp) {
		if (!timestamp) return '';
		const d = new Date(timestamp);
		return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}

	function formatCost(cost) {
		return parseFloat(cost || 0).toFixed(4);
	}

	const totalTokens = $derived($tasks.reduce((sum, t) => sum + (t.tokens_used || 0), 0));
	const totalCost = $derived($tasks.reduce((sum, t) => sum + (parseFloat(t.cost) || 0), 0));
	const completedCount = $derived($tasks.filter(t => t.status === 'done').length);
	const failedCount = $derived($tasks.filter(t => t.status === 'failed').length);
</script>

<div class="space-y-4">
	{#if $tasks.length === 0}
		<div class="kceva-card p-8 text-center">
			<div class="text-kceva-text-dim text-sm">No tasks yet. Execute a pipeline to see tasks appear here.</div>
		</div>
	{:else}
		<!-- Section 5: Worker Agents / Tasks -->
		<div class="kceva-card p-5 kceva-glow">
			<div class="kceva-section-header">
				<div class="kceva-section-number">5</div>
				<h3 class="text-base font-semibold text-kceva-text">Worker Agents</h3>
				<div class="ml-auto flex items-center gap-3 text-xs text-kceva-text-dim">
					<span>{completedCount}/{$tasks.length} done</span>
					{#if failedCount > 0}
						<span class="text-kceva-red">{failedCount} failed</span>
					{/if}
					<span class="font-mono">{totalTokens} tokens</span>
					<span class="font-mono text-kceva-green">${totalCost.toFixed(4)}</span>
				</div>
			</div>

			<div class="space-y-2">
				{#each $tasks as task (task.id)}
					<button
						type="button"
						class="kceva-card p-3 cursor-pointer transition-all w-full text-left"
						style="background-color: {$selectedTaskId === task.id ? 'rgba(74,222,128,0.04)' : 'var(--color-kceva-surface-2)'}; {(task.status === 'running' || task.status === 'retrying') ? 'border-color: rgba(74,222,128,0.2)' : ''}"
						onclick={() => selectedTaskId.set(task.id)}
					>
						<div class="flex items-center justify-between gap-3">
							<div class="flex items-center gap-3 min-w-0">
								<StatusBadge status={task.status} />
								<span class="text-sm font-medium text-kceva-text truncate">{task.title}</span>
							</div>
							<div class="flex items-center gap-2 flex-shrink-0">
								{#if task.tokens_used > 0}
									<span class="text-xs text-kceva-text-faint font-mono">{task.tokens_used}t</span>
								{/if}
								{#if task.cost > 0}
									<span class="text-xs text-kceva-text-faint font-mono">${formatCost(task.cost)}</span>
								{/if}
								{#if task.status === 'failed'}
									<button
										class="kceva-btn kceva-btn-ghost"
										style="padding: 0.25rem 0.5rem; font-size: 0.7rem"
										onclick={(e) => { e.stopPropagation(); handleRetry(task); }}
									>
										Retry
									</button>
								{/if}
							</div>
						</div>

						{#if task.error_message}
							<div class="mt-2 text-xs text-kceva-red font-mono px-2 py-1 rounded" style="background-color: rgba(248,113,113,0.05)">
								{task.error_message}
							</div>
						{/if}

						{#if task.retry_count > 0}
							<div class="mt-1 text-xs text-kceva-amber">
								Retried {task.retry_count} time{task.retry_count > 1 ? 's' : ''}
							</div>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Section 6: Validation Gate -->
		{#if $activeRun?.status === 'validating' || $activeRun?.final_output}
			<div class="kceva-card p-5 kceva-glow">
				<div class="kceva-section-header">
					<div class="kceva-section-number">6</div>
					<h3 class="text-base font-semibold text-kceva-text">Testing / Validation Gate</h3>
				</div>

				{#if $activeRun.status === 'validating'}
					<div class="flex items-center gap-2 text-sm text-kceva-amber">
						<span class="kceva-status-dot kceva-status-validating"></span>
						Validating outputs...
					</div>
				{:else if $activeRun.final_output}
					<div class="flex items-center gap-3">
						{#if $activeRun.final_output.validation_passed}
							<span class="kceva-badge kceva-badge-green">Validation Passed</span>
						{:else}
							<span class="kceva-badge kceva-badge-red">Validation Failed</span>
						{/if}
						<span class="text-sm text-kceva-text-dim">{$activeRun.final_output.summary || ''}</span>
						<span class="kceva-badge kceva-badge-dim ml-auto">{$activeRun.validation_strategy}</span>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Section 7: Aggregation & Delivery -->
		{#if $activeRun?.final_output}
			<div class="kceva-card p-5 kceva-glow">
				<div class="kceva-section-header">
					<div class="kceva-section-number">7</div>
					<h3 class="text-base font-semibold text-kceva-text">Aggregation & Delivery</h3>
				</div>

				<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
					<div class="p-3 rounded-lg" style="background-color: var(--color-kceva-surface-2)">
						<div class="kceva-label">Total Tasks</div>
						<div class="text-xl font-bold text-kceva-text font-mono">{$activeRun.final_output.total_tasks}</div>
					</div>
					<div class="p-3 rounded-lg" style="background-color: var(--color-kceva-surface-2)">
						<div class="kceva-label">Completed</div>
						<div class="text-xl font-bold text-kceva-green font-mono">{$activeRun.final_output.completed}</div>
					</div>
					<div class="p-3 rounded-lg" style="background-color: var(--color-kceva-surface-2)">
						<div class="kceva-label">Tokens</div>
						<div class="text-xl font-bold text-kceva-text font-mono">{$activeRun.total_tokens}</div>
					</div>
					<div class="p-3 rounded-lg" style="background-color: var(--color-kceva-surface-2)">
						<div class="kceva-label">Cost</div>
						<div class="text-xl font-bold text-kceva-green font-mono">${$activeRun.total_cost.toFixed(4)}</div>
					</div>
				</div>

				{#if $activeRun.final_output.failed_tasks?.length > 0}
					<div class="mb-4">
						<div class="kceva-label mb-2">Failed Tasks</div>
						{#each $activeRun.final_output.failed_tasks as ft}
							<div class="text-sm text-kceva-red mb-1">
								<span class="font-medium">{ft.title}</span>: {ft.error}
							</div>
						{/each}
					</div>
				{/if}

				<div>
					<div class="kceva-label mb-2">Final Output</div>
					<pre class="text-xs font-mono text-kceva-text-dim p-3 rounded-lg overflow-x-auto max-h-64" style="background-color: var(--color-kceva-surface-2)">{JSON.stringify($activeRun.final_output, null, 2)}</pre>
				</div>
			</div>
		{/if}

		<!-- Task Detail & Logs -->
		{#if $activeTask}
			<div class="kceva-card p-5 kceva-glow">
				<div class="flex items-center gap-2 mb-3">
					<h3 class="text-base font-semibold text-kceva-text">Task Detail</h3>
					<StatusBadge status={$activeTask.status} />
				</div>

				<div class="space-y-3">
					<div>
						<div class="kceva-label mb-1">Title</div>
						<div class="text-sm text-kceva-text">{$activeTask.title}</div>
					</div>

					{#if $activeTask.description}
						<div>
							<div class="kceva-label mb-1">Description</div>
							<div class="text-sm text-kceva-text-dim">{$activeTask.description}</div>
						</div>
					{/if}

					{#if $activeTask.output_payload}
						<div>
							<div class="kceva-label mb-1">Output</div>
							<pre class="text-xs font-mono text-kceva-text-dim p-3 rounded-lg overflow-x-auto max-h-48" style="background-color: var(--color-kceva-surface-2)">{JSON.stringify($activeTask.output_payload, null, 2)}</pre>
						</div>
					{/if}

					<!-- Task Logs -->
					<div>
						<div class="kceva-label mb-2">Logs</div>
						<div class="space-y-0.5 max-h-48 overflow-y-auto p-2 rounded-lg" style="background-color: var(--color-kceva-surface-2)">
							{#each $taskLogs[$activeTask.id] || [] as log (log.id)}
								<div class="kceva-log-entry">
									<span class="kceva-log-time">{formatTime(log.created_at)}</span>
									<span class="kceva-log-{log.level}">{log.message}</span>
								</div>
							{:else}
								<div class="text-xs text-kceva-text-faint">No logs yet</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Run Logs -->
		{#if $runLogs.length > 0}
			<div class="kceva-card p-5 kceva-glow">
				<h3 class="text-base font-semibold text-kceva-text mb-3">Run Logs</h3>
				<div class="space-y-0.5 max-h-64 overflow-y-auto p-2 rounded-lg" style="background-color: var(--color-kceva-surface-2)">
					{#each $runLogs as log (log.id)}
						<div class="kceva-log-entry">
							<span class="kceva-log-time">{formatTime(log.created_at)}</span>
							<span class="kceva-log-{log.level}">{log.message}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
