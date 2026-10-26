// Daiana Contrera: cabecera que cambia de fondo, apariciones al bajar y videos que andan sólo a la vista.
(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Cabecera: clara u oscura según la sección que tiene debajo.
  const cab = document.getElementById('cabecera');
  const oscuras = [...document.querySelectorAll('.trayectoria, .punta')];
  const apertura = document.getElementById('inicio');
  const pintarCabecera = () => {
    const y = cab.offsetHeight / 2;
    const sobreApertura = scrollY < 40 && apertura.getBoundingClientRect().bottom > y;
    const sobreOscura = oscuras.some(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom >= y; });
    cab.classList.toggle('oscura', !sobreApertura && sobreOscura);
    cab.classList.toggle('solida', !sobreApertura && !sobreOscura);
  };
  addEventListener('scroll', pintarCabecera, { passive: true });
  pintarCabecera();

  // Menú del celular.
  const boton = cab.querySelector('.menu-boton');
  const abrir = si => {
    cab.classList.toggle('abierta', si);
    boton.setAttribute('aria-expanded', si);
    boton.textContent = si ? 'Cerrar' : 'Menú';
  };
  boton.addEventListener('click', () => abrir(!cab.classList.contains('abierta')));
  cab.querySelectorAll('nav a').forEach(a => a.addEventListener('click', () => abrir(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') abrir(false); });

  // Apariciones.
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.revelar').forEach(el => io.observe(el));

  // Siluetas: se mueven a otro ritmo que la página al bajar.
  if (!quieto) {
    const capas = [...document.querySelectorAll('[data-paralaje]')];
    const ancho = matchMedia('(min-width: 900px)');
    let pendiente = false;
    const mover = () => {
      pendiente = false;
      if (!ancho.matches) { capas.forEach(el => { el.style.transform = ''; }); return; }
      const medio = innerHeight / 2;
      capas.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        el.style.transform = `translate3d(0, ${((r.top + r.height / 2 - medio) * Number(el.dataset.paralaje)).toFixed(1)}px, 0)`;
      });
    };
    addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(mover); } }, { passive: true });
    mover();
  }

  // Videos: eligen el ancho justo para su caja y andan sólo mientras se ven.
  if (quieto) return;
  const elegir = clip => {
    const anchos = clip.dataset.anchos.split(',').map(Number);
    const falta = clip.clientWidth * Math.min(devicePixelRatio || 1, 1.5);
    return anchos.find(w => w >= falta) || anchos[anchos.length - 1];
  };
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const clip = e.target, v = clip.querySelector('video');
    if (e.isIntersecting) {
      if (!v.src) {
        v.src = `${clip.dataset.clip}-${elegir(clip)}.h264.mp4`;
        v.addEventListener('playing', () => clip.classList.add('andando'), { once: true });
      }
      v.play().catch(() => {});
    } else if (v.src) {
      v.pause();
    }
  }), { threshold: 0.15 });
  // Los videos esperan a que la página termine de cargar: primero se ve la portada.
  const arrancar = () => setTimeout(() => document.querySelectorAll('.clip').forEach(c => vio.observe(c)), 400);
  if (document.readyState === 'complete') arrancar(); else addEventListener('load', arrancar, { once: true });
})();
