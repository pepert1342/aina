// Événements automatiques pour le calendrier AiNa
// Fêtes, jours fériés, événements commerciaux

export interface AutoEvent {
  title: string;
  date: string; // Format: MM-DD (mois-jour)
  type: 'ferie' | 'fete' | 'commercial' | 'saison';
  icon: string;
  description: string;
  suggestPost: boolean; // Suggérer de créer un post ?
}

// Fonction pour obtenir la date de Pâques (algorithme de Butcher)
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// Fonction pour obtenir les jours fériés mobiles (basés sur Pâques)
function getMobileHolidays(year: number): { date: Date; title: string; icon: string }[] {
  const easter = getEasterDate(year);
  
  // Lundi de Pâques (Pâques + 1)
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  
  // Ascension (Pâques + 39)
  const ascension = new Date(easter);
  ascension.setDate(easter.getDate() + 39);
  
  // Lundi de Pentecôte (Pâques + 50)
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 50);
  
  return [
    { date: easter, title: '🐣 Pâques', icon: '🐣' },
    { date: easterMonday, title: '🐣 Lundi de Pâques', icon: '🐣' },
    { date: ascension, title: '✝️ Ascension', icon: '✝️' },
    { date: pentecost, title: '✝️ Lundi de Pentecôte', icon: '✝️' }
  ];
}

// Fonction pour obtenir le nième jour d'un mois (ex: 2ème dimanche de mai)
function getNthDayOfMonth(year: number, month: number, dayOfWeek: number, n: number): Date {
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();
  const day = 1 + ((dayOfWeek - firstDayOfWeek + 7) % 7) + (n - 1) * 7;
  return new Date(year, month, day);
}

// Événements fixes (même date chaque année)
export const fixedEvents: AutoEvent[] = [
  // JOURS FÉRIÉS
  { title: '🎆 Jour de l\'An', date: '01-01', type: 'ferie', icon: '🎆', description: 'Bonne année !', suggestPost: true },
  { title: '👷 Fête du Travail', date: '05-01', type: 'ferie', icon: '👷', description: 'Jour férié', suggestPost: false },
  { title: '🕊️ Victoire 1945', date: '05-08', type: 'ferie', icon: '🕊️', description: 'Armistice', suggestPost: false },
  { title: '🇫🇷 Fête Nationale', date: '07-14', type: 'ferie', icon: '🇫🇷', description: '14 juillet', suggestPost: true },
  { title: '⛪ Assomption', date: '08-15', type: 'ferie', icon: '⛪', description: 'Jour férié', suggestPost: false },
  { title: '🕯️ Toussaint', date: '11-01', type: 'ferie', icon: '🕯️', description: 'Jour férié', suggestPost: false },
  { title: '🕊️ Armistice 1918', date: '11-11', type: 'ferie', icon: '🕊️', description: 'Jour férié', suggestPost: false },
  { title: '🎄 Noël', date: '12-25', type: 'ferie', icon: '🎄', description: 'Joyeux Noël !', suggestPost: true },
  
  // FÊTES COMMERCIALES
  { title: '💝 Saint-Valentin', date: '02-14', type: 'commercial', icon: '💝', description: 'Fête des amoureux', suggestPost: true },
  { title: '🍀 Saint-Patrick', date: '03-17', type: 'fete', icon: '🍀', description: 'Fête irlandaise', suggestPost: true },
  { title: '🐟 Poisson d\'Avril', date: '04-01', type: 'fete', icon: '🐟', description: 'Blagues et poissons !', suggestPost: true },
  { title: '🎃 Halloween', date: '10-31', type: 'commercial', icon: '🎃', description: 'Frissons et bonbons', suggestPost: true },
  { title: '🎅 Réveillon de Noël', date: '12-24', type: 'fete', icon: '🎅', description: 'Veille de Noël', suggestPost: true },
  { title: '🥂 Réveillon Nouvel An', date: '12-31', type: 'fete', icon: '🥂', description: 'Dernier jour de l\'année', suggestPost: true },
  
  // ÉVÉNEMENTS SAISONNIERS
  { title: '🌸 Printemps', date: '03-20', type: 'saison', icon: '🌸', description: 'Début du printemps', suggestPost: true },
  { title: '☀️ Été', date: '06-21', type: 'saison', icon: '☀️', description: 'Début de l\'été - Fête de la musique', suggestPost: true },
  { title: '🍂 Automne', date: '09-22', type: 'saison', icon: '🍂', description: 'Début de l\'automne', suggestPost: true },
  { title: '❄️ Hiver', date: '12-21', type: 'saison', icon: '❄️', description: 'Début de l\'hiver', suggestPost: false },
  
  // SOLDES & COMMERCE
  { title: '🏷️ Soldes d\'hiver', date: '01-10', type: 'commercial', icon: '🏷️', description: 'Début des soldes d\'hiver', suggestPost: true },
  { title: '🏷️ Soldes d\'été', date: '06-26', type: 'commercial', icon: '🏷️', description: 'Début des soldes d\'été', suggestPost: true },
  { title: '📚 Rentrée scolaire', date: '09-01', type: 'commercial', icon: '📚', description: 'C\'est la rentrée !', suggestPost: true },
  
  // ÉVÉNEMENTS SPÉCIAUX
  { title: '🎵 Fête de la Musique', date: '06-21', type: 'fete', icon: '🎵', description: 'Musique partout !', suggestPost: true },
  { title: '🏠 Journées du Patrimoine', date: '09-16', type: 'fete', icon: '🏠', description: 'Découverte du patrimoine', suggestPost: true },
  { title: '🌍 Journée de la Terre', date: '04-22', type: 'fete', icon: '🌍', description: 'Environnement', suggestPost: true },
];

