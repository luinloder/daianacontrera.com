// Daiana Contrera: cabecera que cambia de fondo, botones de copiar, apariciones al bajar y videos que andan sólo a la vista.
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
    const sobreApertura = !!apertura && scrollY < 40 && apertura.getBoundingClientRect().bottom > y;
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

  // Copiar un correo o una biografía; el aviso va en el mismo botón.
  document.querySelectorAll('[data-copiar]').forEach(b => b.addEventListener('click', async () => {
    const valor = b.dataset.copiar;
    const texto = valor.startsWith('#')
      ? [...document.querySelectorAll(`${valor} p`)].map(p => p.textContent.trim()).join('\n\n')
      : valor;
    try { await navigator.clipboard.writeText(texto); b.textContent = 'Copiado'; }
    catch { b.textContent = 'No se pudo copiar'; }
    setTimeout(() => { b.textContent = b.dataset.rotulo; }, 2200);
  }));

  // Galería de Punta Cana: flechas, capítulos, cuenta y visor en grande. Sin JavaScript, la tira se desplaza igual.
  document.querySelectorAll('[data-galeria]').forEach(gal => {
    const pista = gal.querySelector('.gal-pista');
    const fotos = [...pista.querySelectorAll('.gal-foto')];
    const chips = [...gal.querySelectorAll('.gal-chip')];
    const num = gal.querySelector('.gal-num'), nombre = gal.querySelector('.gal-nombre'), bajada = gal.querySelector('.gal-bajada');
    const ant = gal.querySelector('.gal-ant'), sig = gal.querySelector('.gal-sig');
    const dos = n => String(n).padStart(2, '0');
    let actual = 0;
    const ir = i => {
      i = Math.max(0, Math.min(fotos.length - 1, i));
      const margen = parseFloat(getComputedStyle(pista).scrollPaddingInlineStart) || 0;
      pista.scrollTo({ left: fotos[i].offsetLeft - margen, behavior: quieto ? 'auto' : 'smooth' });
    };
    const marcar = () => {
      const borde = pista.getBoundingClientRect().left + (parseFloat(getComputedStyle(pista).scrollPaddingInlineStart) || 0);
      let mejor = 0, dist = Infinity;
      fotos.forEach((f, i) => { const d = Math.abs(f.getBoundingClientRect().left - borde); if (d < dist) { dist = d; mejor = i; } });
      actual = mejor;
      const f = fotos[actual];
      num.textContent = dos(actual + 1);
      nombre.textContent = f.dataset.nombre;
      bajada.textContent = f.dataset.bajada;
      chips.forEach(c => c.setAttribute('aria-current', c.dataset.cap === f.dataset.cap ? 'true' : 'false'));
      ant.disabled = pista.scrollLeft <= 2;
      sig.disabled = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 2;
    };
    let espera = false;
    pista.addEventListener('scroll', () => { if (!espera) { espera = true; requestAnimationFrame(() => { espera = false; marcar(); }); } }, { passive: true });
    addEventListener('resize', marcar);
    ant.addEventListener('click', () => ir(actual - 1));
    sig.addEventListener('click', () => ir(actual + 1));
    chips.forEach(c => c.addEventListener('click', e => {
      e.preventDefault();
      ir(fotos.findIndex(f => f.dataset.cap === c.dataset.cap));
    }));
    marcar();

    // El visor: la foto en grande, con flechas, teclado y deslizamiento.
    const visor = gal.querySelector('.visor');
    const marco = visor.querySelector('.visor-marco'), pie = visor.querySelector('.visor-pie');
    let enVisor = 0;
    const mostrar = i => {
      enVisor = (i + fotos.length) % fotos.length;
      const f = fotos[enVisor];
      const pic = f.querySelector('picture').cloneNode(true);
      pic.querySelectorAll('source, img').forEach(el => el.setAttribute('sizes', '100vw'));
      const img = pic.querySelector('img');
      img.removeAttribute('loading');
      marco.replaceChildren(pic);
      pie.textContent = `${dos(enVisor + 1)} / ${dos(fotos.length)} · ${f.dataset.nombre}${f.dataset.credito ? ' · ' + f.dataset.credito : ''}`;
    };
    fotos.forEach((f, i) => f.querySelector('.gal-abrir').addEventListener('click', () => { mostrar(i); visor.showModal(); }));
    visor.querySelector('.visor-cerrar').addEventListener('click', () => visor.close());
    visor.querySelector('.visor-ant').addEventListener('click', () => mostrar(enVisor - 1));
    visor.querySelector('.visor-sig').addEventListener('click', () => mostrar(enVisor + 1));
    visor.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); mostrar(enVisor - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); mostrar(enVisor + 1); }
    });
    visor.addEventListener('close', () => {
      ir(enVisor);
      fotos[enVisor].querySelector('.gal-abrir').focus({ preventScroll: true });
    });
    let x0 = null;
    marco.addEventListener('pointerdown', e => { x0 = e.clientX; });
    marco.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) mostrar(enVisor + (dx < 0 ? 1 : -1));
    });
  });

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
