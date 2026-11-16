// Daiana Contrera (dirección B «Portada»): menú del celular, la sección en la que se está, botones de copiar, el visor
// (cualquier foto de la página se abre en grande), apariciones al bajar y videos que andan sólo a la vista.
(() => {
  document.documentElement.classList.add('js');
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dos = n => String(n).padStart(2, '0');

  // Menú del celular.
  const cab = document.getElementById('cabecera');
  const boton = cab && cab.querySelector('.menu-boton');
  if (boton) {
    const abrir = si => {
      cab.classList.toggle('abierta', si);
      boton.setAttribute('aria-expanded', si);
      boton.textContent = si ? 'Cerrar' : 'Menú';
    };
    boton.addEventListener('click', () => abrir(!cab.classList.contains('abierta')));
    cab.querySelectorAll('nav a').forEach(a => a.addEventListener('click', () => abrir(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') abrir(false); });
  }

  // La barra marca la sección que se está leyendo: la última cuyo comienzo ya pasó por debajo de la barra.
  if (cab) {
    const enlaces = [...cab.querySelectorAll('nav a[href^="#"]')];
    const destinos = enlaces.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    if (destinos.length) {
      let pedido = false;
      const marcar = () => {
        pedido = false;
        const linea = innerHeight * 0.4;
        let actual = null;
        destinos.forEach(d => { if (d.getBoundingClientRect().top <= linea) actual = d; });
        enlaces.forEach(a => {
          if (actual && a.getAttribute('href') === '#' + actual.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      };
      addEventListener('scroll', () => { if (!pedido) { pedido = true; requestAnimationFrame(marcar); } }, { passive: true });
      marcar();
    }
  }

  // Copiar un correo, una cita o una biografía; el aviso va en el mismo botón.
  document.querySelectorAll('[data-copiar]').forEach(b => b.addEventListener('click', async () => {
    const valor = b.dataset.copiar;
    const texto = valor.startsWith('#')
      ? [...document.querySelectorAll(`${valor} p`)].map(p => p.textContent.trim()).join('\n\n')
      : valor;
    try { await navigator.clipboard.writeText(texto); b.textContent = 'Copiado'; }
    catch { b.textContent = 'No se pudo copiar'; }
    setTimeout(() => { b.textContent = b.dataset.rotulo; }, 2200);
  }));

  // El visor: todas las fotos de la página (no los videos) se abren en grande, en el orden en que aparecen, con
  // flechas, teclado y deslizamiento. El pie dice el capítulo, lo que muestra la foto y su crédito.
  const visor = document.getElementById('visor');
  if (visor && visor.showModal) {
    const fotos = [...document.querySelectorAll('main figure')].filter(f => f.querySelector('picture') && !f.querySelector('.clip') && !f.closest('.tapa'));
    const marco = visor.querySelector('.visor-marco'), pie = visor.querySelector('.visor-pie');
    const dato = (f, nombre) => {
      const el = f.closest(`[data-${nombre}]`);
      return el ? el.dataset[nombre] : '';
    };
    const rotulo = f => {
      const fc = f.querySelector('figcaption');
      return [dato(f, 'cap'), f.dataset.nombre || (fc ? fc.textContent.trim() : ''), dato(f, 'credito')].filter(Boolean).join(' · ');
    };
    let actual = 0;
    const armar = i => {
      const pic = fotos[i].querySelector('picture').cloneNode(true);
      pic.querySelectorAll('source, img').forEach(el => el.setAttribute('sizes', '100vw'));
      const img = pic.querySelector('img');
      img.removeAttribute('loading');
      img.removeAttribute('style');
      return pic;
    };
    const mostrar = i => {
      actual = (i + fotos.length) % fotos.length;
      marco.replaceChildren(armar(actual));
      const b = document.createElement('b');
      b.textContent = `${dos(actual + 1)} / ${dos(fotos.length)}`;
      pie.replaceChildren(b, rotulo(fotos[actual]));
      // la siguiente se va bajando mientras se mira ésta
      const sig = fotos[(actual + 1) % fotos.length].querySelector('img');
      if (sig && sig.loading === 'lazy') sig.loading = 'eager';
    };
    fotos.forEach((f, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ampliar';
      const img = f.querySelector('img');
      b.setAttribute('aria-label', `Ver en grande la foto ${i + 1} de ${fotos.length}: ${img.alt}`);
      // al abrir, el foco va al marco: las flechas del teclado andan y ningún botón queda resaltado
      b.addEventListener('click', () => { mostrar(i); visor.showModal(); marco.focus({ preventScroll: true }); });
      f.classList.add('con-ampliar');
      f.append(b);
    });
    visor.querySelector('.visor-cerrar').addEventListener('click', () => visor.close());
    visor.querySelector('.visor-ant').addEventListener('click', () => mostrar(actual - 1));
    visor.querySelector('.visor-sig').addEventListener('click', () => mostrar(actual + 1));
    visor.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); mostrar(actual - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); mostrar(actual + 1); }
    });
    // un toque fuera de la foto (en el fondo del visor) también cierra
    visor.addEventListener('click', e => { if (e.target === visor || e.target === marco) visor.close(); });
    visor.addEventListener('close', () => {
      marco.replaceChildren();
      const b = fotos[actual].querySelector('.ampliar');
      if (b) b.focus({ preventScroll: true });
    });
    let x0 = null;
    marco.addEventListener('pointerdown', e => { x0 = e.clientX; });
    marco.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1));
    });
  }

  // Apariciones: títulos y textos.
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.revelar').forEach(el => io.observe(el));

  // Videos: eligen el ancho justo para su caja y andan sólo mientras se ven. Con movimiento reducido, queda la imagen.
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
  // Los videos esperan a que la página termine de cargar: primero se ve la tapa.
  const arrancar = () => setTimeout(() => document.querySelectorAll('.clip').forEach(c => vio.observe(c)), 400);
  if (document.readyState === 'complete') arrancar(); else addEventListener('load', arrancar, { once: true });
})();
