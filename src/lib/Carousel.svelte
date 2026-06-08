<!-- Carousel.svelte -->

<!-- JS -->
<!-- Components are reusable. Funnel unique data in using properties (props for short.) -->
<!-- Aka function parameters. Someone calls the component "function" and the relevant params/args are passed. -->

<script>

    let { projects } = $props(); // Props is a Svelte function that returns all params/args passed in as an object.
    let current = $state(0); // $state(0) declares a reactive variable starting at 0

    function nextproj() {
        current = (current + 1) % projects.length;
    }

    function prevproj() {
        current = (current - 1 + projects.length) % projects.length;
    }

</script>

<!-- HTML MARKUP -->
<!-- Everything inside {} is evaluated as JS. -->
<!-- onclick={prev} is event binding, call prev when clicked -->
<!-- if/else block is conditional rendering, execution dependent on what markup exists in the DOM.
    Syntax: # to open, : for middle branches, / to close -->

<div class="carousel">
    <button class="arrow" onclick={prevproj} aria-label="Previous Project">Prev</button>

    <a class="project-card" href={projects[current].link}>
        {#if projects[current].type === 'video'}
            <video class="project-media" src={projects[current].media} autoplay loop muted playsinline></video>
        {:else}
            <img class="project-media" src={projects[current].media} alt={projects[current].title}>
        {/if}

        <h3 class="project-title">{projects[current].title}</h3>
        <p class="project-desc">{projects[current].desc}</p>

    </a>

    <button class="arrow" onclick={nextproj} aria-label="Next Project">Next</button>
</div>





<!-- CSS STYLES -->
<style>
    .carousel {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .project-card {
        flex: 1;
        text-decoration: none;
        color: inherit;
        display: flex;
        flex-direction: column;
    }
        .project-media {
        width: 100%;
        aspect-ratio: 16 / 9;
        object-fit: cover;
    }
    .arrow {
        flex-shrink: 0;
        background: none;
        border: none;
        font-size: 2rem;
        cursor: pointer;
    }
</style>