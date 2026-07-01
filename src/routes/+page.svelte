<script>
    import { resolve } from '$app/paths';
    import { goto } from '$app/navigation';

    let moved;
    let stage;
    let maxX;
    let maxY;
    let dropZone;
    let startX, startY, originX, originY;

    let topZ = 3;                   // highest z-index handed out so far
    let dragging = $state(false);   // true while a stamp is mid-drag
    let overZone = $state(false);   // true when the dragged stamp is over the box

    /* ─────────────────────────────────────────────────────────────
       PLACED-STATE INTERACTION — features to build (see step-by-step)
       -- F1  placed         : which card is staged in the box (null = default)
       -- F2  enter placed   : in endDrag(), set `placed` instead of goto()
       -- F3  card data      : add `media` img + `address` per card (F9 = geo)
       F4  swap content   : pc-left shows title/desc/media when placed
       F5  snap to box    : selected stamp animates into pc-right slot
       F6  corner cluster : other stamps bunch into bottom-left
       F7  go back        : corner = back hit-area (hover-scale) + ←BACK + Esc
       F8  let's go       : button → navigation (the old goto lives here now)
       F9  geolocation    : (stretch) fill TO: from visitor IP location
       F10 transitions    : fade/slide choreography between the two states
       ───────────────────────────────────────────────────────────── */
    
    let placed = $state(null);

    let cardbingo = $state({
        x: 50, y: 170, rotation: -2, width: 11, z: 1,
        href: '/work/bingo',
        title: 'photo bingo',
        desc: 'Creating a 10x bingo experience for groups using playful visual and interaction design.',
        media: '',
    });

    let cardxcode = $state({
        x: 265, y: 235, rotation: 0, width: 15, z: 2,
        href: '/work/xcode',
        title: 'xcode',
        desc: 'Reimagining the new project experience and building with AI in Xcode.',
        media: ''
    });

    let cardrabbit = $state({
        x: 260, y: 60, rotation: 3, width: 13, z: 3,
        href: '/work/rabbitholing',
        title: 'rabbitholing',
        desc: 'Rabbithole with LLMs by interacting with your chat queries as a knowledge graph.',
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
        const H = stage.clientHeight;
        const slots = [
            { x: 24,  y: H - 50, rot: -8 },
            { x: 108,  y: H - 55, rot:   10 },
        ];
        return slots.slice(0, n);
    }

    // centers a stamp inside the drop-zone box
    function boxSlotFor(node) {
        const box   = dropZone.getBoundingClientRect();
        const stageR = stage.getBoundingClientRect();
        return {
            x: (box.left - stageR.left) + (box.width  - node.offsetWidth)  / 2,
            y: (box.top  - stageR.top)  + (box.height - node.offsetHeight) / 2,
        };
    }

    let addressLines = $derived(placed ? placed.address : ['', '', '']);
    // $derived as a computed state (calculated from other reactive things)

    // TODO F7/F8: component actions (not inside the draggable action below)
    //   goBack()  → placed = null;  (also bind to Escape keydown + corner click)
    //   mail()    → goto(resolve(placed.href));  (the LET'S GO button)
    // TODO F9 (stretch): on mount, fetch visitor city/region/country from an IP
    //   geolocation API and fill the TO: lines; fall back to the static playful
    //   copy if it fails. If the site is statically hosted, do this client-side.

    function draggable(node, pos) {
    let startX, startY, originX, originY;

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

    function endDrag(event) {
        node.style.transition = '';   // ← add: restore CSS transition for the snap
        node.removeEventListener('pointermove', onPointerMove);
        node.removeEventListener('pointerup', endDrag);
        node.removeEventListener('pointercancel', endDrag);

        if (node.hasPointerCapture(event.pointerId)) {
            node.releasePointerCapture(event.pointerId);
        }

        pos.x = clamp(pos.x, 0, maxX);
        pos.y = clamp(pos.y, 0, maxY);

        dragging = false;
        overZone = false;

        const droppedInBox = moved && isOverDropZone(node);
        const isPlacedStamp = placed && placed.href === pos.href;

        if (droppedInBox) {
            const slot = boxSlotFor(node);
            pos.x = slot.x;          // center it…
            pos.y = slot.y;
            pos.rotation = -3;       // …with a slight tilt
            placed = pos;            // enter placed state (drives F4 content)
            // goto(resolve(pos.href));   ← moves to the LET'S GO button (F8)
        } else if (isPlacedStamp) {
            // going back from the placed state
            if (moved) {
                // peeled it out and dropped it somewhere new → that's its new home
                homes[pos.href] = { x: pos.x, y: pos.y, rotation: pos.rotation };
                placed = null;
                othersRestore();     // bring the bunched ones home; this one stays put
            } else {
                goBack();            // simple click → every stamp returns home
            }
        } else {
            // a normal stamp dropped outside the box
            if (moved) homes[pos.href] = { x: pos.x, y: pos.y, rotation: pos.rotation };
            othersRestore();
        }
    }

    function onPointerDown(event) {
        node.style.transition = 'none';    // ← add this: no smoothing while dragging
        maxX = stage.clientWidth  - node.offsetWidth;
        maxY = stage.clientHeight - node.offsetHeight;

        moved = false;
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
        // new position = original position + how far the pointer moved
        pos.x = originX + (event.clientX - startX);
        pos.y = originY + (event.clientY - startY);

        pos.x = rubber(pos.x, 0, maxX);
        pos.y = rubber(pos.y, 0, maxY);

        if (Math.hypot(event.clientX - startX, event.clientY - startY) > 4) {
            moved = true; // drag, not click
            dragging = true;
        }
        if (dragging) {
            const nowOver = isOverDropZone(node);
            if (nowOver && !overZone)      othersToCorner();   // just entered → clear them
            else if (!nowOver && overZone) othersRestore();    // just left → bring them back
            overZone = nowOver;
        }
    }

    node.addEventListener('pointerdown', onPointerDown);

    return {
        destroy() {
            node.removeEventListener('pointerdown', onPointerDown);
        }
    };

    function isOverDropZone(node) {
        if (!dropZone) return false;
        const stamp = node.getBoundingClientRect();
        const box   = dropZone.getBoundingClientRect();
        const cx = stamp.left + stamp.width / 2;   // stamp's center point
        const cy = stamp.top  + stamp.height / 2;
        return cx >= box.left && cx <= box.right &&
                cy >= box.top  && cy <= box.bottom;
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
                                    <h2 id="work-title">{placed.title}</h2>
                                    <p class="work-desc">{placed.desc}</p>
                                    <img class="work-media" src={placed.media} alt="{placed.desc}">
                                {:else}
                                    <h2 id="work-title">Featured Work</h2>
                                {/if}
                            </div>
                            <div class="pc-right">
                                <!-- TODO F5: when placed, the chosen stamp snaps INTO this box
                                     (animate position + rotation + scale to fit). Start with
                                     jump-and-settle; upgrade to continuous/FLIP later if it feels cheap. -->
                                <div class="stamp-div" class:dragging class:over={overZone} bind:this={dropZone}>
                                    <!-- bind:this hands you that node after render -->
                                    <p class="stamp-text">Place<br>Stamp<br>Here</p>
                                </div>

                                <div class="address">
                                <span class="to-label">To:</span>
                                    {#each addressLines as line, i(i)}
                                    <!-- each item needs an ID https://svelte.dev/tutorial/svelte/keyed-each-blocks-->
                                    <!-- use i(i) since this is static and mutating the list is not a worry -->
                                        <p class="address-line">{line}</p>
                                    {/each}
                                </div>
                            </div>
                            

                            <!-- TODO F3/F9: add the TO: address block on the right half.
                                 Empty/decorative by default; filled when placed (playful copy,
                                 or visitor's real city/country via IP geolocation, F9). -->
                        </div>

                        <!-- TODO F6: when placed, animate the two NON-selected stamps into a
                             bunched cluster in the bottom-left corner; the selected one goes to
                             the box (F5). Drive their x/y/rotation toward preset cluster targets.
                             DECISION — back RESTORES, it does not reset: before moving anything,
                             snapshot every card's x/y/rotation/z (the live values get overwritten
                             here). For the selected card, snapshot its PRE-DRAG origin
                             (originX/originY from onPointerDown), not the box — so back undoes the
                             whole gesture. Snapshot z too, or the pile returns reshuffled. -->
                        <div
                            class="floating-item"
                            style:--card-w="{cardbingo.width}rem"
                            style:transform="translate3d({cardbingo.x}px, {cardbingo.y}px, 0) rotate({cardbingo.rotation}deg)"
                            style:z-index={cardbingo.z}
                            use:draggable={cardbingo}
                        >
                            <div class="example-card">
                                <img src="/projects/bingo/stamp.png" alt="xcode" draggable="false">
                                <span class="coord-readout">{Math.round(cardbingo.x)}, {Math.round(cardbingo.y)}</span>
                            </div>
                        </div>

                        <div
                            class="floating-item"
                            style:--card-w="{cardxcode.width}rem"
                            style:transform="translate3d({cardxcode.x}px, {cardxcode.y}px, 0) rotate({cardxcode.rotation}deg)"
                            style:z-index={cardxcode.z}
                            use:draggable={cardxcode}
                        >
                            <div class="example-card">
                                <img src="/projects/xcode/stamp.png" alt="xcode" draggable="false">
                                <span class="coord-readout">{Math.round(cardxcode.x)}, {Math.round(cardxcode.y)}</span>
                            </div>
                        </div>

                        <div
                            class="floating-item"
                            style:--card-w="{cardrabbit.width}rem"
                            style:transform="translate3d({cardrabbit.x}px, {cardrabbit.y}px, 0) rotate({cardrabbit.rotation}deg)"
                            style:z-index={cardrabbit.z}
                            use:draggable={cardrabbit}
                        >
                            <div class="example-card">
                                <img src="/projects/rabbitholing/stamp.png" alt="xcode" draggable="false">
                                <span class="coord-readout">{Math.round(cardrabbit.x)}, {Math.round(cardrabbit.y)}</span>
                            </div>
                        </div>

                        <!-- TODO F7: render {#if placed} — a tinted "back" hit-area over the
                             bottom-left corner where the stamps bunch. Click anywhere in it (or
                             on a stamp) → goBack(). Scale the stamps a little on hover. Include a
                             visible "← BACK" label so it reads as a control, not just a pile.
                             goBack() RESTORES the snapshot taken in F6 (animate all three cards
                             back to their saved x/y/rotation/z), then sets placed = null — so the
                             arrangement the user left is preserved, not reset to defaults. -->

                        <!-- TODO F8: render {#if placed} — the "LET'S GO →" button → mail()
                             (the navigation). This is the deliberate "send" step. Focus it on
                             enter so it's keyboard-reachable. -->
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
        height: 100dvh;
        overflow: hidden; /* Prevents scrolling */
        background-color: var(--background--blue);
    }

    .border {
        flex: 1;            /* fill the width of page-container */
        margin: 2rem;
        border: 1px dashed #B1C8DC;
        display: flex;      /* so page-layout can fill its height */
        min-height: 0;
    }

    .page-layout {
        flex: 1;            /* fill the height of .border */
        display: flex;
        padding: 3rem 5rem 4rem 5rem;
        gap: 5rem;
        min-height: 0;      /* allow children to shrink instead of overflowing */
    }

    .col {
        display: flex;
        flex-direction: column;
        min-height: 0;      /* let inner flex sections share height */
    }

    #left-col {
        flex: 1;
        gap: 4rem;
    }
    #right-col {
        flex: 1.6;
        gap: 4rem;
    }

    /* #intro-section {
        box-shadow: 0px 2px 8px 0px rgba(61, 60, 60, 0.1);
    }
     */
    #name {
        margin: 0;
        padding: 0;
        font-family: 'Monsieur-La-Doulaise';
        font-size: 5.4rem;
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
        padding: 2rem;
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
        gap: 4rem;
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
        padding: 2rem 0 2rem 0;
        color: var(--primary--burgundy);
    }

    #notes h2 {
        padding: 0 2rem 0 2rem;
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
        padding: 0.8rem 2rem 0.8rem 2rem;
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
        height: 60vh;          /* gives the flap's % height something to resolve against */
        position: relative;
        padding: 2rem;
        overflow: hidden;
        min-height: 50vh;
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
        gap: 2rem;
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
        justify-content: space-between;
        position: relative;
    }

    .pc-left {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 2.4rem;
    }

    .pc-right {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: end;
        padding: 2.4rem;
    }

    .stamp-div {
        color: var(--light--blue);
        display: flex;
        width: 10rem;
        height: 8rem;
        border: 0.3rem double var(--light--blue);
        justify-content: center;
        align-items: center;
        transition:
            border-color var(--duration-base) var(--ease-out),
            background-color var(--duration-base) var(--ease-out),
            transform var(--duration-base) var(--ease-out);
    }

    /* a stamp is being dragged somewhere on the stage → hint the target */
    .stamp-div.dragging {
        border: 0.3rem double var(--tertiary--blue);
        background-color: var(--hover--blue);
    }

    /* the dragged stamp is over the box → ready to drop */
    .stamp-div.over {
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
        cursor: grab;
        touch-action: none;
        user-select: none;
        padding: 0;
        margin: 0;
        transition: transform 340ms cubic-bezier(.34, 1.56, .64, 1);
        will-change: transform;
    }
    /* .floating-item:active {
        cursor: grabbing;
    } */

    .example-card {
        width: var(--card-w, 13rem);
    }

    .example-card img {
        display: block;
        width: 100%;         /* fill the card's width */
        height: auto;        /* height follows automatically → no distortion */
    }

    .address-line {
        margin: 0 0 0.9rem;                       /* gap between lines */
        padding-bottom: 0.2rem;                   /* lift text off the rule */
        min-height: 1.4em;                        /* keeps EMPTY lines visible */
        border-bottom: 1px solid var(--light--blue);
        font-family: 'Whois', monospace;
    }

    .work-desc {
        font-family: 'Whois';
        margin-top: 0;
        line-height: 1.3rem;
        letter-spacing: 0.03rem;
        

    }

    /* ── TODO: styles for the placed state ───────────────────────────
       F4  .placed layout : title / desc / media column on pc-left
       F5  stamp-in-box    : sizing + transition for the snapped stamp
       F6  .corner-cluster : bottom-left stack positions for idle stamps
       F7  .back-area      : light-red tint hit-area + stamp hover-scale
       F8  .lets-go / .back-btn : button styling (Whois/Hershey type)
       F10 transitions     : reuse var(--duration-base)/var(--ease-out)
       ──────────────────────────────────────────────────────────────── */

</style>