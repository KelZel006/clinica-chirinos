# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Adultos de 40 años o más con pérdida dental**: perdieron una o varias piezas y evalúan implantes o una rehabilitación completa. Deciden con calma, comparan opciones y necesitan confianza antes de agendar.
- **Adultos jóvenes interesados en estética dental**: buscan mejorar su sonrisa y odontología integral.
- **Familiares que deciden**: hijos o parientes que investigan y agendan la valoración para otra persona (a menudo sus padres).

Todos llegan desde el teléfono con frecuencia y terminan la conversación por WhatsApp.

## Product Purpose

Sitio web de la clínica del Dr. Elías Chirinos, Cirujano Dentista e Implantólogo con 17 años de experiencia, en Danlí, El Paraíso, Honduras (Barrio Abajo, frente a Ferretería Manineña). Su trabajo es convertir a un visitante en una **valoración agendada**: el visitante abre el chat de agenda, deja nombre, WhatsApp, motivo y fecha preferida, y la clínica confirma la hora exacta por WhatsApp.

Éxito = solicitudes de valoración completas que llegan a la agenda.

## Positioning

- **Especialista en implantes**: implantes unitarios, carga inmediata y rehabilitación completa (All-on-4 / All-on-6) son el centro de la práctica, no un servicio más.
- **Alta calidad de implantes** y materiales.
- **Trato cercano**: el doctor acompaña al paciente antes, durante y después del tratamiento.
- **Facilidades de pago**: planes de pago y abonos en Lempiras para tratamientos grandes.

## Operating Context

- Flujo: web → chat de agenda → webhook de n8n → registro en el sistema de gestión (Supabase, proyecto `Clinica-Odontologica`) → confirmación por WhatsApp.
- Horario: lunes a viernes 8:00–18:00, sábado 8:00–13:00. Atención con cita previa.
- Proceso del paciente: Valoración → Planificación → Procedimiento → Nueva sonrisa.
- Idioma: español (Honduras). Moneda: Lempiras.

## Capabilities and Constraints

- Sitio estático: `index.html`, `styles.css`, `script.js`. Sin framework ni build.
- La agenda en línea (`script.js`) reserva directo en la agenda real mediante las funciones públicas de Supabase `web_servicios`, `web_horarios` y `web_reservar_cita`, con la clave **publicable** de `config.js` (nunca la secreta). La cita queda «por confirmar» y la clínica la confirma por WhatsApp.
- Los servicios que aparecen en la agenda son los marcados «Se puede reservar desde la web» en el catálogo del sistema (`Clinica-Odontologica`).

## Brand Commitments

- Nombre: Dr. Elías Chirinos (en el sistema interno: Dr. Elías Renato Chirinos).
- Logo: `logo-clinica.png` (versión corregida "Cirujano Dentista e Implantólogo"; derivado web `assets/logo-clinica.webp`).
- Lema en uso: "Sonrisas para toda la vida" / "Más que dientes, mejores historias."

## Evidence on Hand

- `assets/fotos/doctor-consultorio.png`: el doctor de pie en su consultorio, con gabacha blanca bordada "Odontólogo", lupas y mascarilla; detrás, el sillón dental y un monitor con una radiografía panorámica.
- `assets/fotos/doctor-atendiendo-paciente.jpg`: el doctor atendiendo a una paciente (rostro de la paciente no visible).
- **No hay**: retrato profesional sin mascarilla, casos antes/después, testimonios, fotos de instalaciones ni cifras de pacientes atendidos. No inventarlos; mantener los espacios como pendientes.
- WhatsApp de la clínica: +504 9911-5127.
- Experiencia del doctor: 17 años.
- Formación: Odontología en la Universidad Católica de Honduras (UNICAH).

## Product Principles

1. **Una sola acción**: todo el sitio empuja a agendar la valoración; nada compite con eso.
2. **Confianza antes que persuasión**: especialidad, acompañamiento y pago accesible, contados con hechos reales, sin promesas ni pruebas inventadas.
3. **Hecho para el teléfono y para WhatsApp**: el recorrido completo funciona con una mano y termina en una conversación.
4. **Claro para quien decide por otro**: un familiar debe entender el proceso y agendar sin ser el paciente.

## Accessibility & Inclusion

Inferido del público (por confirmar): con usuarios de 40 años o más, texto legible a tamaño cómodo, contraste alto y controles grandes al tacto.
