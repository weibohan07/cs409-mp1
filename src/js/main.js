'use strict';

// All application behavior is native JavaScript. No runtime dependencies.
const header = document.getElementById('site-header');
const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
const sections = Array.from(document.querySelectorAll('[data-section]'));
const menuButton = document.querySelector('.menu-toggle');
const menu = document.getElementById('nav-links');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopMenu = window.matchMedia('(min-width: 641px)');

function closeMenu() {
  menu.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menu.classList.toggle('is-open', open);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.classList.contains('is-open')) {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!header.contains(event.target)) closeMenu();
});
desktopMenu.addEventListener('change', () => { if (desktopMenu.matches) closeMenu(); });

function updateNavigation() {
  header.classList.toggle('is-compact', window.scrollY > 24);
  const readingLine = header.getBoundingClientRect().bottom + 2;
  let active = sections[0].id;
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= readingLine) active = section.id;
  });
  // The short footer may never reach the header. It must still be selected at the bottom.
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3) {
    active = sections[sections.length - 1].id;
  }
  navLinks.forEach((link) => {
    if (link.hash === `#${active}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

let scrollFrame = 0;
function scheduleNavigationUpdate() {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    updateNavigation();
    scrollFrame = 0;
  });
}
window.addEventListener('scroll', scheduleNavigationUpdate, { passive: true });
window.addEventListener('resize', scheduleNavigationUpdate);
header.addEventListener('transitionend', scheduleNavigationUpdate);

function goToSection(hash, behavior, updateHistory = true) {
  const target = document.getElementById(hash.slice(1));
  if (!target) return;
  closeMenu();
  // Use the FINAL compact height, not the height partway through its transition.
  const navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-compact'));
  const top = hash === '#home' ? 0 : Math.max(0, window.scrollY + target.getBoundingClientRect().top - navHeight + 1);
  if (updateHistory && window.location.hash !== hash) window.history.pushState(null, '', hash);
  target.focus({ preventScroll: true });
  window.scrollTo({ top, behavior });
  scheduleNavigationUpdate();
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!document.getElementById(link.hash.slice(1))) return;
    event.preventDefault();
    goToSection(link.hash, reducedMotion.matches ? 'instant' : 'smooth');
  });
});
window.history.scrollRestoration = 'manual';
window.addEventListener('popstate', () => goToSection(window.location.hash || '#home', 'instant', false));
window.addEventListener('hashchange', () => goToSection(window.location.hash || '#home', 'instant', false));
window.addEventListener('load', () => {
  if (window.location.hash) goToSection(window.location.hash, 'instant', false);
  else updateNavigation();
});
updateNavigation();

// Carousel: arrows, direct selection, wraparound, and keyboard navigation.
const carousel = document.querySelector('.carousel');
const slides = Array.from(document.querySelectorAll('.slide'));
const dots = Array.from(document.querySelectorAll('[data-slide]'));
const status = document.querySelector('.slide-status');
const titles = slides.map((slide) => slide.querySelector('h3').textContent.replace(/\.$/, ''));
let currentSlide = 0;

function showSlide(index) {
  currentSlide = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => { slide.hidden = i !== currentSlide; });
  dots.forEach((dot, i) => {
    if (i === currentSlide) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });
  status.textContent = `${String(currentSlide + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')} — ${titles[currentSlide]}`;
}
document.querySelector('.previous').addEventListener('click', () => showSlide(currentSlide - 1));
document.querySelector('.next').addEventListener('click', () => showSlide(currentSlide + 1));
dots.forEach((dot) => dot.addEventListener('click', () => showSlide(Number(dot.dataset.slide))));
carousel.addEventListener('keydown', (event) => {
  const actions = { ArrowLeft: currentSlide - 1, ArrowRight: currentSlide + 1, Home: 0, End: slides.length - 1 };
  if (!Object.prototype.hasOwnProperty.call(actions, event.key)) return;
  event.preventDefault();
  // Do not leave keyboard focus inside a slide that is about to become hidden.
  if (slides[currentSlide].contains(document.activeElement)) carousel.focus({ preventScroll: true });
  showSlide(actions[event.key]);
});

const projectNotes = {
  syna: {
    title: 'Syna.',
    summary: 'Dependency and lifetime management for stateful TypeScript services.',
    idea:
      'Syna makes service dependencies and lifetimes explicit. Services declare what they depend on, create their resources during setup, and register cleanup in the same place. Execution environments determine which service instances can be reused and which need to be created for a new context.',
    details: [
      'Models dependencies, service creation, reuse, and cleanup as part of the runtime.',
      'Supports parent and child environments for contexts such as applications, tenants, and requests.',
      'Written for modern TypeScript and designed around explicit service declarations rather than process-wide singletons.'
    ]
  },

  oxidase: {
    title: 'Oxidase.',
    summary: 'A declarative HTTP service compiler and runtime written in Rust.',
    idea:
      'Oxidase treats gateway configuration as a program. It validates and compiles service definitions before publishing an immutable runtime snapshot that can serve sites, route requests, transform responses, proxy traffic, and manage shared HTTP resources.',
    details: [
      'Built in Rust around a compiled service graph rather than per-request configuration interpretation.',
      'Supports routing, proxying, transforms, limits, observability, TLS, HTTP/1, and HTTP/2 behavior.',
      'Uses atomic last-known-good reloads so invalid configuration changes do not replace the active runtime.'
    ]
  },

  curly: {
    title: 'remark-curly-directive.',
    summary: 'A curly-brace syntax extension for the Unified and Remark ecosystem.',
    idea:
      'The project adds syntax such as {{...}} to Markdown and converts it into typed MDAST nodes. The parser deliberately does not assign application-specific meaning to a directive, leaving those semantics to downstream Remark plugins.',
    details: [
      'Includes Micromark tokenization, MDAST conversion, and a Remark integration package.',
      'Supports one-, two-, and three-brace fence sizes with predictable fallback and escaping behavior.',
      'Preserves source positions and supports safe serialization back to Markdown.'
    ]
  }
};
const dialog = document.getElementById('project-dialog');
const closeButton = dialog.querySelector('.dialog-close');
const doneButton = dialog.querySelector('.dialog-done');
let dialogTrigger = null;

document.querySelectorAll('[data-project]').forEach((button) => {
  button.addEventListener('click', () => {
    const project = projectNotes[button.dataset.project];
    if (!project || dialog.open) return;
    dialogTrigger = button;
    document.getElementById('dialog-title').textContent = project.title;
    document.getElementById('dialog-summary').textContent = project.summary;
    document.getElementById('dialog-idea').textContent = project.idea;
    const list = document.getElementById('dialog-details');
    list.replaceChildren();
    project.details.forEach((detail) => {
      const item = document.createElement('li');
      item.textContent = detail;
      list.appendChild(item);
    });
    dialog.showModal();
    document.body.classList.add('modal-open');
  });
});
closeButton.addEventListener('click', () => dialog.close());
doneButton.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) dialog.close();
});
// Native showModal makes the rest of the page inert. Keep Tab cycling between the controls too.
dialog.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  if (event.shiftKey && document.activeElement === closeButton) {
    event.preventDefault(); doneButton.focus();
  } else if (!event.shiftKey && document.activeElement === doneButton) {
    event.preventDefault(); closeButton.focus();
  }
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  if (dialogTrigger) dialogTrigger.focus({ preventScroll: true });
});
