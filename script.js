document.addEventListener('DOMContentLoaded', () => {
  // Fetch movie data
  fetch('movies.json')
    .then(response => response.json())
    .then(movies => {
      const moviesGrid = document.getElementById('movies-grid');
      
      movies.reverse ().forEach(movie => {
        const cardHTML = `
          <div class="card-container">
            <div class="card">
              <div class="front" style="background-image: url('${movie.frontImage}')">
                <div class="title-overlay">${movie.title}</div>
              </div>
              <div class="back">
                <img src="${movie.backImage}" alt="${movie.title} background" class="back-image">
                <div class="back-content">${movie.description}</div>
                <a href="${movie.watchLink}" target="_blank" class="watch-btn">▶ Watch Now</a>
              </div>
            </div>
          </div>
        `;
        moviesGrid.insertAdjacentHTML('beforeend', cardHTML);
      });

      // Add event listeners to all cards
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
    })
    .catch(error => console.error('Error loading movies:', error));
});
