document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');

  fetch('movies.json')
    .then(response => response.json())
    .then(movies => {
      const moviesGrid = document.getElementById('movies-grid');
      let allMovies = movies.reverse();

      const renderMovies = (filteredMovies) => {
        moviesGrid.innerHTML = '';

        filteredMovies.forEach(movie => {
          const epKeyPrefix = movie.title.replace(/\s+/g, '-').toLowerCase();

          let backContentHTML = '';

          if (movie.isSeries && Array.isArray(movie.episodes)) {
            backContentHTML += '<div class="back-content"><p>' + movie.description + '</p>';
            backContentHTML += '<h4>Episodes</h4><ul class="episode-list">';
            movie.episodes.forEach((ep, i) => {
              const epKey = `${epKeyPrefix}-ep${i}`;
              const watched = localStorage.getItem(epKey) === 'true';
              backContentHTML += `
                <li>
                  <button onclick="window.open('${ep.watchLink}', '_blank')">${ep.title}</button>
                  <input type="checkbox" id="${epKey}" ${watched ? 'checked' : ''} onchange="toggleWatched('${epKey}')">
                  <label for="${epKey}">${watched ? '✅ Watched' : 'Mark as Watched'}</label>
                </li>`;
            });
            backContentHTML += '</ul></div>';
          } else {
            backContentHTML = `
              <img src="${movie.backImage}" alt="${movie.title}" class="back-image">
              <div class="back-content">
                <p>${movie.description}</p>
                <a href="${movie.watchLink}" target="_blank" class="watch-btn pulse">▶ Watch Now</a>
              </div>`;
          }

          const cardHTML = `
            <div class="card-container">
              <div class="card">
                <div class="front" style="background-image: url('${movie.frontImage}')">
                  <div class="title-overlay">${movie.title}</div>
                </div>
                <div class="back">
                  ${backContentHTML}
                </div>
              </div>
            </div>
          `;
          moviesGrid.insertAdjacentHTML('beforeend', cardHTML);
        });

        document.querySelectorAll('.card').forEach(card => {
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
        });
      };

      renderMovies(allMovies);

      if (searchInput) {
        searchInput.addEventListener('input', () => {
          const term = searchInput.value.toLowerCase();
          const filtered = allMovies.filter(movie =>
            movie.title.toLowerCase().includes(term) ||
            movie.description.toLowerCase().includes(term)
          );
          renderMovies(filtered);
        });
      }
    })
    .catch(error => console.error('Error loading movies:', error));
});

// Episode tracker helper
window.toggleWatched = function (epKey) {
  const checkbox = document.getElementById(epKey);
  localStorage.setItem(epKey, checkbox.checked ? 'true' : 'false');
};
