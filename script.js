
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const navbar = document.getElementById('navbar');
  const categoryItems = document.querySelectorAll('.category-item');
  const detailModal = document.getElementById('detail-modal');
  const modalClose = document.getElementById('modal-close');
  const modalWatchBtn = document.getElementById('modal-watch-btn');
  const similarMoviesContainer = document.getElementById('similar-movies');
  const backToTopBtn = document.getElementById('back-to-top');
  const heroContainer = document.getElementById('hero-container');
  const heroElement = document.querySelector('.hero');
  const heroIndicators = document.getElementById('hero-indicators');
  const categoryNav = document.getElementById('category-nav');

  // Header search elements
  const headerSearchInput = document.getElementById('header-search-input');
  const headerSearchBtn = document.getElementById('header-search-btn');
  const headerVoiceSearch = document.getElementById('header-voice-search');
  const searchResults = document.getElementById('search-results');

  // Modal detail elements
  const modalDirector = document.getElementById('modal-director');
  const modalCast = document.getElementById('modal-cast');
  const modalGenre = document.getElementById('modal-genre');
  const modalLanguage = document.getElementById('modal-language');
  const modalAwards = document.getElementById('modal-awards');

  // View All Modal Elements
  const viewAllModal = document.getElementById('view-all-modal');
  const viewAllClose = document.getElementById('view-all-close');
  const viewAllTitle = document.getElementById('view-all-title');
  const viewAllGrid = document.getElementById('view-all-grid');

  // Data and state
  let movies = [];
  let filteredMovies = [];
  let currentMovie = null;
  let heroCarouselInterval;
  let currentHeroSlide = 0;
  let featuredMovies = [];

  // Show back to top button when scrolling
  function toggleBackToTop() {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }

  // Scroll to top function
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Search state
  let searchHistory = JSON.parse(localStorage.getItem('cineStreamSearchHistory')) || [];
  let searchTimeout = null;
  let isListening = false;
  let recognition = null;

  // Initialize search functionality
  function initSearch() {
    // Handle search input
    headerSearchInput.addEventListener('input', handleSearchInput);

    // Handle search button click
    headerSearchBtn.addEventListener('click', () => {
      performSearch(headerSearchInput.value.trim());
    });

    // Handle Enter key in search input
    headerSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch(headerSearchInput.value.trim());
      }
    });

    // Handle keyboard events
    document.addEventListener('keydown', handleKeyboard);

    // Initialize voice search if available
    initVoiceSearch();

    // Close search when clicking outside
    document.addEventListener('click', closeSearchOnClickOutside);

    // Show search history when input is focused
    headerSearchInput.addEventListener('focus', showSearchHistory);
  }

  // Close search
  function closeSearch() {
    searchResults.classList.remove('active');
    headerSearchInput.value = '';
    isListening = false;
    if (recognition) {
      recognition.stop();
    }
  }

  // Close search when clicking outside
  function closeSearchOnClickOutside(e) {
    if (!e.target.closest('.header-search-bar') && !e.target.closest('.search-results')) {
      searchResults.classList.remove('active');
    }
  }

  // Handle search input with debouncing
  function handleSearchInput() {
    const query = headerSearchInput.value.trim();

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length === 0) {
      showSearchHistory();
      return;
    }

    // Set new timeout for search
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);
  }

  // Perform search
  function performSearch(query) {
    if (query.length < 1) return;

    // Add to search history
    addToSearchHistory(query);

    // Filter movies based on query
    const results = {
      titles: [],
      people: [],
      genres: []
    };

    // Search in titles, cast, directors, and genres
    movies.forEach(movie => {
      // Check title
      if (fuzzyMatch(movie.title, query)) {
        results.titles.push({ ...movie, matchType: 'title', matchScore: calculateMatchScore(movie.title, query) });
      }

      // Check cast
      if (movie.cast) {
        movie.cast.forEach(person => {
          if (fuzzyMatch(person, query)) {
            // Check if person already exists
            const existingPerson = results.people.find(p => p.name === person);
            if (!existingPerson) {
              results.people.push({
                name: person,
                role: 'Actor',
                matchScore: calculateMatchScore(person, query)
              });
            }
          }
        });
      }

      // Check director
      if (movie.director && fuzzyMatch(movie.director, query)) {
        const existingPerson = results.people.find(p => p.name === movie.director);
        if (!existingPerson) {
          results.people.push({
            name: movie.director,
            role: 'Director',
            matchScore: calculateMatchScore(movie.director, query)
          });
        }
      }

      // Check genre/category
      if (fuzzyMatch(movie.category, query)) {
        results.genres.push({
          name: movie.category.charAt(0).toUpperCase() + movie.category.slice(1),
          matchScore: calculateMatchScore(movie.category, query)
        });
      }
    });

    // Sort results by match score (personalized ranking would go here)
    results.titles.sort((a, b) => b.matchScore - a.matchScore);
    results.people.sort((a, b) => b.matchScore - a.matchScore);
    results.genres.sort((a, b) => b.matchScore - a.matchScore);

    // Display results
    displaySearchResults(query, results);
  }

  // Fuzzy match function
  function fuzzyMatch(text, query) {
    if (!text || !query) return false;

    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    // Exact match
    if (textLower.includes(queryLower)) return true;

    // Split query into words and check if all words appear in text
    const queryWords = queryLower.split(' ');
    return queryWords.every(word => textLower.includes(word));
  }

  // Calculate match score (simplified version)
  function calculateMatchScore(text, query) {
    if (!text || !query) return 0;

    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    // Exact match gets highest score
    if (textLower === queryLower) return 100;

    // Starts with query
    if (textLower.startsWith(queryLower)) return 90;

    // Contains query
    if (textLower.includes(queryLower)) return 80;

    // Check for word matches
    const textWords = textLower.split(/\s+/);
    const queryWords = queryLower.split(/\s+/);

    let matchCount = 0;
    queryWords.forEach(qWord => {
      if (textWords.some(tWord => tWord.includes(qWord))) {
        matchCount++;
      }
    });

    return (matchCount / queryWords.length) * 70;
  }

  // Display search results
  function displaySearchResults(query, results) {
    // Clear previous results
    searchResults.innerHTML = '';

    // Check if we have any results
    const hasResults = results.titles.length > 0 || results.people.length > 0 || results.genres.length > 0;

    if (!hasResults) {
      displayNoResults(query);
      return;
    }

    // Create results header
    const resultsHeader = document.createElement('div');
    resultsHeader.className = 'search-results-header';
    resultsHeader.innerHTML = `
  <div class="search-results-title">Search Results for "${query}"</div>
  <div class="search-clear" id="search-clear">Clear</div>
  `;
    searchResults.appendChild(resultsHeader);

    // Add clear event
    document.getElementById('search-clear').addEventListener('click', () => {
      headerSearchInput.value = '';
      showSearchHistory();
    });

    // Display titles
    if (results.titles.length > 0) {
      const titlesCategory = document.createElement('div');
      titlesCategory.className = 'search-category';
      titlesCategory.innerHTML = `
  <div class="search-category-title"><i class="fas fa-film"></i> Movies & TV Shows</div>
  <div class="search-items" id="search-titles"></div>
  `;
      searchResults.appendChild(titlesCategory);

      const titlesContainer = document.getElementById('search-titles');
      results.titles.slice(0, 5).forEach(movie => {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.innerHTML = `
  <img src="${movie.frontImage}" class="search-item-poster" alt="${movie.title}">
    <div class="search-item-info">
      <div class="search-item-title">${movie.title}</div>
      <div class="search-item-meta">
        <span>${movie.year}</span>
        <span class="search-item-rating"><i class="fas fa-star"></i> ${movie.rating}</span>
        <span>${movie.category.charAt(0).toUpperCase() + movie.category.slice(1)}</span>
      </div>
    </div>
    `;
        item.addEventListener('click', () => {
          showModal(movie);
          closeSearch();
        });
        titlesContainer.appendChild(item);
      });
    }

    // Display people
    if (results.people.length > 0) {
      const peopleCategory = document.createElement('div');
      peopleCategory.className = 'search-category';
      peopleCategory.innerHTML = `
    <div class="search-category-title"><i class="fas fa-users"></i> People</div>
    <div class="search-items" id="search-people"></div>
    `;
      searchResults.appendChild(peopleCategory);

      const peopleContainer = document.getElementById('search-people');
      results.people.slice(0, 5).forEach(person => {
        const item = document.createElement('div');
        item.className = 'search-item-person';
        item.innerHTML = `
    <div class="person-avatar">${person.name.charAt(0)}</div>
    <div class="person-info">
      <div class="person-name">${person.name}</div>
      <div class="person-role">${person.role}</div>
    </div>
    `;
        peopleContainer.appendChild(item);
      });
    }

    // Display genres
    if (results.genres.length > 0) {
      const genresCategory = document.createElement('div');
      genresCategory.className = 'search-category';
      genresCategory.innerHTML = `
    <div class="search-category-title"><i class="fas fa-tags"></i> Genres</div>
    <div class="search-items" id="search-genres"></div>
    `;
      searchResults.appendChild(genresCategory);

      const genresContainer = document.getElementById('search-genres');
      results.genres.slice(0, 5).forEach(genre => {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.innerHTML = `
    <div class="search-item-info">
      <div class="search-item-title">${genre.name}</div>
      <div class="search-item-meta">Browse all ${genre.name} titles</div>
    </div>
    `;
        genresContainer.appendChild(item);
      });
    }

    // Show results
    searchResults.classList.add('active');
  }

  // Display no results message
  function displayNoResults(query) {
    searchResults.innerHTML = '';

    const noResults = document.createElement('div');
    noResults.className = 'search-no-results';
    noResults.innerHTML = `
    <i class="fas fa-search"></i>
    <h3>No results found for "${query}"</h3>
    <p>Try searching for something else</p>
    <div class="search-suggestions">
      <div class="search-suggestion">Action</div>
      <div class="search-suggestion">Comedy</div>
      <div class="search-suggestion">Drama</div>
      <div class="search-suggestion">Thriller</div>
    </div>
    `;

    // Add click events to suggestions
    const suggestions = noResults.querySelectorAll('.search-suggestion');
    suggestions.forEach(suggestion => {
      suggestion.addEventListener('click', () => {
        headerSearchInput.value = suggestion.textContent;
        performSearch(suggestion.textContent);
      });
    });

    searchResults.appendChild(noResults);
    searchResults.classList.add('active');
  }

  // Show search history
  function showSearchHistory() {
    searchResults.innerHTML = '';

    if (searchHistory.length === 0) {
      const noHistory = document.createElement('div');
      noHistory.className = 'search-no-results';
      noHistory.innerHTML = `
    <i class="fas fa-clock"></i>
    <h3>No search history</h3>
    <p>Your recent searches will appear here</p>
    `;
      searchResults.appendChild(noHistory);
    } else {
      const historyHeader = document.createElement('div');
      historyHeader.className = 'search-results-header';
      historyHeader.innerHTML = `
    <div class="search-results-title">Recent Searches</div>
    <div class="search-clear" id="clear-all-history">Clear All</div>
    `;
      searchResults.appendChild(historyHeader);

      // Add clear all event
      document.getElementById('clear-all-history').addEventListener('click', () => {
        searchHistory = [];
        localStorage.setItem('cineStreamSearchHistory', JSON.stringify(searchHistory));
        showSearchHistory();
      });

      const historyContainer = document.createElement('div');
      historyContainer.className = 'search-category';

      searchHistory.slice(0, 5).forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'search-history-item';
        historyItem.innerHTML = `
    <div class="search-history-text">
      <i class="fas fa-clock"></i>
      <span>${item}</span>
    </div>
    <div class="search-history-delete" data-query="${item}">
      <i class="fas fa-times"></i>
    </div>
    `;

        // Add click event to search again
        historyItem.addEventListener('click', (e) => {
          if (!e.target.closest('.search-history-delete')) {
            headerSearchInput.value = item;
            performSearch(item);
          }
        });

        // Add delete event
        const deleteBtn = historyItem.querySelector('.search-history-delete');
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          removeFromSearchHistory(item);
          showSearchHistory();
        });

        historyContainer.appendChild(historyItem);
      });

      searchResults.appendChild(historyContainer);
    }

    searchResults.classList.add('active');
  }

  // Add to search history
  function addToSearchHistory(query) {
    // Remove if already exists
    searchHistory = searchHistory.filter(item => item !== query);

    // Add to beginning
    searchHistory.unshift(query);

    // Keep only last 10 items
    if (searchHistory.length > 10) {
      searchHistory.pop();
    }

    // Save to localStorage
    localStorage.setItem('cineStreamSearchHistory', JSON.stringify(searchHistory));
  }

  // Remove from search history
  function removeFromSearchHistory(query) {
    searchHistory = searchHistory.filter(item => item !== query);
    localStorage.setItem('cineStreamSearchHistory', JSON.stringify(searchHistory));
  }

  // Initialize voice search
  function initVoiceSearch() {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      headerVoiceSearch.addEventListener('click', toggleVoiceSearch);

      recognition.onstart = function () {
        isListening = true;
        headerVoiceSearch.classList.add('listening');
      };

      recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        headerSearchInput.value = transcript;
        performSearch(transcript);
        isListening = false;
        headerVoiceSearch.classList.remove('listening');
      };

      recognition.onerror = function (event) {
        console.error('Speech recognition error', event.error);
        isListening = false;
        headerVoiceSearch.classList.remove('listening');
      };

      recognition.onend = function () {
        isListening = false;
        headerVoiceSearch.classList.remove('listening');
      };
    } else {
      // Hide voice search if not supported
      headerVoiceSearch.style.display = 'none';
    }
  }

  // Toggle voice search
  function toggleVoiceSearch() {
    if (isListening) {
      recognition.stop();
      isListening = false;
      headerVoiceSearch.classList.remove('listening');
    } else {
      recognition.start();
    }
  }

  // Handle keyboard events
  function handleKeyboard(e) {
    // Ctrl+K or Cmd+K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      headerSearchInput.focus();
    }

    // Escape to close search
    if (e.key === 'Escape' && searchResults.classList.contains('active')) {
      searchResults.classList.remove('active');
    }

    // Escape to close view all modal
    if (e.key === 'Escape' && viewAllModal.classList.contains('visible')) {
      viewAllModal.classList.remove('visible');
      document.body.style.overflow = "auto";
    }
  }

  // Initialize search after DOM is loaded
  initSearch();

  // Hero Carousel Functions
  function initHeroCarousel() {
    // Get featured movies - show last IDs first
    featuredMovies = movies.filter(movie => movie.featured).slice(-5).reverse();

    if (featuredMovies.length === 0) {
      // If no featured movies, use the last 5 movies
      featuredMovies = movies.slice(-5).reverse();
    }

    // Clear existing hero content
    heroElement.innerHTML = '';
    heroIndicators.innerHTML = '';

    // Create slides and indicators
    featuredMovies.forEach((movie, index) => {
      // Create slide
      const slide = document.createElement('div');
      slide.className = `hero-slide ${index === 0 ? 'active' : ''}`;
      slide.innerHTML = `
    <img src="${movie.backImage}" class="hero-backdrop" alt="${movie.title}">
      <div class="hero-content">
        <div class="hero-badge"><i class="fas fa-star"></i> FEATURED</div>
        <h1 class="hero-title">${movie.title}</h1>
        <div class="hero-meta">
          <span><i class="fas fa-calendar-alt"></i> ${movie.year}</span>
          <span><i class="fas fa-certificate"></i> ${movie.certification}</span>
          <span><i class="fas fa-clock"></i> ${movie.duration}</span>
          <span><i class="fas fa-film"></i> ${movie.category}</span>
          <span><i class="fas fa-star"></i> ${movie.rating}/10</span>
        </div>
        <p class="hero-description">${movie.description}</p>
        <div class="hero-actions">
          <a href="${movie.watchLink}" target="_blank" class="btn btn-primary">
            <i class="fas fa-play"></i> Watch Now
          </a>
          <button class="btn btn-secondary hero-info-btn" data-movie-id="${movie.id}"><i class="fas fa-info-circle"></i> More Info</button>
        </div>
      </div>
      `;
      heroElement.appendChild(slide);

      // Create indicator
      const indicator = document.createElement('div');
      indicator.className = `hero-indicator ${index === 0 ? 'active' : ''}`;
      indicator.addEventListener('click', () => goToSlide(index));
      heroIndicators.appendChild(indicator);
    });

    // Start the carousel
    startHeroCarousel();

    // Add event listeners to hero buttons
    document.querySelectorAll('.hero-info-btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const movieId = this.getAttribute('data-movie-id');
        const movie = movies.find(m => m.id == movieId);
        if (movie) showModal(movie);
      });
    });
  }

  function startHeroCarousel() {
    // Clear any existing interval
    if (heroCarouselInterval) {
      clearInterval(heroCarouselInterval);
    }

    // Set up the carousel to change slides every 20 seconds
    heroCarouselInterval = setInterval(() => {
      nextSlide();
    }, 20000);
  }

  function nextSlide() {
    const slides = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.hero-indicator');

    // Remove active class from current slide
    slides[currentHeroSlide].classList.remove('active');
    indicators[currentHeroSlide].classList.remove('active');

    // Move to next slide
    currentHeroSlide = (currentHeroSlide + 1) % slides.length;

    // Add active class to new slide
    slides[currentHeroSlide].classList.add('active');
    indicators[currentHeroSlide].classList.add('active');
  }

  function goToSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.hero-indicator');

    // Remove active class from current slide
    slides[currentHeroSlide].classList.remove('active');
    indicators[currentHeroSlide].classList.remove('active');

    // Set new slide
    currentHeroSlide = index;

    // Add active class to new slide
    slides[currentHeroSlide].classList.add('active');
    indicators[currentHeroSlide].classList.add('active');

    // Reset the interval
    startHeroCarousel();
  }

  // Fetch movies from external JSON
  fetch("movies.json")
    .then(res => {
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    })
    .then(data => {
      // Check if data is an array or has a movies property
      if (Array.isArray(data)) {
        movies = data;
      } else if (data.movies && Array.isArray(data.movies)) {
        movies = data.movies;
      } else {
        throw new Error('Invalid data structure in movies.json');
      }

      // Sort movies by ID in descending order (last ID first)
      movies.sort((a, b) => b.id - a.id);
      filteredMovies = [...movies];
      renderMovies();
      initHeroCarousel();
      setupEvents();
    })
    .catch(err => {
      console.error("Error loading movies.json:", err);
      // Create sample data if movies.json is not available
      createSampleData();
      renderMovies();
      initHeroCarousel();
      setupEvents();
    });

  function createSampleData() {
    movies = [
      {
        id: 1,
        title: "The Matrix Resurrections",
        year: "2021",
        certification: "PG-13",
        duration: "2h 28m",
        category: "action",
        rating: 8.2,
        description: "Return to a world of two realities: one, everyday life; the other, what lies behind it. To find out if his reality is a construct, to truly know himself, Mr. Anderson will have to choose to follow the white rabbit once more.",
        frontImage: "https://images.unsplash.com/photo-1635805737707-575885ab0820?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        backImage: "https://images.unsplash.com/photo-1489599809505-f2d4c3f70800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80",
        watchLink: "#",
        featured: true,
        isNewRelease: true,
        isPopular: true,
        top10: true,
        director: "Lana Wachowski",
        cast: ["Keanu Reeves", "Carrie-Anne Moss", "Yahya Abdul-Mateen II"],
        language: "English",
        awards: ["Best Visual Effects"]
      },
      {
        id: 2,
        title: "Dune",
        year: "2021",
        certification: "PG-13",
        duration: "2h 35m",
        category: "action",
        rating: 8.1,
        description: "Feature adaptation of Frank Herbert's science fiction novel about the son of a noble family entrusted with the protection of the most valuable asset and most vital element in the galaxy.",
        frontImage: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        backImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80",
        watchLink: "#",
        featured: true,
        isNewRelease: true,
        isPopular: true,
        top10: true,
        director: "Denis Villeneuve",
        cast: ["Timothée Chalamet", "Rebecca Ferguson", "Oscar Isaac"],
        language: "English",
        awards: ["Best Cinematography", "Best Original Score"]
      },
      {
        id: 3,
        title: "Spider-Man: No Way Home",
        year: "2021",
        certification: "PG-13",
        duration: "2h 28m",
        category: "action",
        rating: 8.7,
        description: "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear, forcing Peter to discover what it truly means to be Spider-Man.",
        frontImage: "https://images.unsplash.com/photo-1635805737707-575885ab0820?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        backImage: "https://images.unsplash.com/photo-1489599809505-f2d4c3f70800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80",
        watchLink: "#",
        featured: true,
        isNewRelease: true,
        isPopular: true,
        top10: true,
        director: "Jon Watts",
        cast: ["Tom Holland", "Zendaya", "Benedict Cumberbatch"],
        language: "English",
        awards: ["Best Visual Effects"]
      },
      {
        id: 4,
        title: "The Power of the Dog",
        year: "2021",
        certification: "R",
        duration: "2h 6m",
        category: "drama",
        rating: 7.8,
        description: "Charismatic rancher Phil Burbank inspires fear and awe in those around him. When his brother brings home a new wife and her son, Phil torments them until he finds himself exposed to the possibility of love.",
        frontImage: "https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        backImage: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80",
        watchLink: "#",
        featured: false,
        isNewRelease: true,
        isPopular: true,
        top10: false,
        director: "Jane Campion",
        cast: ["Benedict Cumberbatch", "Kirsten Dunst", "Jesse Plemons"],
        language: "English",
        awards: ["Best Director", "Best Picture"]
      },
      {
        id: 5,
        title: "Don't Look Up",
        year: "2021",
        certification: "R",
        duration: "2h 18m",
        category: "comedy",
        rating: 7.2,
        description: "Two low-level astronomers must go on a giant media tour to warn mankind of an approaching comet that will destroy planet Earth.",
        frontImage: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        backImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80",
        watchLink: "#",
        featured: false,
        isNewRelease: true,
        isPopular: true,
        top10: true,
        director: "Adam McKay",
        cast: ["Leonardo DiCaprio", "Jennifer Lawrence", "Meryl Streep"],
        language: "English",
        awards: ["Best Original Screenplay"]
      }
    ];
    // Sort movies by ID in descending order (last ID first)
    movies.sort((a, b) => b.id - a.id);
    filteredMovies = [...movies];
  }

  function renderMovies() {
    // Show last IDs first in all sections
    renderSection('new-releases', filteredMovies.filter(m => m.isNewRelease).slice(0, 10));
    renderSection('popular-movies', filteredMovies.filter(m => m.isPopular).slice(0, 10));
    renderSection('top-movies', filteredMovies.filter(m => m.top10).slice(0, 10));
    renderSection('action-movies', filteredMovies.filter(m => m.category === 'action').slice(0, 10));
  }

  function renderSection(id, moviesList) {
    const section = document.getElementById(id);
    section.innerHTML = '';
    moviesList.forEach((movie, i) => {
      const card = document.createElement('div');
      card.className = "movie-card";
      card.innerHTML = `
      ${movie.top10 && i < 10 ? `<div class="top-badge">#${i + 1}</div>` : ""}
      <img src="${movie.frontImage}" class="movie-poster" alt="${movie.title}">
        <div class="movie-overlay">
          <h3 class="movie-title">${movie.title}</h3>
          <div class="movie-meta">
            <span>${movie.year}</span>
            <span><i class="fas fa-star"></i> ${movie.rating}</span>
          </div>
        </div>
        <div class="movie-actions">
          <button class="action-btn play-now" title="Play Now"><i class="fas fa-play"></i></button>
        </div>
        `;
      card.addEventListener('click', () => showModal(movie));

      // Add event listeners to action buttons
      const playBtn = card.querySelector('.play-now');

      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(movie.watchLink, "_blank");
      });

      section.appendChild(card);
    });
  }

  function setupEvents() {
    // Category filtering
    categoryItems.forEach(item => {
      item.addEventListener('click', () => {
        categoryItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const cat = item.dataset.category;
        if (cat === "all") filteredMovies = [...movies];
        else if (cat === "new") filteredMovies = [...movies].sort((a, b) => b.year - a.year);
        else if (cat === "popular") filteredMovies = [...movies].sort((a, b) => b.rating - a.rating);
        else if (cat === "top10") filteredMovies = movies.filter(m => m.top10);
        else filteredMovies = movies.filter(m => m.category === cat);
        renderMovies();
      });
    });

    // View All functionality
    document.querySelectorAll('.view-all').forEach(button => {
      button.addEventListener('click', function () {
        const sectionId = this.getAttribute('data-section');
        showViewAllModal(sectionId);
      });
    });

    // View All Modal close
    viewAllClose.addEventListener('click', () => {
      viewAllModal.classList.remove('visible');
      document.body.style.overflow = "auto";
    });

    // Scroll events
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
      toggleBackToTop();
    });

    // Modal events
    modalClose.addEventListener('click', () => {
      detailModal.classList.remove('modal-visible');
      document.body.style.overflow = "auto";
    });

    // Back to top button
    backToTopBtn.addEventListener('click', scrollToTop);
  }

  function showViewAllModal(sectionId) {
    // Set the modal title based on the section
    let sectionTitle = '';
    let moviesToShow = [];

    switch (sectionId) {
      case 'new-releases':
        sectionTitle = 'New Releases For You';
        moviesToShow = movies.filter(m => m.isNewRelease);
        break;
      case 'popular-movies':
        sectionTitle = 'Popular Movies';
        moviesToShow = movies.filter(m => m.isPopular);
        break;
      case 'top-movies':
        sectionTitle = 'Top 10 Movies This Week';
        moviesToShow = movies.filter(m => m.top10);
        break;
      case 'action-movies':
        sectionTitle = 'Action Movies';
        moviesToShow = movies.filter(m => m.category === 'action');
        break;
      default:
        sectionTitle = 'All Movies';
        moviesToShow = [...movies];
    }

    // Set the modal title
    viewAllTitle.textContent = sectionTitle;

    // Clear the grid
    viewAllGrid.innerHTML = '';

    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<i class="fas fa-spinner"></i>';
    viewAllGrid.appendChild(loadingIndicator);

    // Show the modal
    viewAllModal.classList.add('visible');
    document.body.style.overflow = "hidden";

    // Simulate loading delay for better UX
    setTimeout(() => {
      // Clear loading indicator
      viewAllGrid.innerHTML = '';

      // Populate the grid with movies
      moviesToShow.forEach((movie, i) => {
        const card = document.createElement('div');
        card.className = "view-all-movie-card";
        card.innerHTML = `
        ${movie.top10 && i < 10 ? `<div class="view-all-top-badge">#${i + 1}</div>` : ""}
        <img src="${movie.frontImage}" class="view-all-poster" alt="${movie.title}">
          <div class="view-all-overlay">
            <h3 class="view-all-movie-title">${movie.title}</h3>
            <div class="view-all-movie-meta">
              <span>${movie.year}</span>
              <span><i class="fas fa-star"></i> ${movie.rating}</span>
            </div>
          </div>
          <div class="view-all-actions">
            <button class="view-all-action-btn play-now" title="Play Now"><i class="fas fa-play"></i></button>
          </div>
          `;

        // Add click event to show movie details
        card.addEventListener('click', () => {
          showModal(movie);
        });

        // Add event listener to play button
        const playBtn = card.querySelector('.play-now');
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.open(movie.watchLink, "_blank");
        });

        viewAllGrid.appendChild(card);
      });

      // If no movies found, show message
      if (moviesToShow.length === 0) {
        viewAllGrid.innerHTML = `
                            <div class="search-no-results" style="grid-column: 1 / -1;">
                                <i class="fas fa-film"></i>
                                <h3>No movies found</h3>
                                <p>Try browsing other categories</p>
                            </div>
                        `;
      }
    }, 500); // Small delay for better UX
  }

  function showModal(movie) {
    currentMovie = movie;
    detailModal.querySelector('.modal-backdrop').src = movie.backImage;
    detailModal.querySelector('.modal-poster').src = movie.frontImage;
    detailModal.querySelector('.modal-title').textContent = movie.title;
    detailModal.querySelector('.modal-year').textContent = movie.year;
    detailModal.querySelector('.modal-certification').textContent = movie.certification;
    detailModal.querySelector('.modal-duration').textContent = movie.duration;
    detailModal.querySelector('.modal-rating').innerHTML = `<i class="fas fa-star"></i> ${movie.rating}/10`;
    detailModal.querySelector('.modal-description').textContent = movie.description;
    modalWatchBtn.onclick = () => window.open(movie.watchLink, "_blank");

    // Set additional details
    modalDirector.textContent = movie.director || 'N/A';
    modalCast.textContent = movie.cast ? movie.cast.join(', ') : 'N/A';
    modalGenre.textContent = movie.category ? movie.category.charAt(0).toUpperCase() + movie.category.slice(1) : 'N/A';
    modalLanguage.textContent = movie.language || 'N/A';
    modalAwards.textContent = movie.awards ? movie.awards.join(', ') : 'N/A';

    similarMoviesContainer.innerHTML = "";
    movies.filter(m => m.category === movie.category && m.title !== movie.title)
      .slice(0, 6).forEach(sim => {
        const el = document.createElement('div');
        el.className = "similar-movie";
        el.innerHTML = `<img src="${sim.frontImage}" class="similar-poster"><div class="similar-title">${sim.title}</div>`;
        el.addEventListener('click', () => showModal(sim));
        similarMoviesContainer.appendChild(el);
      });

    detailModal.classList.add("modal-visible");
    document.body.style.overflow = "hidden";
  }
});
