<script>
	/* ────────────────────────────────────────────────────────────────
	   UNCOVER FOOTER  (direct scroll-reveal — no snap)

	   Wrap your page content in this component:

	     <UncoverFooter>
	       <main> …your page… </main>
	     </UncoverFooter>

	   How it works:
	   • The page content lives in a fixed "scroller" layer.
	   • A footer sits fixed BEHIND it at the bottom, fully hidden at rest.
	   • Scrolling past the bottom (wheel / touch) lifts the scroller up by
	     `value` px, uncovering the footer beneath.
	   • The reveal tracks your scroll 1:1 — no snap, no spring. It simply
	     stays wherever you scrolled it, and retracts as you scroll back up.
	   ──────────────────────────────────────────────────────────────── */

	let {
		children, // page content (default slot)
		footerContent, // optional snippet to replace the placeholder footer body
		maxReveal = 320, // px the footer can open to
		resistance = 0.5 // 0–1: fraction of a scroll delta that becomes reveal
	} = $props();

	let value = $state(0); // px the page is lifted = how far the footer is revealed
	let lastPointerY = 0;
	let scroller;

	const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

	// The reveal is a direct function of how far you've scrolled past the
	// bottom — set it straight from the delta, clamped to [0, maxReveal].
	function applyDelta(dy) {
		value = clamp(value + dy * resistance, 0, maxReveal);
	}

	const atBottom = () =>
		scroller && scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;

	// Engage the footer (instead of scrolling) when scrolling down at the very
	// bottom, or whenever it's already partly revealed (so scrolling up retracts it).
	const engaged = (dy) => (atBottom() && dy > 0) || value > 0;

	function onWheel(e) {
		if (!engaged(e.deltaY)) return;
		e.preventDefault();
		applyDelta(e.deltaY);
	}
	function onTouchStart(e) {
		lastPointerY = e.touches[0].clientY;
	}
	function onTouchMove(e) {
		const y = e.touches[0].clientY;
		const dy = lastPointerY - y; // finger up ⇒ positive ⇒ reveal more
		lastPointerY = y;
		if (!engaged(dy)) return;
		e.preventDefault();
		applyDelta(dy);
	}

	// Non-passive listeners so preventDefault works during the scroll-reveal.
	$effect(() => {
		const opts = { passive: false };
		window.addEventListener('wheel', onWheel, opts);
		window.addEventListener('touchstart', onTouchStart, opts);
		window.addEventListener('touchmove', onTouchMove, opts);
		return () => {
			window.removeEventListener('wheel', onWheel, opts);
			window.removeEventListener('touchstart', onTouchStart, opts);
			window.removeEventListener('touchmove', onTouchMove, opts);
		};
	});
</script>

<!-- Page content: a fixed layer that lifts up to uncover the footer. -->
<div class="uf-scroller" bind:this={scroller} style="transform: translateY({-value}px);">
	{@render children?.()}
</div>

<!-- The footer, fixed behind the scroller. Hidden at rest; revealed bottom-up. -->
<footer class="uf-footer" style="height:{maxReveal}px;" aria-label="Site footer">
	<div class="uf-body">
		{#if footerContent}
			{@render footerContent()}
		{:else}
			<!-- Placeholder — swap in real content, or pass a footerContent snippet. -->
			<div class="uf-col">
				<span class="uf-tag">navigate</span>
				<span class="uf-link">home</span>
				<span class="uf-link">work</span>
				<span class="uf-link">about</span>
			</div>
			<div class="uf-col">
				<span class="uf-tag">connect</span>
				<span class="uf-link">email</span>
				<span class="uf-link">github</span>
				<span class="uf-link">read.cv</span>
			</div>
			<div class="uf-col uf-wide">
				<span class="uf-tag">colophon</span>
				<span class="uf-note">placeholder footer — swap in real content once it's wired up.</span>
			</div>
		{/if}
	</div>
</footer>

<style>
	.uf-scroller {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0; /* covers the footer completely at rest */
		overflow-y: auto;
		overscroll-behavior: none; /* suppress the browser's own bounce */
		background: var(--background--blue, #e8eef2);
		z-index: 2;
		will-change: transform;
	}

	.uf-footer {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1; /* sits behind the scroller */
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: var(--primary--blue, #4b5e74);
		color: var(--barelythere--white, #f9fafb);
		box-shadow: 0 -12px 40px rgba(23, 26, 29, 0.18);
	}

	.uf-body {
		flex: 1;
		display: flex;
		align-items: flex-end; /* bottom-anchor so content is revealed first */
		gap: 3rem;
		padding: 1.4rem 3rem 1.6rem;
		min-height: 0;
	}
	.uf-col {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.uf-wide {
		max-width: 26ch;
	}
	.uf-tag {
		font-family: 'GeistMono', monospace;
		font-size: 0.72rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--secondary--blue, #92b2d0);
	}
	.uf-link {
		font-size: 1.05rem;
		opacity: 0.9;
	}
	.uf-note {
		font-size: 0.95rem;
		line-height: 1.5;
		color: var(--light--blue, #b1c8dc);
	}
</style>
