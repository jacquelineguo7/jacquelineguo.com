<script>
	/* ────────────────────────────────────────────────────────────────
	   FOOTER OVERSCROLL PLAYGROUND
	   One gesture ("pull past the bottom"), three visual mappings, and a
	   live control panel to tune the feel. Nothing here touches the real
	   site — it's a self-contained sandbox at /playground.

	   Mental model:
	   • `value`  = how far the footer is pulled open, in px (0 … maxReveal)
	   • A gesture (wheel / touch / handle-drag) pushes `value` up or down
	     with resistance, then on release we SNAP: past the threshold it
	     springs fully open, otherwise it springs closed.
	   • A tiny spring integrator animates `value` toward `target`.
	   ──────────────────────────────────────────────────────────────── */

	// ── Tunable params (bound to the sliders) ───────────────────────
	let variant = $state('stretch'); // 'stretch' | 'curtain' | 'uncover'
	let maxReveal = $state(320); // px the footer opens to
	let resistance = $state(0.5); // 0–1: how much of a drag delta becomes pull (lower = heavier)
	let snapThreshold = $state(120); // px past which release snaps OPEN
	let stiffness = $state(0.12); // spring pull strength toward target
	let damping = $state(0.75); // 0–1 velocity retained per frame (higher = bouncier)
	let peek = $state(44); // px of footer always visible at rest

	// ── Physics / gesture state (plain vars — not reactive on purpose) ─
	let value = $state(0); // rendered pull, the one thing the DOM reads
	let velocity = 0;
	let target = 0;
	let raf = null;
	let releaseTimer = null;
	let lastPointerY = 0;
	let opened = $state(false); // committed-open? footer only opens on purpose

	// element refs
	let scroller;
	let panelEl;

	const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

	// Higher "resistance" ⇒ stiffer band (smaller c ⇒ harder to pull open).
	const tension = $derived(1 - resistance * 0.85);

	// iOS-style rubber band: early pixels move a little, then resistance
	// grows and the value only ever asymptotes toward maxReveal — so it
	// takes a deliberate pull to travel any real distance.
	const rubber = (raw) => (raw * maxReveal * tension) / (maxReveal + tension * raw);
	// Inverse of `rubber`: given the current position, what raw pull produced
	// it? Lets us keep the gesture continuous across frames / spring hand-offs.
	const unrubber = (v) => (v * maxReveal) / (tension * (maxReveal - v));

	// ── Spring loop ─────────────────────────────────────────────────
	// Classic light-weight spring: nudge velocity toward the target,
	// bleed some energy off each frame (damping), then move. Runs only
	// while it still has work to do, then parks itself.
	function step() {
		velocity += (target - value) * stiffness;
		velocity *= damping;
		value = clamp(value + velocity, 0, maxReveal);

		const settled = Math.abs(target - value) < 0.4 && Math.abs(velocity) < 0.4;
		if (settled) {
			value = target;
			velocity = 0;
			raf = null; // stop the loop
			return;
		}
		raf = requestAnimationFrame(step);
	}
	function startSpring() {
		if (raf == null) raf = requestAnimationFrame(step);
	}

	// ── Gesture core ────────────────────────────────────────────────
	// A gesture directly drives `value` (no spring fighting it). `dy > 0`
	// means "pull the footer more open".
	function applyDelta(dy) {
		if (raf != null) {
			cancelAnimationFrame(raf); // pause the spring while the user drives
			raf = null;
		}
		velocity = 0;
		if (opened) {
			// Already open: closing is direct and free (1:1 with the drag).
			value = clamp(value + dy, 0, maxReveal);
		} else {
			// Closed: convert position → raw pull, add the delta, re-map through
			// the rubber band. The band fights you, so it resists opening by
			// accident and only a purposeful pull reaches the snap threshold.
			const raw = unrubber(Math.min(value, maxReveal - 1)) + dy;
			value = clamp(rubber(Math.max(0, raw)), 0, maxReveal);
		}
	}

	// On release, decide the resting state and let the spring carry it there.
	function release() {
		if (opened) {
			// Pulled down far enough (past the threshold from the top) ⇒ commit closed.
			if (value <= maxReveal - snapThreshold) {
				opened = false;
				target = 0;
			} else {
				target = maxReveal; // snap back open
			}
		} else {
			// Pulled up past the threshold ⇒ commit open; otherwise rubber back.
			if (value >= snapThreshold) {
				opened = true;
				target = maxReveal;
			} else {
				target = 0;
			}
		}
		startSpring();
	}
	function scheduleRelease() {
		// wheel has no "end" event, so we debounce a release after it stops.
		clearTimeout(releaseTimer);
		releaseTimer = setTimeout(release, 110);
	}

	const atBottom = () =>
		scroller && scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;

	// Should this delta engage the footer instead of scrolling the page?
	// Yes if the footer is open (so a drag can close it), if we're pulling
	// down at the very bottom, or if it's already partly pulled out.
	const engaged = (dy) => opened || (atBottom() && dy > 0) || value > 0;

	function onWheel(e) {
		if (panelEl && panelEl.contains(e.target)) return; // let the controls scroll normally
		if (!engaged(e.deltaY)) return;
		e.preventDefault();
		applyDelta(e.deltaY);
		scheduleRelease();
	}

	// Touch + pointer share one incremental model: track last Y, feed deltas.
	function onTouchStart(e) {
		lastPointerY = e.touches[0].clientY;
	}
	function onTouchMove(e) {
		const y = e.touches[0].clientY;
		const dy = lastPointerY - y; // finger up ⇒ positive ⇒ pull open
		lastPointerY = y;
		if (!engaged(dy)) return;
		e.preventDefault();
		applyDelta(dy);
	}

	// Dragging the peek handle directly (works even at the top of the page).
	function onHandleDown(e) {
		lastPointerY = e.clientY;
		e.currentTarget.setPointerCapture(e.pointerId);
	}
	function onHandleMove(e) {
		if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) return;
		const dy = lastPointerY - e.clientY;
		lastPointerY = e.clientY;
		applyDelta(dy);
	}
	function onHandleUp(e) {
		e.currentTarget.releasePointerCapture?.(e.pointerId);
		release();
	}

	function toggle() {
		opened = !opened;
		target = opened ? maxReveal : 0;
		startSpring();
	}
	function reset() {
		opened = false;
		target = 0;
		startSpring();
	}

	// Attach wheel/touch as NON-passive so preventDefault actually works.
	$effect(() => {
		const opts = { passive: false };
		window.addEventListener('wheel', onWheel, opts);
		window.addEventListener('touchstart', onTouchStart, opts);
		window.addEventListener('touchmove', onTouchMove, opts);
		window.addEventListener('touchend', release, opts);
		return () => {
			window.removeEventListener('wheel', onWheel, opts);
			window.removeEventListener('touchstart', onTouchStart, opts);
			window.removeEventListener('touchmove', onTouchMove, opts);
			window.removeEventListener('touchend', release, opts);
		};
	});

	// ── Per-variant visual mapping (derived from `value`) ───────────
	const openPct = $derived(maxReveal > 0 ? Math.round((value / maxReveal) * 100) : 0);
