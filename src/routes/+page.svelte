<script>
	import { onMount } from 'svelte';
	import {
		agents, apiKeys, assignments, projects, activeProject,
		knowledgeCache, runs, tasks, addToast
	} from '../lib/stores.js';
	import {
		fetchAgents, fetchApiKeys, fetchAssignments, fetchProjects, fetchKnowledge, seedDefaultAgents
	} from '../lib/api.js';
	import Toasts from '../lib/components/Toasts.svelte';
	import ProjectInput from '../lib/components/ProjectInput.svelte';
	import ScannerSection from '../lib/components/ScannerSection.svelte';
	import OrchestratorSection from '../lib/components/OrchestratorSection.svelte';
	import AgentTree from '../lib/components/AgentTree.svelte';
	import TasksSection from '../lib/components/TasksSection.svelte';
	import ApiKeysPanel from '../lib/components/ApiKeysPanel.svelte';
	import AgentManagement from '../lib/components/AgentManagement.svelte';

	let activeTab = $state('workflow');
	let initialized = $state(false);

	const tabs = [
		{ id: 'workflow', label: 'Workflow' },
		{ id: 'agents', label: 'Agents' },
		{ id: 'keys', label: 'API Keys' }
	];

	onMount(async () => {
		try {
			// Seed default agents if none exist
			const seededAgents = await seedDefaultAgents();
			agents.set(seededAgents);

			const keys = await fetchApiKeys();
			apiKeys.set(keys);

			const a = await fetchAssignments();
			assignments.set(a);

			const p = await fetchProjects();
			projects.set(p);

			if (p.length > 0) {
				activeProject.set(p[0]);
				const knowledge = await fetchKnowledge(p[0].id);
				knowledgeCache.set(knowledge);
				const r = await fetchRuns(p[0].id);
				runs.set(r);
			}
		} catch (err) {
			addToast(`Initialization error: ${err.message}`, 'error');
		} finally {
			initialized = true;
		}
	});

	async function handleSelectTask(taskId) {
		selectedTaskId.set(taskId);
	}

	import { selectedTaskId } from '../lib/stores.js';
</script>

<Toasts />

<div class="min-h-screen">
	<!-- Header -->
	<header class="sticky top-0 z-40 backdrop-blur-xl" style="background-color: rgba(10, 15, 10, 0.8); border-bottom: 1px solid var(--color-kceva-border)">
		<div class="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<!-- Kceva Logo: Tree icon -->
				<div class="relative">
					<svg class="w-8 h-8 text-kceva-green" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M16 4 L16 28" />
						<path d="M16 8 C16 8 12 10 12 13 C12 10 16 8 16 8 Z" fill="currentColor" fill-opacity="0.15" />
						<path d="M16 8 C16 8 20 10 20 13 C20 10 16 8 16 8 Z" fill="currentColor" fill-opacity="0.15" />
						<path d="M16 14 C16 14 11 16 11 19 C11 16 16 14 16 14 Z" fill="currentColor" fill-opacity="0.2" />
						<path d="M16 14 C16 14 21 16 21 19 C21 16 16 14 16 14 Z" fill="currentColor" fill-opacity="0.2" />
						<path d="M16 20 C16 20 12 22 12 24 C12 22 16 20 16 20 Z" fill="currentColor" fill-opacity="0.25" />
						<path d="M16 20 C16 20 20 22 20 24 C20 22 16 20 16 20 Z" fill="currentColor" fill-opacity="0.25" />
					</svg>
				</div>
				<div>
					<h1 class="text-lg font-bold text-kceva-text tracking-tight">Kceva</h1>
					<p class="text-xs text-kceva-text-dim -mt-0.5">Agent Orchestration Control Panel</p>
				</div>
			</div>

			<!-- Tabs -->
			<nav class="flex items-center gap-1">
				{#each tabs as tab}
					<button
						class="kceva-tab {activeTab === tab.id ? 'kceva-tab-active' : ''}"
						onclick={() => activeTab = tab.id}
					>
						{tab.label}
					</button>
				{/each}
			</nav>

			<!-- Status indicator -->
			<div class="hidden md:flex items-center gap-2 text-xs text-kceva-text-dim">
				<span class="kceva-status-dot kceva-status-done"></span>
				{$agents.length} agents
				<span class="text-kceva-text-faint">|</span>
				{$apiKeys.length} keys
				<span class="text-kceva-text-faint">|</span>
				{$projects.length} projects
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 md:px-6 py-6">
		{#if !initialized}
			<div class="flex items-center justify-center py-20">
				<div class="flex items-center gap-3 text-kceva-text-dim">
					<span class="kceva-status-dot kceva-status-running"></span>
					<span class="text-sm">Initializing Kceva...</span>
				</div>
			</div>
		{:else if activeTab === 'workflow'}
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
				<!-- Left column: Project + Scanner + Orchestrator -->
				<div class="lg:col-span-5 space-y-4">
					<ProjectInput />
					<ScannerSection />
					<OrchestratorSection />
				</div>

				<!-- Right column: Agent Tree + Tasks + Logs -->
				<div class="lg:col-span-7 space-y-4">
					<AgentTree
						agents={$agents}
						tasks={$tasks}
						selectedTaskId={$selectedTaskId}
						onSelectTask={handleSelectTask}
					/>
					<TasksSection />
				</div>
			</div>
		{:else if activeTab === 'agents'}
			<div class="max-w-4xl mx-auto space-y-4">
				<AgentManagement />
			</div>
		{:else if activeTab === 'keys'}
			<div class="max-w-4xl mx-auto space-y-4">
				<ApiKeysPanel />
			</div>
		{/if}
	</main>

	<!-- Footer -->
	<footer class="max-w-7xl mx-auto px-4 md:px-6 py-6 text-center">
		<div class="kceva-divider mb-4"></div>
		<p class="text-xs text-kceva-text-faint">
			Kceva — Agent Orchestration Workflow System
		</p>
	</footer>
</div>
