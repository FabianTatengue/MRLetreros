(function(){
  var burger = document.querySelector('[data-burger]');
  var nav = document.querySelector('[data-nav]');
  if(burger && nav){
    burger.addEventListener('click', function(){
      var isOpen = nav.classList.toggle('is-open');
      burger.classList.toggle('is-open', isOpen);
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    nav.addEventListener('click', function(e){
      var t = e.target;
      if(t && t.classList && t.classList.contains('mr-nav-link')){
        nav.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded','false');
      }
    });
  }

  var lightbox = document.querySelector('[data-lightbox]');
  var lbImg = document.querySelector('[data-lightbox-img]');
  var btnClose = document.querySelector('[data-lightbox-close]');
  var btnPrev = document.querySelector('[data-lightbox-prev]');
  var btnNext = document.querySelector('[data-lightbox-next]');
  var links = Array.prototype.slice.call(document.querySelectorAll('.mr-gallery-link'));

  var currentGroup = null;
  var currentIndex = -1;

  function openLightbox(group, idx){
    currentGroup = group;
    currentIndex = idx;
    var groupLinks = links.filter(function(a){ return a.getAttribute('data-group') === group; });
    var href = groupLinks[idx] ? groupLinks[idx].getAttribute('href') : null;
    var alt = groupLinks[idx] ? (groupLinks[idx].querySelector('img') ? groupLinks[idx].querySelector('img').getAttribute('alt') : '') : '';
    if(!href) return;
    lbImg.src = href;
    lbImg.alt = alt || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox(){
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden','true');
    lbImg.src = '';
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