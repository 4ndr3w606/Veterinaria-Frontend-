export interface Service {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export const SERVICES: Service[] = [
  {
    id: '1',
    title: 'Consulta General',
    description: 'Revisión completa de salud para tu mascota.',
    iconName: 'Stethoscope',
  },
  {
    id: '2',
    title: 'Vacunación y Desparasitación',
    description: 'Esquema completo de protección sanitaria.',
    iconName: 'Syringe',
  },
];