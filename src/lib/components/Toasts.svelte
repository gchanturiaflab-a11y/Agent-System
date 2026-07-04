<script>
	import { toasts } from '../stores.js';
</script>

{#if $toasts.length > 0}
	<div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
		{#each $toasts as toast (toast.id)}
			<div
				class="kceva-card px-4 py-3 flex items-start gap-3 kceva-fade-in"
				style="border-color: {toast.type === 'error' ? 'rgba(248,113,113,0.4)' : toast.type === 'success' ? 'rgba(74,222,128,0.4)' : 'var(--color-kceva-border-bright)'}"
			>
				<span
					class="kceva-status-dot mt-1.5"
					style="background-color: {toast.type === 'error' ? 'var(--color-kceva-red)' : toast.type === 'success' ? 'var(--color-kceva-green)' : 'var(--color-kceva-blue)'}"
				></span>
				<span class="text-sm text-kceva-text flex-1">{toast.message}</span>
			</div>
		{/each}
	</div>
{/if}
