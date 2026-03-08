/**
 * Pet Spa & Shop - About Page
 * Stats counter animation when section is in view
 */
(function () {
  'use strict';

  function animateValue(el, end, duration) {
    if (!el || typeof end !== 'number') return;
    var start = 0;
    var startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var easeOut = 1 - Math.pow(1 - progress, 2);
      var current = Math.round(start + (end - start) * easeOut);
      el.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = end;
      }
    }
    requestAnimationFrame(step);
  }

  function initStats() {
    var section = document.querySelector('.about-stats');
    var numbers = section ? section.querySelectorAll('.about-stat__number[data-count]') : [];
    if (numbers.length === 0) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var end = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(end)) return;
        animateValue(el, end, 1200);
        observer.unobserve(el);
      });
    }, { threshold: 0.3, rootMargin: '0px' });

    numbers.forEach(function (el) {
      observer.observe(el);
    });
  }

  function init() {
    initStats();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
