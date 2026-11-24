/**
 * Mailinfra scroll motion
 * - Slide-in reveals (left / right / up)
 * - Scroll-linked SVG stroke draw
 */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const REVEAL_SELECTORS = [
    '.section-header',
    '.trust-stat-card',
    '.problem-card',
    '.diff-card',
    '.feature-tile',
    '.step-card',
    '.testimonial-card',
    '.proof-switcher',
    '.proof-stage',
    '.proof-stage-cta',
    '.testimonials-header',
    '.pricing-command-deck',
    '.console-shell',
    '.problem-transition-banner',
    '.steps-cta-wrap',
    '.final-cta-inner',
    '.cf-cta',
    '.cf-brand',
    '.cf-col',
    '.hero-copy',
    '.hero-visual-stage',
    '.hero-center-stack > .hero-badge',
    '.hero-center-stack > .hero-title',
    '.hero-center-stack > .hero-sub-1',
    '.hero-center-stack > .hero-ctas',
    '.hero-center-stack > .hero-checks',
    '.faq-chat-layout > *',
    '.guarantee-pillar',
    '.page-hero > *',
    '.page-hero-copy',
    '.page-hero-visual',
    '.content-card',
    '.pricing-card',
    '.resource-card',
    '.about-card',
    '.contact-card',
    '.feature-block',
    '.info-card',
    '.cta-banner'
  ].join(',');

  const hasReveal = (el) =>
    el.classList.contains('reveal-up') ||
    el.classList.contains('reveal-left') ||
    el.classList.contains('reveal-right') ||
    el.classList.contains('reveal-scale') ||
    el.classList.contains('reveal-clip');

  const directionFor = (el, i) => {
    const preferRight =
      el.classList.contains('hero-visual-stage') ||
      el.classList.contains('page-hero-visual') ||
      el.classList.contains('console-shell') ||
      el.classList.contains('pricing-command-deck') ||
      el.classList.contains('hero-ctas') ||
      el.classList.contains('hero-checks') ||
      el.classList.contains('reveal-clip');

    const preferLeft =
      el.classList.contains('hero-copy') ||
      el.classList.contains('page-hero-copy') ||
      el.classList.contains('section-header') ||
      el.classList.contains('cf-brand') ||
      el.classList.contains('hero-badge') ||
      el.classList.contains('hero-title') ||
      el.classList.contains('hero-sub-1');

    if (preferRight) return 'reveal-right';
    if (preferLeft) return 'reveal-left';
    return i % 2 === 0 ? 'reveal-left' : 'reveal-right';
  };

  const markDirectional = (els) => {
    els.forEach((el, i) => {
      if (el.closest('header, nav, .site-header, .announcement-bar, script, style')) return;

      const onlyUp =
        el.classList.contains('reveal-up') &&
        !el.classList.contains('reveal-left') &&
        !el.classList.contains('reveal-right') &&
        !el.classList.contains('reveal-scale') &&
        !el.classList.contains('reveal-clip');

      if (!hasReveal(el) || onlyUp) {
        if (onlyUp) el.classList.remove('reveal-up');
        el.classList.add(directionFor(el, i));
      }

      el.classList.remove(
        'reveal-delay-1',
        'reveal-delay-2',
        'reveal-delay-3',
        'reveal-delay-4',
        'reveal-delay-5'
      );
      el.classList.add(`reveal-delay-${(i % 5) + 1}`);
    });
  };

  const initReveals = () => {
    markDirectional(Array.from(document.querySelectorAll(REVEAL_SELECTORS)));

    // Alternate siblings inside common grids
    document.querySelectorAll(
      '.trust-stats-grid, .problem-grid, .diff-grid, .features-bento, .steps-grid, .guarantee-grid, .cf-cols, .proof-switcher'
    ).forEach((grid) => {
      Array.from(grid.children).forEach((child, i) => {
        if (!hasReveal(child)) {
          child.classList.add(i % 2 === 0 ? 'reveal-left' : 'reveal-right');
        } else if (child.classList.contains('reveal-up')) {
          child.classList.remove('reveal-up');
          child.classList.add(i % 2 === 0 ? 'reveal-left' : 'reveal-right');
        }
        child.classList.remove(
          'reveal-delay-1',
          'reveal-delay-2',
          'reveal-delay-3',
          'reveal-delay-4',
          'reveal-delay-5'
        );
        child.classList.add(`reveal-delay-${(i % 5) + 1}`);
      });
    });

    const revealEls = document.querySelectorAll(
      '.reveal-up, .reveal-left, .reveal-right, .reveal-scale, .reveal-clip'
    );

    if (reduce) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    if (!('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    revealEls.forEach((el) => io.observe(el));
  };

  const SHAPE_SELECTOR = 'path, line, polyline, polygon, circle, ellipse, rect';

  const hasStroke = (node, svg) => {
    if (node.hasAttribute('data-no-draw')) return false;
    const own = node.getAttribute('stroke');
    if (own && own !== 'none') return true;
    const inherited = svg.getAttribute('stroke');
    if (inherited && inherited !== 'none') return true;
    try {
      const cs = getComputedStyle(node);
      return !!(cs.stroke && cs.stroke !== 'none' && cs.stroke !== 'rgba(0, 0, 0, 0)');
    } catch (_) {
      return false;
    }
  };

  const measureLen = (node) => {
    try {
      if (typeof node.getTotalLength === 'function') {
        return Math.max(1, node.getTotalLength());
      }
      if (node.tagName === 'line') {
        const x1 = parseFloat(node.getAttribute('x1') || 0);
        const y1 = parseFloat(node.getAttribute('y1') || 0);
        const x2 = parseFloat(node.getAttribute('x2') || 0);
        const y2 = parseFloat(node.getAttribute('y2') || 0);
        return Math.hypot(x2 - x1, y2 - y1) || 80;
      }
      if (node.tagName === 'circle') {
        return 2 * Math.PI * parseFloat(node.getAttribute('r') || 10);
      }
      if (node.tagName === 'rect') {
        const w = parseFloat(node.getAttribute('width') || 40);
        const h = parseFloat(node.getAttribute('height') || 20);
        return 2 * (w + h);
      }
      if (node.tagName === 'ellipse') {
        const rx = parseFloat(node.getAttribute('rx') || 20);
        const ry = parseFloat(node.getAttribute('ry') || 12);
        return Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
      }
    } catch (_) {
      /* fall through */
    }
    return 160;
  };

  const prepareSvg = (svg) => {
    if (svg.dataset.drawReady === '1') return;
    const nodes = Array.from(svg.querySelectorAll(SHAPE_SELECTOR)).filter((n) => hasStroke(n, svg));
    if (!nodes.length) return;

    svg.classList.add('svg-scroll-draw');
    svg.style.setProperty('--svg-draw', '0');

    nodes.forEach((node) => {
      const len = measureLen(node);
      node.style.setProperty('--draw-len', String(Math.ceil(len)));
      node.setAttribute('data-draw', '');
      if (!node.getAttribute('fill')) node.setAttribute('fill', 'none');
    });

    svg.dataset.drawReady = '1';
  };

  const sectionProgress = (el) => {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 800;
    const start = vh * 0.88;
    const end = vh * 0.18;
    const raw = (start - rect.top) / Math.max(1, start - end + rect.height * 0.35);
    return Math.max(0, Math.min(1, raw));
  };

  const initSvgScroll = () => {
    if (reduce) {
      document.querySelectorAll('svg').forEach((svg) => {
        prepareSvg(svg);
        svg.style.setProperty('--svg-draw', '1');
        svg.classList.add('is-drawn');
      });
      return;
    }

    // Explicit targets + decorative inline SVGs in main content
    const candidates = new Set([
      ...document.querySelectorAll('svg.svg-scroll-draw, [data-svg-draw] svg, svg[data-svg-draw]'),
      ...document.querySelectorAll(
        'main svg, .trust-micro-viz svg, .feature-schematic svg, .step-svg-visual svg, .hiw-pipeline-svg, .feature-icon-box svg, .problem-card svg, .diff-card svg, .console-shell svg'
      )
    ]);

    const svgs = Array.from(candidates).filter((svg) => {
      if (!(svg instanceof SVGElement)) return false;
      if (svg.closest('.site-header, .announcement-bar, .menu-toggle, .skip-link')) return false;
      return Array.from(svg.querySelectorAll(SHAPE_SELECTOR)).some((n) => hasStroke(n, svg));
    });

    svgs.forEach(prepareSvg);

    let ticking = false;
    const update = () => {
      ticking = false;
      svgs.forEach((svg) => {
        const host = svg.closest('section, article, .feature-tile, .trust-stat-card, .step-card, .console-shell, .cf-footer') || svg;
        const p = sectionProgress(host);
        svg.style.setProperty('--svg-draw', p.toFixed(3));
        if (p > 0.82) svg.classList.add('is-drawn');
      });
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    window.addEventListener('resize', update, { passive: true });
    update();
  };

  const boot = () => {
    initReveals();
    initSvgScroll();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
