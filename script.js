document.addEventListener('DOMContentLoaded', () => {
    const pokemonListElement = document.getElementById('pokemon-list');
    const pokemonDetailElement = document.getElementById('pokemon-detail');
    const detailContentElement = document.getElementById('detail-content');
    const instructionTextElement = document.querySelector('.instruction-text');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const pageInfoElement = document.getElementById('page-info');
    const pokemonNameElement = document.getElementById('pokemon-name');
    const pokemonIdElement = document.getElementById('pokemon-id');
    const pokemonSpriteElement = document.getElementById('pokemon-sprite');
    const pokemonTypesElement = document.getElementById('pokemon-types');
    const pokemonStatsElement = document.getElementById('pokemon-stats');
    const playCryButton = document.getElementById('play-cry-button');
    const pokemonCryAudio = document.getElementById('pokemon-cry');

    const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/';
    const POKEMON_LIMIT = 20; // Cuántos cargar por página
    let currentOffset = 0;
    let currentPage = 1;
    let totalPokemon = 0; // Se obtendrá de la API

    // --- Funciones de la API ---

    async function fetchPokemonList(offset, limit) {
        try {
            const response = await fetch(`${POKEAPI_BASE_URL}pokemon?offset=${offset}&limit=${limit}`);
            if (!response.ok) throw new Error('Network response was not ok.');
            const data = await response.json();
            if (totalPokemon === 0) {
                 totalPokemon = data.count; // Guardar el total de Pokémon la primera vez
            }
            return data.results; // Array de { name, url }
        } catch (error) {
            console.error('Error fetching Pokémon list:', error);
            pokemonListElement.innerHTML = '<p class="error">Error al cargar la lista de Pokémon.</p>';
            return []; // Devuelve array vacío en caso de error
        }
    }

    async function fetchPokemonData(pokemonIdentifier) { // Puede ser nombre o ID
        try {
            const response = await fetch(`${POKEAPI_BASE_URL}pokemon/${pokemonIdentifier.toLowerCase()}`);
            if (!response.ok) {
                 if (response.status === 404) {
                    return null; // Pokémon no encontrado
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error fetching data for ${pokemonIdentifier}:`, error);
            return null; // Devuelve null en caso de error
        }
    }

    // --- Funciones de Display ---

    function displayPokemonList(pokemonArray) {
        pokemonListElement.innerHTML = ''; // Limpiar lista anterior
        if (pokemonArray.length === 0 && searchInput.value.trim() !== '') {
             pokemonListElement.innerHTML = '<p class="info">No se encontraron Pokémon con ese nombre/ID.</p>';
             return;
        } else if (pokemonArray.length === 0) {
             pokemonListElement.innerHTML = '<div class="loader">Cargando...</div>'; // Mostrar si está vacío pero no es búsqueda
            return;
        }

        pokemonArray.forEach(pokemon => {
            const card = document.createElement('div');
            card.classList.add('pokemon-card');
            card.dataset.name = pokemon.name; // Guardar nombre para fetch de detalles

            // Extraer ID de la URL para mostrarlo
            const urlParts = pokemon.url.split('/');
            const pokemonId = urlParts[urlParts.length - 2];

            // Intentar obtener sprite básico rápido (puede fallar si la API cambia estructura)
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;

            card.innerHTML = `
                <span class="pokemon-id-list">#${pokemonId}</span>
                <img src="${spriteUrl}" alt="${pokemon.name}" loading="lazy">
                <p>${pokemon.name}</p>
            `;
            card.addEventListener('click', () => loadAndDisplayPokemonDetail(pokemon.name));
            pokemonListElement.appendChild(card);
        });
    }

    function displayPokemonDetail(pokemonData) {
        if (!pokemonData) {
             // Ocultar detalles y mostrar mensaje de no encontrado si viene de búsqueda
             instructionTextElement.textContent = 'Pokémon no encontrado.';
             instructionTextElement.style.display = 'block';
             detailContentElement.style.display = 'none';
             playCryButton.style.display = 'none';
             return;
        }

        instructionTextElement.style.display = 'none'; // Ocultar instrucciones
        detailContentElement.style.display = 'block'; // Mostrar contenido de detalles

        pokemonNameElement.textContent = pokemonData.name;
        pokemonIdElement.textContent = `#${pokemonData.id.toString().padStart(3, '0')}`;

        // Priorizar sprite animado de Gen 5, si no, el default
        const animatedSprite = pokemonData.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default;
        const defaultSprite = pokemonData.sprites.front_default;
        pokemonSpriteElement.src = animatedSprite || defaultSprite || 'placeholder.png'; // Usar placeholder si no hay ninguno
        pokemonSpriteElement.alt = pokemonData.name;

        // Mostrar Tipos
        pokemonTypesElement.innerHTML = '';
        pokemonData.types.forEach(typeInfo => {
            const typeSpan = document.createElement('span');
            typeSpan.classList.add('type-badge', `type-${typeInfo.type.name}`);
            typeSpan.textContent = typeInfo.type.name;
            pokemonTypesElement.appendChild(typeSpan);
        });

        // Mostrar Stats Base
        pokemonStatsElement.innerHTML = '';
        pokemonData.stats.forEach(statInfo => {
            const statLi = document.createElement('li');
            statLi.textContent = `${statInfo.stat.name}: ${statInfo.base_stat}`;
            pokemonStatsElement.appendChild(statLi);
        });

         // Configurar Sonido (Grito)
        const cryUrl = pokemonData.cries?.latest || pokemonData.cries?.legacy;
        if (cryUrl) {
            pokemonCryAudio.src = cryUrl;
            playCryButton.style.display = 'inline-block'; // Mostrar botón
             // Asegurarse de que el listener no se añada múltiples veces
             playCryButton.onclick = () => { // Usar .onclick para reemplazar listeners anteriores
                pokemonCryAudio.play().catch(e => console.warn("Error al reproducir audio:", e)); // Añadir catch por si el navegador bloquea autoplay
            };
        } else {
            playCryButton.style.display = 'none'; // Ocultar si no hay grito
            pokemonCryAudio.src = ''; // Limpiar src
            playCryButton.onclick = null; // Quitar listener
        }
    }

    function showLoadingDetails() {
         instructionTextElement.style.display = 'none';
         detailContentElement.style.display = 'block'; // Mostrar contenedor pero vacío
         pokemonNameElement.textContent = 'Cargando...';
         pokemonIdElement.textContent = '#???';
         pokemonSpriteElement.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Imagen transparente 1x1
         pokemonTypesElement.innerHTML = '';
         pokemonStatsElement.innerHTML = '<li>Cargando stats...</li>';
         playCryButton.style.display = 'none';
    }

     function resetDetailView() {
        instructionTextElement.textContent = 'Selecciona un Pokémon de la lista o búscalo.';
        instructionTextElement.style.display = 'block';
        detailContentElement.style.display = 'none';
        playCryButton.style.display = 'none';
        pokemonCryAudio.src = '';
        playCryButton.onclick = null;
    }


    // --- Lógica de Carga y Navegación ---

    async function loadAndDisplayPokemonList(offset) {
        pokemonListElement.innerHTML = '<div class="loader">Cargando...</div>'; // Mostrar loader
        const pokemon = await fetchPokemonList(offset, POKEMON_LIMIT);
        displayPokemonList(pokemon);
        updatePaginationControls();
    }

    async function loadAndDisplayPokemonDetail(identifier) {
        const audio = new Audio('assets/audio/sound_pokemon_seleccionado.mp3');
        audio.play();
        showLoadingDetails(); // Mostrar estado de carga en detalles
        const pokemonData = await fetchPokemonData(identifier);
        displayPokemonDetail(pokemonData); // Mostrar datos o mensaje de no encontrado
    }

    function updatePaginationControls() {
        const maxPage = Math.ceil(totalPokemon / POKEMON_LIMIT);
        pageInfoElement.textContent = `Página ${currentPage} de ${maxPage}`;
        prevButton.disabled = currentOffset === 0;
        nextButton.disabled = currentOffset + POKEMON_LIMIT >= totalPokemon;
    }

    // --- Event Listeners ---

    prevButton.addEventListener('click', () => {
        if (currentOffset > 0) {
            currentOffset -= POKEMON_LIMIT;
            currentPage--;
            loadAndDisplayPokemonList(currentOffset);
             resetDetailView(); // Limpiar detalles al cambiar página
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentOffset + POKEMON_LIMIT < totalPokemon) {
            currentOffset += POKEMON_LIMIT;
            currentPage++;
            loadAndDisplayPokemonList(currentOffset);
             resetDetailView(); // Limpiar detalles al cambiar página
        }
    });

    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            pokemonListElement.innerHTML = ''; // Limpiar lista al buscar
            prevButton.style.display = 'none'; // Ocultar paginación durante búsqueda
            nextButton.style.display = 'none';
            pageInfoElement.style.display = 'none';
            loadAndDisplayPokemonDetail(searchTerm);
        } else {
            // Si la búsqueda está vacía, recargar la primera página
             prevButton.style.display = 'inline-block'; // Mostrar paginación
             nextButton.style.display = 'inline-block';
             pageInfoElement.style.display = 'inline-block';
            currentOffset = 0;
            currentPage = 1;
            loadAndDisplayPokemonList(currentOffset);
             resetDetailView();
        }
    });

     // Permitir buscar con Enter
     searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click(); // Simular clic en el botón de búsqueda
        }
     });

    // --- Carga Inicial ---
    loadAndDisplayPokemonList(currentOffset); // Cargar la primera página al inicio
});
