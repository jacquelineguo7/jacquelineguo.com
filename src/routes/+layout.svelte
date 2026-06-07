<script>
	import favicon from '$lib/assets/slanted-saturated-button.svg';
	import '../app.css';
	// import { createDialKit } from 'dialkit/svelte'
	import 'dialkit/styles.css'

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
