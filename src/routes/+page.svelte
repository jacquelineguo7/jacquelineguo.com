<script>
    import { resolve } from '$app/paths';
</script>
<div class="page-container">
    <div class="border">
        <div class="page-layout">
            <div class="col" id="left-col">
                    <h1 id="name">Jacqueline Guo</h1>
                <div>
                    <p>Hey! This is Jacqueline.</p>
                    <p>I'm a product & graphic designer, amateur engineer, and recent USC CS Games grad (fight on!) based in the San Francisco Bay Area.</p>
                    <p>I’m excited by solving hard problems with great people to make our world a better place, so I’m stoked to be starting at Persona soon getting to do just that.</p>
                    <p>Outside of work, I’m probably nerding out over typography, photographing everyday life, trying a new handcraft, or being a lifelong music student. Right now, I’m also learning more about frontend and building on the web. You can read my design engineering field notes here, amongst other writing.</p>
                    <p>If any of this speaks to you, please drop me a line. I’d love to chat!</p>
                    <nav>
                        <a href={resolve('/work')}>Work</a>
                        <a href={resolve('/sandbox')}>Sandbox</a>
                        <a href={resolve('/writing')}>Writing</a>
                        <a href={resolve('/about')}>About</a>
                    </nav>
                </div>
                <div>
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
    :global(body) { margin: 0; }

    p {
        font-family: 'Commissioner', sans-serif;
        font-size: 1rem;
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
        padding: 4rem 5rem 4rem 5rem;
        gap: 5rem;
    }

    .border {
        border: 1px dashed #B1C8DC;
    }

    .col {
        display: flex;
        flex-direction: column;
    }

    #left-col { flex: 1; }
    #right-col { flex: 1.8; }
    
    #name {
        font-family: 'Monsieur';
        font-size: 4.5rem;
        font-weight: 400;
    }

    nav {
        display: flex;
        flex-direction: row;
    }

    a {
        flex: 1;
        text-align: center;
    }

    h1 {
        margin: 0;
        padding: 0;
    }

</style>