// Fonction pour générer tous les événements d'une année
export function generateYearEvents(year: number): { date: Date; title: string; type: string; icon: string; description: string; suggestPost: boolean }[] {
  const events: { date: Date; title: string; type: string; icon: string; description: string; suggestPost: boolean }[] = [];
  
  // Ajouter les événements fixes
  fixedEvents.forEach(event => {
    const [month, day] = event.date.split('-').map(Number);
    events.push({
      date: new Date(year, month - 1, day),
      title: event.title,
      type: event.type,
      icon: event.icon,
      description: event.description,
      suggestPost: event.suggestPost
    });
  });
  
  // Ajouter les jours fériés mobiles (Pâques, Ascension, Pentecôte)
  const mobileHolidays = getMobileHolidays(year);
  mobileHolidays.forEach(holiday => {
    events.push({
      date: holiday.date,
      title: holiday.title,
      type: 'ferie',
      icon: holiday.icon,
      description: 'Jour férié',
      suggestPost: holiday.title.includes('Pâques')
    });
  });
  
  // Fête des mères (dernier dimanche de mai)
  const _feteDesMeres = getNthDayOfMonth(year, 4, 0, 4); void _feteDesMeres; // 4ème dimanche de mai généralement, mais c'est le dernier
  // En fait c'est plus complexe, on simplifie au dernier dimanche de mai
  const lastSundayMay = new Date(year, 5, 0); // Dernier jour de mai
  while (lastSundayMay.getDay() !== 0) {
    lastSundayMay.setDate(lastSundayMay.getDate() - 1);
  }
  events.push({
    date: lastSundayMay,
    title: '👩 Fête des Mères',
    type: 'commercial',
    icon: '👩',
    description: 'Bonne fête à toutes les mamans !',
    suggestPost: true
  });
  
  // Fête des pères (3ème dimanche de juin)
  const feteDesPeres = getNthDayOfMonth(year, 5, 0, 3);
  events.push({
    date: feteDesPeres,
    title: '👨 Fête des Pères',
    type: 'commercial',
    icon: '👨',
    description: 'Bonne fête à tous les papas !',
    suggestPost: true
  });
  
  // Black Friday (4ème vendredi de novembre)
  const blackFriday = getNthDayOfMonth(year, 10, 5, 4);
  events.push({
    date: blackFriday,
    title: '🛍️ Black Friday',
    type: 'commercial',
    icon: '🛍️',
    description: 'Promotions exceptionnelles !',
    suggestPost: true
  });
  
  // Cyber Monday (lundi après Black Friday)
  const cyberMonday = new Date(blackFriday);
  cyberMonday.setDate(blackFriday.getDate() + 3);
  events.push({
    date: cyberMonday,
    title: '💻 Cyber Monday',
    type: 'commercial',
    icon: '💻',
    description: 'Promotions en ligne !',
    suggestPost: true
  });
  
  // Trier par date
  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return events;
}

// Fonction pour obtenir les événements des 30 prochains jours
export function getUpcomingEvents(days: number = 30): { date: Date; title: string; type: string; icon: string; description: string; suggestPost: boolean; daysUntil: number }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + days);
  
  const currentYear = today.getFullYear();
  const nextYear = currentYear + 1;
  
  // Générer les événements pour cette année et l'année prochaine
  const allEvents = [...generateYearEvents(currentYear), ...generateYearEvents(nextYear)];
  
  // Filtrer les événements dans la période
  return allEvents
    .filter(event => event.date >= today && event.date <= endDate)
    .map(event => ({
      ...event,
      daysUntil: Math.ceil((event.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

// Fonction pour formater une date en français
export function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}
