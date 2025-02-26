/**
 * Image Lightbox functionality for news images
 * Opens a modal with larger image when clicked
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get lightbox elements
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImg = document.getElementById('lightboxImage');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const closeBtn = document.querySelector('.close-lightbox');

    // Find all news image containers and add click event listeners
    function initializeLightbox() {
        const newsImages = document.querySelectorAll('.news-item img');
        
        newsImages.forEach(image => {
            // Make images show pointer cursor to indicate they're clickable
            image.style.cursor = 'pointer';
            
            // Add click event
            image.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get the full-size image path
                const imageSrc = this.getAttribute('src');
                
                // Get the parent news item for possible caption info
                const newsItem = this.closest('.news-item');
                const title = newsItem ? newsItem.querySelector('.news-title').textContent : '';
                
                // Show the lightbox with this image
                openLightbox(imageSrc, title);
            });
        });
    }

    // Open the lightbox with specific image and caption
    function openLightbox(src, caption) {
        lightboxImg.src = src;
        lightboxCaption.textContent = caption;
        lightbox.style.display = 'block';
        
        // Prevent scrolling of the body while lightbox is open
        document.body.style.overflow = 'hidden';
    }

    // Close the lightbox
    function closeLightbox() {
        lightbox.style.display = 'none';
        
        // Re-enable scrolling
        document.body.style.overflow = 'auto';
    }

    // Close lightbox when close button is clicked
    closeBtn.addEventListener('click', closeLightbox);
    
    // Close lightbox when clicking outside the image
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Close lightbox when ESC key is pressed
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });

    // Initialize lightbox functionality once the news content is loaded
    if (document.readyState === 'complete') {
        initializeLightbox();
    } else {
        // If news is loaded dynamically, we need to wait
        // This assumes there's some event or callback when news is loaded
        document.addEventListener('newsLoaded', initializeLightbox);
        
        // Fallback - try initializing after a delay
        setTimeout(initializeLightbox, 1000);
    }
    
    // Re-initialize when the DOM is updated (for dynamically loaded content)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                initializeLightbox();
            }
        });
    });
    
    // Observe changes to the news container
    const newsContainer = document.querySelector('.news-container') || document.body;
    observer.observe(newsContainer, { childList: true, subtree: true });
}); 