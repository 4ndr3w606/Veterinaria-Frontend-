import { Stethoscope, HeartPulse, ShieldCheck } from "lucide-react";

export const links = [
  ["Nuestra esencia", "nosotros"],
  ["Servicios", "servicios"],
  ["Tu visita", "visita"],
  ["Historias", "historias"],
] as const;

export const services = [
  { icon: Stethoscope, title: "Medicina preventiva", text: "Chequeos completos para que cada nueva aventura empiece con salud." },
  { icon: HeartPulse, title: "Cuidado especializado", text: "Diagnósticos precisos y atención diseñada alrededor de cada paciente." },
  { icon: ShieldCheck, title: "Vacunación y bienestar", text: "Protección y seguimiento en cada etapa de su vida." },
];

export const stats = [
  [2000, "+", "patitas atendidas"],
  [98, "%", "de familias que vuelven"],
  [12, "", "años cuidando con calma"],
] as const;

export const steps = [
  ["Reservas", "Eliges día y hora. Nos cuentas cómo está tu peludo."],
  ["Lo conocemos", "Empezamos con calma: primero olfatea, luego lo revisamos."],
  ["Te explicamos", "Sales con un plan claro y con todas tus dudas resueltas."],
];

export const reviews = [
  { name: "Valentina R.", pet: "Milo · Golden", initials: "VR", quote: "Por primera vez sentí que escuchaban a mi perro tanto como a mí." },
  { name: "Andrés M.", pet: "Nala · Gata rescatada", initials: "AM", quote: "El equipo explica todo con una tranquilidad que te hace sentir en casa." },
  { name: "Camila P.", pet: "Bruno · Mestizo", initials: "CP", quote: "Aquí la medicina y el amor por los animales van juntos." },
];

export const faqs = [
  ["¿Necesito cita previa?", "Sí. Así cada paciente tiene su tiempo y evitamos esperas largas."],
  ["¿Mi mascota tiene miedo, qué hago?", "Avísanos al reservar. Adaptamos el ritmo y la consulta a su carácter."],
  ["¿Atienden gatos y perros?", "Sí, atendemos ambos, con espacios y tiempos pensados para cada uno."],
];