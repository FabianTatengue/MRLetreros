(function(){
  var burger = document.querySelector('[data-burger]');
  var nav = document.querySelector('[data-nav]');
  if(burger && nav){
    var backdrop = document.querySelector('[data-nav-backdrop]');
    if(!backdrop){
      backdrop = document.createElement('div');
      backdrop.className = 'mr-nav-backdrop';
      backdrop.setAttribute('data-nav-backdrop','');
      backdrop.setAttribute('aria-hidden','true');
      document.body.appendChild(backdrop);
    }
  
    function closeNav(){
      nav.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded','false');
      if(backdrop) backdrop.classList.remove('is-open');
    }
  
    burger.addEventListener('click', function(e){
      e.stopPropagation();
      var isOpen = nav.classList.toggle('is-open');
      burger.classList.toggle('is-open', isOpen);
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if(backdrop) backdrop.classList.toggle('is-open', isOpen);
    });
  
    // Close when selecting a link
    nav.addEventListener('click', function(e){
      var t = e.target;
      if(t && t.classList && t.classList.contains('mr-nav-link')){
        closeNav();
      }
    });
  
    // Close on tap/click outside (backdrop + document)
    if(backdrop){
      backdrop.addEventListener('click', function(){ closeNav(); });
    }
    document.addEventListener('click', function(e){
      if(!nav.classList.contains('is-open')) return;
      if(nav.contains(e.target) || burger.contains(e.target)) return;
      closeNav();
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && nav.classList.contains('is-open')){
        closeNav();
      }
    });
  }

  var lightbox = document.querySelector('[data-lightbox]');
  var lbImg = document.querySelector('[data-lightbox-img]');
  // Video support (created dynamically to avoid touching every HTML file)
  var lbVideo = null;
  if(lightbox){
    lbVideo = lightbox.querySelector('[data-lightbox-video]');
    if(!lbVideo){
      lbVideo = document.createElement('video');
      lbVideo.className = 'mr-lightbox-video';
      lbVideo.setAttribute('data-lightbox-video','');
      lbVideo.setAttribute('playsinline','');
      lbVideo.setAttribute('controls','');
      lbVideo.preload = 'metadata';
      lbVideo.style.display = 'none';
      // insert right after the image so nav buttons remain on top
      if(lbImg && lbImg.parentNode){
        lbImg.parentNode.insertBefore(lbVideo, lbImg.nextSibling);
      } else {
        lightbox.appendChild(lbVideo);
      }
    }
  }
  var btnClose = document.querySelector('[data-lightbox-close]');
  var btnPrev = document.querySelector('[data-lightbox-prev]');
  var btnNext = document.querySelector('[data-lightbox-next]');
  var links = Array.prototype.slice.call(document.querySelectorAll('.mr-gallery-link'));

  var currentGroup = null;
  var currentIndex = -1;

  function isVideoUrl(url){
    return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url || '');
  }

  function stopVideo(){
    if(!lbVideo) return;
    try{ lbVideo.pause(); } catch(_){ }
    // Hide first (Android can keep rendering controls if src is cleared first)
    lbVideo.style.display = 'none';
    // Clear src safely
    try{ lbVideo.removeAttribute('src'); } catch(_){ }
    try{ lbVideo.load(); } catch(_){ }
  }

  function openLightbox(group, idx){
    currentGroup = group;
    currentIndex = idx;
    var groupLinks = links.filter(function(a){ return a.getAttribute('data-group') === group; });
    var href = groupLinks[idx] ? groupLinks[idx].getAttribute('href') : null;
    var alt = groupLinks[idx] ? (groupLinks[idx].querySelector('img') ? groupLinks[idx].querySelector('img').getAttribute('alt') : '') : '';
    if(!href) return;
    // Always stop any previous video before switching
    stopVideo();

    if(isVideoUrl(href) && lbVideo){
      // Use child img src as poster when available
      var poster = groupLinks[idx].querySelector('img') ? groupLinks[idx].querySelector('img').getAttribute('src') : '';
      if(poster) lbVideo.setAttribute('poster', poster);
      else lbVideo.removeAttribute('poster');

      // Show video, hide image
      if(lbImg) lbImg.style.display = 'none';
      lbVideo.style.display = '';
      lbVideo.src = href;
      try{ lbVideo.load(); } catch(_){ }
    } else {
      // Show image, hide video
      if(lbVideo) lbVideo.style.display = 'none';
      if(lbImg){
        lbImg.style.display = '';
        lbImg.src = href;
        lbImg.alt = alt || '';
      }
    }
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox(){
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden','true');
    stopVideo();
    if(lbImg){
      lbImg.src = '';
      lbImg.style.display = '';
    }
    document.body.style.overflow = '';
  }

  function move(delta){
    if(!currentGroup) return;
    var groupLinks = links.filter(function(a){ return a.getAttribute('data-group') === currentGroup; });
    if(!groupLinks.length) return;
    currentIndex = (currentIndex + delta + groupLinks.length) % groupLinks.length;
    openLightbox(currentGroup, currentIndex);
  }

  links.forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      var group = a.getAttribute('data-group') || 'default';
      var groupLinks = links.filter(function(x){ return x.getAttribute('data-group') === group; });
      var idx = groupLinks.indexOf(a);
      openLightbox(group, Math.max(0, idx));
    });
  });

  if(btnClose) btnClose.addEventListener('click', closeLightbox);
  if(lightbox) lightbox.addEventListener('click', function(e){ if(e.target === lightbox) closeLightbox(); });
  if(btnPrev) btnPrev.addEventListener('click', function(){ move(-1); });
  if(btnNext) btnNext.addEventListener('click', function(){ move(1); });
  document.addEventListener('keydown', function(e){
    if(!lightbox || !lightbox.classList.contains('is-open')) return;
    if(e.key === 'Escape') closeLightbox();
    if(e.key === 'ArrowLeft') move(-1);
    if(e.key === 'ArrowRight') move(1);
  });


  // Scroll-to-top button (appears after scrolling a bit)
  var scrollBtn = document.getElementById('mrScrollTop');
  if(scrollBtn){
    var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    function prefersReduced(){ return mqReduce ? mqReduce.matches : false; }

    var ticking = false;
    function setVisible(){
      if(window.scrollY > 40){
        scrollBtn.classList.add('is-visible');
      } else {
        scrollBtn.classList.remove('is-visible');
      }
    }

    window.addEventListener('scroll', function(){
      if(ticking) return;
      ticking = true;
      (window.requestAnimationFrame || window.setTimeout)(function(){
        setVisible();
        ticking = false;
      }, 16);
    }, { passive: true });

    setVisible();

    scrollBtn.addEventListener('click', function(){
      try{
        window.scrollTo({ top: 0, behavior: prefersReduced() ? 'auto' : 'smooth' });
      } catch(_){
        window.scrollTo(0, 0);
      }
    });
  }

  // Pixel-perfect: keep "Proceso" collage exactly the same height as the text column (desktop only)
  var process = document.querySelector('.mr-process');
  var processText = process ? process.querySelector('.mr-process-text') : null;
  var processMedia = process ? process.querySelector('.mr-process-media') : null;
  var resizeTimer = null;

  function syncProcessHeight(){
    if(!processText || !processMedia) return;
    // On mobile the layout stacks; let CSS handle height.
    if(window.matchMedia('(max-width: 900px)').matches){
      processMedia.style.height = '';
      process.style.setProperty('--mr-process-h','auto');
      return;
    }
    // Use scrollHeight so we measure the *content* height, not a stretched grid height.
    // (In CSS we avoid stretching, but this keeps it robust if anything changes.)
    var h = processText.scrollHeight;
    // Apply as CSS variable (more reliable) + inline height for older browsers.
    process.style.setProperty('--mr-process-h', Math.round(h) + 'px');
    // Guard against weird 0 values while fonts are loading.
    if(h && h > 0){
      processMedia.style.height = Math.round(h) + 'px';
    }
  }

  function requestSync(){
    if(resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(syncProcessHeight, 60);
  }

  // Initial + after images/fonts load
  syncProcessHeight();
  // Extra passes to ensure correct sizing after layout settles
  window.setTimeout(syncProcessHeight, 120);
  window.setTimeout(syncProcessHeight, 400);
  window.setTimeout(syncProcessHeight, 900);
  window.addEventListener('resize', requestSync);
  window.addEventListener('load', syncProcessHeight);
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(syncProcessHeight).catch(function(){});
  }
})();


