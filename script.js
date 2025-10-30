document.addEventListener('DOMContentLoaded', () => {
  // Fetch movie data
  fetch('movies.json')
    .then(response => response.json())
    .then(movies => {
      // Sort movies by releaseDate (newest first)
      movies.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

      const moviesGrid = document.getElementById('movies-grid');
      renderMovies(moviesGrid, movies);
    })
    .catch(error => console.error('Error loading movies:', error));
});

// Function to render all movie cards
function renderMovies(container, movies) {
  container.innerHTML = ''; // clear existing content

  movies.forEach(movie => {
    const cardHTML = `
      <div class="card-container">
        <div class="card">
          <div class="front" style="background-image: url('${movie.frontImage}')">
            <div class="title-overlay">${movie.title}</div>
          </div>
          <div class="back">
            <img src="${movie.backImage}" alt="${movie.title} background" class="back-image">
            <div class="back-content">
              <p><strong>Release Date:</strong> ${movie.releaseDate}</p>
              <p>${movie.description}</p>
            </div>
            <a href="${movie.watchLink}" target="_blank" class="watch-btn">▶ Watch Now</a>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', cardHTML);
  });

  // Flip functionality (click & touch)
  document.querySelectorAll('.card').forEach(card => {
    let touched = false;

    const flipCard = (e) => {
      if (e.type === 'touchend') {
        touched = true;
        setTimeout(() => (touched = false), 100);
        card.classList.toggle('flipped');
      } else if (e.type === 'click' && !touched) {
        card.classList.toggle('flipped');
      }
    };

    card.addEventListener('click', flipCard);
    card.addEventListener('touchend', flipCard);
  });
}
