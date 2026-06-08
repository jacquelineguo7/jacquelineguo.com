<script>
	import favicon from '$lib/assets/slanted-saturated-button.svg';
	// import { createDialKit } from 'dialkit/svelte'
	import 'dialkit/styles.css'

	let { children } = $props();
	import '../app.css';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
