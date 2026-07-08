<script>
	import UncoverFooter from '$lib/UncoverFooter.svelte';
</script>

<svelte:head>
	<title>Uncover Footer</title>
</svelte:head>

<UncoverFooter>
	<main class="demo">
		<h1>Uncover footer</h1>
		<p class="lead">
			Scroll to the very bottom, then keep scrolling — with the wheel or a touch drag. The page lifts
			to uncover the footer beneath, tracking your scroll directly. There's no snap; it just stays
			wherever you scrolled it, and retracts as you scroll back up.
		</p>
		{#each Array(6) as _, i}
			<section class="block">
				<span class="tag">placeholder block {i + 1}</span>
				<div class="rows">
					{#each Array(3) as _, j}
						<div class="row" style="width:{90 - j * 18}%"></div>
					{/each}
				</div>
			</section>
		{/each}
		<p class="hint">↓ keep pulling past here ↓</p>
	</main>
</UncoverFooter>

<style>
	:global(body) {
		margin: 0;
		background: var(--background--blue);
		font-family: 'Commissioner', system-ui, sans-serif;
		color: var(--dark--blue);
	}
	.demo {
		max-width: 720px;
		margin: 0 auto;
		padding: 5rem 2rem 8rem;
	}
	h1 {
		font-family: 'Hershey-Triplex-Bold', serif;
		font-size: 2.4rem;
		color: var(--primary--blue);
		margin: 0 0 0.6rem;
	}
	.lead {
		font-size: 1.05rem;
		line-height: 1.6;
		color: var(--tertiary--blue);
		max-width: 46ch;
	}
	.block {
		margin-top: 2.5rem;
		padding: 1.4rem;
		border: 1px solid var(--primary--blue--32);
		border-radius: 12px;
		background: var(--barelythere--white);
	}
	.tag {
		font-family: 'GeistMono', monospace;
		font-size: 0.72rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--secondary--blue);
	}
	.rows {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin-top: 0.9rem;
	}
	.row {
		height: 12px;
		border-radius: 6px;
		background: var(--light--blue);
	}
	.hint {
		text-align: center;
		margin-top: 4rem;
		font-family: 'GeistMono', monospace;
		font-size: 0.8rem;
		color: var(--secondary--blue);
	}
</style>
