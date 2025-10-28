    // ===== CONFIGURATION =====
    const CONFIG = {
        // Data source URL
        dataSourceUrl: 'https://hci.icat.vt.edu/content/dam/hci_icat_vt_edu/carousel.js',

        // Timing settings (in milliseconds)
        autoAdvanceDelay: 5000,  // Time between auto-advance (5 seconds)

        // Touch/Swipe settings
        swipeThreshold: 50,  // Minimum pixels to trigger swipe

        // Accessibility
        dotAriaLabel: 'Go to slide'  // Screen reader label for dots
    };
    // ===== END CONFIGURATION =====

    // DOM Elements
    const carouselContainer = document.getElementById('carouselContainer');
    const track = document.getElementById('carouselTrack');
    const dotsContainer = document.getElementById('carouselDots');
    const background = document.getElementById('carouselBg');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const pauseIcon = document.getElementById('pauseIcon');
    const playIcon = document.getElementById('playIcon');

    // State
    let currentIndex = 0;
    let totalSlides = 0;
    let slides = [];
    let dots = [];
    let autoAdvanceInterval = null;
    let isPlaying = true;

    // Build carousel from data
    function buildCarousel() {
        // Clear existing content
        track.innerHTML = '';
        dotsContainer.innerHTML = '';

        // Preload first image before building carousel
        const firstImage = new Image();
        firstImage.onload = function () {
            // First image loaded, now build the carousel
            createSlides();
            // Update background with loaded image
            updateBackground();
            // Remove loading state
            carouselContainer.classList.remove('loading');
            carouselContainer.classList.add('loaded');
        };
        firstImage.onerror = function () {
            // Even if image fails, show the carousel
            createSlides();
            updateBackground();
            carouselContainer.classList.remove('loading');
            carouselContainer.classList.add('loaded');
        };
        firstImage.src = CAROUSEL_DATA.slides[0].image;
    }

    // Create slides and dots
    function createSlides() {
        // Create slides from CAROUSEL_DATA
        CAROUSEL_DATA.slides.forEach((slideData, index) => {
            // Create slide
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';

            // Use alt text from data, fallback to title if not provided
            const altText = slideData.alt || slideData.title;

            slide.innerHTML = `
                    <div class="slide-content">
                        <h1 style="text-align: center; color:#fff;">${slideData.title}</h1>
                        <h3 class="slide-description">${slideData.description || ''}</h3>
                        <div class="slide-date">${slideData.date} <a href="${slideData.url}">Read more</a></div>
                    </div>
                    <a href="${slideData.url}">
                        <img src="${slideData.image}" alt="${altText}" class="slide-image">
                    </a>
                `;

            track.appendChild(slide);

            // Create dot
            const dot = document.createElement('button');
            dot.classList.add('dot');
            dot.setAttribute('aria-label', `${CONFIG.dotAriaLabel} ${index + 1}`);
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });

        // Update references
        slides = document.querySelectorAll('.carousel-slide');
        dots = document.querySelectorAll('.dot');
        totalSlides = slides.length;
    }

    // Update background image
    function updateBackground() {
        if (CAROUSEL_DATA.slides[currentIndex]) {
            background.style.backgroundImage = `url(${CAROUSEL_DATA.slides[currentIndex].image})`;
        }
    }

    // Update carousel position and dots
    function updateCarousel() {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateBackground();
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    // Navigate to specific slide
    function goToSlide(index) {
        currentIndex = index;
        updateCarousel();
    }

    // Navigate to next slide
    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalSlides;
        updateCarousel();
    }

    // Navigate to previous slide
    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        updateCarousel();
    }

    // Start auto-advance
    function startAutoAdvance() {
        if (autoAdvanceInterval) return;
        autoAdvanceInterval = setInterval(nextSlide, CONFIG.autoAdvanceDelay);
        isPlaying = true;
        updatePlayPauseButton();
    }

    // Stop auto-advance
    function stopAutoAdvance() {
        if (autoAdvanceInterval) {
            clearInterval(autoAdvanceInterval);
            autoAdvanceInterval = null;
        }
        isPlaying = false;
        updatePlayPauseButton();
    }

    // Toggle play/pause
    function togglePlayPause() {
        if (isPlaying) {
            stopAutoAdvance();
        } else {
            startAutoAdvance();
        }
    }

    // Update play/pause button appearance
    function updatePlayPauseButton() {
        if (isPlaying) {
            pauseIcon.style.display = 'block';
            playIcon.style.display = 'none';
            playPauseBtn.setAttribute('aria-label', 'Pause carousel');
        } else {
            pauseIcon.style.display = 'none';
            playIcon.style.display = 'block';
            playPauseBtn.setAttribute('aria-label', 'Play carousel');
        }
    }

    // Play/Pause button event listener
    playPauseBtn.addEventListener('click', togglePlayPause);

    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > CONFIG.swipeThreshold) {
            if (diff > 0) {
                nextSlide(); // Swipe left
            } else {
                prevSlide(); // Swipe right
            }
        }
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === ' ' && e.target === document.body) {
            e.preventDefault();
            togglePlayPause();
        }
    });

    // Initialize carousel when DOM is ready
    function initCarousel() {
        // Check if CAROUSEL_DATA is available
        if (typeof CAROUSEL_DATA === 'undefined') {
            console.error('CAROUSEL_DATA not found. Please ensure carousel.js exists at:', CONFIG.dataSourceUrl);
            console.log('Expected format:');
            console.log(`const CAROUSEL_DATA = {
    slides: [
        {
            title: "Your Title",
            description: "",
            date: "Month Day, Year",
            url: "https://...",
            image: "/path/to/image.jpg",
            alt: "Descriptive alt text for image"
        }
    ]
};`);

            // Display error message in carousel
            track.innerHTML = '<div style="color: white; text-align: center; padding: 60px;">Carousel data not found. Please check with dhparker@vt.edu for details.</div>';
            return;
        }

        buildCarousel();
        // Start auto-advance
        startAutoAdvance();
    }

    // Wait for carousel.js to load
    window.addEventListener('load', () => {
        // Small delay to ensure external script is processed
        setTimeout(initCarousel, 100);
    });
