<script>
    import { resolve } from '$app/paths';
    import { goto } from '$app/navigation';
    import { fade, fly } from 'svelte/transition';
    import { onMount } from 'svelte';
    import UncoverFooter from '$lib/UncoverFooter.svelte';   // TEST: uncover footer wrapper (remove to revert)

    let moved;
    let stage;
    let maxX;
    let maxY;
    let dropZone;
    let startX, startY, originX, originY;

    let topZ = 3;                   // highest z-index handed out so far
    let dragging = $state(false);   // true while a stamp is mid-drag
    let overZone = $state(false);   // true when the dragged stamp is over the box

    // ── POSITION SCALING ──────────────────────────────────────────
    // Stamp coordinates (pos.x / pos.y, homes, corner + box slots) are all
    // stored in REFERENCE SPACE: the px values that were tuned when the
    // postcard was REF_W wide. `scale` = live postcard width / REF_W, so the
    // whole scatter tracks the postcard as it resizes. It's applied ×scale at
    // render, and pointer input is divided by scale wherever real (screen) px
    // enter the drag math. The postcard keeps a ~constant aspect ratio, so one
    // width-based factor drives both x and y.
    const REF_W = 854;              // postcard width (px) at the 1792px design viewport → scale = 1 here
    let scale = $state(1);

    // drag physics (tuned in the playground)
    const GRAB_SCALE = 1.04;        // scale-up when a stamp is grabbed
    const FRICTION = 0.85;          // velocity decay per frame during the float
    const BOUNCE = 0.35;            // energy kept when the float hits a wall
    const VEL_CARRY = 0.3;          // how much throw speed carries into the float
    const DROP_THRESHOLD = 0.40;    // overlap fraction needed to count as "over the box"
    const MOVE_THRESHOLD = 8;       // px of pointer travel before a click counts as a drag

    /* ─────────────────────────────────────────────────────────────
       PLACED-STATE INTERACTION — features to build (see step-by-step)
       F7  go back        : corner = back hit-area (hover-scale) + ←BACK + Esc
       F8  let's go       : button → navigation (the old goto lives here now)
       F9  geolocation    : done — see visitStats/addressLines below
       F10 transitions    : fade/slide choreography between the two states
       ───────────────────────────────────────────────────────────── */
    
    let placed = $state(null);

    // swap animation matches the pc-left "Featured Work" ⇄ project title swap:
    // 60ms, default (linear) easing, in-only — the outgoing element just vanishes.
    const GO_SWAP_DURATION = 60;
    const GO_SWAP_X = 16;   // px — "Go To Project" slides in from the >>>'s side

    // ── THROWAWAY — background color is still up for grabs; pick one, copy the
    // hex into .lets-go's background-color below, then delete this block + the
    // <div class="tune-panel"> near the end of the markup. ──
    let goBg = $state('#E8EEF2');          // matches --background--blue

    let cardbingo = $state({
        x: 32, y: 100, rotation: -2, width: 12, z: 1,
        href: '/work/bingo',
        title: 'photo bingo',
        desc: 'Creating a 10x bingo experience for groups using playful visual and interaction design.',
        media: '',
    });

    let cardxcode = $state({
        x: 185, y: 195, rotation: 0, width: 16, z: 2,
        href: '/work/xcode',
        title: 'xcode',
        desc: 'Reimagining the new project experience and building with AI in Xcode.',
        media: ''
    });

    let cardrabbit = $state({
        x: 210, y: 30, rotation: 3, width: 14, z: 3,
        href: '/work/rabbitholing',
        title: 'rabbitholing',
        desc: 'Rabbithole with LLMs by interacting with your chat queries in the form of a knowledge graph.',
        media: ''
    });

    const cards = [cardbingo, cardxcode, cardrabbit];

    // each card's TRUE resting spot — captured once, updated only when the user
    // deliberately drops a stamp (never when it's auto-moved to the corner).
    const homes = Object.fromEntries(
        cards.map(c => [c.href, { x: c.x, y: c.y, rotation: c.rotation }])
    );

    // send every stamp back to its home and leave the placed state
    function goBack() {
        cards.forEach(c => {
            const h = homes[c.href];
            c.x = h.x; c.y = h.y; c.rotation = h.rotation;
        });
        placed = null;
    }

    // where the bunched stamps sit, bottom-left of the stage
    function cornerSlots(n) {
        const H = stage.clientHeight / scale;   // reference-space height
        const slots = [
            { x: 24,  y: H - 50, rot: -8 },
            { x: 108,  y: H - 55, rot:   10 },
        ];
        return slots.slice(0, n);
    }

    // which corner slot a given card occupies (matches othersToCorner's assignment)
    function cornerSlotFor(card) {
        if (!placed) return null;
        const others = cards.filter(c => c.href !== placed.href);
        const i = others.findIndex(c => c.href === card.href);
        return i < 0 ? null : cornerSlots(others.length)[i];
    }

    // centers a stamp inside the drop-zone box
    function boxSlotFor(node) {
        const box   = dropZone.getBoundingClientRect();
        const stageR = stage.getBoundingClientRect();
        // getBoundingClientRect + offsetWidth are real (screen) px → /scale to
        // land back in the reference space that pos.x / pos.y live in
        return {
            x: ((box.left - stageR.left) + (box.width  - node.offsetWidth)  / 2) / scale,
            y: ((box.top  - stageR.top)  + (box.height - node.offsetHeight) / 2) / scale,
        };
    }

    // F9: visit count + geolocation, fetched once from our own /api/visit
    // endpoint (which reads Vercel's edge geo headers and increments the
    // counter in Upstash). Falls back to placeholder copy if it fails or
    // is running somewhere without those headers (e.g. local dev).
    let visitStats = $state({ count: null, city: null, region: null, country: null });
    const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

    onMount(async () => {
        // keep `scale` synced to the postcard's live width so the stamp scatter
        // tracks it as the postcard resizes (see POSITION SCALING above)
        if (stage) {
            scale = stage.clientWidth / REF_W;
            const ro = new ResizeObserver(() => { scale = stage.clientWidth / REF_W; });
            ro.observe(stage);
        }

        try {
            const res = await fetch('/api/visit');
            if (res.ok) visitStats = await res.json();
        } catch {
            // network error — visitStats stays at its placeholder defaults
        }
    });

    let addressLines = $derived([
        `Internet Visitor #${visitStats.count ?? '----'}`,
        visitStats.city
            ? `${visitStats.city}, ${visitStats.region ? visitStats.region + ', ' : ''}${countryNames.of(visitStats.country) ?? visitStats.country}`
            : 'Somewhere Out There',
        'World Wide Web, Earth'
    ]);
    // $derived as a computed state (calculated from other reactive things)

    function draggable(node, pos) {
    let startX, startY, originX, originY;
    let lastTap = 0;   // timestamp of the last tap on this stamp, for double-tap detection
    const card = node.querySelector('.example-card');   // inner element that carries the grab-scale
    let samples = [];      // recent pointer positions, for computing throw velocity
    let floatRaf = null;   // active momentum-float animation frame (if any)

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function othersToCorner() {
        const others = cards.filter(c => c.href !== pos.href);   // everyone but me
        const slots = cornerSlots(others.length);
        others.forEach((c, i) => { c.x = slots[i].x; c.y = slots[i].y; c.rotation = slots[i].rot; });
    }

    // bring the bunched stamps back to their real homes (skip a placed one)
    function othersRestore() {
        cards
            .filter(c => c.href !== pos.href && (!placed || c.href !== placed.href))
            .forEach(c => { const h = homes[c.href]; c.x = h.x; c.y = h.y; c.rotation = h.rotation; });
    }

    // true on the 2nd tap of a double-tap; always records this tap for next time
    function checkDoubleTap(event) {
        const isDouble = event.timeStamp - lastTap < 300;
        lastTap = isDouble ? 0 : event.timeStamp;
        return isDouble;
    }

    // drop this stamp into the box, centered, and clear the others (F5 + F6)
    function placeInBox() {
        const slot = boxSlotFor(node);
        pos.x = slot.x;
        pos.y = slot.y;
        pos.rotation = -3;
        othersToCorner();
        placed = pos;
    }

    // momentum: keep drifting after release, bleeding off with friction + edge-bounce
    function startFloat(vx, vy) {
        node.style.transition = 'none';   // rAF drives the position, not CSS easing
        function step() {
            vx *= FRICTION; vy *= FRICTION;
            pos.x += vx;    pos.y += vy;
            if (pos.x < 0)    { pos.x = 0;    vx = -vx * BOUNCE; }
            if (pos.x > maxX) { pos.x = maxX; vx = -vx * BOUNCE; }
            if (pos.y < 0)    { pos.y = 0;    vy = -vy * BOUNCE; }
            if (pos.y > maxY) { pos.y = maxY; vy = -vy * BOUNCE; }
            if (Math.hypot(vx, vy) > 0.4) {
                floatRaf = requestAnimationFrame(step);
            } else {
                floatRaf = null;
                node.style.transition = '';   // restore for the next snap
                homes[pos.href] = { x: pos.x, y: pos.y, rotation: pos.rotation };
            }
        }
        floatRaf = requestAnimationFrame(step);
    }

    // fling with momentum if thrown, otherwise clamp into frame — and record the new home
    function flingOrLand() {
        const a = samples[0], b = samples[samples.length - 1];
        let vx = 0, vy = 0;
        if (a && b && b.t > a.t) {
            const dt = Math.max(8, b.t - a.t);
            // samples are screen px → /scale so the float drifts in reference space
            vx = (b.x - a.x) / dt * 16 * VEL_CARRY / scale;
            vy = (b.y - a.y) / dt * 16 * VEL_CARRY / scale;
        }
        if (Math.hypot(vx, vy) > 0.4) {
            startFloat(vx, vy);
        } else {
            pos.x = clamp(pos.x, 0, maxX);
            pos.y = clamp(pos.y, 0, maxY);
            homes[pos.href] = { x: pos.x, y: pos.y, rotation: pos.rotation };
        }
    }

    function endDrag(event) {
        node.style.transition = '';            // restore CSS transition for the snap
        if (card) card.style.transform = '';   // scale the stamp back down
        node.removeEventListener('pointermove', onPointerMove);
        node.removeEventListener('pointerup', endDrag);
        node.removeEventListener('pointercancel', endDrag);

        if (node.hasPointerCapture(event.pointerId)) {
            node.releasePointerCapture(event.pointerId);
        }

        dragging = false;
        overZone = false;

        if (moved) lastTap = 0;   // a real drag breaks any pending double-tap sequence

        const droppedInBox = moved && isOverDropZone(node);
        const isPlacedStamp = placed && placed.href === pos.href;
        const isCornerStamp = placed && !isPlacedStamp;   // a bunched (set-aside) stamp

        if (droppedInBox) {
            placeInBox();                        // drag onto the box → place / replace
        } else if (isCornerStamp) {
            if (!moved && checkDoubleTap(event)) {
                placeInBox();                    // corner stamp double-tapped → swap in
            } else {
                // corner stamp NOT dropped on the box → always return to its slot,
                // whether it was a drag elsewhere or just a (jittery) click
                const slot = cornerSlotFor(pos);
                if (slot) { pos.x = slot.x; pos.y = slot.y; pos.rotation = slot.rot; }
            }
        } else if (isPlacedStamp) {
            if (moved) {
                // peeled the placed stamp out → un-place, bring the pile home, this one lands
                placed = null;
                othersRestore();
                flingOrLand();
            } else {
                goBack();                        // single click on the placed stamp → release
            }
        } else if (moved) {
            flingOrLand();                       // a free stamp dragged/flung → land where dropped
        } else if (checkDoubleTap(event)) {
            placeInBox();                        // free stamp double-tapped → place
        }
    }

    function onPointerDown(event) {
        if (floatRaf) { cancelAnimationFrame(floatRaf); floatRaf = null; }   // stop any in-flight float
        node.style.transition = 'none';    // no smoothing while dragging
        if (card) card.style.transform = `scale(${GRAB_SCALE})`;   // grab-scale up
        scale = stage.clientWidth / REF_W;   // refresh in case a resize was mid-flight
        // travel limits in reference space (screen px extents ÷ scale)
        maxX = (stage.clientWidth  - node.offsetWidth)  / scale;
        maxY = (stage.clientHeight - node.offsetHeight) / scale;

        moved = false;
        samples = [];             // fresh velocity samples for this drag
        pos.z = ++topZ;           // clicked/grabbed stamp jumps to the front

        event.preventDefault();   // stops native image-drag + text selection
        startX = event.clientX;            // where the pointer grabbed
        startY = event.clientY;
        originX = pos.x;                   // where the item was at that moment
        originY = pos.y;
        node.setPointerCapture(event.pointerId);
        node.addEventListener('pointermove', onPointerMove);
        node.addEventListener('pointerup', endDrag);
        node.addEventListener('pointercancel', endDrag);
    }

    function onPointerMove(event) {
        if (event.pointerType === 'mouse' && event.buttons === 0) {
            endDrag(event);
            return;
        }
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        if (!moved) {
            // still inside the click-jitter tolerance — don't move the stamp yet
            if (Math.hypot(dx, dy) <= MOVE_THRESHOLD) return;
            moved = true; // drag, not click
            dragging = true;
        }

        // new position = original position + how far the pointer moved.
        // dx/dy are screen px; originX/Y + maxX/Y are reference space → /scale
        pos.x = rubber(originX + dx / scale, 0, maxX);
        pos.y = rubber(originY + dy / scale, 0, maxY);

        samples.push({ x: event.clientX, y: event.clientY, t: event.timeStamp });
        if (samples.length > 5) samples.shift();

        // stamps now clear on DROP, not on hover — here we only light up the box
        overZone = isOverDropZone(node);
    }

    node.addEventListener('pointerdown', onPointerDown);

    return {
        destroy() {
            node.removeEventListener('pointerdown', onPointerDown);
        }
    };

    function isOverDropZone(node) {
        if (!dropZone) return false;
        const s = node.getBoundingClientRect();
        const b = dropZone.getBoundingClientRect();
        const ix = Math.max(0, Math.min(s.right, b.right) - Math.max(s.left, b.left));
        const iy = Math.max(0, Math.min(s.bottom, b.bottom) - Math.max(s.top, b.top));
        // fraction of the SMALLER shape that's covered — robust whether stamp or box is bigger
        const overlap = (ix * iy) / Math.min(s.width * s.height, b.width * b.height);
        return overlap >= DROP_THRESHOLD;
    }

    function rubber(value, min, max) {
        const give = 30; // how far past the edge it can stretch, px
        if (value < min) return min - resist(min - value, give);
        if (value > max) return max + resist(value - max, give);
        return value;
    }
    // overshoot grows, but the return value asymptotes toward `give`
    function resist(overshoot, give) {
        return (1 - 1 / (overshoot / give + 1)) * give;
    }
}

