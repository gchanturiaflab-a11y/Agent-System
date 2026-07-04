<script>
	import { projects, activeProject, knowledgeCache, addToast } from '../stores.js';
	import { createProject, deleteProject, fetchProjects, updateProject, fetchKnowledge } from '../api.js';
	import { runScanner } from '../orchestrator.js';
	import StatusBadge from './StatusBadge.svelte';

	let sourcePath = $state('');
	let sourceType = $state('local');
	let projectName = $state('');
	let creating = $state(false);
	let scanning = $state(false);

	async function handleCreate() {
		if (!sourcePath.trim()) {
			addToast('Project path or URL is required', 'error');
			return;
		}
		creating = true;
		try {
			const isUrl = sourcePath.trim().startsWith('http') || sourcePath.trim().includes('github.com');
			const type = isUrl ? 'git' : sourceType;
			const name = projectName.trim() || sourcePath.trim().split('/').pop() || 'Untitled';

			const project = await createProject({
				name,
				source_path: sourcePath.trim(),
				source_type: type
			});
			const all = await fetchProjects();
			projects.set(all);
			activeProject.set(project);
			sourcePath = '';
			projectName = '';
			addToast(`Project "${name}" created`, 'success');
		} catch (err) {
			addToast(`Failed to create project: ${err.message}`, 'error');
		} finally {
			creating = false;
		}
	}

	async function handleSelectProject(project) {
		activeProject.set(project);
		const knowledge = await fetchKnowledge(project.id);
		knowledgeCache.set(knowledge);
	}

	async function handleScan(project) {
		scanning = true;
		try {
			const knowledge = await runScanner(project);
			knowledgeCache.set(knowledge);
			const all = await fetchProjects();
			projects.set(all);
			const updated = all.find(p => p.id === project.id);
			if (updated) activeProject.set(updated);
			addToast('Project scanned successfully', 'success');
		} catch (err) {
			addToast(`Scan failed: ${err.message}`, 'error');
		} finally {
			scanning = false;
		}
	}

	async function handleDelete(id) {
		try {
			await deleteProject(id);
			const all = await fetchProjects();
			projects.set(all);
			if ($activeProject?.id === id) activeProject.set(null);
			addToast('Project deleted', 'success');
		} catch (err) {
			addToast(`Failed to delete: ${err.message}`, 'error');
		}
	}
</script>

<div class="kceva-card p-5 kceva-glow">
	<div class="kceva-section-header">
		<div class="kceva-section-number">1</div>
		<h3 class="text-base font-semibold text-kceva-text">Project Input</h3>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
		<div class="md:col-span-5">
			<label class="kceva-label block mb-1.5">Project Name (optional)</label>
			<input class="kceva-input" placeholder="My Awesome Project" bind:value={projectName} />
		</div>
		<div class="md:col-span-5">
			<label class="kceva-label block mb-1.5">Local Path or Repo URL</label>
			<input class="kceva-input" placeholder="/path/to/project or https://github.com/user/repo" bind:value={sourcePath} />
		</div>
		<div class="md:col-span-2">
			<label class="kceva-label block mb-1.5">Type</label>
			<select class="kceva-input" bind:value={sourceType}>
				<option value="local">Local Folder</option>
				<option value="git">Git Repo</option>
			</select>
		</div>
	</div>

	<button class="kceva-btn kceva-btn-primary w-full" onclick={handleCreate} disabled={creating}>
		{creating ? 'Creating...' : '+ Add Project'}
	</button>

	{#if $projects.length > 0}
		<div class="kceva-divider my-4"></div>
		<div class="space-y-2">
			{#each $projects as project (project.id)}
				<div
					class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all"
					role="button"
					tabindex="0"
					style="background-color: {$activeProject?.id === project.id ? 'rgba(74,222,128,0.06)' : 'var(--color-kceva-surface-2)'}; border: 1px solid {$activeProject?.id === project.id ? 'rgba(74,222,128,0.2)' : 'var(--color-kceva-border)'}"
					onclick={() => handleSelectProject(project)}
					onkeydown={(e) => e.key === 'Enter' && handleSelectProject(project)}
				>
					<div class="flex items-center gap-3 min-w-0">
						<StatusBadge status={project.scan_status} />
						<div class="min-w-0">
							<div class="text-sm font-medium text-kceva-text truncate">{project.name}</div>
							<div class="text-xs text-kceva-text-faint font-mono truncate">{project.source_path}</div>
						</div>
					</div>
					<div class="flex items-center gap-2" onclick={(e) => e.stopPropagation()}>
						<button
							class="kceva-btn kceva-btn-ghost"
							style="padding: 0.375rem 0.75rem; font-size: 0.75rem"
							onclick={() => handleScan(project)}
							disabled={scanning}
						>
							{scanning ? 'Scanning...' : 'Rescan'}
						</button>
						<button
							class="kceva-btn kceva-btn-danger"
							style="padding: 0.375rem 0.75rem; font-size: 0.75rem"
							onclick={() => handleDelete(project.id)}
						>
							Delete
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
