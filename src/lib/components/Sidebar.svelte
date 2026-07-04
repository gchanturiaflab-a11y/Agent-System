<script>
	import { Layers, Users, KeyRound, Wrench, Bot } from '@lucide/svelte';

	let { activeTab = $bindable('workflow'), agentCount = 0, keyCount = 0, projectCount = 0, hasActiveRun = false } = $props();

	const baseNavItems = [
		{ id: 'workflow', label: 'Workflow', color: 'var(--color-role-architect)' },
		{ id: 'agents', label: 'Agents', color: 'var(--color-role-orchestrator)' },
		{ id: 'keys', label: 'API Keys', color: 'var(--color-role-coder)' },
		{ id: 'skills', label: 'Skills', color: 'var(--color-role-tester)' }
	];

	const navItems = $derived(baseNavItems.map(item => {
		if (item.id === 'agents') return { ...item, badge: agentCount > 0 ? agentCount : null };
		if (item.id === 'keys') return { ...item, badge: keyCount > 0 ? keyCount : null };
		return item;
	}));
</script>

<aside class="sidebar">
	<!-- Logo -->
	<div class="sidebar-logo">
		<div class="logo-icon">
			<Bot size={17} strokeWidth={1.6} />
		</div>
		<div class="logo-text">
			<span class="logo-name">Kceva</span>
			<span class="logo-tagline">Agent OS</span>
		</div>
	</div>

	<!-- Status pill -->
	{#if hasActiveRun}
		<div class="sidebar-status">
			<span class="dot dot-running"></span>
			<span>Running</span>
		</div>
	{:else}
		<div class="sidebar-status idle">
			<span class="dot dot-live"></span>
			<span>Ready</span>
		</div>
	{/if}

	<!-- Nav -->
	<nav class="sidebar-nav">
		{#each navItems as item (item.id)}
			<button
				class="nav-item {activeTab === item.id ? 'active' : ''}"
				onclick={() => activeTab = item.id}
				title={item.label}
			>
				<span class="nav-icon">
					{#if item.id === 'workflow'}
						<Layers size={15} strokeWidth={1.75} />
					{:else if item.id === 'agents'}
						<Users size={15} strokeWidth={1.75} />
					{:else if item.id === 'keys'}
						<KeyRound size={15} strokeWidth={1.75} />
					{:else if item.id === 'skills'}
						<Wrench size={15} strokeWidth={1.75} />
					{/if}
				</span>
				<span class="nav-label">{item.label}</span>
				{#if item.badge}
					<span class="nav-badge">{item.badge}</span>
				{/if}
			</button>
		{/each}
	</nav>

	<!-- Bottom stats -->
	<div class="sidebar-footer">
		<div class="stat-row">
			<div class="stat">
				<div class="stat-val">{agentCount}</div>
				<div class="stat-key">agents</div>
			</div>
			<div class="stat">
				<div class="stat-val">{projectCount}</div>
				<div class="stat-key">projects</div>
			</div>
			<div class="stat">
				<div class="stat-val">{keyCount}</div>
				<div class="stat-key">keys</div>
			</div>
		</div>
	</div>
</aside>

<style>
	.sidebar {
		width: calc(var(--spacing) * 49);
		min-width: calc(var(--spacing) * 49);
		height: 100vh;
		position: sticky;
		top: 0;
		background: color-mix(in srgb, var(--color-surface-elevated) 94%, transparent);
		border-right: var(--p-border-width-1) solid var(--color-border-default);
		display: flex;
		flex-direction: column;
		padding: calc(var(--spacing) * 4.5) 0;
		gap: 0;
		z-index: 30;
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
	}

	.sidebar-logo {
		display: flex;
		align-items: center;
		gap: calc(var(--spacing) * 2.5);
		padding: 0 calc(var(--spacing) * 4) calc(var(--spacing) * 4.5);
		border-bottom: var(--p-border-width-1) solid var(--color-border-default);
		margin-bottom: calc(var(--spacing) * 3);
	}
	.logo-icon {
		width: calc(var(--spacing) * 7.5);
		height: calc(var(--spacing) * 7.5);
		border-radius: calc(var(--spacing) * 2.25);
		background: color-mix(in srgb, var(--color-border-strong) 12%, transparent);
		border: var(--p-border-width-1) solid color-mix(in srgb, var(--color-border-strong) 18%, transparent);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.logo-text {
		display: flex;
		flex-direction: column;
		line-height: 1.1;
	}
	.logo-name {
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--color-text-primary);
		letter-spacing: -0.03em;
		font-family: var(--font-heading);
	}
	.logo-tagline {
		font-size: var(--text-2xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-muted);
		margin-top: 0.1rem;
	}

	.sidebar-status {
		display: flex;
		align-items: center;
		gap: calc(var(--spacing) * 2);
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--color-status-success-default);
		padding: calc(var(--spacing) * 0.75) calc(var(--spacing) * 3);
		margin: 0 calc(var(--spacing) * 2.5) calc(var(--spacing) * 3);
		border-radius: var(--radius-full);
		background: color-mix(in srgb, var(--color-status-success-default) 7%, transparent);
		border: var(--p-border-width-1) solid color-mix(in srgb, var(--color-status-success-default) 13%, transparent);
		transition: all 0.2s ease;
	}
	.sidebar-status.idle {
		color: var(--color-text-muted);
		background: color-mix(in srgb, var(--color-surface-elevated) 2%, transparent);
		border-color: var(--color-border-default);
	}

	.sidebar-nav {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing) * 0.5);
		padding: 0 calc(var(--spacing) * 2);
		overflow-y: auto;
		scrollbar-width: none;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: calc(var(--spacing) * 2.25);
		padding: calc(var(--spacing) * 2.25) calc(var(--spacing) * 3);
		border-radius: calc(var(--spacing) * 2.5);
		border: var(--p-border-width-1) solid transparent;
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		font-size: var(--text-sm);
		font-weight: 500;
		text-align: left;
		width: 100%;
		position: relative;
		letter-spacing: -0.01em;
	}
	.nav-item:hover {
		color: var(--color-text-secondary);
		background: color-mix(in srgb, var(--color-surface-elevated) 4%, transparent);
		border-color: var(--color-border-default);
	}
	.nav-item.active {
		color: var(--color-text-primary);
		background: color-mix(in srgb, var(--color-action-primary) 9%, transparent);
		border-color: color-mix(in srgb, var(--color-action-primary) 18%, transparent);
	}
	.nav-icon {
		width: calc(var(--spacing) * 4);
		height: calc(var(--spacing) * 4);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: color 0.18s ease;
		color: currentColor;
	}
	.nav-label {
		flex: 1;
	}
	.nav-badge {
		background: color-mix(in srgb, var(--color-action-primary) 18%, transparent);
		color: var(--color-action-primary-hover);
		font-size: var(--text-2xs);
		font-weight: 700;
		padding: calc(var(--spacing) * 0.4) calc(var(--spacing) * 1.5);
		border-radius: var(--radius-full);
		min-width: calc(var(--spacing) * 4.5);
		text-align: center;
	}

	.sidebar-footer {
		padding: calc(var(--spacing) * 3) calc(var(--spacing) * 3) 0;
		border-top: var(--p-border-width-1) solid var(--color-border-default);
		margin-top: calc(var(--spacing) * 2);
	}
	.stat-row {
		display: flex;
		gap: 0;
	}
	.stat {
		flex: 1;
		text-align: center;
		padding: calc(var(--spacing) * 2) calc(var(--spacing) * 1);
	}
	.stat-val {
		font-size: var(--text-sm);
		font-weight: 700;
		font-family: var(--font-mono);
		color: var(--color-text-primary);
	}
	.stat-key {
		font-size: var(--text-2xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-disabled);
		margin-top: 0.1rem;
	}
</style>
