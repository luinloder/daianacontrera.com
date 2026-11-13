// Daiana Contrera (dirección B «Portada»): menú del celular, botones de copiar, la hoja de Punta Cana con su visor,
// apariciones al bajar y videos que andan sólo a la vista.
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

  // «Punta Cana, foto por foto»: cada foto se abre en grande, con flechas, teclado y deslizamiento.
  document.querySelectorAll('[data-hoja]').forEach(hoja => {
    const fotos = [...hoja.querySelectorAll('.h-foto')];
    const visor = hoja.querySelector('.visor');
    const marco = visor.querySelector('.visor-marco'), pie = visor.querySelector('.visor-pie');
    let actual = 0;
    const mostrar = i => {
      actual = (i + fotos.length) % fotos.length;
      const f = fotos[actual];
      const pic = f.querySelector('picture').cloneNode(true);
      pic.querySelectorAll('source, img').forEach(el => el.setAttribute('sizes', '100vw'));
      pic.querySelector('img').removeAttribute('loading');
      marco.replaceChildren(pic);
      pie.textContent = `${dos(actual + 1)} / ${dos(fotos.length)} · ${f.dataset.nombre}${f.dataset.credito ? ' · ' + f.dataset.credito : ''}`;
    };
    fotos.forEach((f, i) => f.querySelector('.h-abrir').addEventListener('click', () => { mostrar(i); visor.showModal(); }));
    visor.querySelector('.visor-cerrar').addEventListener('click', () => visor.close());
    visor.querySelector('.visor-ant').addEventListener('click', () => mostrar(actual - 1));
    visor.querySelector('.visor-sig').addEventListener('click', () => mostrar(actual + 1));
    visor.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); mostrar(actual - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); mostrar(actual + 1); }
    });
    visor.addEventListener('close', () => fotos[actual].querySelector('.h-abrir').focus({ preventScroll: true }));
    let x0 = null;
    marco.addEventListener('pointerdown', e => { x0 = e.clientX; });
    marco.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1));
    });
  });

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
