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
  var counterEl = null;

  function ensureCounter(){
    if(!lightbox) return;
    counterEl = lightbox.querySelector('.mr-lightbox-counter');
    if(counterEl) return;
    counterEl = document.createElement('div');
    counterEl.className = 'mr-lightbox-counter';
    counterEl.setAttribute('aria-live','polite');
    lightbox.appendChild(counterEl);
  }

  function getGroupLinks(group){
    return links.filter(function(a){ return a.getAttribute('data-group') === group; });
  }

  function updateUI(total){
    ensureCounter();
    var hasMulti = total > 1;
    if(btnPrev) btnPrev.style.display = hasMulti ? '' : 'none';
    if(btnNext) btnNext.style.display = hasMulti ? '' : 'none';
    if(counterEl) counterEl.style.display = hasMulti ? '' : 'none';
    if(hasMulti && counterEl){
      counterEl.textContent = (currentIndex + 1) + ' / ' + total;
    }
  }

  function openLightbox(group, idx){
    currentGroup = group;
    currentIndex = idx;
    var groupLinks = getGroupLinks(group);
    var href = groupLinks[idx] ? groupLinks[idx].getAttribute('href') : null;
    var alt = groupLinks[idx] ? (groupLinks[idx].querySelector('img') ? groupLinks[idx].querySelector('img').getAttribute('alt') : '') : '';
    if(!href) return;

    // reset any drag leftover
    if(lbImg){
      lbImg.classList.remove('is-dragging');
      lbImg.style.setProperty('--mr-lb-drag','0px');
    }

    lbImg.src = href;
    lbImg.alt = alt || '';
    updateUI(groupLinks.length);

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox(){
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden','true');
    lbImg.src = '';
    if(lbImg){
      lbImg.classList.remove('is-dragging');
      lbImg.style.setProperty('--mr-lb-drag','0px');
    }
    document.body.style.overflow = '';
  }

  function move(delta){
    if(!currentGroup) return;
    var groupLinks = getGroupLinks(currentGroup);
    if(!groupLinks.length) return;
    currentIndex = (currentIndex + delta + groupLinks.length) % groupLinks.length;
    openLightbox(currentGroup, currentIndex);
  }

  // Swipe / drag to navigate (mobile + desktop)
  (function(){
    if(!lbImg || !lightbox) return;
    // Prevent native image dragging (desktop) which can swallow pointer/touch gestures
    lbImg.setAttribute('draggable','false');
    var startX = 0;
    var startY = 0;
    var pointerId = null;
    var dragging = false;

    function canSwipe(){
      if(!lightbox.classList.contains('is-open')) return false;
      if(!currentGroup) return false;
      return getGroupLinks(currentGroup).length > 1;
    }

    function isInteractiveTarget(el){
      if(!el || !el.closest) return false;
      return !!el.closest('button');
    }

    // Pointer events (Chrome/Edge/Firefox + most modern mobile browsers)
    lightbox.addEventListener('pointerdown', function(e){
      if(!canSwipe()) return;
      if(isInteractiveTarget(e.target)) return;
      // only primary button for mouse
      if(typeof e.button === 'number' && e.button !== 0) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      dragging = true;
      lbImg.classList.add('is-dragging');
      try{ lightbox.setPointerCapture(pointerId); } catch(_){ }
    });

    lightbox.addEventListener('pointermove', function(e){
      if(!dragging || e.pointerId !== pointerId) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if(Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      if(Math.abs(dx) > Math.abs(dy)){
        e.preventDefault();
        lbImg.style.setProperty('--mr-lb-drag', dx + 'px');
      }
    }, { passive: false });

    function end(e){
      if(!dragging || e.pointerId !== pointerId) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      dragging = false;
      pointerId = null;
      lbImg.classList.remove('is-dragging');
      lbImg.style.setProperty('--mr-lb-drag','0px');

      // Swipe threshold
      if(Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)){
        if(dx < 0) move(1);
        else move(-1);
      }
    }

    lightbox.addEventListener('pointerup', end);
    lightbox.addEventListener('pointercancel', end);

    // Touch fallback (in case pointer events are flaky on some devices)
    var tDragging = false;
    var tStartX = 0;
    var tStartY = 0;

    lightbox.addEventListener('touchstart', function(e){
      if(!canSwipe()) return;
      if(isInteractiveTarget(e.target)) return;
      if(!e.touches || !e.touches[0]) return;
      tDragging = true;
      tStartX = e.touches[0].clientX;
      tStartY = e.touches[0].clientY;
      lbImg.classList.add('is-dragging');
    }, { passive: false });

    lightbox.addEventListener('touchmove', function(e){
      if(!tDragging) return;
      if(!e.touches || !e.touches[0]) return;
      var dx = e.touches[0].clientX - tStartX;
      var dy = e.touches[0].clientY - tStartY;
      if(Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      if(Math.abs(dx) > Math.abs(dy)){
        e.preventDefault();
        lbImg.style.setProperty('--mr-lb-drag', dx + 'px');
      }
    }, { passive: false });

    lightbox.addEventListener('touchend', function(e){
      if(!tDragging) return;
      tDragging = false;
      lbImg.classList.remove('is-dragging');

      var t = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
      var endX = t ? t.clientX : tStartX;
      var endY = t ? t.clientY : tStartY;
      var dx = endX - tStartX;
      var dy = endY - tStartY;
      lbImg.style.setProperty('--mr-lb-drag','0px');

      if(Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)){
        if(dx < 0) move(1);
        else move(-1);
      }
    }, { passive: true });

    lightbox.addEventListener('touchcancel', function(){
      if(!tDragging) return;
      tDragging = false;
      lbImg.classList.remove('is-dragging');
      lbImg.style.setProperty('--mr-lb-drag','0px');
    }, { passive: true });
  })();

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


// --- Works thumbs: mobile carousel + arrows (final) ---
(function(){
  function isMobile(){ return window.matchMedia && window.matchMedia("(max-width: 720px)").matches; }

  function wrapThumbs(thumbs){
    if (!thumbs) return null;
    // add carousel class
    thumbs.classList.add("mr-carousel");
    // ensure wrapper exists for overlay arrows
    const existingWrap = thumbs.closest(".mr-carousel-wrap");
    if (existingWrap) return existingWrap;

    const wrap = document.createElement("div");
    wrap.className = "mr-carousel-wrap";
    thumbs.parentNode.insertBefore(wrap, thumbs);
    wrap.appendChild(thumbs);
    return wrap;
  }

  function ensureButtons(wrap){
    if (!wrap) return;
    if (wrap.querySelector(".mr-carousel-btn")) return;

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "mr-carousel-btn mr-carousel-btn--prev";
    prev.setAttribute("aria-label", "Anterior");
    prev.innerHTML = "‹";

    const next = document.createElement("button");
    next.type = "button";
    next.className = "mr-carousel-btn mr-carousel-btn--next";
    next.setAttribute("aria-label", "Siguiente");
    next.innerHTML = "›";

    wrap.appendChild(prev);
    wrap.appendChild(next);
  }

  function bind(wrap){
    const thumbs = wrap.querySelector(".mr-thumbs");
    const prev = wrap.querySelector(".mr-carousel-btn--prev");
    const next = wrap.querySelector(".mr-carousel-btn--next");
    if (!thumbs || !prev || !next) return;

    const step = () => Math.max(thumbs.clientWidth * 0.85, 240);

    function update(){
      const max = thumbs.scrollWidth - thumbs.clientWidth - 1;
      prev.disabled = thumbs.scrollLeft <= 1;
      next.disabled = thumbs.scrollLeft >= max;
      const hasOverflow = thumbs.scrollWidth > thumbs.clientWidth + 8;
      const show = isMobile() && hasOverflow;
      prev.style.display = next.style.display = show ? "" : "none";
    }

    if (wrap.dataset.carouselBound === "1") { update(); return; }
    wrap.dataset.carouselBound = "1";

    prev.addEventListener("click", () => thumbs.scrollBy({ left: -step(), behavior: "smooth" }));
    next.addEventListener("click", () => thumbs.scrollBy({ left: step(), behavior: "smooth" }));

    thumbs.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    setTimeout(update, 0);
  }

  function teardown(thumbs){
    if (!thumbs) return;
    thumbs.classList.remove("mr-carousel");
    const wrap = thumbs.closest(".mr-carousel-wrap");
    if (!wrap) return;
    // move thumbs out and remove wrapper/buttons
    wrap.parentNode.insertBefore(thumbs, wrap);
    wrap.remove();
  }

  function init(){
    document.querySelectorAll(".mr-work-card .mr-thumbs").forEach(thumbs => {
      if (isMobile()){
        const wrap = wrapThumbs(thumbs);
        ensureButtons(wrap);
        bind(wrap);
      } else {
        teardown(thumbs);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("resize", init);
})();

