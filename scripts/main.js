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

/* ============================================================
   Screenshot slideshows inside the CSS iPhone frame (.ios-device)

   Two callers share this engine:
     - the header banner        (.ios-device[data-screenshots])
     - the feature showcase     (.feature-showcase, one tab per group)

   Screenshot lists are "path/file.webp|alt text", ONE ENTRY PER LINE,
   relative to images/latest/. Entries split on newlines rather than
   commas so captions may contain commas.
   ============================================================ */
(function () {
  var BASE = 'images/latest/';
  var INTERVAL = 4000;

  function parseSlides(value) {
    if (!value) return [];
    return value.split(/[\r\n;]+/).map(function (entry) {
      var parts = entry.trim().split('|');
      return { file: parts[0].trim(), alt: (parts[1] || '').trim() };
    }).filter(function (s) { return s.file; });
  }

  function arrowButton(dir, label) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ios-arrow ios-arrow-' + dir;
    b.setAttribute('aria-label', label);
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="' + (dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7') + '"/></svg>';
    return b;
  }

  function makeImage(slide, active) {
    var img = new Image();
    img.className = 'ios-shot' + (active ? ' is-active' : '');
    img.alt = slide.alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = BASE + slide.file;
    return img;
  }

  /* Drives one .ios-device. `dotsHost` is where the dot strip is appended.
     opts.arrows adds prev/next buttons either side of the phone.
     Returns a handle so a caller (the tabs) can swap the slide set out. */
  function createSlideshow(device, dotsHost, opts) {
    opts = opts || {};
    var screen = device.querySelector('.ios-device-screen');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dots = document.createElement('div');
    dots.className = 'ios-dots';

    var prev = null, next_ = null;
    if (opts.arrows) {
      // Arrows sit OUTSIDE the frame - overlaid on the screen they would read
      // as part of the app's own UI rather than as page controls.
      var rail = document.createElement('div');
      rail.className = 'ios-carousel';
      device.parentNode.insertBefore(rail, device);
      prev = arrowButton('prev', 'Previous screenshot');
      next_ = arrowButton('next', 'Next screenshot');
      rail.appendChild(prev);
      rail.appendChild(device);
      rail.appendChild(next_);
      prev.addEventListener('click', function () { manual(current - 1); });
      next_.addEventListener('click', function () { manual(current + 1); });
    }
    dotsHost.appendChild(dots);

    var images = [];
    var current = 0;
    var timer = null;
    var userTookOver = false;   // manual navigation ends auto-advance for good

    function stop() { clearInterval(timer); timer = null; }

    function start() {
      if (timer || reduced || userTookOver || document.hidden || images.length < 2) return;
      timer = setInterval(next, INTERVAL);
    }

    /* Any deliberate navigation - arrow, dot or swipe.
       Stepping past either edge is offered to opts.onEdge first, so the
       showcase can carry the visitor into the next/previous feature group
       rather than looping them inside one group forever. Falls back to
       wrapping within the group when nothing handles it. */
    function manual(i) {
      userTookOver = true;   // set before onEdge so the next group inherits it
      stop();
      if (i >= images.length || i < 0) {
        if (opts.onEdge && opts.onEdge(i < 0 ? -1 : 1)) return;
        i = (i + images.length) % images.length;
      }
      show(i);
    }

    function show(i) {
      if (!images[i]) return;
      images[current].classList.remove('is-active');
      if (dots.children[current]) dots.children[current].setAttribute('aria-current', 'false');
      current = i;
      images[current].classList.add('is-active');
      if (dots.children[current]) dots.children[current].setAttribute('aria-current', 'true');
    }

    function next() { show((current + 1) % images.length); }

    /* o.startAt: 0 | 'last' - 'last' lands on the final screenshot, so
                   stepping backwards into a group enters it from the end.
       o.keepTakeover: carry the paused state across an arrow-driven group
                   change. A direct tab click passes nothing, so it resets. */
    function setSlides(slides, keepFirstImage, o) {
      o = o || {};
      stop();
      userTookOver = o.keepTakeover ? userTookOver : false;
      // keepFirstImage: the banner's first <img> is authored in the HTML so the
      // banner still renders with JS off. Never destroy it.
      var keep = keepFirstImage ? screen.querySelector('img') : null;
      Array.prototype.slice.call(screen.querySelectorAll('img')).forEach(function (img) {
        if (img !== keep) img.parentNode.removeChild(img);
      });
      dots.innerHTML = '';
      images = [];

      slides.forEach(function (slide, i) {
        var img = (i === 0 && keep) ? keep : makeImage(slide, false);
        if (!(i === 0 && keep)) screen.appendChild(img);
        images.push(img);
      });

      current = o.startAt === 'last' ? images.length - 1 : (o.startAt || 0);
      if (images[current]) images[current].classList.add('is-active');

      if (images.length > 1) {
        images.forEach(function (img, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Show screenshot ' + (i + 1) + ' of ' + images.length);
          b.setAttribute('aria-current', i === current ? 'true' : 'false');
          b.addEventListener('click', function () { manual(i); });
          dots.appendChild(b);
        });
      }
      if (prev) {
        // A single-screenshot group still needs arrows when they lead somewhere.
        prev.hidden = next_.hidden = (images.length < 2 && !opts.onEdge);
      }
      start();
    }

    // Swipe: on a phone-shaped mockup this is what people try first.
    var touchX = 0, touchY = 0;
    device.addEventListener('touchstart', function (e) {
      touchX = e.changedTouches[0].clientX;
      touchY = e.changedTouches[0].clientY;
    }, { passive: true });
    device.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchX;
      var dy = e.changedTouches[0].clientY - touchY;
      // Horizontal intent only, so vertical page scrolling still works.
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        manual(current + (dx < 0 ? 1 : -1));
      }
    }, { passive: true });

    device.addEventListener('mouseenter', stop);
    device.addEventListener('mouseleave', start);
    dots.addEventListener('mouseenter', stop);
    dots.addEventListener('mouseleave', start);
    dots.addEventListener('focusin', stop);
    dots.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); } else { start(); }
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      }, { threshold: 0.15 }).observe(device);
    }

    return { setSlides: setSlides, stop: stop, start: start };
  }

  function initBanner() {
    var device = document.querySelector('.ios-device[data-screenshots]');
    if (!device) return;
    // Hidden below md (see css/main.css). Bail out before building any
    // slides so the screenshots are never fetched on phones.
    if (window.matchMedia('(max-width: 767.98px)').matches) return;
    var slides = parseSlides(device.getAttribute('data-screenshots'));
    if (slides.length < 2) return;   // lone <img> stays as a static banner
    createSlideshow(device, device.parentNode).setSlides(slides, true);
  }

  function initShowcase() {
    var host = document.querySelector('.feature-showcase');
    if (!host) return;

    // Empty groups are dropped, so a placeholder folder costs nothing.
    var groups = Array.prototype.slice.call(host.querySelectorAll('.feature-group'))
      .map(function (el) {
        return { label: el.getAttribute('data-label'),
                 slides: parseSlides(el.getAttribute('data-screenshots')) };
      })
      .filter(function (g) { return g.slides.length; });

    if (!groups.length) { host.style.display = 'none'; return; }

    var tabs = document.createElement('div');
    tabs.className = 'feature-tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'App features');

    var stage = document.createElement('div');
    stage.className = 'feature-stage';
    stage.innerHTML = '<div class="ios-device"><div class="ios-device-screen"></div></div>';

    host.innerHTML = '';
    host.appendChild(tabs);
    host.appendChild(stage);

    var buttons = [];
    var active = -1;

    /* Arrows run past the end of one group into the next, so a visitor can
       tour the whole app without discovering the tabs. Wraps at both ends. */
    function onEdge(dir) {
      if (groups.length < 2) return false;   // nothing to cross into
      select((active + dir + groups.length) % groups.length,
             { fromArrow: true, startAt: dir > 0 ? 0 : 'last' });
      return true;
    }

    var show = createSlideshow(stage.querySelector('.ios-device'), stage,
                               { arrows: true, onEdge: onEdge });

    function select(i, o) {
      o = o || {};
      if (i === active) return;
      buttons.forEach(function (b, n) {
        b.setAttribute('aria-selected', n === i ? 'true' : 'false');
        b.tabIndex = n === i ? 0 : -1;
      });
      active = i;
      // A tab click passes nothing, so takeover resets and the group rotates.
      // An arrow-driven change keeps it paused - the visitor is still driving.
      show.setSlides(groups[i].slides, false,
                     { startAt: o.startAt || 0, keepTakeover: !!o.fromArrow });
    }

    groups.forEach(function (group, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'feature-tab';
      b.setAttribute('role', 'tab');
      b.textContent = group.label;
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = (i + d + groups.length) % groups.length;
        buttons[n].focus();
        select(n);
      });
      tabs.appendChild(b);
      buttons.push(b);
    });

    select(0);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initBanner();
    initShowcase();
  });
}());
