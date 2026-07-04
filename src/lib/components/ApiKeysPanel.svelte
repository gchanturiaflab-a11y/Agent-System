<script>
	import { apiKeys, agents, assignments, addToast } from '../stores.js';
	import { PROVIDERS, PROVIDER_MODELS } from '../constants.js';
	import { createApiKey, deleteApiKey, assignModelToAgent, removeAssignment, fetchApiKeys, fetchAssignments } from '../api.js';

	let showAddKey = $state(false);
	let newProvider = $state('openai');
	let newLabel = $state('');
	let newApiKey = $state('');
	let customModels = $state('');
	let saving = $state(false);

	async function handleAddKey() {
		if (!newLabel.trim() || !newApiKey.trim()) {
			addToast('Label and API key are required', 'error');
			return;
		}
		saving = true;
		try {
			const models = newProvider === 'custom'
				? customModels.split(',').map(m => m.trim()).filter(Boolean)
				: PROVIDER_MODELS[newProvider] || [];

			await createApiKey({
				provider: newProvider,
				label: newLabel.trim(),
				api_key: newApiKey.trim(),
				available_models: models
			});
			const keys = await fetchApiKeys();
			apiKeys.set(keys);
			addToast('API key added successfully', 'success');
			showAddKey = false;
			newLabel = '';
			newApiKey = '';
			customModels = '';
		} catch (err) {
			addToast(`Failed to add API key: ${err.message}`, 'error');
		} finally {
			saving = false;
		}
	}

	async function handleDeleteKey(id) {
		try {
			await deleteApiKey(id);
			const keys = await fetchApiKeys();
			apiKeys.set(keys);
			const a = await fetchAssignments();
			assignments.set(a);
			addToast('API key deleted', 'success');
		} catch (err) {
			addToast(`Failed to delete: ${err.message}`, 'error');
		}
	}

	async function handleAssign(agentId, apiKeyId, modelId) {
		if (!apiKeyId || !modelId) {
			await removeAssignment(agentId);
			const a = await fetchAssignments();
			assignments.set(a);
			addToast('Model assignment removed', 'success');
			return;
		}
		try {
			await assignModelToAgent(agentId, apiKeyId, modelId);
			const a = await fetchAssignments();
			assignments.set(a);
			addToast('Model assigned to agent', 'success');
		} catch (err) {
			addToast(`Failed to assign: ${err.message}`, 'error');
		}
	}

	function getAssignment(agentId) {
		return $assignments.find(a => a.agent_id === agentId);
	}

	function getApiKey(id) {
		return $apiKeys.find(k => k.id === id);
	}

	function getModelsForProvider(provider) {
		return PROVIDER_MODELS[provider] || [];
	}
</script>

<div class="kceva-card p-5 kceva-glow">
	<div class="flex items-center justify-between mb-4">
		<div>
			<h3 class="text-base font-semibold text-kceva-text">API Keys & Model Assignment</h3>
			<p class="text-xs text-kceva-text-dim mt-1">Add your LLM API keys and assign models to each agent</p>
		</div>
		<button
			class="kceva-btn kceva-btn-primary"
			onclick={() => showAddKey = !showAddKey}
		>
			{showAddKey ? 'Cancel' : '+ Add API Key'}
		</button>
	</div>

	{#if showAddKey}
		<div class="kceva-card p-4 mb-4 kceva-fade-in" style="background-color: var(--color-kceva-surface-2)">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div>
					<label class="kceva-label block mb-1.5">Provider</label>
					<select class="kceva-input" bind:value={newProvider}>
						{#each Object.entries(PROVIDERS) as [key, val]}
							<option value={key}>{val}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="kceva-label block mb-1.5">Label</label>
					<input class="kceva-input" placeholder="e.g. OpenAI Production" bind:value={newLabel} />
				</div>
				<div class="md:col-span-2">
					<label class="kceva-label block mb-1.5">API Key</label>
					<input class="kceva-input" type="password" placeholder="sk-..." bind:value={newApiKey} />
				</div>
				{#if newProvider === 'custom'}
					<div class="md:col-span-2">
						<label class="kceva-label block mb-1.5">Available Models (comma-separated)</label>
						<input class="kceva-input" placeholder="model-1, model-2, model-3" bind:value={customModels} />
					</div>
				{/if}
			</div>
			<div class="flex justify-end gap-2 mt-4">
				<button class="kceva-btn kceva-btn-ghost" onclick={() => showAddKey = false}>Cancel</button>
				<button class="kceva-btn kceva-btn-primary" onclick={handleAddKey} disabled={saving}>
					{saving ? 'Saving...' : 'Save Key'}
				</button>
			</div>
		</div>
	{/if}

	<!-- API Keys List -->
	{#if $apiKeys.length === 0}
		<div class="text-center py-8 text-kceva-text-dim text-sm">
			No API keys added yet. Click "Add API Key" to get started.
		</div>
	{:else}
		<div class="space-y-2 mb-6">
			{#each $apiKeys as key (key.id)}
				<div class="flex items-center justify-between p-3 rounded-lg" style="background-color: var(--color-kceva-surface-2)">
					<div class="flex items-center gap-3">
						<span class="kceva-badge kceva-badge-green">{key.provider}</span>
						<div>
							<div class="text-sm font-medium text-kceva-text">{key.label}</div>
							<div class="text-xs text-kceva-text-faint font-mono">{key.api_key_hint}</div>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<span class="text-xs text-kceva-text-dim">{key.available_models?.length || 0} models</span>
						<button class="kceva-btn kceva-btn-danger" style="padding: 0.375rem 0.75rem" onclick={() => handleDeleteKey(key.id)}>
							Delete
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Agent Model Assignments -->
	{#if $agents.length > 0 && $apiKeys.length > 0}
		<div class="kceva-divider mb-4"></div>
		<h4 class="text-sm font-semibold text-kceva-text mb-3">Assign Models to Agents</h4>
		<div class="space-y-2">
			{#each $agents as agent (agent.id)}
				{@const assignment = getAssignment(agent.id)}
				{@const assignedKey = assignment ? getApiKey(assignment.api_key_id) : null}
				<div class="flex items-center gap-3 p-3 rounded-lg" style="background-color: var(--color-kceva-surface-2)">
					<div class="flex items-center gap-2 min-w-0 flex-1">
						<span class="kceva-badge kceva-badge-dim">{agent.role}</span>
						<span class="text-sm font-medium text-kceva-text truncate">{agent.name}</span>
					</div>
					<div class="flex items-center gap-2">
						<select
							class="kceva-input"
							style="width: 140px; padding: 0.375rem 0.5rem; font-size: 0.75rem"
							value={assignment?.api_key_id || ''}
							onchange={(e) => {
								const keyId = e.target.value;
								if (!keyId) {
									handleAssign(agent.id, null, null);
								} else {
									const key = getApiKey(keyId);
									const firstModel = key?.available_models?.[0] || '';
									handleAssign(agent.id, keyId, firstModel);
								}
							}}
						>
							<option value="">No key</option>
							{#each $apiKeys as key (key.id)}
								<option value={key.id}>{key.label}</option>
							{/each}
						</select>
						{#if assignedKey}
							<select
								class="kceva-input"
								style="width: 180px; padding: 0.375rem 0.5rem; font-size: 0.75rem"
								value={assignment?.model_id || ''}
								onchange={(e) => handleAssign(agent.id, assignedKey.id, e.target.value)}
							>
								{#each assignedKey.available_models as model}
									<option value={model}>{model}</option>
								{/each}
							</select>
						{:else}
							<div style="width: 180px" class="text-xs text-kceva-text-faint text-center py-2">No key assigned</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
