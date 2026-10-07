// Conexión pública con el sistema de la clínica (Supabase).
// Esta es la clave PUBLICABLE: está hecha para ir en una página web. Solo permite
// ver los servicios reservables, consultar horas libres y reservar una cita «por confirmar».
// Nunca pongas aquí la clave secreta (service_role).
window.AGENDA_CONFIG = {
  supabaseUrl: "https://oqoinutwttajwxgnnbrp.supabase.co",
  clavePublica: "sb_publishable_VHMQTvfvzAWeyretpz8ZzQ_uPzoKji0",
  whatsapp: "+504 9911-5127",
};
