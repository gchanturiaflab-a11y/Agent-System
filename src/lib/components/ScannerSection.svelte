<script>
	import { activeProject, knowledgeCache, addToast } from '../stores.js';
	import { runScanner } from '../orchestrator.js';
	import { fetchKnowledge } from '../api.js';
	import { STORAGE_TYPES } from '../constants.js';
	import StatusBadge from './StatusBadge.svelte';

	let scanning = $state(false);
	let selectedStorageType = $state(STORAGE_TYPES.STRUCTURED_JSON);
	let showStorageOptions = $state(false);

	const storageOptions = [
		{
			value: STORAGE_TYPES.STRUCTURED_JSON,
			label: 'Structured JSON (Supabase)',
			description: 'Stores structured knowledge in the database. Best for exact lookups and reuse across runs.',
			recommended: true
		},
		{
			value: STORAGE_TYPES.KEY_VALUE_CACHE,
			label: 'Key-Value Cache',
			description: 'Lightweight key-value pairs for fast retrieval. Good for small, flat knowledge sets.',
			recommended: false
		},
		{
			value: STORAGE_TYPES.VECTOR_DB,
			label: 'Vector Database',
			description: 'Embedding-based semantic search. Only needed if queries are semantic, not exact match.',
			recommended: false
		}
	];

	async function handleScan() {
		if (!$activeProject) return;
		scanning = true;
		try {
			const knowledge = await runScanner($activeProject);
			knowledgeCache.set(knowledge);
			addToast('Scan complete', 'success');
		} catch (err) {
			addToast(`Scan failed: ${err.message}`, 'error');
		} finally {
			scanning = false;
		}
	}

	function renderJsonTree(obj, depth = 0) {
		if (obj === null || obj === undefined) return '<span class="text-kceva-text-faint">null</span>';
		if (typeof obj === 'string') return `<span class="text-kceva-green">"${obj}"</span>`;
		if (typeof obj === 'number') return `<span class="text-kceva-amber">${obj}</span>`;
		if (typeof obj === 'boolean') return `<span class="text-kceva-blue">${obj}</span>`;
		return '';
	}
</script>

