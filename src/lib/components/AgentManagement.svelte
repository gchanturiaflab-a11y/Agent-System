<script>
	import { agents, addToast } from '../stores.js';
	import { createAgent, updateAgent, deleteAgent, fetchAgents } from '../api.js';
	import { DEFAULT_AGENTS, AGENT_ROLES } from '../constants.js';
	import StatusBadge from './StatusBadge.svelte';

	let showForm = $state(false);
	let editingAgent = $state(null);
	let formData = $state({
		name: '',
		role: 'coder',
		description: '',
		scope: '',
		system_prompt: ''
	});

	function openCreate() {
		editingAgent = null;
		formData = { name: '', role: 'coder', description: '', scope: '', system_prompt: '' };
		showForm = true;
	}

	function openEdit(agent) {
		editingAgent = agent;
		formData = {
			name: agent.name,
			role: agent.role,
			description: agent.description || '',
			scope: agent.scope || '',
			system_prompt: agent.system_prompt || ''
		};
		showForm = true;
	}

	async function handleSave() {
		if (!formData.name.trim()) {
			addToast('Agent name is required', 'error');
			return;
		}
		try {
			if (editingAgent) {
				await updateAgent(editingAgent.id, formData);
				addToast('Agent updated', 'success');
			} else {
				await createAgent(formData);
				addToast('Agent created', 'success');
			}
			const all = await fetchAgents();
			agents.set(all);
			showForm = false;
		} catch (err) {
			addToast(`Failed to save: ${err.message}`, 'error');
		}
	}

	async function handleDelete(id) {
		try {
			await deleteAgent(id);
			const all = await fetchAgents();
			agents.set(all);
			addToast('Agent deleted', 'success');
		} catch (err) {
			addToast(`Failed to delete: ${err.message}`, 'error');
		}
	}

	async function handleSeed() {
		try {
			const all = await fetchAgents();
			if (all.length > 0) {
				addToast('Agents already exist', 'info');
				return;
			}
			for (const agent of DEFAULT_AGENTS) {
				await createAgent(agent);
			}
			const seeded = await fetchAgents();
			agents.set(seeded);
			addToast(`${seeded.length} default agents seeded`, 'success');
		} catch (err) {
			addToast(`Failed to seed: ${err.message}`, 'error');
		}
	}
</script>

<div class="kceva-card p-5 kceva-glow">
	<div class="flex items-center justify-between mb-4">
		<div>
			<h3 class="text-base font-semibold text-kceva-text">Agent Management</h3>
			<p class="text-xs text-kceva-text-dim mt-1">Create and configure specialized worker agents</p>
		</div>
		<div class="flex items-center gap-2">
			{#if $agents.length === 0}
				<button class="kceva-btn kceva-btn-ghost" onclick={handleSeed}>Seed Defaults</button>
			{/if}
			<button class="kceva-btn kceva-btn-primary" onclick={openCreate}>+ Add Agent</button>
		</div>
	</div>

	{#if showForm}
		<div class="kceva-card p-4 mb-4 kceva-fade-in" style="background-color: var(--color-kceva-surface-2)">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div>
					<label class="kceva-label block mb-1.5">Name</label>
					<input class="kceva-input" bind:value={formData.name} placeholder="e.g. Code Generator" />
				</div>
				<div>
					<label class="kceva-label block mb-1.5">Role</label>
					<select class="kceva-input" bind:value={formData.role}>
						{#each Object.values(AGENT_ROLES) as role}
							<option value={role}>{role}</option>
						{/each}
					</select>
				</div>
				<div class="md:col-span-2">
					<label class="kceva-label block mb-1.5">Description</label>
					<input class="kceva-input" bind:value={formData.description} placeholder="What this agent does" />
				</div>
				<div class="md:col-span-2">
					<label class="kceva-label block mb-1.5">Scope</label>
					<input class="kceva-input" bind:value={formData.scope} placeholder="e.g. Code implementation" />
				</div>
				<div class="md:col-span-2">
					<label class="kceva-label block mb-1.5">System Prompt</label>
					<textarea class="kceva-input" rows="3" bind:value={formData.system_prompt} placeholder="Instructions for the LLM when this agent executes"></textarea>
				</div>
			</div>
			<div class="flex justify-end gap-2 mt-4">
				<button class="kceva-btn kceva-btn-ghost" onclick={() => showForm = false}>Cancel</button>
				<button class="kceva-btn kceva-btn-primary" onclick={handleSave}>
					{editingAgent ? 'Update' : 'Create'}
				</button>
			</div>
		</div>
	{/if}

	{#if $agents.length === 0}
		<div class="text-center py-8 text-kceva-text-dim text-sm">
			No agents yet. Click "Seed Defaults" to create the standard agent set, or "Add Agent" to create a custom one.
		</div>
	{:else}
		<div class="space-y-2">
			{#each $agents as agent (agent.id)}
				<div class="flex items-center justify-between p-3 rounded-lg" style="background-color: var(--color-kceva-surface-2)">
					<div class="flex items-center gap-3 min-w-0">
						<span class="kceva-badge kceva-badge-dim">{agent.role}</span>
						<div class="min-w-0">
							<div class="text-sm font-medium text-kceva-text truncate">{agent.name}</div>
							<div class="text-xs text-kceva-text-faint truncate">{agent.description || agent.scope}</div>
						</div>
					</div>
					<div class="flex items-center gap-2 flex-shrink-0">
						<button class="kceva-btn kceva-btn-ghost" style="padding: 0.375rem 0.75rem; font-size: 0.75rem" onclick={() => openEdit(agent)}>Edit</button>
						<button class="kceva-btn kceva-btn-danger" style="padding: 0.375rem 0.75rem; font-size: 0.75rem" onclick={() => handleDelete(agent.id)}>Delete</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
