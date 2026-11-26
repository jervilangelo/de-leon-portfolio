(() => {
  const deck = document.querySelector('.project-deck');
  const restack = document.querySelector('.project-deck-restack');
  const cards = Array.from(deck.children);
  const links = cards.map(card => card.querySelector('a'));
  const tablet = matchMedia('(min-width: 600px)');
  const desktop = matchMedia('(min-width: 930px)');
  const tilts = [-5, -4, -5, -4, -3, -2, -3, -2, 0, 3];

  deck.style.setProperty('--last-index', cards.length - 1);
  cards.forEach((card, index) => {
    card.style.setProperty('--index', index);
    card.style.setProperty('--tilt', `${tilts[index]}deg`);
  });

  function updateLayout() {
    const expanded = deck.hasAttribute('data-expanded');
    const visibleCount = expanded ? cards.length : desktop.matches ? 3 : tablet.matches ? 2 : 1;
    const pileCount = cards.length - visibleCount;

    restack.hidden = !expanded;
    deck.style.setProperty('--pile-count', pileCount);
    deck.style.setProperty('--visible-count', visibleCount);

    cards.forEach((card, index) => {
      const piled = index < pileCount;
      const link = links[index];
      const opener = !expanded && !piled;
      card.toggleAttribute('data-pile', piled);
      card.inert = piled;
      card.ariaHidden = piled ? 'true' : null;
      link.role = opener ? 'button' : null;
      link.ariaExpanded = opener ? 'false' : null;

      if (opener) {
        link.setAttribute('aria-controls', deck.id);
        link.setAttribute('aria-describedby', 'project-deck-instructions');
      } else {
        link.removeAttribute('aria-controls');
        link.removeAttribute('aria-describedby');
      }
    });
  }

  updateLayout();
  deck.setAttribute('data-ready', '');
  tablet.addEventListener('change', updateLayout);
  desktop.addEventListener('change', updateLayout);

  restack.addEventListener('click', () => {
    deck.removeAttribute('data-expanded');
    updateLayout();
    links[links.length - 1].focus({ preventScroll: true });
  });

  deck.addEventListener('click', event => {
    if (deck.hasAttribute('data-expanded')) return;

    event.preventDefault();
    deck.setAttribute('data-expanded', '');
    updateLayout();
    if (event.detail === 0) links[0].focus({ preventScroll: true });
  });

  deck.addEventListener('keydown', event => {
    const card = event.target.closest('[role="button"]');
    if (event.key !== ' ' || !card) return;

    event.preventDefault();
    if (!event.repeat) card.click();
  });

  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    deck.setAttribute('data-dealt', '');
  } else {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;

      deck.setAttribute('data-dealt', '');
      observer.disconnect();
    }, { threshold: .5 });

    observer.observe(document.querySelector('.project-showcase-head'));
  }
})();
