// Smooth scroll for links with hashes
$('a[href*="#"]')
// Remove links that don't actually link to anything
.not('[href="#"]')
.not('[href="#0"]')
.click(function(event) {
  // On-page links
  if (
    location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') 
    && 
    location.hostname == this.hostname
  ) {
    // Figure out element to scroll to
    var target = $(this.hash);
    target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
    // Does a scroll target exist?
    if (target.length) {
      // Only prevent default if animation is actually gonna happen
      event.preventDefault();
      $('html, body').animate({
        scrollTop: target.offset().top
      }, 1000, function() {
        // Callback after animation
        // Must change focus!
        var $target = $(target);
        $target.focus();
        if ($target.is(":focus")) { // Checking if the target was focused
          return false;
        } else {
          $target.attr('tabindex','-1'); // Adding tabindex for elements not focusable
          $target.focus(); // Set focus again
        };
      });
    }
  }
});

// Optimized Video Lazy Loading with Intersection Observer
document.addEventListener('DOMContentLoaded', function() {
  // Check if browser supports Intersection Observer
  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target;
          const videoSrc = video.getAttribute('data-src');
          
          if (videoSrc) {
            // Set the source and load the video
            video.src = videoSrc;
            video.removeAttribute('data-src');
            
            // Add loading event listener
            video.addEventListener('loadeddata', function() {
              video.play().catch(e => {
                // Auto-play failed, which is expected on some browsers
                console.log('Auto-play prevented:', e);
              });
            });
            
            // Load the video
            video.load();
          }
          
          // Stop observing this video
          observer.unobserve(video);
        }
      });
    }, {
      // Load video when it's 50% visible
      threshold: 0.5,
      // Start loading 100px before the video enters viewport
      rootMargin: '100px'
    });

    // Observe all lazy videos
    document.querySelectorAll('.lazy-video').forEach(video => {
      videoObserver.observe(video);
    });
  } else {
    // Fallback for browsers without Intersection Observer
    document.querySelectorAll('.lazy-video').forEach(video => {
      const videoSrc = video.getAttribute('data-src');
      if (videoSrc) {
        video.src = videoSrc;
        video.removeAttribute('data-src');
        video.load();
        video.play().catch(e => console.log('Auto-play prevented:', e));
      }
    });
  }

  // Pause videos when they go out of viewport to save bandwidth
  const pauseObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      if (!entry.isIntersecting && !video.paused) {
        video.pause();
      } else if (entry.isIntersecting && video.paused && video.src) {
        video.play().catch(e => console.log('Auto-play prevented:', e));
      }
    });
  }, {
    threshold: 0.1
  });

  // Observe videos for pause/play optimization
  document.querySelectorAll('video').forEach(video => {
    pauseObserver.observe(video);
  });

  // Preload videos on user interaction (touch/mouse) for better UX
  let userInteracted = false;
  const enableVideoPreload = () => {
    if (!userInteracted) {
      userInteracted = true;
      document.querySelectorAll('.lazy-video[data-src]').forEach(video => {
        const videoSrc = video.getAttribute('data-src');
        if (videoSrc) {
          // Create a prefetch link instead of preload for video
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = videoSrc;
          document.head.appendChild(link);
        }
      });
    }
  };

  // Listen for first user interaction
  ['touchstart', 'mousedown', 'keydown'].forEach(event => {
    document.addEventListener(event, enableVideoPreload, { once: true });
  });
});