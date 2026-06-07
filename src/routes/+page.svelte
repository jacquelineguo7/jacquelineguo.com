<script>
    import { resolve } from '$app/paths';
</script>
<div class="page-container">
    <div class="border">
        <div class="page-layout">
            <div class="col" id="left-col">
                <div>
                    <h1 id="name">Jacqueline Guo</h1>
                    <div id="intro">
                        <p class="top-p">Hey! This is Jacqueline.</p>
                        <p>I'm a designer, amateur engineer, and recent <a href="https://games.usc.edu/" class="inline-link">USC CS Games</a> grad (fight on!) based in the San Francisco Bay Area.</p>
                        <p>I’m excited by solving hard problems with great people to make our world a better place, so I’m stoked to be starting at <a href="https://withpersona.com/" class="inline-link">Persona</a> soon getting to do just that.</p>
                        <p>Outside of work, I’m probably nerding out over typography, photographing everyday life, trying a new handcraft, or being a lifelong music student. Right now, I’m also learning more about frontend and building on the web. You can read my design engineering field notes <a href={resolve('/writing')} class="inline-link">here</a>, amongst other writing.</p>
                        <p class="bottom-p">If any of this speaks to you, please <a href="mailto:jacquelineguo7@gmail.com?subject=something in your intro caught my eye" class="inline-link">drop me a line</a>. I’d love to chat!</p>
                    </div>
                    <nav id="nav">
                        <a class="nav-link" href={resolve('/work')}>Work</a>
                        <a class="nav-link" href={resolve('/sandbox')}>Sandbox</a>
                        <a class="nav-link" href={resolve('/writing')}>Writing</a>
                        <a class="nav-link" href={resolve('/about')}>About</a>
                    </nav>
                </div>
                <div class="zigzag" id="notes">
                    <h2>Notes from the Garden</h2>
                    <ol>
                        <li>Design Engineering Fieldnotes</li>
                        <li>Graduating from USC? A checklist, so you can enjoy your time left</li>
                        <li>Don’t delegate understanding</li>
                    </ol>
                </div>
            </div>
            <div class="col" id="right-col">
                <div id="selected-work">
                    <h2>Selected Work</h2>
                    <img src={resolve('/favicon.svg')} alt="temp favicon">

                    <h3>Rabbitholing</h3>
                    <p>Rabbithole into topics using LLMs by transforming chat responses into a knowledge graph nodes and links.</p>
                </div>

                <div id="photo">
                    <div>
                        <img src={resolve('/favicon.svg')} alt="temp place for photography">
                    </div>

                    <div>
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
        margin: 2rem;
        border: 1px dashed #B1C8DC;
    }

    .page-layout {
        display: flex;
        padding: 3rem 5rem 4rem 5rem;
        gap: 5rem;
    }

    .border {
        border: 1px dashed #B1C8DC;
    }

    .col {
        display: flex;
        flex-direction: column;
    }

    #left-col {
        flex: 1;
        gap: 4rem;
    }
    #right-col { flex: 1.6; }
    
    #name {
        margin: 0;
        padding: 0;
        font-family: 'Monsieur';
        font-size: 5rem;
        font-weight: 400;
        color: var(--primary--blue);
        margin-bottom: -1.5rem;
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

    #notes {
        background-color: var(--barelythere--yellow);
        padding: 2rem;
        color: var(--primary--burgundy)
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



</style>