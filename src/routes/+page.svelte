<script>
    import { resolve } from '$app/paths';
</script>
<div class="page-container">
    <div class="col" id="left-col">
        <div>
            <h1>Jacqueline Guo</h1>
            <p>Hey! This is Jacqueline-</p>
            <p>Product & graphic designer, amateur engineer, and recent USC CS Games grad (fight on!) based in the San Francisco Bay Area.</p>
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
        <div>
            <h2>Selected Work</h2>
            <img src={resolve('/favicon.svg')} alt="temp favicon">

            <h3>Rabbitholing</h3>
            <p>Rabbithole into topics using LLMs by transforming chat responses into a knowledge graph nodes and links.</p>
        </div>

        <div>
            <div>
                <img src={resolve('/favicon.svg')} alt="temp place for photography">
            </div>

            <div>
                <p>random div that idk what to do with rn</p>
            </div>
        </div>

    </div>
</div>

<style>
    .page-container {
        display: flex;
        padding: 4rem;
        gap: 3rem;
    }

    .col {
        display: flex;
        flex-direction: column;
    }

    #left-col { flex: 1; }
    #right-col { flex: 1.5; }

</style>