</script>

<!-- TEST: wrapped in UncoverFooter so the footer works on the real homepage. Remove wrapper to revert. -->
<UncoverFooter>
<div class="page-container">
    <div class="border">
        <div class="page-layout">
            <div class="col" id="left-col">
                <div>
                    <h1 id="name">Jacqueline Guo</h1>
                    <div id="intro-section">
                        <div id="intro">
                            <p class="top-p">Hey! This is Jacqueline.</p>
                            <p>I'm a product + graphic designer, amateur engineer, and recent <a href="https://games.usc.edu/" class="inline-link">USC CS Games</a> grad (fight on!) based in the San Francisco Bay Area.</p>
                            <p>I’m excited by tackling difficult, high-craft technical problems with great people to make our world a better place, so I’m stoked to be starting at <a href="https://withpersona.com/" class="inline-link">Persona</a> soon! Previously, I was a design intern at <a href="https://developer.apple.com/xcode/" class="inline-link">Apple</a> working on dev tooling and AI.</p>
                            <p>Outside of work, I’m probably nerding out over typography, photographing everyday life, trying a new handcraft, or being a lifelong music student. Right now, I’m learning about how the web was built and how that contributes to its current state. You can read my field notes <a href={resolve('/writing')} class="inline-link">here</a>, amongst other writing.</p>
                            <p class="bottom-p">If any of this speaks to you, please <a href="mailto:jacquelineguo7@gmail.com?subject=something in your intro caught my eye" class="inline-link">drop me a line</a>. I’d love to chat!</p>
                        </div>
                        <nav id="nav">
                            <a class="nav-link" href={resolve('/work')}>Work</a>
                            <a class="nav-link" href={resolve('/sandbox')}>Sandbox</a>
                            <a class="nav-link" href={resolve('/writing')}>Writing</a>
                            <a class="nav-link" href={resolve('/about')}>About</a>
                        </nav>
                    </div>
                </div>
                <div class="zigzag" id="notes">
                    <h2>Notes from the Garden</h2>
                    <ol>
                        <li class="article li-top">
                            <a href={resolve('/writing')} class="article-link">Design Engineering Fieldnotes</a>
                        </li>
                        <li class="article">
                            <a href={resolve('/writing')} class="article-link">Graduating from USC? A checklist, so you can enjoy your time left</a>
                        </li>
                        <li class="article">
                            <a href={resolve('/writing')} class="article-link">Don’t delegate understanding</a>
                        </li>
                    </ol>
                </div>
            </div>
            <div class="col" id="right-col">
                <div id="envelope">
                    <div id="envelope-flap"></div>
                    <div id="postcard" bind:this={stage}>
                        <div class="postcard-decor">
                            <div class="pc-left">
                                {#if placed}
                                    <h2 class="work-title" in:fade={{ duration: 60 }}>{placed.title}</h2>
                                    <p class="work-desc" in:fade={{ duration: 60 }}>{placed.desc}</p>
                                    <img class="work-media" in:fade={{ duration: 60 }} src={placed.media} alt="{placed.desc}">
                                {:else}
                                    <h2 class="work-title" in:fade={{ duration: 60 }}>Featured Work</h2>
                                {/if}
                            </div>
                            <div class="pc-right">
                                <div class="right-flush-div">
                                    <div class="stamp-div" class:dragging class:over={overZone} bind:this={dropZone}>
                                        <!-- bind:this hands you that node after render -->
                                        <p class="stamp-text">Place<br>Stamp<br>Here</p>
                                    </div>
                                </div>

                                <div class="address">
                                    <p class="to-label">To:</p>
                                    {#each addressLines as line, i(i)}
                                    <!-- each item needs an ID https://svelte.dev/tutorial/svelte/keyed-each-blocks-->
                                    <!-- use i(i) since this is static and mutating the list is not a worry -->
                                        <p class="address-line">{line}</p>
                                    {/each}
                                </div>

                                <div class="right-flush-div">
                                    <div id="project-go-button" style:--go-bg={goBg}>
                                        {#if placed}
                                            <a class="lets-go" href="{placed.href}"><span class="lets-go-label" in:fade={{ x: GO_SWAP_X, duration: GO_SWAP_DURATION }}>Go To Project </span><span class="lets-go-arrow">&gt;&gt;&gt;</span></a>
                                        {:else}
                                            <span class="lets-go-idle" aria-hidden="true"><span class="lets-go-arrow">&gt;&gt;&gt;</span></span>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            class="floating-item"
                            style:--card-w={cardbingo.width}
                            style:transform="translate3d({cardbingo.x * scale}px, {cardbingo.y * scale}px, 0) rotate({cardbingo.rotation}deg)"
                            style:z-index={cardbingo.z}
                            use:draggable={cardbingo}
                        >
                            <div class="example-card">
                                <img src="/projects/bingo/stamp.png" alt="xcode" draggable="false">
                                <!-- <span class="coord-readout">{Math.round(cardbingo.x)}, {Math.round(cardbingo.y)}</span> -->
                            </div>
                        </div>

                        <div
                            class="floating-item"
                            style:--card-w={cardxcode.width}
                            style:transform="translate3d({cardxcode.x * scale}px, {cardxcode.y * scale}px, 0) rotate({cardxcode.rotation}deg)"
                            style:z-index={cardxcode.z}
                            use:draggable={cardxcode}
                        >
                            <div class="example-card">
                                <img src="/projects/xcode/stamp.png" alt="xcode" draggable="false">
                                <!-- <span class="coord-readout">{Math.round(cardxcode.x)}, {Math.round(cardxcode.y)}</span> -->
                            </div>
                        </div>

                        <div
                            class="floating-item"
                            style:--card-w={cardrabbit.width}
                            style:transform="translate3d({cardrabbit.x * scale}px, {cardrabbit.y * scale}px, 0) rotate({cardrabbit.rotation}deg)"
                            style:z-index={cardrabbit.z}
                            use:draggable={cardrabbit}
                        >
                            <div class="example-card">
                                <img src="/projects/rabbitholing/stamp.png" alt="xcode" draggable="false">
                                <!-- <span class="coord-readout">{Math.round(cardrabbit.x)}, {Math.round(cardrabbit.y)}</span> -->
                            </div>
                        </div>
                    </div>
                </div>

                <div id="other">
                    <div id="photo">
                        <img src="/photos/JQG001.webp" alt="temp place for photography">
                    </div>

                    <div id="random">
                        <p>random div that idk what to do with rn</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</UncoverFooter>

<style>
    :global(*) { box-sizing: border-box; }
    :global(body) { margin: 0;  }
    :global(a) { text-align: left }

    p {
        font-family: 'Commissioner', sans-serif;
        font-size: 1rem;
        color: var(--primary--blue);
        font-weight: 400;
        line-height: 160%;
    }

    h2 {
        font-family: 'Hershey-Triplex-Italic-Bold';
        font-size: 1.2rem;
        text-transform: uppercase;
        margin-top: 0;
    }

    .top-p {
        margin-top: 0;
    }

    .bottom-p {
        margin-bottom: 0;
    }

    .page-container {
        display: flex;
        width: 100%; /* Use 100% instead of 100vw to avoid scrollbar overflow */
        min-height: 100dvh; /* fill the viewport, but grow + scroll when content needs it */
        background-color: var(--background--blue);
    }

    .border {
        flex: 1;            /* fill the width of page-container */
        margin: var(--frame-inset);
        border: 1px dashed #B1C8DC;
        display: flex;      /* so page-layout can fill its height */
        min-height: 0;
    }

    .page-layout {
        flex: 1;            /* fill the height of .border */
        display: flex;
        padding: var(--page-pad-top) var(--page-pad-x) var(--page-pad-bottom);
        gap: var(--col-gap);
        min-height: 0;      /* allow children to shrink instead of overflowing */
        /* beyond ~the 1450 breakpoint, freeze the content width and let the
           extra window space become gutter — this stops the envelope (sized by
           aspect-ratio from its width) from growing taller and scrolling the
           page. margin-inline:auto centers the frozen content inside the frame. */
        max-width: 1600px;
        margin-inline: auto;
    }

    .col {
        display: flex;
        flex-direction: column;
        min-height: 0;      /* let inner flex sections share height */
    }

    #left-col {
        flex: 1;
        gap: var(--section-gap);
    }
    #right-col {
        flex: 1.6;
        gap: var(--section-gap);
    }

    /* #intro-section {
        box-shadow: 0px 2px 8px 0px rgba(61, 60, 60, 0.1);
    }
     */
    #name {
        margin: 0;
        padding: 0;
        font-family: 'Monsieur-La-Doulaise';
        font-size: clamp(3rem, 12vw, 5.4rem);   /* shrinks with the column, caps at the design size */
        font-weight: 400;
        color: var(--primary--blue);
        margin-bottom: -1.8rem;
        z-index: 2;
    }

    #nav {
        display: flex;
        flex-direction: row;
        gap: 0.14rem;
    }

    .nav-link {
        background-color: var(--barelythere--white);
        padding-top: 1.4rem;
        padding-bottom: 1.4rem;
        font-family: 'Hershey-Triplex-Bold';
        text-transform: uppercase;
        color: var(--primary--blue);
        text-decoration: none;
    }

    a {
        flex: 1;
        text-align: center;
    }

    #intro {
        background-color: white;
        padding: var(--block-pad);
        border-bottom: 2px dotted var(--secondary--blue);
    }

    .zigzag {
        --s: 0.6rem;  /* control the size of the spikes */
        width: round(var(--w),4*var(--s)); 
        object-fit: cover;
        padding: calc(2*var(--s));
        --_m:#0000 0 calc(2*atan(.5)),#000 0 50%;
        mask:
            repeating-conic-gradient(from atan(2) at 50% var(--s),var(--_m))
            calc(2*var(--s)) calc(-1*var(--s))/calc(4*var(--s)) 100% intersect,
            repeating-conic-gradient(from atan(-.5) at var(--s),var(--_m))
            calc(-1*var(--s)) calc(2*var(--s))/100% calc(4*var(--s));
    }
    
    #other {
        display: flex;
        flex-direction: row;
        gap: var(--section-gap);
    }

    #photo {
        flex: 0.8;
        overflow: hidden;
        padding: 1rem 1rem 3.5rem 1rem;
        background-color: white;
    }

    #photo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    #random {
        flex: 1;
    }

    .inline-link {
        color: var(--primary--blue);
        font-weight: 500;
        text-decoration: underline dotted var(--secondary--blue);
        text-underline-offset: 3px;
        text-decoration-thickness: 2px;

        transition:
            background-color var(--duration-base) var(--ease-out);
    }

    .inline-link:hover {
        color: var(--primary--blue);
        background-color: var(--hover--blue);
    }

    #notes {
        background-color: var(--barelythere--yellow);
        padding: var(--block-pad) 0;
        color: var(--primary--burgundy);
    }

    #notes h2 {
        padding: 0 var(--notes-pad-x);
    }

    #notes ol {
        list-style: none;
        counter-reset: notes;
        margin: 0;
        padding: 0;
    }

    #notes .article-link {
        text-decoration: none;
        font-family: 'Commissioner', sans-serif;
        color: var(--primary--burgundy);
        line-height: 120%;
        padding: 0.8rem var(--notes-pad-x);
        border-bottom: 0.4px solid var(--primary--burgundy--64);
        counter-increment: notes;
        display: flex;            /* keeps number + text aligned as columns */

        transition:
        background-color var(--duration-base) var(--ease-out);
        text-align: left;
        align-items: top;
    }

    .li-top {
        border-top: 0.4px solid var(--primary--burgundy--64);
    }

    #notes .article-link::before {
        content: "(" counter(notes) ") ";
        font-family: 'Hershey-Triplex-Bold';   /* the separate font */
        flex-shrink: 0;
        margin-right: 0.5rem;
    }

    #notes .article-link:hover {
        background-color: var(--yellow--hover);
        content: " » ";
        
    }

    #envelope {
        background-color: #D7DDE2;
        aspect-ratio: 5 / 3; /* fixed envelope proportion (5.5 wide × 3 tall) */
        height: auto;          /* let the ratio drive height instead of the viewport */
        position: relative;
        padding: var(--block-pad) 3rem;
        overflow: hidden;
    }

    #envelope-flap {
        position: absolute;
        top: 0;                    
        left: 0;
        right: 0;
        height: 35%;
        background-color: #C5CDD4;
        border-bottom-left-radius: 1rem;
        border-bottom-right-radius: 1rem;
    }

    #postcard {
        height: 100%;
        position: relative;   /* the stage: floating items measure x/y from here */
            /* canvas room — absolute items don't prop this open */
        background-color: #F8F8F4;
        color: var(--primary--blue);
        align-items: baseline;
        gap: var(--postcard-gap);

        /* make the postcard a size-query container so 1cqw = 1% of its width.
           the stamps + drop-zone size themselves in --stamp-unit below, which
           tracks the postcard width — so their relative sizes stay locked and
           the drag/drop interaction behaves the same at any width. */
        container-type: inline-size;
        /* Pure-proportional unit: 1.33cqw = 1.33% of the postcard width, no
           clamp. This makes stamp SIZES scale 1:1 with the postcard, matching
           the stamp POSITIONS (which scale by width/REF_W) — so the whole
           scatter is one locked composition that just grows/shrinks with the
           postcard. Tradeoff: no floor/cap, so stamps get proportionally tiny
           on very small postcards and large on very wide ones. */
        --stamp-unit: 1.33cqw;
    }
    #postcard::after {
        content: '';
        position: absolute;
        left: 50%;  top: 0;  bottom: 0;
        width: 1.6px;
        background: var(--light--blue);
        transform: translateX(-50%);   /* centers the 2px on the 50% mark */
    }

    .postcard-decor {
        display: flex;
        flex-direction: row;
        height: 100%;
    }

    .pc-left {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: var(--card-pad);
    }

    .pc-right {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: var(--card-pad);
    }

    .stamp-div {
        color: var(--light--blue);
        display: flex;
        width: calc(12 * var(--stamp-unit));
        height: calc(10 * var(--stamp-unit));
        border: 0.3rem double var(--light--blue);
        justify-content: center;
        align-items: center;
        transition:
            border-color var(--duration-base) var(--ease-out),
            background-color var(--duration-base) var(--ease-out),
            transform var(--duration-base) var(--ease-out);
    }
    .stamp-div.dragging {                                           /* Hint Stamp Target */
        border: 0.3rem double var(--tertiary--blue);
        background-color: var(--hover--blue);
    }
    .stamp-div.over {                                               /* Stamp Over Box */
        border: 0.3rem double var(--tertiary--blue);
        background-color: var(--hover--blue);
        transform: scale(1.06);
    }
    .stamp-div p {
        font-family: 'Whois';
        text-transform: uppercase;
        text-align: center;
    }

    .floating-item {
        position: absolute;      /* lifts out of flow; positioned from the stage */
        top: 0;
        left: 0;                 /* origin = stage top-left; transform does the moving */
        transform-origin: top left;   /* pin the stamp's top-left corner at (x,y) so
                                         rotation + size changes radiate from there —
                                         the layout holds as the postcard resizes */
        cursor: grab;
        touch-action: none;
        user-select: none;
        padding: 0;
        margin: 0;
        transition: transform 280ms cubic-bezier(.34, 1.10, .64, 1);  /* 280ms, bounce 0.10 */
        will-change: transform;
    }

    /* respect users who ask for less motion — stamps relocate instantly, no sweep */
    @media (prefers-reduced-motion: reduce) {
        .floating-item { transition: none; }
    }

    .example-card {
        /* --card-w is now a unitless count (11/13/15), scaled by --stamp-unit so
           each stamp stays a fixed % of the postcard, same basis as .stamp-div */
        width: calc(var(--card-w, 13) * var(--stamp-unit));
        transition: transform 150ms ease-out;   /* grab-scale animation */
        transform-origin: center;
    }

    .example-card img {
        display: block;
        width: 100%;         /* fill the card's width */
        height: auto;        /* height follows automatically → no distortion */
    }

    /* shared Whois-label look: uppercase monospace, tracked out 0.03rem.
       grouped here so the trio only needs tuning in one place. */
    .address,
    .address-line,
    .to-label,
    .work-desc,
    .lets-go,
    .lets-go-idle,
    .stamp-div p {
        font-family: 'Whois', monospace;
        text-transform: uppercase;
        letter-spacing: 0.03rem;
    }

    .work-desc {
        text-transform: none;    /* body copy — only wants the font + tracking, not caps */
    }

    .address-line {
        margin: 0 0 0.9rem;                       /* gap between lines */
        padding-bottom: 0.2rem;                   /* lift text off the rule */
        min-height: 1.4em;                        /* keeps EMPTY lines visible */
        border-bottom: 1.2px solid var(--light--blue);
    }

    .to-label {
        color: var(--secondary--blue);
        margin: 0 0 0.5rem;                       /* lift text off the rule */
        padding-bottom: 0.05rem;
        min-height: 1.4em;                        /* keeps EMPTY lines visible */
    }

    .work-desc {
        margin-top: 0;
        line-height: 1.3rem;
    }

    .right-flush-div {
        display: flex;
        justify-content: end;
    }

    /* reserves the button's footprint even when {#if placed} is false,
       so .address above it doesn't jump when a stamp is placed/removed */
    #project-go-button {
        min-height: 2.75rem;
    }

    .lets-go,
    .lets-go-idle {
        display: inline-block;
        color: var(--secondary--blue);
        padding: 0.6rem;
        margin-bottom: 0;
    }

    .lets-go-idle {
        border: 1px #B1C8DC;
    }

    .lets-go {
        text-decoration: none;
        /* hover transition (not the swap-in) — reuses the site-wide interactive timing */
        transition:
            color var(--duration-base) var(--ease-out),
            background-color var(--duration-base) var(--ease-out);
        /* TUNE: still deciding on this one — pick a hex, hardcode it here, then
           delete goBg + the <div class="tune-panel"> near the end of the markup */
        background-color: var(--go-bg, var(--background--blue));
    }
    .lets-go:hover {
        color: var(--tertiary--blue);
    }

    /* the arrow is shared markup in both states, always unstyled/untransitioned —
       it never moves or fades, it just happens to sit in the same right-flush spot */
    .lets-go-arrow {
        display: inline-block;
    }

    /* only the label mounts/unmounts, and only it carries the swap-in transition */
    .lets-go-label {
        display: inline-block;
        margin-right: 0.4rem;
    }

    .stamp-text{
        color: var(--secondary--blue);
    }

    /* ── RESPONSIVE: below this width the two columns stack, right under left.
       The interactive postcard's small-screen behavior is a separate pass
       (stamps still use fixed-px starts), so expect it to look tight here. ── */
    @media (max-width: 1450px) {
        /* retune the Tier-1 spacing levers (defined in app.css :root) */
        :root {
            --page-pad-x: 10rem;
            --page-pad-top: 2rem;
            --page-pad-bottom: 2rem;
            --col-gap: 3rem;
            --section-gap: 3rem;
        }
        .page-layout {
            flex-direction: column;
            min-height: auto;   /* size to content + scroll — don't squish the postcard */
        }
        /* stop the below-content vertical shrink (old fixed-height scaffolding),
           so the envelope keeps its 5.5/3 aspect-ratio when stacked */
        .col {
            min-height: auto;
        }
        #left-col,
        #right-col {
            flex: 1;   /* drop the 1 : 1.6 desktop ratio when stacked */
        }
    }

    /* ~900px — tablet: tighten the frame + component paddings */
    @media (max-width: 1000px) {
        :root {
            --page-pad-top: 1rem;
            --frame-inset: 1.25rem;
            --page-pad-x: 2rem;
            --card-pad: 1.5rem;
            --block-pad: 1.5rem;
            --notes-pad-x: 1.5rem;
            --col-gap: 2rem;
            --section-gap: 2rem;
        }
    }

    /* ~600px — phone: minimal spacing */
    @media (max-width: 600px) {
        :root {
            --frame-inset: 0.75rem;
            --page-pad-x: 2rem;
            --page-pad-top: 2rem;
            --page-pad-bottom: 2rem;
            --section-gap: 2rem;
            --card-pad: 1rem;
            --block-pad: 1.25rem;
            --notes-pad-x: 1rem;
        }

        .zigzag {
            --s: 0.4rem;
        }

        #envelope {
            padding: 0;
        }
        
    }

</style>