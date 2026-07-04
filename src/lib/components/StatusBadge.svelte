<script>
	let { status = 'idle', label = true, size = 'sm' } = $props();

	const statusConfig = {
		idle: { dot: 'kceva-status-idle', text: 'Idle', badge: 'kceva-badge-dim' },
		scanning: { dot: 'kceva-status-scanning', text: 'Scanning', badge: 'kceva-badge-blue' },
		running: { dot: 'kceva-status-running', text: 'Running', badge: 'kceva-badge-green' },
		done: { dot: 'kceva-status-done', text: 'Done', badge: 'kceva-badge-green' },
		failed: { dot: 'kceva-status-failed', text: 'Failed', badge: 'kceva-badge-red' },
		retrying: { dot: 'kceva-status-retrying', text: 'Retrying', badge: 'kceva-badge-amber' },
		validating: { dot: 'kceva-status-validating', text: 'Validating', badge: 'kceva-badge-amber' },
		decomposing: { dot: 'kceva-status-running', text: 'Decomposing', badge: 'kceva-badge-blue' },
		pending: { dot: 'kceva-status-idle', text: 'Pending', badge: 'kceva-badge-dim' },
		completed: { dot: 'kceva-status-done', text: 'Completed', badge: 'kceva-badge-green' }
	};

	const config = $derived(statusConfig[status] || statusConfig.idle);
</script>

{#if label}
	<span class="kceva-badge {config.badge}">
		<span class="kceva-status-dot {config.dot}"></span>
		{config.text}
	</span>
{:else}
	<span class="kceva-status-dot {config.dot}"></span>
{/if}