// --- Works thumbs: carousel + arrows (desktop + mobile) ---
(function(){
  function isMobile(){
    return window.matchMedia && window.matchMedia("(max-width: 720px)").matches;
  }

  function ensureWrap(thumbs){
    if(!thumbs) return null;

    // Ensure wrapper exists (for overlay arrows + fades)
    var existingWrap = thumbs.closest(".mr-carousel-wrap");
    if(existingWrap) return existingWrap;

    var wrap = document.createElement("div");
    wrap.className = "mr-carousel-wrap";
    thumbs.parentNode.insertBefore(wrap, thumbs);
    wrap.appendChild(thumbs);
    return wrap;
  }

  function ensureButtons(wrap){
    if(!wrap) return;
    if(wrap.querySelector(".mr-carousel-btn")) return;

    var prev = document.createElement("button");
    prev.type = "button";
    prev.className = "mr-carousel-btn mr-carousel-btn--prev";
    prev.setAttribute("aria-label", "Anterior");
    prev.innerHTML = "‹";

    var next = document.createElement("button");
    next.type = "button";
    next.className = "mr-carousel-btn mr-carousel-btn--next";
    next.setAttribute("aria-label", "Siguiente");
    next.innerHTML = "›";

    wrap.appendChild(prev);
    wrap.appendChild(next);
  }

  function bind(wrap){
    if(!wrap || wrap.dataset.carouselBound === "1") return;
    var thumbs = wrap.querySelector(".mr-thumbs");
    var prev = wrap.querySelector(".mr-carousel-btn--prev");
    var next = wrap.querySelector(".mr-carousel-btn--next");
    if(!thumbs || !prev || !next) return;

    wrap.dataset.carouselBound = "1";

    function step(){
      // Desktop: scroll by about a screen; Mobile: a bit less so it feels natural.
      var base = thumbs.clientWidth * (isMobile() ? 0.85 : 0.9);
      return Math.max(base, isMobile() ? 240 : 320);
    }

    prev.addEventListener("click", function(){
      thumbs.scrollBy({ left: -step(), behavior: "smooth" });
    });
    next.addEventListener("click", function(){
      thumbs.scrollBy({ left: step(), behavior: "smooth" });
    });

    thumbs.addEventListener("scroll", function(){ update(wrap); }, { passive: true });
  }

  function update(wrap){
    if(!wrap) return;
    var thumbs = wrap.querySelector(".mr-thumbs");
    var prev = wrap.querySelector(".mr-carousel-btn--prev");
    var next = wrap.querySelector(".mr-carousel-btn--next");
    if(!thumbs || !prev || !next) return;

    var max = Math.max(0, thumbs.scrollWidth - thumbs.clientWidth);
    var atStart = thumbs.scrollLeft <= 1;
    var atEnd = thumbs.scrollLeft >= (max - 1);
    var hasOverflow = thumbs.scrollWidth > thumbs.clientWidth + 6;

    prev.disabled = atStart;
    next.disabled = atEnd;

    // Data attrs drive fades
    wrap.dataset.atStart = atStart ? "1" : "0";
    wrap.dataset.atEnd = atEnd ? "1" : "0";
    wrap.dataset.hasOverflow = hasOverflow ? "1" : "0";

    // Button visibility:
    // - Mobile: always visible (even if disabled) so it feels consistent.
    // - Desktop: only show when there's overflow.
    var show = isMobile() ? true : hasOverflow;
    prev.style.display = show ? "" : "none";
    next.style.display = show ? "" : "none";
  }

  function init(){
    document.querySelectorAll(".mr-work-card .mr-thumbs").forEach(function(thumbs){
      var wrap = ensureWrap(thumbs);
      ensureButtons(wrap);
      bind(wrap);
      // Delay update until layout is stable (images/fonts)
      setTimeout(function(){ update(wrap); }, 0);
      setTimeout(function(){ update(wrap); }, 120);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("resize", function(){
    // Recalculate overflow + button states on resize
    document.querySelectorAll(".mr-carousel-wrap").forEach(function(wrap){
      update(wrap);
    });
  });
  window.addEventListener("load", function(){
    document.querySelectorAll(".mr-carousel-wrap").forEach(function(wrap){
      update(wrap);
    });
  });
})();
