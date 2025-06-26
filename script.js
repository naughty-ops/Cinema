document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.querySelector('.clear-search');
  const themeToggle = document.getElementById('theme-toggle');
  const moviesGrid = document.getElementById('movies-grid');
  const movieModal = document.getElementById('movie-modal');
  const closeModal = document.querySelector('.close-modal');
  const modalTitle = document.querySelector('.modal-title');
  const modalDescription = document.querySelector('.modal-description');
  const modalPoster = document.querySelector('.modal-poster');
  const modalWatchBtn = document.querySelector('.modal-info .watch-btn');

  // State
  let allMovies = [];
  let searchTimeout;

  // Initialize theme
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.add(`${currentTheme}-theme`);
  updateThemeIcon(currentTheme);

  // Fetch movies
  fetch('movies.json')
    .then(response => response.json())
    .then(movies => {
      allMovies = movies.reverse();
      renderMovies(allMovies);
    })
    .catch(error => console.error('Error loading movies:', error));

  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
    clearSearchBtn.addEventListener('click', clearSearch);
  }

  themeToggle.addEventListener('click', toggleTheme);
  closeModal.addEventListener('click', () => toggleModal(false));
  movieModal.addEventListener('click', (e) => {
    if (e.target === movieModal) toggleModal(false);
  });

  // Functions
  function renderMovies(movies) {
    moviesGrid.innerHTML = '';
    
    if (movies.length === 0) {
      moviesGrid.innerHTML = '<div class="no-results">No movies found. Try a different search.</div>';
      return;
    }

    movies.forEach(movie => {
      const card = createMovieCard(movie);
      moviesGrid.appendChild(card);
    });
  }

  function createMovieCard(movie) {
    const epKeyPrefix = movie.title.replace(/\s+/g, '-').toLowerCase();
    const cardContainer = document.createElement('div');
    cardContainer.className = 'card-container';

    let backContentHTML = '';
    
    if (movie.isSeries && Array.isArray(movie.episodes)) {
      backContentHTML = createSeriesBackContent(movie, epKeyPrefix);
    } else {
      backContentHTML = `
        <img src="${movie.backImage}" alt="${movie.title}" class="back-image">
        <div class="back-content">
          <p>${movie.description}</p>
          <a href="${movie.watchLink}" target="_blank" class="watch-btn pulse">▶ Watch Now</a>
          <button class="details-btn" data-movie-id="${movie.title.toLowerCase().replace(/\s+/g, '-')}">
            <i class="fas fa-info-circle"></i> Details
          </button>
        </div>
      `;
    }

    cardContainer.innerHTML = `
      <div class="card">
        <div class="front" style="background-image: url('${movie.frontImage}')">
          <div class="title-overlay">${movie.title}</div>
        </div>
        <div class="back">
          ${backContentHTML}
        </div>
      </div>
    `;

    const card = cardContainer.querySelector('.card');
    setupCardInteractions(card, movie);
    
    return cardContainer;
  }

  function createSeriesBackContent(movie, epKeyPrefix) {
    let html = '<div class="back-content"><p>' + movie.description + '</p>';
    html += '<h4>Episodes</h4><ul class="episode-list">';
    
    movie.episodes.forEach((ep, i) => {
      const epKey = `${epKeyPrefix}-ep${i}`;
      const watched = localStorage.getItem(epKey) === 'true';
      html += `
        <li>
          <button onclick="window.open('${ep.watchLink}', '_blank')">${ep.title}</button>
          <input type="checkbox" id="${epKey}" ${watched ? 'checked' : ''} onchange="toggleWatched('${epKey}')">
          <label for="${epKey}">${watched ? '✅ Watched' : 'Mark as Watched'}</label>
        </li>`;
    });
    
    html += '</ul></div>';
    return html;
  }

  function setupCardInteractions(card, movie) {
    let touched = false;
    
    const flipCard = (e) => {
      if (e.type === "touchend") {
        touched = true;
        setTimeout(() => touched = false, 100);
        card.classList.toggle('flipped');
      } else if (e.type === "click" && !touched) {
        card.classList.toggle('flipped');
      }
    };
    
    card.addEventListener('click', flipCard);
    card.addEventListener('touchend', flipCard);

    // Add click event for details button if it exists
    const detailsBtn = card.querySelector('.details-btn');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showMovieDetails(movie);
      });
    }
  }

  function handleSearch() {
    const term = searchInput.value.trim().toLowerCase();
    clearSearchBtn.classList.toggle('visible', term.length > 0);
    
    // Debounce search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const filtered = allMovies.filter(movie =>
        movie.title.toLowerCase().includes(term) ||
        movie.description.toLowerCase().includes(term)
      );
      renderMovies(filtered);
    }, 300);
  }

  function clearSearch() {
    searchInput.value = '';
    clearSearchBtn.classList.remove('visible');
    renderMovies(allMovies);
    searchInput.focus();
  }

  function toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    const newTheme = isDark ? 'light' : 'dark';
    
    document.body.classList.remove(`${isDark ? 'dark' : 'light'}-theme`);
    document.body.classList.add(`${newTheme}-theme`);
    
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  }

  function showMovieDetails(movie) {
    modalTitle.textContent = movie.title;
    modalDescription.textContent = movie.description;
    modalPoster.style.backgroundImage = `url('${movie.frontImage}')`;
    modalWatchBtn.href = movie.watchLink;
    
    toggleModal(true);
  }

  function toggleModal(show) {
    if (show) {
      movieModal.classList.add('show');
      document.body.style.overflow = 'hidden';
    } else {
      movieModal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }
});

// Episode tracker helper
window.toggleWatched = function(epKey) {
  const checkbox = document.getElementById(epKey);
  localStorage.setItem(epKey, checkbox.checked ? 'true' : 'false');
  
  // Update label text
  const label = checkbox.nextElementSibling;
  if (label) {
    label.textContent = checkbox.checked ? '✅ Watched' : 'Mark as Watched';
  }
};