<div class="kceva-card p-5 kceva-glow">
	<div class="kceva-section-header">
		<div class="kceva-section-number">2</div>
		<h3 class="text-base font-semibold text-kceva-text">Discovery / Scanner Agent</h3>
		{#if $activeProject}
			<div class="ml-auto">
				<StatusBadge status={$activeProject.scan_status} />
			</div>
		{/if}
	</div>

	{#if !$activeProject}
		<div class="text-center py-8 text-kceva-text-dim text-sm">
			Select or create a project to begin scanning.
		</div>
	{:else}
		<div class="flex items-center gap-3 mb-4">
			<button
				class="kceva-btn kceva-btn-primary"
				onclick={handleScan}
				disabled={scanning || $activeProject.scan_status === 'scanning'}
			>
				{scanning || $activeProject.scan_status === 'scanning' ? 'Scanning...' : 'Run Scanner'}
			</button>
			<span class="text-xs text-kceva-text-dim">
				{$activeProject.source_type === 'git' ? 'Git repository' : 'Local folder'}: {$activeProject.source_path}
			</span>
		</div>

		{#if $activeProject.scan_status === 'scanning' || scanning}
			<div class="space-y-2">
				{#each ['Scanning file tree...', 'Reading manifests...', 'Extracting documentation...', 'Building dependency graph...'] as step, i}
					<div class="flex items-center gap-2 text-sm text-kceva-text-dim">
						<span class="kceva-status-dot kceva-status-running" style="animation-delay: {i * 0.3}s"></span>
						{step}
					</div>
				{/each}
			</div>
		{:else if $knowledgeCache}
			<!-- Knowledge Display -->
			<div class="space-y-4">
				{#if $knowledgeCache.tech_stack?.length > 0}
					<div>
						<div class="kceva-label mb-2">Tech Stack</div>
						<div class="flex flex-wrap gap-2">
							{#each $knowledgeCache.tech_stack as tech}
								<span class="kceva-badge kceva-badge-green">{tech}</span>
							{/each}
						</div>
					</div>
				{/if}

				{#if $knowledgeCache.entry_points?.length > 0}
					<div>
						<div class="kceva-label mb-2">Entry Points</div>
						<div class="flex flex-wrap gap-2">
							{#each $knowledgeCache.entry_points as ep}
								<span class="kceva-badge kceva-badge-dim font-mono">{ep}</span>
							{/each}
						</div>
					</div>
				{/if}

				{#if $knowledgeCache.documentation?.length > 0}
					<div>
						<div class="kceva-label mb-2">Documentation Found</div>
						<div class="space-y-1">
							{#each $knowledgeCache.documentation as doc}
								<div class="flex items-center gap-2 text-sm">
									<span class="text-kceva-green font-mono">{doc.path}</span>
									<span class="text-kceva-text-faint">— {doc.summary}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if $knowledgeCache.raw_summary}
					<div>
						<div class="kceva-label mb-2">Summary</div>
						<p class="text-sm text-kceva-text-dim leading-relaxed">{$knowledgeCache.raw_summary}</p>
					</div>
				{/if}
			</div>
		{:else if $activeProject.scan_status === 'done'}
			<div class="text-sm text-kceva-text-dim">Scan completed but no knowledge cached. Try rescanning.</div>
		{:else}
			<div class="text-sm text-kceva-text-dim">Click "Run Scanner" to analyze the project structure.</div>
		{/if}
	{/if}
</div>

<!-- Section 3: Knowledge Storage Decision -->
{#if $knowledgeCache}
	<div class="kceva-card p-5 kceva-glow mt-4">
		<div class="kceva-section-header">
			<div class="kceva-section-number">3</div>
			<h3 class="text-base font-semibold text-kceva-text">Knowledge Storage</h3>
			<button class="kceva-btn kceva-btn-ghost ml-auto" style="padding: 0.375rem 0.75rem; font-size: 0.75rem" onclick={() => showStorageOptions = !showStorageOptions}>
				{showStorageOptions ? 'Hide' : 'Configure'}
			</button>
		</div>

		<div class="flex items-center gap-2 mb-2">
			<span class="kceva-badge kceva-badge-green">Active: Structured JSON (Supabase)</span>
			<span class="text-xs text-kceva-text-dim">Knowledge cached and reusable across runs</span>
		</div>

		{#if showStorageOptions}
			<div class="space-y-2 mt-4 kceva-fade-in">
				<div class="text-xs text-kceva-text-dim mb-2">
					Choose how scanner output is stored for orchestrator access and future runs:
				</div>
				{#each storageOptions as opt}
					<label
						class="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all"
						style="background-color: {selectedStorageType === opt.value ? 'rgba(74,222,128,0.06)' : 'var(--color-kceva-surface-2)'}; border: 1px solid {selectedStorageType === opt.value ? 'rgba(74,222,128,0.2)' : 'var(--color-kceva-border)'}"
					>
						<input type="radio" bind:group={selectedStorageType} value={opt.value} class="mt-1" />
						<div>
							<div class="flex items-center gap-2">
								<span class="text-sm font-medium text-kceva-text">{opt.label}</span>
								{#if opt.recommended}
									<span class="kceva-badge kceva-badge-green" style="font-size: 0.65rem">Recommended</span>
								{/if}
							</div>
							<div class="text-xs text-kceva-text-dim mt-1">{opt.description}</div>
						</div>
					</label>
				{/each}
				<div class="text-xs text-kceva-text-faint mt-2">
					Note: Currently using Structured JSON in Supabase. Vector DB requires additional setup (pgvector extension + embeddings).
				</div>
			</div>
		{/if}
	</div>
{/if}
