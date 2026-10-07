// Agenda en línea del Dr. Elías Chirinos.
// Paso 1: servicio · Paso 2: día y hora libres · Paso 3: datos · Listo.
// Las horas vienen de la agenda real del doctor; la cita queda «por confirmar»
// y la clínica la confirma por WhatsApp.

(function () {
  const config = window.AGENDA_CONFIG || {};
  const ZONA = "America/Tegucigalpa";
  const overlay = document.getElementById("chatOverlay");
  const raiz = document.getElementById("agendaWeb");
  if (!overlay || !raiz) return;

  // ---------------------------------------------------------------- apertura
  let ultimoFoco = null;
  const abrir = () => {
    ultimoFoco = document.activeElement;
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    if (!estado.servicios) cargarServicios();
    setTimeout(() => raiz.querySelector("button, input")?.focus(), 50);
  };
  const cerrar = () => {
    overlay.classList.remove("active");
    document.body.style.overflow = "";
    ultimoFoco?.focus?.();
  };
  document.querySelectorAll(".open-chat").forEach((b) => b.addEventListener("click", abrir));
  document.getElementById("chatClose")?.addEventListener("click", cerrar);
  overlay.addEventListener("click", (e) => e.target === overlay && cerrar());
  document.addEventListener("keydown", (e) => e.key === "Escape" && overlay.classList.contains("active") && cerrar());

  // ---------------------------------------------------------------- datos
  const estado = { paso: 1, servicios: null, servicio: null, dia: null, horas: null, hora: null, enviando: false, error: null, resultado: null };

  async function rpc(funcion, cuerpo) {
    const clave = config.clavePublica || "";
    const respuesta = await fetch(`${config.supabaseUrl}/rest/v1/rpc/${funcion}`, {
      method: "POST",
      headers: {
        apikey: clave,
        "Content-Type": "application/json",
        ...(clave.startsWith("eyJ") ? { Authorization: `Bearer ${clave}` } : {}),
      },
      body: JSON.stringify(cuerpo),
    });
    if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
    return respuesta.json();
  }

  async function cargarServicios() {
    estado.error = null;
    pintar();
    try {
      estado.servicios = await rpc("web_servicios", {});
    } catch {
      estado.error = "No pudimos cargar la agenda. Revisa tu conexión o escríbenos por WhatsApp.";
    }
    pintar();
  }

  async function cargarHoras(dia) {
    estado.dia = dia;
    estado.horas = null;
    estado.hora = null;
    estado.error = null;
    pintar();
    try {
      estado.horas = await rpc("web_horarios", { p_fecha: dia, p_servicio: estado.servicio.slug });
    } catch {
      estado.horas = [];
      estado.error = "No pudimos consultar las horas libres. Intenta de nuevo.";
    }
    pintar();
  }

  async function reservar(formulario) {
    const datos = Object.fromEntries(new FormData(formulario));
    estado.error = null;
    if (datos.sitio) return; // campo trampa para robots
    if (!String(datos.nombre || "").trim()) return mostrarError("Escribe tu nombre completo.");
    if (String(datos.telefono || "").replace(/\D/g, "").length < 8) return mostrarError("Escribe tu número de WhatsApp de 8 dígitos.");
    estado.enviando = true;
    pintar();
    try {
      const r = await rpc("web_reservar_cita", {
        p_nombre: datos.nombre,
        p_telefono: datos.telefono,
        p_servicio: estado.servicio.slug,
        p_inicio: estado.hora.inicio,
        p_correo: datos.correo || null,
        p_motivo: datos.motivo || null,
      });
      estado.enviando = false;
      if (!r.ok) {
        // Si la hora se ocupó, volvemos a mostrar las horas actualizadas.
        if (/hora/i.test(r.mensaje) && !/cita por confirmar/i.test(r.mensaje)) {
          estado.paso = 2;
          await cargarHoras(estado.dia);
        }
        return mostrarError(r.mensaje);
      }
      estado.resultado = { ...r, nombre: String(datos.nombre).trim().split(" ")[0] };
      estado.paso = 4;
      pintar();
    } catch {
      estado.enviando = false;
      mostrarError("No pudimos completar la reserva. Revisa tu conexión e intenta de nuevo.");
    }
  }

  function mostrarError(texto) {
    estado.error = texto;
    pintar();
  }

  // ---------------------------------------------------------------- fechas
  const fmtISO = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });
  const hoy = () => fmtISO.format(new Date());
  const sumarDias = (iso, n) => {
    const d = new Date(`${iso}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const diaSemana = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();
  const fmtDia = (iso, opciones) => new Intl.DateTimeFormat("es-HN", { timeZone: "UTC", ...opciones }).format(new Date(`${iso}T12:00:00Z`));
  const fmtHora = (horaLocal) => {
    const [h, m] = horaLocal.split(":").map(Number);
    return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
  };
  const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  /** Próximos días con atención (lunes a sábado), empezando hoy. */
  function proximosDias(cantidad) {
    const dias = [];
    for (let i = 0; dias.length < cantidad && i < 30; i++) {
      const d = sumarDias(hoy(), i);
      if (diaSemana(d) !== 0) dias.push(d);
    }
    return dias;
  }

  // ---------------------------------------------------------------- vista
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  function pasos() {
    const nombres = ["Servicio", "Día y hora", "Tus datos"];
    return `<ol class="agenda-pasos" aria-label="Pasos">${nombres
      .map((n, i) => `<li class="${estado.paso === i + 1 ? "actual" : estado.paso > i + 1 ? "hecho" : ""}">${n}</li>`)
      .join("")}</ol>`;
  }

  function error() {
    return estado.error ? `<p class="agenda-error" role="alert">${esc(estado.error)}</p>` : "";
  }

  function vistaServicios() {
    if (!estado.servicios) {
      return estado.error ? error() : `<p class="agenda-cargando">Cargando servicios…</p>`;
    }
    return `
      <h3 class="agenda-titulo">¿Qué necesitas?</h3>
      <div class="agenda-servicios">
        ${estado.servicios
          .map(
            (s, i) => `
          <button type="button" class="agenda-servicio" data-servicio="${i}">
            <span class="agenda-servicio-nombre">${esc(s.nombre)}</span>
            ${s.descripcion ? `<span class="agenda-servicio-desc">${esc(s.descripcion)}</span>` : ""}
            <span class="agenda-servicio-dur">${s.duracion_minutos} min</span>
          </button>`,
          )
          .join("")}
      </div>
      <p class="agenda-nota">¿Implantes, carga inmediata o rehabilitación completa? Empieza con una <strong>valoración</strong>: el doctor te explica el tratamiento ideal.</p>
      ${error()}`;
  }

  function vistaHorario() {
    const dias = proximosDias(14);
    const horas = estado.horas;
    let bloqueHoras = `<p class="agenda-nota">Elige un día para ver las horas libres.</p>`;
    if (estado.dia && horas === null) bloqueHoras = `<p class="agenda-cargando">Buscando horas libres…</p>`;
    if (estado.dia && horas && horas.length === 0)
      bloqueHoras = `<p class="agenda-vacio">No quedan horas libres ese día. Prueba con otro.</p>`;
    if (estado.dia && horas && horas.length > 0)
      bloqueHoras = `
        <div class="agenda-horas" role="radiogroup" aria-label="Horas libres">
          ${horas
            .map(
              (h, i) =>
                `<button type="button" role="radio" aria-checked="${estado.hora?.inicio === h.inicio}" class="agenda-hora ${estado.hora?.inicio === h.inicio ? "elegida" : ""}" data-hora="${i}">${fmtHora(h.hora_local)}</button>`,
            )
            .join("")}
        </div>`;

    return `
      <button type="button" class="agenda-volver" data-ir="1">← ${esc(estado.servicio.nombre)}</button>
      <h3 class="agenda-titulo">Elige el día</h3>
      <div class="agenda-dias" role="radiogroup" aria-label="Días">
        ${dias
          .map(
            (d) => `
          <button type="button" role="radio" aria-checked="${estado.dia === d}" class="agenda-dia ${estado.dia === d ? "elegido" : ""}" data-dia="${d}">
            <span>${d === hoy() ? "Hoy" : capitalizar(fmtDia(d, { weekday: "short" }).replace(".", ""))}</span>
            <strong>${fmtDia(d, { day: "numeric" })}</strong>
            <span>${fmtDia(d, { month: "short" }).replace(".", "")}</span>
          </button>`,
          )
          .join("")}
      </div>
      ${estado.dia ? `<h3 class="agenda-titulo">${capitalizar(fmtDia(estado.dia, { weekday: "long", day: "numeric", month: "long" }))}</h3>` : ""}
      ${bloqueHoras}
      ${error()}
      <button type="button" class="btn btn-dark full agenda-siguiente" data-ir="3" ${estado.hora ? "" : "disabled"}>Continuar</button>`;
  }

  function resumen() {
    return `<p class="agenda-resumen"><strong>${esc(estado.servicio.nombre)}</strong><br>${capitalizar(
      fmtDia(estado.dia, { weekday: "long", day: "numeric", month: "long" }),
    )} · ${fmtHora(estado.hora.hora_local)}</p>`;
  }

  function vistaDatos() {
    return `
      <button type="button" class="agenda-volver" data-ir="2">← Cambiar día u hora</button>
      ${resumen()}
      <form class="agenda-form" novalidate>
        <label>Nombre completo<input name="nombre" autocomplete="name" required></label>
        <label>WhatsApp<input name="telefono" inputmode="tel" autocomplete="tel" placeholder="9999-8888" required></label>
        <label>Correo electrónico <span>(opcional)</span><input name="correo" type="email" autocomplete="email"></label>
        <label>¿Algo que el doctor deba saber? <span>(opcional)</span><textarea name="motivo" rows="2" maxlength="500"></textarea></label>
        <label class="agenda-trampa" aria-hidden="true">Sitio web<input name="sitio" tabindex="-1" autocomplete="off"></label>
        ${error()}
        <button class="btn btn-dark full" type="submit" ${estado.enviando ? "disabled" : ""}>${estado.enviando ? "Reservando…" : "Reservar mi cita"}</button>
        <p class="agenda-nota">Tu cita queda reservada y te escribimos por WhatsApp para confirmarla.</p>
      </form>`;
  }

  function vistaListo() {
    const r = estado.resultado;
    return `
      <div class="agenda-listo" role="status">
        <div class="agenda-check" aria-hidden="true">✓</div>
        <h3 class="agenda-titulo">¡Listo, ${esc(r.nombre)}!</h3>
        ${resumen()}
        <p>${esc(r.mensaje)}</p>
        ${config.whatsapp ? `<p class="agenda-nota">¿Necesitas cambiarla? Escríbenos al ${esc(config.whatsapp)}.</p>` : ""}
        <button type="button" class="btn btn-dark full" data-cerrar>Cerrar</button>
      </div>`;
  }

  function pintar() {
    // Conserva lo escrito en el formulario si hay que repintar (por ejemplo, para mostrar un error).
    const previo = raiz.querySelector(".agenda-form");
    const escrito = previo ? Object.fromEntries(new FormData(previo)) : null;
    const contenido = { 1: vistaServicios, 2: vistaHorario, 3: vistaDatos, 4: vistaListo }[estado.paso]();
    raiz.innerHTML = `${estado.paso < 4 ? pasos() : ""}<div class="agenda-cuerpo">${contenido}</div>`;
    const nuevo = raiz.querySelector(".agenda-form");
    if (nuevo && escrito) for (const [k, v] of Object.entries(escrito)) if (nuevo.elements[k]) nuevo.elements[k].value = v;
  }

  // ---------------------------------------------------------------- eventos
  raiz.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.servicio !== undefined) {
      estado.servicio = estado.servicios[+b.dataset.servicio];
      estado.paso = 2;
      estado.error = null;
      const primerDia = proximosDias(1)[0];
      cargarHoras(estado.dia && estado.dia >= hoy() ? estado.dia : primerDia);
      return;
    }
    if (b.dataset.dia) return cargarHoras(b.dataset.dia);
    if (b.dataset.hora !== undefined) {
      estado.hora = estado.horas[+b.dataset.hora];
      estado.error = null;
      return pintar();
    }
    if (b.dataset.ir) {
      estado.paso = +b.dataset.ir;
      estado.error = null;
      pintar();
      raiz.querySelector(estado.paso === 3 ? "input" : "button")?.focus();
      return;
    }
    if (b.dataset.cerrar !== undefined) {
      cerrar();
      Object.assign(estado, { paso: 1, servicio: null, dia: null, horas: null, hora: null, resultado: null, error: null });
      pintar();
    }
  });

  raiz.addEventListener("submit", (e) => {
    e.preventDefault();
    reservar(e.target);
  });

  pintar();
})();

// Barra fija del teléfono: aparece solo cuando el botón principal del hero ya no está a la vista
// ni el de la llamada final, para no mostrar dos botones iguales a la vez.
(function () {
  const barra = document.querySelector(".barra-movil");
  const visibles = new Set();
  const objetivos = document.querySelectorAll(".hero-accion, .cta-final");
  if (!barra || !objetivos.length || !("IntersectionObserver" in window)) {
    barra?.classList.add("visible");
    return;
  }
  const observador = new IntersectionObserver((entradas) => {
    for (const e of entradas) e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target);
    barra.classList.toggle("visible", visibles.size === 0);
  });
  objetivos.forEach((o) => observador.observe(o));
})();