</script>

<svelte:head>
	<title>Footer Overscroll Playground</title>
</svelte:head>

<!-- The scrollable "page". Pull past its bottom to engage the footer. -->
<div
	class="scroller"
	class:lift={variant === 'uncover'}
	bind:this={scroller}
	style="--peek:{peek}px; transform: {variant === 'uncover' ? `translateY(${-value}px)` : 'none'};"
>
	<main class="content">
		<h1>Overscroll footer sandbox</h1>
		<p class="lead">
			Scroll to the very bottom, then keep pulling — with the wheel, a touch drag, or by dragging the
			handle. The footer rubber-bands against you, so it takes a deliberate pull to open. Tune the
			feel on the right. This page is a sandbox; your real site is untouched.
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
</div>

<!-- THE FOOTER. Same content, three different position mappings. -->
<footer
	class="footer {variant}"
	style={variant === 'stretch'
		? `height:${peek + value}px;`
		: variant === 'curtain'
			? `height:${maxReveal + peek}px; transform:translateY(${maxReveal - value}px);`
			: `height:${maxReveal + peek}px;`}
>
	<button
		class="handle"
		onpointerdown={onHandleDown}
		onpointermove={onHandleMove}
		onpointerup={onHandleUp}
		onclick={toggle}
		aria-label="Toggle footer"
	>
		<span class="grip"></span>
		<span class="handle-label">drag / scroll to explore · {openPct}%</span>
	</button>

	<div class="footer-inner">
		<div class="fcol">
			<span class="ftag">navigate</span>
			<span class="flink">home</span>
			<span class="flink">work</span>
			<span class="flink">about</span>
		</div>
		<div class="fcol">
			<span class="ftag">connect</span>
			<span class="flink">email</span>
			<span class="flink">github</span>
			<span class="flink">read.cv</span>
		</div>
		<div class="fcol wide">
			<span class="ftag">colophon</span>
			<span class="fnote">placeholder footer — swap in real content once the motion feels right.</span>
		</div>
	</div>
