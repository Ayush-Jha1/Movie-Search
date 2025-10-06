// DOM Elements
const searchInput = document.getElementById('movie-search');
const searchButton = document.getElementById('search-btn');
const moviesContainer = document.getElementById('movies-container');
const initialMessage = document.getElementById('initial-message');
const noResults = document.getElementById('no-results');
const errorMessage = document.getElementById('error-message');
const movieModal = document.getElementById('movie-modal');
const modalContentContainer = document.getElementById('modal-content-container');
const closeModalBtn = document.querySelector('.close-modal');

// API Key for OMDb API (Free to use, limited to 1,000 requests per day)
// In a production environment, this should be secured and not exposed in client-side code
const API_KEY = 'trilogy'; // This is a public API key that has been shared for testing
const API_URL = 'https://www.omdbapi.com/';

// Event Listeners
searchButton.addEventListener('click', searchMovies);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchMovies();
    }
});

// Modal event listeners
closeModalBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === movieModal) {
        closeModal();
    }
});

// Functions
async function searchMovies() {
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm === '') {
        showInitialState();
        return;
    }
    
    try {
        showLoadingState();
        
        const response = await fetch(`${API_URL}?apikey=${API_KEY}&s=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        
        console.log('API Response:', data); // Add logging to debug
        
        if (data.Response === 'True' && data.Search) {
            displayMovies(data.Search);
        } else {
            showNoResults();
            console.error('API returned no results:', data);
        }
    } catch (error) {
        console.error('Error fetching movies:', error);
        showErrorMessage();
    }
}

function displayMovies(movies) {
    // Clear any previous results
    clearAllStates();
    moviesContainer.innerHTML = '';
    
    // Create a movie card for each result
    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        
        // Check if movie has a poster
        const posterContent = movie.Poster && movie.Poster !== 'N/A' 
            ? `<img class="movie-poster" src="${movie.Poster}" alt="${movie.Title} poster">` 
            : `<div class="no-poster">No poster available</div>`;
        
        movieCard.innerHTML = `
            ${posterContent}
            <div class="movie-info">
                <h3 class="movie-title">${movie.Title}</h3>
                <p class="movie-year">${movie.Year}</p>
            </div>
        `;
        
        // Add click event to get more details (could expand this feature)
        movieCard.addEventListener('click', () => {
            getMovieDetails(movie.imdbID);
        });
        
        moviesContainer.appendChild(movieCard);
    });
}

async function getMovieDetails(imdbID) {
    try {
        // Show a loading state in the modal
        showModal();
        modalContentContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-pulse fa-4x" style="color: #01b4e4;"></i>
                <p style="margin-top: 20px;">Loading movie details...</p>
            </div>
        `;
        
        const response = await fetch(`${API_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
        const movieDetails = await response.json();
        
        if (movieDetails.Response === 'True') {
            displayMovieDetails(movieDetails);
            console.log('Movie details:', movieDetails);
        } else {
            modalContentContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-circle fa-4x" style="color: #e74c3c;"></i>
                    <p style="margin-top: 20px;">Could not load movie details.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching movie details:', error);
        modalContentContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-circle fa-4x" style="color: #e74c3c;"></i>
                <p style="margin-top: 20px;">Error loading movie details. Please try again later.</p>
            </div>
        `;
    }
}

function displayMovieDetails(movie) {
    // Format ratings if available
    let ratingsHTML = '';
    if (movie.Ratings && movie.Ratings.length > 0) {
        ratingsHTML = `
            <div class="movie-ratings">
                <h4>Ratings:</h4>
                <ul>
                    ${movie.Ratings.map(rating => `
                        <li><strong>${rating.Source}:</strong> ${rating.Value}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    // Check if poster exists
    const posterContent = movie.Poster && movie.Poster !== 'N/A' 
        ? `<img src="${movie.Poster}" alt="${movie.Title} poster">` 
        : `<div class="no-poster" style="height: 300px; display: flex; align-items: center; justify-content: center; background-color: #ddd;">
            <span>No poster available</span>
          </div>`;
    
    // Create HTML for the modal content
    const modalHTML = `
        <div class="movie-detail">
            <div class="movie-detail-poster">
                ${posterContent}
            </div>
            <div class="movie-detail-info">
                <h2 class="movie-detail-title">${movie.Title}</h2>
                
                <div class="movie-meta">
                    ${movie.Year ? `<span><i class="far fa-calendar-alt"></i> ${movie.Year}</span>` : ''}
                    ${movie.Runtime ? `<span><i class="far fa-clock"></i> ${movie.Runtime}</span>` : ''}
                    ${movie.Rated ? `<span><i class="fas fa-film"></i> ${movie.Rated}</span>` : ''}
                    ${movie.Genre ? `<span><i class="fas fa-tag"></i> ${movie.Genre}</span>` : ''}
                </div>
                
                ${movie.imdbRating ? `
                    <div>
                        <span class="movie-rating"><i class="fas fa-star"></i> ${movie.imdbRating}/10</span>
                        ${movie.imdbVotes ? `<span>${movie.imdbVotes} votes</span>` : ''}
                    </div>
                ` : ''}
                
                <div class="movie-plot">
                    <h4>Plot:</h4>
                    <p>${movie.Plot || 'No plot description available.'}</p>
                </div>
                
                ${ratingsHTML}
                
                <div class="movie-additional-info">
                    ${movie.Director && movie.Director !== 'N/A' ? `
                        <div class="info-item">
                            <span class="info-label">Director:</span>
                            <p>${movie.Director}</p>
                        </div>
                    ` : ''}
                    
                    ${movie.Writer && movie.Writer !== 'N/A' ? `
                        <div class="info-item">
                            <span class="info-label">Writer:</span>
                            <p>${movie.Writer}</p>
                        </div>
                    ` : ''}
                    
                    ${movie.Actors && movie.Actors !== 'N/A' ? `
                        <div class="info-item">
                            <span class="info-label">Actors:</span>
                            <p>${movie.Actors}</p>
                        </div>
                    ` : ''}
                    
                    ${movie.Language && movie.Language !== 'N/A' ? `
                        <div class="info-item">
                            <span class="info-label">Language:</span>
                            <p>${movie.Language}</p>
                        </div>
                    ` : ''}
                    
                    ${movie.Country && movie.Country !== 'N/A' ? `
                        <div class="info-item">
                            <span class="info-label">Country:</span>
                            <p>${movie.Country}</p>
                        </div>
                    ` : ''}
                    
                    ${movie.Awards && movie.Awards !== 'N/A' ? `
                        <div class="info-item">
                            <span class="info-label">Awards:</span>
                            <p>${movie.Awards}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Insert the HTML into the modal
    modalContentContainer.innerHTML = modalHTML;
}

// UI State Management Functions
function showLoadingState() {
    clearAllStates();
    
    // Create and show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading';
    loadingIndicator.innerHTML = `
        <i class="fas fa-spinner fa-pulse fa-4x"></i>
        <p>Searching for movies...</p>
    `;
    loadingIndicator.style.textAlign = 'center';
    loadingIndicator.style.padding = '40px 20px';
    loadingIndicator.style.color = '#666';
    
    moviesContainer.innerHTML = '';
    moviesContainer.appendChild(loadingIndicator);
}

function showModal() {
    movieModal.classList.remove('hidden');
    movieModal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
}

function closeModal() {
    movieModal.classList.remove('show');
    movieModal.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
}

function showInitialState() {
    clearAllStates();
    initialMessage.classList.remove('hidden');
}

function showNoResults() {
    clearAllStates();
    noResults.classList.remove('hidden');
}

function showErrorMessage() {
    clearAllStates();
    errorMessage.classList.remove('hidden');
}

function clearAllStates() {
    initialMessage.classList.add('hidden');
    noResults.classList.add('hidden');
    errorMessage.classList.add('hidden');
    
    // Remove loading indicator if it exists
    const loadingIndicator = document.getElementById('loading');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Initialize app in initial state
showInitialState();