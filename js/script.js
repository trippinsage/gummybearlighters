const carousel = document.querySelector('.gallery-carousel');
const track = carousel?.querySelector('.gallery-track');
const cards = track ? [...track.querySelectorAll('.gallery-card')] : [];
const hero = document.querySelector('.hero');
const heroArt = document.querySelector('.hero-art');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktopMotion = window.matchMedia('(min-width: 901px)').matches;
let autoAdvance;
let dragStartX = 0;
let dragStartScroll = 0;
let isDragging = false;
let parallaxFrame;

function cardStep() {
  if (!cards.length) return 0;
  const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
  return cards[0].getBoundingClientRect().width + gap;
}

function moveCarousel(direction = 1) {
  const step = cardStep();
  if (!step) return;
  const atEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 4;
  if (direction > 0 && atEnd) {
    carousel.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    return;
  }
  carousel.scrollBy({ left: direction * step, behavior: reduceMotion ? 'auto' : 'smooth' });
}

function stopAutoAdvance() {
  window.clearInterval(autoAdvance);
  autoAdvance = undefined;
}

function startAutoAdvance() {
  if (reduceMotion || autoAdvance || !cards.length) return;
  autoAdvance = window.setInterval(() => moveCarousel(1), 4600);
}

function syncParallax() {
  parallaxFrame = undefined;
  if (!hero || !heroArt || reduceMotion || !desktopMotion) return;
  const distance = hero.getBoundingClientRect().top;
  const offset = Math.max(-12, Math.min(12, Math.round(distance * -.04)));
  heroArt.style.setProperty('--parallax-scroll', `${offset}px`);
}

if (carousel) {
  carousel.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    isDragging = true;
    dragStartX = event.clientX;
    dragStartScroll = carousel.scrollLeft;
    carousel.classList.add('is-dragging');
    carousel.setPointerCapture(event.pointerId);
    stopAutoAdvance();
  });
  carousel.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    carousel.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
  });
  const endDrag = (event) => {
    if (!isDragging) return;
    isDragging = false;
    carousel.classList.remove('is-dragging');
    if (carousel.hasPointerCapture(event.pointerId)) carousel.releasePointerCapture(event.pointerId);
    startAutoAdvance();
  };
  carousel.addEventListener('pointerup', endDrag);
  carousel.addEventListener('pointercancel', endDrag);
  carousel.addEventListener('mouseenter', stopAutoAdvance);
  carousel.addEventListener('mouseleave', startAutoAdvance);
  carousel.addEventListener('focusin', stopAutoAdvance);
  carousel.addEventListener('focusout', startAutoAdvance);
  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); moveCarousel(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveCarousel(-1); }
  });
  document.addEventListener('visibilitychange', () => document.hidden ? stopAutoAdvance() : startAutoAdvance());
  startAutoAdvance();
}

if (hero && heroArt && desktopMotion && !reduceMotion) {
  hero.addEventListener('pointermove', (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
    heroArt.style.setProperty('--parallax-x', `${Math.round(x * 8)}px`);
    heroArt.style.setProperty('--parallax-y', `${Math.round(y * 6)}px`);
  });
  hero.addEventListener('pointerleave', () => {
    heroArt.style.setProperty('--parallax-x', '0px');
    heroArt.style.setProperty('--parallax-y', '0px');
  });
  window.addEventListener('scroll', () => {
    if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(syncParallax);
  }, { passive: true });
  syncParallax();
}

document.querySelector('[data-carousel-prev]')?.addEventListener('click', () => moveCarousel(-1));
document.querySelector('[data-carousel-next]')?.addEventListener('click', () => moveCarousel(1));

const tickerRail = document.querySelector('.ticker-rail');
const tickerViewport = tickerRail?.closest('.ticker');
if (tickerRail && tickerViewport && !reduceMotion) {
  const tickerTemplate = tickerRail.querySelector('.ticker-track');
  const tickerSpeed = 40; // px per second, matches the previous 24s/16s CSS pace
  let tickerOffset = 0;
  let tickerLastTime = null;
  let tickerTrackWidth = 0;

  // Clone the track enough times that, however far the rail has scrolled
  // (up to one full track width), there is always content covering the
  // entire visible width — otherwise wide viewports run out of text before
  // the loop wraps. Re-run on resize/font-load since both change the widths.
  function ensureTickerCoverage() {
    if (!tickerTemplate) return;
    const width = tickerTemplate.getBoundingClientRect().width;
    if (!width) return;
    tickerTrackWidth = width;
    const viewportWidth = tickerViewport.getBoundingClientRect().width;
    const copiesNeeded = Math.max(2, Math.ceil(viewportWidth / width) + 1);
    while (tickerRail.children.length < copiesNeeded) {
      tickerRail.appendChild(tickerTemplate.cloneNode(true));
    }
    while (tickerRail.children.length > copiesNeeded) {
      tickerRail.lastElementChild.remove();
    }
  }

  function tickTicker(now) {
    if (tickerTrackWidth && tickerLastTime !== null) {
      const delta = (now - tickerLastTime) / 1000;
      tickerOffset = (tickerOffset + tickerSpeed * delta) % tickerTrackWidth;
      tickerRail.style.transform = `translateX(${-tickerOffset}px)`;
    }
    tickerLastTime = now;
    requestAnimationFrame(tickTicker);
  }

  ensureTickerCoverage();
  document.fonts?.ready?.then(ensureTickerCoverage);
  window.addEventListener('resize', ensureTickerCoverage);
  requestAnimationFrame(tickTicker);
}

const revealEls = [...document.querySelectorAll('.reveal')];
if (revealEls.length) {
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));

    // Safety net: guarantee content is never permanently stuck invisible
    // if the observer fails to fire for any reason (edge-case viewports,
    // browser quirks, etc). Harmless for the normal case since most
    // sections will already be revealed well before this fires.
    window.setTimeout(() => {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    }, 2500);
  }
}