</footer>

<!-- ── CONTROL PANEL ─────────────────────────────────────────────── -->
<aside class="panel" bind:this={panelEl}>
	<h2>controls</h2>

	<div class="field">
		<span class="flabel">variant</span>
		<div class="seg">
			{#each ['stretch', 'curtain', 'uncover'] as v}
				<button class:active={variant === v} onclick={() => (variant = v)}>{v}</button>
			{/each}
		</div>
	</div>

	<label class="slider">
		<span>max reveal <b>{maxReveal}px</b></span>
		<input type="range" min="120" max="520" step="10" bind:value={maxReveal} />
	</label>
	<label class="slider">
		<span>band resistance <b>{resistance.toFixed(2)}</b></span>
		<input type="range" min="0.1" max="0.9" step="0.05" bind:value={resistance} />
	</label>
	<label class="slider">
		<span>snap threshold <b>{snapThreshold}px</b></span>
		<input type="range" min="20" max="400" step="10" bind:value={snapThreshold} />
	</label>
	<label class="slider">
		<span>spring stiffness <b>{stiffness.toFixed(3)}</b></span>
		<input type="range" min="0.02" max="0.3" step="0.005" bind:value={stiffness} />
	</label>
	<label class="slider">
		<span>damping (bounce) <b>{damping.toFixed(2)}</b></span>
		<input type="range" min="0.5" max="0.95" step="0.01" bind:value={damping} />
	</label>
	<label class="slider">
		<span>peek height <b>{peek}px</b></span>
		<input type="range" min="0" max="120" step="4" bind:value={peek} />
	</label>

	<div class="readout">
		<span>pull</span><b>{Math.round(value)}px · {openPct}%</b>
	</div>
	<div class="btns">
		<button onclick={toggle}>toggle</button>
		<button onclick={reset}>reset</button>
	</div>
</aside>

<style>
	:global(body) {
		margin: 0;
		overflow: hidden; /* the .scroller owns scrolling, not the window */
		background: var(--background--blue);
		font-family: 'Commissioner', system-ui, sans-serif;
		color: var(--dark--blue);
	}

	/* ── Scroll area ── */
	.scroller {
		position: fixed;
		inset: 0;
		bottom: var(--peek); /* leave the footer peek visible beneath */
		overflow-y: auto;
		overscroll-behavior: none; /* stop the browser's own rubber-band */
		background: var(--background--blue);
		z-index: 2;
		will-change: transform;
	}
	.scroller.lift {
		bottom: 0;
	} /* uncover: footer sits behind, no reserved peek gap */

	.content {
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
	.tag,
	.ftag {
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

	/* ── Footer ── */
	.footer {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--primary--blue);
		color: var(--barelythere--white);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 -12px 40px rgba(23, 26, 29, 0.18);
		z-index: 1; /* behind scroller for the "uncover" variant */
	}
	.footer.curtain,
	.footer.stretch {
		z-index: 3;
	} /* these sit above the page */
	.footer.curtain {
		border-radius: 18px 18px 0 0;
	}

	.handle {
		flex: 0 0 var(--peek, 44px);
		height: 44px;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		border: none;
		background: transparent;
		color: inherit;
		cursor: grab;
		touch-action: none;
		font: inherit;
	}
	.handle:active {
		cursor: grabbing;
	}
	.grip {
		width: 42px;
		height: 5px;
		border-radius: 3px;
		background: var(--light--blue);
		opacity: 0.85;
	}
	.handle-label {
		font-family: 'GeistMono', monospace;
		font-size: 0.72rem;
		letter-spacing: 0.05em;
		color: var(--light--blue);
	}

	.footer-inner {
		flex: 1;
		display: flex;
		align-items: flex-end; /* bottom-anchor so "uncover" reveals content first */
		gap: 3rem;
		padding: 1.2rem 3rem 2.4rem;
		min-height: 0;
	}
	.fcol {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.fcol.wide {
		max-width: 26ch;
	}
	.flink {
		font-size: 1.05rem;
		color: var(--barelythere--white);
		opacity: 0.9;
	}
	.fnote {
		font-size: 0.95rem;
		line-height: 1.5;
		color: var(--light--blue);
	}

	/* ── Control panel ── */
	.panel {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 10;
		width: 250px;
		max-height: calc(100vh - 2rem);
		overflow-y: auto;
		padding: 1.1rem 1.2rem 1.3rem;
		background: var(--barelythere--yellow);
		border: 1px solid var(--yellow--outline);
		border-radius: 14px;
		box-shadow: 0 10px 30px rgba(23, 26, 29, 0.12);
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}
	.panel h2 {
		margin: 0;
		font-family: 'GeistMono', monospace;
		font-size: 0.78rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--tertiary--blue);
	}
	.field .flabel,
	.slider span {
		font-size: 0.8rem;
		color: var(--tertiary--blue);
		display: flex;
		justify-content: space-between;
	}
	.slider {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.slider b {
		font-family: 'GeistMono', monospace;
		color: var(--primary--blue);
	}
	.slider input {
		width: 100%;
		accent-color: var(--primary--burgundy);
	}
	.seg {
		display: flex;
		gap: 4px;
		margin-top: 0.4rem;
	}
	.seg button {
		flex: 1;
		padding: 0.4rem 0;
		font-family: 'GeistMono', monospace;
		font-size: 0.7rem;
		border: 1px solid var(--yellow--outline);
		border-radius: 8px;
		background: var(--barelythere--white);
		color: var(--tertiary--blue);
		cursor: pointer;
	}
	.seg button.active {
		background: var(--primary--blue);
		color: var(--barelythere--white);
		border-color: var(--primary--blue);
	}
	.readout {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0.7rem;
		background: var(--hover--blue);
		border-radius: 8px;
		font-size: 0.8rem;
		color: var(--tertiary--blue);
	}
	.readout b {
		font-family: 'GeistMono', monospace;
		color: var(--primary--blue);
	}
	.btns {
		display: flex;
		gap: 6px;
	}
	.btns button {
		flex: 1;
		padding: 0.5rem 0;
		font-family: 'GeistMono', monospace;
		font-size: 0.72rem;
		border: 1px solid var(--yellow--outline);
		border-radius: 8px;
		background: var(--barelythere--white);
		color: var(--primary--blue);
		cursor: pointer;
	}
	.btns button:hover {
		background: var(--yellow--hover);
	}
</style>
