<!-- PhotoCarousel.svelte -->
<!-- A looping photo viewer: < and > step through `photos`, each with a short note.
     New photos develop in — a white veil clears first, then color, contrast and
     focus settle. Nothing moves or scales. -->

<script>
    // `photos` is an array of { src, alt, note }. Passed in by the parent so this
    // component stays reusable — it never hardcodes what it's showing.
    let { photos } = $props();

    let current = $state(0);

    // The modulo (%) is what makes it loop. Going forward past the last index
    // wraps to 0; going back, we add photos.length first so we never hand a
    // negative number to % (JS would return a negative index).
    function next() {
        current = (current + 1) % photos.length;
    }

    function prev() {
        current = (current - 1 + photos.length) % photos.length;
    }
</script>

<div class="photo-carousel">
    <div class="frame">
        <!-- #key tells Svelte "this is a different element when the value changes",
             so it tears down + rebuilds the contents instead of just swapping the
             src. That's what lets the animation re-run on every step. -->
        {#key current}
            <img
                class="photo"
                src={photos[current].src}
                alt={photos[current].alt}
                draggable="false"
            >
            <!-- the white wash that burns off first, like emulsion clearing -->
            <div class="veil"></div>
        {/key}
    </div>

    <div class="caption">
        <p class="note">{photos[current].note}</p>

        <div class="controls">
            <button class="arrow" onclick={prev} aria-label="Previous photo">&lt;</button>
            <button class="arrow" onclick={next} aria-label="Next photo">&gt;</button>
        </div>
    </div>
</div>

<style>
    .photo-carousel {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    /* aspect-ratio reserves the space so the caption row never jumps
       while a new image decodes. */
    .frame {
        position: relative;
        width: 100%;
        aspect-ratio: 3 / 2;
        overflow: hidden;
        background-color: var(--background--blue);
    }

    .photo {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        animation: develop 700ms var(--ease-out) both;
    }

    /* the veil clears at 70% of the develop, so the white lifts before the
       color finishes arriving — that stagger is what reads as "developing"
       rather than as a plain crossfade */
    .veil {
        position: absolute;
        inset: 0;
        background: #fff;
        pointer-events: none;   /* never intercepts clicks */
        animation: veil-out 490ms var(--ease-out) both;
    }

    /* no transform here on purpose — a zoom settling into place reads as
       motion sickness on a photo this size. Color only. */
    @keyframes develop {
        from { filter: saturate(0.8) contrast(0.95) brightness(1.04) blur(1px); }
        to   { filter: saturate(1) contrast(1) brightness(1) blur(0px); }
    }

    @keyframes veil-out {
        from { opacity: 0.31; }
        to   { opacity: 0; }
    }

    .caption {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding-top: 1.25rem;
    }

    .note {
        font-family: 'Whois', monospace;
        text-transform: uppercase;
        letter-spacing: 0.03rem;
        font-size: 1rem;
        color: var(--primary--blue);
        margin: 0;
    }

    .controls {
        display: flex;
        flex-shrink: 0;
        gap: 0.25rem;
    }

    .arrow {
        font-family: 'Whois', monospace;
        font-size: 1rem;
        color: var(--primary--blue);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem 0.6rem;
        line-height: 1;
        transition:
            background-color var(--duration-fast) var(--ease-out),
            transform var(--duration-fast) var(--ease-out);
    }

    .arrow:hover {
        background-color: var(--hover--blue);
    }

    .arrow:active {
        transform: scale(0.92);
    }

    /* Keyboard users get a visible ring; mouse clicks don't. */
    .arrow:focus-visible {
        outline: 2px solid var(--secondary--blue);
        outline-offset: 2px;
    }

    /* Respect the OS "reduce motion" setting — the develop is decorative. */
    @media (prefers-reduced-motion: reduce) {
        .photo, .veil { animation: none; }
        .veil { opacity: 0; }
        .arrow { transition: none; }
        .arrow:active { transform: none; }
    }
</style>
