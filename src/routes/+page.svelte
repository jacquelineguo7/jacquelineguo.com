<script>
    import { resolve } from '$app/paths';
    import { goto } from '$app/navigation';

    let moved;

    let cardbingo = $state({
        x: 50, y: 170, rotation: -2, width: 12,
        href: '/work/bingo',
        title: 'photo bingo',
        desc: 'One-line blurb shown on hover.'
    });

    let cardxcode = $state({
        x: 265, y: 235, rotation: 0, width: 16,
        href: '/work/xcode',
        title: 'xcode',
        desc: 'One-line blurb shown on hover.'
    });

    let cardrabbit = $state({
        x: 260, y: 60, rotation: 3, width: 14,
        href: '/work/rabbitholing',
        title: 'rabbitholing',
        desc: 'One-line blurb shown on hover.'
    });

    let dropZone;
    
    // let cardbingo = $state({ x: 50, y: 170, rotation: -2, width: 12 });
    // let cardxcode = $state({ x: 265, y: 235, rotation: 0, width: 16 });
    // let cardrabbit = $state({ x: 260, y: 60, rotation: 3, width: 14 });

    function draggable(node, pos) {
    let startX, startY, originX, originY;

    function onPointerDown(event) {
        moved = false;

        event.preventDefault();   // stops native image-drag + text selection
        startX = event.clientX;            // where the pointer grabbed
        startY = event.clientY;
        originX = pos.x;                   // where the item was at that moment
        originY = pos.y;
        node.setPointerCapture(event.pointerId);
        node.addEventListener('pointermove', onPointerMove);
        node.addEventListener('pointerup', onPointerUp);
    }

    function onPointerMove(event) {
        // new position = original position + how far the pointer moved
        pos.x = originX + (event.clientX - startX);
        pos.y = originY + (event.clientY - startY);

        if (Math.hypot(event.clientX - startX, event.clientY - startY) > 4) {
            moved = true; // drag, not click
        }
    }

    function onPointerUp(event) {
        node.releasePointerCapture(event.pointerId);
        node.removeEventListener('pointermove', onPointerMove);
        node.removeEventListener('pointerup', onPointerUp);

        if (moved && isOverDropZone(node)) {
            goto(resolve(pos.href));   // landed on the box → open project
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
                            <p>I’m excited by tackling hard, technical problems with great people to make our world a better place, and so I’m stoked to be starting at <a href="https://withpersona.com/" class="inline-link">Persona</a> soon. Previously, I was a design intern at <a href="https://developer.apple.com/xcode/" class="inline-link">Apple</a> working on dev tooling and AI.</p>
                            <p>Outside of work, I’m probably nerding out over typography, photographing everyday life, trying a new handcraft, or being a lifelong music student. Right now, I’m learning the technical details behind the web. You can read my field notes <a href={resolve('/writing')} class="inline-link">here</a>, amongst other writing.</p>
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
                <div id="selected-work">
                    <div class="envelope-decor">
                        <div class="env-left">
                            <h2 id="feature">Featured Work</h2>
                            <div class="line-media-container"></div>
                        </div>
                        <div class="env-right">
                            <div class="stamp-div" bind:this={dropZone}>
                                <!-- bind:this hands you that node after render -->
                                <p class="stamp-text">Place<br>Stamp<br>Here</p>
                            </div>
                        </div>
                    </div>

                    <div
                        class="floating-item"
                        style:--card-w="{cardbingo.width}rem"
                        style:transform="translate3d({cardbingo.x}px, {cardbingo.y}px, 0) rotate({cardbingo.rotation}deg)" use:draggable={cardbingo}
                    >
                        <div class="example-card">
                            <img src="/projects/bingo/stamp.png" alt="xcode" draggable="false">
                            <!-- <span class="coord-readout">{Math.round(cardbingo.x)}, {Math.round(cardbingo.y)}</span> -->
                        </div>
                    </div>

                    <div
                        class="floating-item"
                        style:--card-w="{cardxcode.width}rem"
                        style:transform="translate3d({cardxcode.x}px, {cardxcode.y}px, 0) rotate({cardxcode.rotation}deg)" use:draggable={cardxcode}
                    >
                        <div class="example-card">
                            <img src="/projects/xcode/stamp.png" alt="xcode" draggable="false">
                            <!-- <span class="coord-readout">{Math.round(cardxcode.x)}, {Math.round(cardxcode.y)}</span> -->
                        </div>
                    </div>

                    <div
                        class="floating-item"
                        style:--card-w="{cardrabbit.width}rem"
                        style:transform="translate3d({cardrabbit.x}px, {cardrabbit.y}px, 0) rotate({cardrabbit.rotation}deg)" use:draggable={cardrabbit}
                    >
                        <div class="example-card">
                            <img src="/projects/rabbitholing/stamp.png" alt="xcode" draggable="false">
                            <!-- <span class="coord-readout">{Math.round(cardrabbit.x)}, {Math.round(cardrabbit.y)}</span> -->
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

    #selected-work {
        position: relative;   /* the stage: floating items measure x/y from here */
        min-height: 45vh;    /* canvas room — absolute items don't prop this open */
        background-color: #F8F8F4;
        padding: 3rem;
        color: var(--primary--blue);
        align-items: baseline;
        gap: 2rem;
    }

    .envelope-decor {
        flex: 1;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .env-left {
        width: 12rem;
        display: flex;
        flex-direction: column;
    }

    .env-right {
        display: flex;
        justify-content: end;
    }

    .stamp-div {   
        display: flex;
        width: 10rem;
        height: 8rem;
        border: 0.3rem double var(--light--blue);
        justify-content: center;
        align-items: center;
    }

    .stamp-div p {
        font-family: 'Whois';
        text-transform: uppercase;
        text-align: center;
    }

    .line-media-container {
        margin-top: 1rem;
        flex: 1;
        background-image: repeating-linear-gradient(
            to bottom,
            var(--light--blue) 0 0.1rem,   /* line */
            transparent 0.1rem 1.8rem          /* gap (period) */
        );
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

</style>