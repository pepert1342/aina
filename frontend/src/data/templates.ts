// Templates data structure for all business types
// Each business type has categories with specific templates

export type FieldType = 'text' | 'textarea' | 'number' | 'price' | 'date' | 'time' | 'select' | 'checkbox' | 'repeatable';

export interface TemplateField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select fields
  suffix?: string; // e.g., "€" for prices
  repeatableFields?: TemplateField[]; // For repeatable groups
  maxItems?: number;
}

export interface TemplateStyle {
  id: string;
  name: string;
  colors: {
    background: string;
    text: string;
    accent: string;
  };
  font: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryIcon: string; // Icon component name
  badge?: string;
  fields: TemplateField[];
  styles: TemplateStyle[];
  defaultStyle: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  templates: Template[];
}

export interface BusinessTemplates {
  businessType: string;
  businessTypeAlt?: string[]; // Alternative names
  categories: TemplateCategory[];
}

// ============================================
// RESTAURANT / BAR / PUB TEMPLATES
// ============================================
export const restaurantTemplates: BusinessTemplates = {
  businessType: 'Restaurant',
  businessTypeAlt: ['Bar', 'Pub', 'Brasserie', 'Bistrot'],
  categories: [
    {
      id: 'menus',
      name: 'Menus et Cartes',
      icon: 'UtensilsIcon',
      templates: [
        {
          id: 'menu-du-jour',
          name: 'Menu du jour',
          description: 'Presentez votre menu du jour avec entree, plat et dessert',
          category: 'menus',
          categoryIcon: 'UtensilsIcon',
          fields: [
            { id: 'entree', label: 'Entree', type: 'text', placeholder: 'Ex: Salade de chevre chaud', required: true },
            { id: 'plat', label: 'Plat', type: 'text', placeholder: 'Ex: Magret de canard aux cerises', required: true },
            { id: 'dessert', label: 'Dessert', type: 'text', placeholder: 'Ex: Tarte aux pommes maison', required: true },
            { id: 'prix', label: 'Prix du menu', type: 'price', suffix: '€', required: true }
          ],
          styles: [
            { id: 'elegant', name: 'Elegant', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Playfair Display' },
            { id: 'rustique', name: 'Rustique', colors: { background: '#F4E4C9', text: '#5D4037', accent: '#8B4513' }, font: 'Merriweather' },
            { id: 'moderne', name: 'Moderne', colors: { background: '#FFFFFF', text: '#2C3E50', accent: '#3498DB' }, font: 'Montserrat' },
            { id: 'ardoise', name: 'Ardoise', colors: { background: '#2C3E50', text: '#FFFFFF', accent: '#F7B731' }, font: 'Permanent Marker' }
          ],
          defaultStyle: 'elegant'
        },
        {
          id: 'plat-du-jour',
          name: 'Plat du jour',
          description: 'Mettez en avant votre plat du jour',
          category: 'menus',
          categoryIcon: 'UtensilsIcon',
          badge: 'PLAT DU JOUR',
          fields: [
            { id: 'nom', label: 'Nom du plat', type: 'text', placeholder: 'Ex: Boeuf bourguignon', required: true },
            { id: 'description', label: 'Description courte', type: 'textarea', placeholder: 'Description appetissante...' },
            { id: 'prix', label: 'Prix', type: 'price', suffix: '€', required: true }
          ],
          styles: [
            { id: 'photo-overlay', name: 'Photo + overlay', colors: { background: '#000000', text: '#FFFFFF', accent: '#FF6B6B' }, font: 'Bebas Neue' },
            { id: 'minimaliste', name: 'Minimaliste', colors: { background: '#FFFFFF', text: '#1A1A2E', accent: '#C84B31' }, font: 'Raleway' },
            { id: 'gourmand', name: 'Gourmand', colors: { background: '#722F37', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Lora' }
          ],
          defaultStyle: 'photo-overlay'
        },
        {
          id: 'suggestion-chef',
          name: 'Suggestion du chef',
          description: 'La recommandation speciale du chef',
          category: 'menus',
          categoryIcon: 'UtensilsIcon',
          badge: 'SUGGESTION DU CHEF',
          fields: [
            { id: 'nom', label: 'Nom du plat', type: 'text', required: true },
            { id: 'description', label: 'Description', type: 'textarea' },
            { id: 'prix', label: 'Prix', type: 'price', suffix: '€', required: true },
            { id: 'chef', label: 'Nom du chef', type: 'text', placeholder: 'Optionnel' }
          ],
          styles: [
            { id: 'elegant', name: 'Elegant', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Playfair Display' },
            { id: 'moderne', name: 'Moderne', colors: { background: '#FFFFFF', text: '#2C3E50', accent: '#10B981' }, font: 'Poppins' }
          ],
          defaultStyle: 'elegant'
        },
        {
          id: 'carte-vins',
          name: 'Carte des vins',
          description: 'Presentez votre selection de vins',
          category: 'menus',
          categoryIcon: 'WineIcon',
          fields: [
            {
              id: 'vins',
              label: 'Liste des vins',
              type: 'repeatable',
              maxItems: 6,
              repeatableFields: [
                { id: 'nom', label: 'Nom du vin', type: 'text', required: true },
                { id: 'region', label: 'Region/Appellation', type: 'text' },
                { id: 'prixVerre', label: 'Prix verre', type: 'price', suffix: '€' },
                { id: 'prixBouteille', label: 'Prix bouteille', type: 'price', suffix: '€' }
              ]
            }
          ],
          styles: [
            { id: 'sombre', name: 'Elegant sombre', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#722F37' }, font: 'Cormorant Garamond' },
            { id: 'bordeaux', name: 'Bordeaux', colors: { background: '#722F37', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Playfair Display' },
            { id: 'moderne', name: 'Moderne', colors: { background: '#FFFFFF', text: '#2C3E50', accent: '#722F37' }, font: 'Montserrat' }
          ],
          defaultStyle: 'bordeaux'
        },
        {
          id: 'carte-bieres',
          name: 'Carte des bieres',
          description: 'Votre selection de bieres',
          category: 'menus',
          categoryIcon: 'WineIcon',
          fields: [
            {
              id: 'bieres',
              label: 'Liste des bieres',
              type: 'repeatable',
              maxItems: 8,
              repeatableFields: [
                { id: 'nom', label: 'Nom', type: 'text', required: true },
                { id: 'type', label: 'Type', type: 'select', options: ['Blonde', 'Brune', 'Ambree', 'IPA', 'Blanche', 'Stout', 'Autre'] },
                { id: 'prixDemi', label: 'Prix demi', type: 'price', suffix: '€' },
                { id: 'prixPinte', label: 'Prix pinte', type: 'price', suffix: '€' }
              ]
            }
          ],
          styles: [
            { id: 'pub', name: 'Pub irlandais', colors: { background: '#006400', text: '#FFFFFF', accent: '#FFBF00' }, font: 'Oswald' },
            { id: 'moderne', name: 'Moderne', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#FFBF00' }, font: 'Bebas Neue' },
            { id: 'craft', name: 'Craft', colors: { background: '#5D4037', text: '#FFFFFF', accent: '#B87333' }, font: 'Righteous' }
          ],
          defaultStyle: 'pub'
        },
        {
          id: 'carte-cocktails',
          name: 'Carte cocktails',
          description: 'Vos cocktails signature',
          category: 'menus',
          categoryIcon: 'WineIcon',
          fields: [
            {
              id: 'cocktails',
              label: 'Liste des cocktails',
              type: 'repeatable',
              maxItems: 6,
              repeatableFields: [
                { id: 'nom', label: 'Nom du cocktail', type: 'text', required: true },
                { id: 'ingredients', label: 'Ingredients', type: 'text' },
                { id: 'prix', label: 'Prix', type: 'price', suffix: '€', required: true }
              ]
            }
          ],
          styles: [
            { id: 'neon', name: 'Neon', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#FF69B4' }, font: 'Bebas Neue' },
            { id: 'tropical', name: 'Tropical', colors: { background: '#4ECDC4', text: '#FFFFFF', accent: '#FF6B6B' }, font: 'Pacifico' },
            { id: 'elegant', name: 'Elegant', colors: { background: '#2C3E50', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Playfair Display' },
            { id: 'speakeasy', name: 'Speakeasy', colors: { background: '#1A1A2E', text: '#D4AF37', accent: '#722F37' }, font: 'Abril Fatface' }
          ],
          defaultStyle: 'neon'
        },
        {
          id: 'menu-brunch',
          name: 'Menu brunch',
          description: 'Presentez vos formules brunch',
          category: 'menus',
          categoryIcon: 'UtensilsIcon',
          badge: 'BRUNCH',
          fields: [
            { id: 'formule1', label: 'Formule 1', type: 'text', placeholder: 'Contenu de la formule' },
            { id: 'prix1', label: 'Prix formule 1', type: 'price', suffix: '€' },
            { id: 'formule2', label: 'Formule 2', type: 'text' },
            { id: 'prix2', label: 'Prix formule 2', type: 'price', suffix: '€' },
            { id: 'formuleComplete', label: 'Formule complete', type: 'text' },
            { id: 'prixComplete', label: 'Prix complete', type: 'price', suffix: '€' },
            { id: 'horaires', label: 'Horaires', type: 'text', placeholder: 'Ex: 10h-15h' },
            { id: 'jours', label: 'Jours', type: 'text', placeholder: 'Ex: Samedi et Dimanche' }
          ],
          styles: [
            { id: 'fresh', name: 'Fresh', colors: { background: '#FFFFFF', text: '#2C3E50', accent: '#4ECDC4' }, font: 'Quicksand' },
            { id: 'cozy', name: 'Cozy', colors: { background: '#F4E4C9', text: '#5D4037', accent: '#C84B31' }, font: 'Lora' }
          ],
          defaultStyle: 'fresh'
        }
      ]
    },
    {
      id: 'promos',
      name: 'Promos et Offres',
      icon: 'TagIcon',
      templates: [
        {
          id: 'happy-hour',
          name: 'Happy Hour',
          description: 'Annoncez votre happy hour',
          category: 'promos',
          categoryIcon: 'TagIcon',
          badge: 'HAPPY HOUR',
          fields: [
            { id: 'heureDebut', label: 'Heure debut', type: 'time', required: true },
            { id: 'heureFin', label: 'Heure fin', type: 'time', required: true },
            { id: 'offre', label: 'Offre', type: 'text', placeholder: 'Ex: -50% sur les pintes', required: true },
            { id: 'jours', label: 'Jours concernes', type: 'text', placeholder: 'Ex: Du lundi au jeudi' }
          ],
          styles: [
            { id: 'festif', name: 'Festif', colors: { background: '#FF6B6B', text: '#FFFFFF', accent: '#F7B731' }, font: 'Bebas Neue' },
            { id: 'neon', name: 'Neon', colors: { background: '#1A1A2E', text: '#00BFFF', accent: '#FF69B4' }, font: 'Anton' }
          ],
          defaultStyle: 'festif'
        },
        {
          id: 'promo-jour',
          name: 'Promo du jour',
          description: 'Offre speciale du jour',
          category: 'promos',
          categoryIcon: 'TagIcon',
          badge: 'OFFRE DU JOUR',
          fields: [
            { id: 'titre', label: 'Titre de l\'offre', type: 'text', required: true },
            { id: 'description', label: 'Description', type: 'textarea' },
            { id: 'conditions', label: 'Conditions', type: 'text', placeholder: 'Optionnel' },
            { id: 'dateFin', label: 'Date de fin', type: 'date' }
          ],
          styles: [
            { id: 'urgent', name: 'Urgent', colors: { background: '#FF1744', text: '#FFFFFF', accent: '#F7B731' }, font: 'Archivo Black' },
            { id: 'elegant', name: 'Elegant', colors: { background: '#2C3E50', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Montserrat' }
          ],
          defaultStyle: 'urgent'
        },
        {
          id: 'formule-midi',
          name: 'Formule midi',
          description: 'Vos formules du midi',
          category: 'promos',
          categoryIcon: 'TagIcon',
          badge: 'FORMULE MIDI',
          fields: [
            { id: 'entreePlat', label: 'Prix Entree+Plat', type: 'price', suffix: '€' },
            { id: 'platDessert', label: 'Prix Plat+Dessert', type: 'price', suffix: '€' },
            { id: 'complete', label: 'Prix formule complete', type: 'price', suffix: '€' },
            { id: 'horaires', label: 'Horaires', type: 'text', placeholder: 'Ex: 12h-14h30' }
          ],
          styles: [
            { id: 'pro', name: 'Professionnel', colors: { background: '#FFFFFF', text: '#2C3E50', accent: '#C84B31' }, font: 'Poppins' },
            { id: 'chaleureux', name: 'Chaleureux', colors: { background: '#F4E4C9', text: '#5D4037', accent: '#10B981' }, font: 'Nunito' }
          ],
          defaultStyle: 'pro'
        }
      ]
    },
    {
      id: 'evenements',
      name: 'Evenements',
      icon: 'CalendarIcon',
      templates: [
        {
          id: 'soiree-dj',
          name: 'Soiree DJ',
          description: 'Annoncez votre soiree DJ',
          category: 'evenements',
          categoryIcon: 'MusicIcon',
          badge: 'DJ SET',
          fields: [
            { id: 'date', label: 'Date', type: 'date', required: true },
            { id: 'heure', label: 'Heure debut', type: 'time', required: true },
            { id: 'nomDj', label: 'Nom du DJ', type: 'text', required: true },
            { id: 'style', label: 'Style musical', type: 'text', placeholder: 'Ex: House, Techno, Hip-Hop' },
            { id: 'entree', label: 'Prix entree', type: 'text', placeholder: 'Ex: Gratuit ou 10€' }
          ],
          styles: [
            { id: 'neon', name: 'Neon', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#9B59B6' }, font: 'Bebas Neue' },
            { id: 'club', name: 'Club', colors: { background: '#000000', text: '#FFFFFF', accent: '#FF69B4' }, font: 'Anton' }
          ],
          defaultStyle: 'neon'
        },
        {
          id: 'concert-live',
          name: 'Concert live',
          description: 'Annoncez un concert',
          category: 'evenements',
          categoryIcon: 'MusicIcon',
          badge: 'LIVE',
          fields: [
            { id: 'date', label: 'Date', type: 'date', required: true },
            { id: 'heure', label: 'Heure', type: 'time', required: true },
            { id: 'artiste', label: 'Artiste/Groupe', type: 'text', required: true },
            { id: 'genre', label: 'Genre musical', type: 'text' },
            { id: 'entree', label: 'Prix entree', type: 'text' }
          ],
          styles: [
            { id: 'rock', name: 'Rock', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#FF1744' }, font: 'Russo One' },
            { id: 'jazz', name: 'Jazz', colors: { background: '#2C3E50', text: '#D4AF37', accent: '#FFFFFF' }, font: 'Playfair Display' },
            { id: 'acoustique', name: 'Acoustique', colors: { background: '#F4E4C9', text: '#5D4037', accent: '#2D5A45' }, font: 'Satisfy' }
          ],
          defaultStyle: 'rock'
        },
        {
          id: 'match-jour',
          name: 'Match du jour',
          description: 'Diffusion d\'un match',
          category: 'evenements',
          categoryIcon: 'ActivityIcon',
          badge: 'SUR ECRAN GEANT',
          fields: [
            { id: 'equipe1', label: 'Equipe 1', type: 'text', required: true },
            { id: 'equipe2', label: 'Equipe 2', type: 'text', required: true },
            { id: 'competition', label: 'Competition', type: 'text', placeholder: 'Ex: Ligue 1, Champions League' },
            { id: 'date', label: 'Date', type: 'date', required: true },
            { id: 'heure', label: 'Heure', type: 'time', required: true }
          ],
          styles: [
            { id: 'sportif', name: 'Sportif', colors: { background: '#10B981', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Bebas Neue' },
            { id: 'intense', name: 'Intense', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#FF1744' }, font: 'Anton' }
          ],
          defaultStyle: 'sportif'
        },
        {
          id: 'quiz-night',
          name: 'Soiree quiz',
          description: 'Organisez un quiz',
          category: 'evenements',
          categoryIcon: 'PartyPopperIcon',
          badge: 'QUIZ NIGHT',
          fields: [
            { id: 'date', label: 'Date', type: 'date', required: true },
            { id: 'heure', label: 'Heure', type: 'time', required: true },
            { id: 'theme', label: 'Theme', type: 'text', placeholder: 'Optionnel' },
            { id: 'lots', label: 'Lots a gagner', type: 'text' },
            { id: 'participation', label: 'Prix participation', type: 'text', placeholder: 'Ex: Gratuit ou 5€' }
          ],
          styles: [
            { id: 'fun', name: 'Fun', colors: { background: '#9B59B6', text: '#FFFFFF', accent: '#F7B731' }, font: 'Luckiest Guy' },
            { id: 'retro', name: 'Retro', colors: { background: '#F7B731', text: '#1A1A2E', accent: '#FF6B6B' }, font: 'Righteous' }
          ],
          defaultStyle: 'fun'
        },
        {
          id: 'karaoke',
          name: 'Karaoke',
          description: 'Soiree karaoke',
          category: 'evenements',
          categoryIcon: 'MusicIcon',
          badge: 'KARAOKE',
          fields: [
            { id: 'jour', label: 'Jour recurrent', type: 'select', options: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'], required: true },
            { id: 'heure', label: 'Heure debut', type: 'time', required: true }
          ],
          styles: [
            { id: 'neon', name: 'Neon', colors: { background: '#1A1A2E', text: '#FF69B4', accent: '#00BFFF' }, font: 'Pacifico' },
            { id: 'disco', name: 'Disco', colors: { background: '#9B59B6', text: '#FFFFFF', accent: '#F7B731' }, font: 'Boogaloo' }
          ],
          defaultStyle: 'neon'
        }
      ]
    },
    {
      id: 'infos',
      name: 'Infos pratiques',
      icon: 'InfoIcon',
      templates: [
        {
          id: 'horaires',
          name: 'Horaires d\'ouverture',
          description: 'Affichez vos horaires',
          category: 'infos',
          categoryIcon: 'ClockIcon',
          fields: [
            { id: 'lundi', label: 'Lundi', type: 'text', placeholder: 'Ex: 12h-14h / 19h-23h' },
            { id: 'mardi', label: 'Mardi', type: 'text' },
            { id: 'mercredi', label: 'Mercredi', type: 'text' },
            { id: 'jeudi', label: 'Jeudi', type: 'text' },
            { id: 'vendredi', label: 'Vendredi', type: 'text' },
            { id: 'samedi', label: 'Samedi', type: 'text' },
            { id: 'dimanche', label: 'Dimanche', type: 'text' },
            { id: 'telephone', label: 'Telephone', type: 'text' },
            { id: 'adresse', label: 'Adresse', type: 'text' }
          ],
          styles: [
            { id: 'clean', name: 'Clean', colors: { background: '#FFFFFF', text: '#2C3E50', accent: '#C84B31' }, font: 'Poppins' },
            { id: 'sombre', name: 'Sombre', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#10B981' }, font: 'Montserrat' }
          ],
          defaultStyle: 'clean'
        },
        {
          id: 'fermeture',
          name: 'Fermeture exceptionnelle',
          description: 'Annoncez une fermeture',
          category: 'infos',
          categoryIcon: 'AlertTriangleIcon',
          fields: [
            { id: 'dates', label: 'Date(s) de fermeture', type: 'text', required: true },
            { id: 'raison', label: 'Raison', type: 'text', placeholder: 'Optionnel' },
            { id: 'reouverture', label: 'Date reouverture', type: 'date' }
          ],
          styles: [
            { id: 'alerte', name: 'Alerte', colors: { background: '#FF6B6B', text: '#FFFFFF', accent: '#F7B731' }, font: 'Poppins' },
            { id: 'sobre', name: 'Sobre', colors: { background: '#2C3E50', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Montserrat' }
          ],
          defaultStyle: 'alerte'
        },
        {
          id: 'conges',
          name: 'Conges annuels',
          description: 'Annoncez vos conges',
          category: 'infos',
          categoryIcon: 'CalendarIcon',
          fields: [
            { id: 'dateDepart', label: 'Date de depart', type: 'date', required: true },
            { id: 'dateRetour', label: 'Date de retour', type: 'date', required: true },
            { id: 'message', label: 'Message', type: 'textarea', placeholder: 'Optionnel' }
          ],
          styles: [
            { id: 'vacances', name: 'Vacances', colors: { background: '#4ECDC4', text: '#FFFFFF', accent: '#F7B731' }, font: 'Pacifico' },
            { id: 'simple', name: 'Simple', colors: { background: '#FFFFFF', text: '#2C3E50', accent: '#3498DB' }, font: 'Poppins' }
          ],
          defaultStyle: 'vacances'
        },
        {
          id: 'recrutement',
          name: 'Recrutement',
          description: 'Publiez une offre d\'emploi',
          category: 'infos',
          categoryIcon: 'UsersIcon',
          badge: 'ON RECRUTE',
          fields: [
            { id: 'poste', label: 'Poste recherche', type: 'text', required: true },
            { id: 'contrat', label: 'Type de contrat', type: 'select', options: ['CDI', 'CDD', 'Stage', 'Alternance', 'Extra', 'Temps partiel'] },
            { id: 'description', label: 'Description/Competences', type: 'textarea' },
            { id: 'contact', label: 'Contact', type: 'text' }
          ],
          styles: [
            { id: 'pro', name: 'Professionnel', colors: { background: '#1A3A5C', text: '#FFFFFF', accent: '#10B981' }, font: 'Montserrat' },
            { id: 'dynamique', name: 'Dynamique', colors: { background: '#FF6B6B', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Poppins' }
          ],
          defaultStyle: 'pro'
        },
        {
          id: 'terrasse',
          name: 'Terrasse ouverte',
          description: 'Annoncez l\'ouverture de la terrasse',
          category: 'infos',
          categoryIcon: 'SunIcon',
          badge: 'TERRASSE',
          fields: [
            { id: 'message', label: 'Message', type: 'textarea' },
            { id: 'places', label: 'Nombre de places', type: 'number', placeholder: 'Optionnel' }
          ],
          styles: [
            { id: 'ete', name: 'Ete', colors: { background: '#F7B731', text: '#1A1A2E', accent: '#4ECDC4' }, font: 'Quicksand' },
            { id: 'zen', name: 'Zen', colors: { background: '#87A878', text: '#FFFFFF', accent: '#F4E4C9' }, font: 'Raleway' }
          ],
          defaultStyle: 'ete'
        }
      ]
    },
    {
      id: 'social',
      name: 'Reseaux sociaux',
      icon: 'Share2Icon',
      templates: [
        {
          id: 'story',
          name: 'Story du jour',
          description: 'Format story vertical',
          category: 'social',
          categoryIcon: 'PhoneIcon',
          fields: [
            { id: 'message', label: 'Message court', type: 'text', placeholder: 'Max 100 caracteres', required: true }
          ],
          styles: [
            { id: 'bold', name: 'Bold', colors: { background: '#C84B31', text: '#FFFFFF', accent: '#F4E4C9' }, font: 'Bebas Neue' },
            { id: 'minimal', name: 'Minimal', colors: { background: '#FFFFFF', text: '#1A1A2E', accent: '#C84B31' }, font: 'Poppins' },
            { id: 'neon', name: 'Neon', colors: { background: '#1A1A2E', text: '#4ECDC4', accent: '#FF6B6B' }, font: 'Anton' }
          ],
          defaultStyle: 'bold'
        },
        {
          id: 'avis-client',
          name: 'Avis client',
          description: 'Partagez un temoignage',
          category: 'social',
          categoryIcon: 'StarIcon',
          fields: [
            { id: 'citation', label: 'Avis/Citation', type: 'textarea', required: true },
            { id: 'prenom', label: 'Prenom du client', type: 'text', required: true },
            { id: 'note', label: 'Note (1-5)', type: 'select', options: ['1', '2', '3', '4', '5'] },
            { id: 'source', label: 'Source', type: 'select', options: ['Google', 'TripAdvisor', 'Facebook', 'TheFork', 'Autre'] }
          ],
          styles: [
            { id: 'testimonial', name: 'Testimonial', colors: { background: '#F4E4C9', text: '#1A1A2E', accent: '#C84B31' }, font: 'Libre Baskerville' },
            { id: 'moderne', name: 'Moderne', colors: { background: '#FFFFFF', text: '#2C3E50', accent: '#10B981' }, font: 'Poppins' }
          ],
          defaultStyle: 'testimonial'
        },
        {
          id: 'coulisses',
          name: 'Coulisses',
          description: 'Montrez les backstages',
          category: 'social',
          categoryIcon: 'CameraIcon',
          badge: 'EN COULISSES',
          fields: [
            { id: 'description', label: 'Description courte', type: 'text', required: true }
          ],
          styles: [
            { id: 'authentique', name: 'Authentique', colors: { background: '#F4E4C9', text: '#5D4037', accent: '#C84B31' }, font: 'Caveat' },
            { id: 'pro', name: 'Pro', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Montserrat' }
          ],
          defaultStyle: 'authentique'
        },
        {
          id: 'equipe',
          name: 'Presentation equipe',
          description: 'Presentez un membre de l\'equipe',
          category: 'social',
          categoryIcon: 'UsersIcon',
          badge: 'L\'EQUIPE',
          fields: [
            { id: 'prenom', label: 'Prenom', type: 'text', required: true },
            { id: 'poste', label: 'Poste', type: 'text', required: true },
            { id: 'bio', label: 'Petite bio', type: 'textarea', placeholder: 'Optionnel' }
          ],
          styles: [
            { id: 'chaleureux', name: 'Chaleureux', colors: { background: '#F4E4C9', text: '#1A1A2E', accent: '#C84B31' }, font: 'Lora' },
            { id: 'moderne', name: 'Moderne', colors: { background: '#FFFFFF', text: '#2C3E50', accent: '#3498DB' }, font: 'Poppins' }
          ],
          defaultStyle: 'chaleureux'
        },
        {
          id: 'nouveau-carte',
          name: 'Nouveau sur la carte',
          description: 'Annoncez une nouveaute',
          category: 'social',
          categoryIcon: 'SparklesIcon',
          badge: 'NOUVEAU',
          fields: [
            { id: 'nom', label: 'Nom', type: 'text', required: true },
            { id: 'description', label: 'Description', type: 'textarea' },
            { id: 'prix', label: 'Prix', type: 'price', suffix: '€' }
          ],
          styles: [
            { id: 'fresh', name: 'Fresh', colors: { background: '#10B981', text: '#FFFFFF', accent: '#F7B731' }, font: 'Poppins' },
            { id: 'elegant', name: 'Elegant', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Playfair Display' }
          ],
          defaultStyle: 'fresh'
        }
      ]
    }
  ]
};

// ============================================
// SALON ESTHETIQUE / COIFFURE / SPA TEMPLATES
// ============================================
export const beautyTemplates: BusinessTemplates = {
  businessType: 'Esthetique',
  businessTypeAlt: ['Coiffeur', 'Spa', 'Salon de beaute', 'Institut'],
  categories: [
    {
      id: 'soins',
      name: 'Soins et Prestations',
      icon: 'SparklesIcon',
      templates: [
        {
          id: 'carte-soins',
          name: 'Carte des soins',
          description: 'Presentez vos soins par categorie',
          category: 'soins',
          categoryIcon: 'SparklesIcon',
          fields: [
            { id: 'categorie', label: 'Categorie', type: 'select', options: ['Visage', 'Corps', 'Mains', 'Pieds', 'Massage', 'Epilation'], required: true },
            {
              id: 'soins',
              label: 'Liste des soins',
              type: 'repeatable',
              maxItems: 6,
              repeatableFields: [
                { id: 'nom', label: 'Nom du soin', type: 'text', required: true },
                { id: 'duree', label: 'Duree', type: 'text', placeholder: 'Ex: 45 min' },
                { id: 'prix', label: 'Prix', type: 'price', suffix: '€', required: true }
              ]
            }
          ],
          styles: [
            { id: 'zen', name: 'Zen', colors: { background: '#FFF8F0', text: '#483C32', accent: '#E0B0FF' }, font: 'Raleway' },
            { id: 'luxe', name: 'Luxe', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#B76E79' }, font: 'Playfair Display' }
          ],
          defaultStyle: 'zen'
        },
        {
          id: 'soin-mois',
          name: 'Soin du mois',
          description: 'Mettez en avant un soin special',
          category: 'soins',
          categoryIcon: 'SparklesIcon',
          badge: 'SOIN DU MOIS',
          fields: [
            { id: 'nom', label: 'Nom du soin', type: 'text', required: true },
            { id: 'description', label: 'Description/Bienfaits', type: 'textarea' },
            { id: 'duree', label: 'Duree', type: 'text' },
            { id: 'prixNormal', label: 'Prix normal', type: 'price', suffix: '€' },
            { id: 'prixPromo', label: 'Prix promo', type: 'price', suffix: '€', required: true }
          ],
          styles: [
            { id: 'rose', name: 'Rose', colors: { background: '#F4C2C2', text: '#483C32', accent: '#B76E79' }, font: 'Dancing Script' },
            { id: 'epure', name: 'Epure', colors: { background: '#FFFFFF', text: '#483C32', accent: '#E6E6FA' }, font: 'Raleway' }
          ],
          defaultStyle: 'rose'
        },
        {
          id: 'nouveau-soin',
          name: 'Nouveau soin',
          description: 'Annoncez un nouveau soin',
          category: 'soins',
          categoryIcon: 'SparklesIcon',
          badge: 'NOUVEAU',
          fields: [
            { id: 'nom', label: 'Nom', type: 'text', required: true },
            { id: 'description', label: 'Description', type: 'textarea' },
            { id: 'duree', label: 'Duree', type: 'text' },
            { id: 'prix', label: 'Prix', type: 'price', suffix: '€', required: true }
          ],
          styles: [
            { id: 'fresh', name: 'Fresh', colors: { background: '#4ECDC4', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Quicksand' },
            { id: 'elegant', name: 'Elegant', colors: { background: '#E6E6FA', text: '#483C32', accent: '#9B59B6' }, font: 'Lora' }
          ],
          defaultStyle: 'fresh'
        },
        {
          id: 'forfait',
          name: 'Forfait/Package',
          description: 'Proposez un forfait complet',
          category: 'soins',
          categoryIcon: 'GiftIcon',
          badge: 'FORFAIT',
          fields: [
            { id: 'nom', label: 'Nom du forfait', type: 'text', required: true },
            { id: 'soinsInclus', label: 'Soins inclus', type: 'textarea', required: true },
            { id: 'prix', label: 'Prix total', type: 'price', suffix: '€', required: true },
            { id: 'economie', label: 'Economie realisee', type: 'text', placeholder: 'Ex: Economisez 25€' }
          ],
          styles: [
            { id: 'premium', name: 'Premium', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Playfair Display' },
            { id: 'doux', name: 'Doux', colors: { background: '#FEB2B2', text: '#1A1A2E', accent: '#FFFFFF' }, font: 'Quicksand' }
          ],
          defaultStyle: 'premium'
        }
      ]
    },
    {
      id: 'promos',
      name: 'Promos et Offres',
      icon: 'TagIcon',
      templates: [
        {
          id: 'promo-mois',
          name: 'Promo du mois',
          description: 'Offre mensuelle',
          category: 'promos',
          categoryIcon: 'TagIcon',
          fields: [
            { id: 'soin', label: 'Soin concerne', type: 'text', required: true },
            { id: 'reduction', label: 'Reduction', type: 'text', placeholder: 'Ex: -20% ou -15€', required: true },
            { id: 'dates', label: 'Dates validite', type: 'text' }
          ],
          styles: [
            { id: 'impact', name: 'Impact', colors: { background: '#FF6B6B', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Bebas Neue' },
            { id: 'doux', name: 'Doux', colors: { background: '#E6E6FA', text: '#483C32', accent: '#9B59B6' }, font: 'Poppins' }
          ],
          defaultStyle: 'impact'
        },
        {
          id: 'offre-duo',
          name: 'Offre duo',
          description: 'Venez a deux',
          category: 'promos',
          categoryIcon: 'UsersIcon',
          badge: 'OFFRE DUO',
          fields: [
            { id: 'description', label: 'Description', type: 'text', required: true },
            { id: 'soins', label: 'Soins inclus', type: 'textarea' },
            { id: 'prix', label: 'Prix duo', type: 'price', suffix: '€', required: true },
            { id: 'economie', label: 'Economie', type: 'text' }
          ],
          styles: [
            { id: 'romantique', name: 'Romantique', colors: { background: '#FEB2B2', text: '#1A1A2E', accent: '#B76E79' }, font: 'Dancing Script' },
            { id: 'moderne', name: 'Moderne', colors: { background: '#4ECDC4', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Poppins' }
          ],
          defaultStyle: 'romantique'
        },
        {
          id: 'carte-cadeau',
          name: 'Carte cadeau',
          description: 'Offrez du bien-etre',
          category: 'promos',
          categoryIcon: 'GiftIcon',
          fields: [
            { id: 'montants', label: 'Montants disponibles', type: 'text', placeholder: 'Ex: 30€, 50€, 100€' },
            { id: 'message', label: 'Message', type: 'textarea' }
          ],
          styles: [
            { id: 'cadeau', name: 'Cadeau', colors: { background: '#D4AF37', text: '#1A1A2E', accent: '#FFFFFF' }, font: 'Great Vibes' },
            { id: 'elegant', name: 'Elegant', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#B76E79' }, font: 'Playfair Display' }
          ],
          defaultStyle: 'cadeau'
        }
      ]
    },
    {
      id: 'evenements',
      name: 'Evenements',
      icon: 'CalendarIcon',
      templates: [
        {
          id: 'atelier-beaute',
          name: 'Atelier beaute',
          description: 'Organisez un atelier',
          category: 'evenements',
          categoryIcon: 'SparklesIcon',
          badge: 'ATELIER',
          fields: [
            { id: 'theme', label: 'Theme', type: 'text', required: true },
            { id: 'date', label: 'Date', type: 'date', required: true },
            { id: 'duree', label: 'Duree', type: 'text' },
            { id: 'prix', label: 'Prix', type: 'text', placeholder: 'Ex: 35€ ou Gratuit' },
            { id: 'places', label: 'Places limitees', type: 'number' }
          ],
          styles: [
            { id: 'chic', name: 'Chic', colors: { background: '#E6E6FA', text: '#483C32', accent: '#9B59B6' }, font: 'Quicksand' },
            { id: 'fun', name: 'Fun', colors: { background: '#FF6B6B', text: '#FFFFFF', accent: '#F7B731' }, font: 'Poppins' }
          ],
          defaultStyle: 'chic'
        },
        {
          id: 'soiree-vip',
          name: 'Soiree VIP',
          description: 'Soiree exclusive',
          category: 'evenements',
          categoryIcon: 'DiamondIcon',
          badge: 'SOIREE VIP',
          fields: [
            { id: 'date', label: 'Date', type: 'date', required: true },
            { id: 'programme', label: 'Programme', type: 'textarea' },
            { id: 'invitation', label: 'Sur invitation', type: 'checkbox' }
          ],
          styles: [
            { id: 'gold', name: 'Gold', colors: { background: '#1A1A2E', text: '#D4AF37', accent: '#FFFFFF' }, font: 'Playfair Display' },
            { id: 'rose', name: 'Rose Gold', colors: { background: '#B76E79', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Great Vibes' }
          ],
          defaultStyle: 'gold'
        }
      ]
    },
    {
      id: 'social',
      name: 'Reseaux sociaux',
      icon: 'Share2Icon',
      templates: [
        {
          id: 'avant-apres',
          name: 'Avant/Apres',
          description: 'Montrez vos resultats',
          category: 'social',
          categoryIcon: 'CameraIcon',
          badge: 'AVANT / APRES',
          fields: [
            { id: 'soin', label: 'Type de soin', type: 'text', required: true },
            { id: 'resultat', label: 'Description resultat', type: 'textarea' }
          ],
          styles: [
            { id: 'split', name: 'Split', colors: { background: '#FFFFFF', text: '#483C32', accent: '#B76E79' }, font: 'Montserrat' },
            { id: 'elegant', name: 'Elegant', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Raleway' }
          ],
          defaultStyle: 'split'
        },
        {
          id: 'conseil-beaute',
          name: 'Conseil beaute',
          description: 'Partagez une astuce',
          category: 'social',
          categoryIcon: 'LightbulbIcon',
          badge: 'CONSEIL',
          fields: [
            { id: 'titre', label: 'Titre du conseil', type: 'text', required: true },
            { id: 'astuce', label: 'Astuce', type: 'textarea', required: true }
          ],
          styles: [
            { id: 'fresh', name: 'Fresh', colors: { background: '#4ECDC4', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Quicksand' },
            { id: 'doux', name: 'Doux', colors: { background: '#FEB2B2', text: '#1A1A2E', accent: '#B76E79' }, font: 'Lora' }
          ],
          defaultStyle: 'fresh'
        }
      ]
    }
  ]
};

// ============================================
// AGENCE IMMOBILIERE TEMPLATES
// ============================================
export const realEstateTemplates: BusinessTemplates = {
  businessType: 'Agence immobiliere',
  businessTypeAlt: ['Immobilier', 'Agent immobilier'],
  categories: [
    {
      id: 'biens',
      name: 'Biens a vendre/louer',
      icon: 'HomeIcon',
      templates: [
        {
          id: 'bien-vente',
          name: 'Nouveau bien - Vente',
          description: 'Annoncez un bien a vendre',
          category: 'biens',
          categoryIcon: 'HomeIcon',
          badge: 'A VENDRE',
          fields: [
            { id: 'type', label: 'Type de bien', type: 'select', options: ['Appartement', 'Maison', 'Villa', 'Terrain', 'Local commercial', 'Immeuble'], required: true },
            { id: 'surface', label: 'Surface (m2)', type: 'number', suffix: 'm2', required: true },
            { id: 'pieces', label: 'Nombre de pieces', type: 'number' },
            { id: 'prix', label: 'Prix', type: 'price', suffix: '€', required: true },
            { id: 'ville', label: 'Ville/Quartier', type: 'text', required: true },
            { id: 'points', label: 'Points forts', type: 'textarea' }
          ],
          styles: [
            { id: 'pro', name: 'Professionnel', colors: { background: '#1A3A5C', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Montserrat' },
            { id: 'moderne', name: 'Moderne', colors: { background: '#FFFFFF', text: '#2C3E50', accent: '#3498DB' }, font: 'Poppins' }
          ],
          defaultStyle: 'pro'
        },
        {
          id: 'bien-location',
          name: 'Nouveau bien - Location',
          description: 'Annoncez un bien a louer',
          category: 'biens',
          categoryIcon: 'HomeIcon',
          badge: 'A LOUER',
          fields: [
            { id: 'type', label: 'Type de bien', type: 'select', options: ['Appartement', 'Maison', 'Studio', 'Local commercial'], required: true },
            { id: 'surface', label: 'Surface (m2)', type: 'number', suffix: 'm2', required: true },
            { id: 'pieces', label: 'Nombre de pieces', type: 'number' },
            { id: 'loyer', label: 'Loyer', type: 'price', suffix: '€/mois', required: true },
            { id: 'charges', label: 'Charges', type: 'price', suffix: '€/mois' },
            { id: 'ville', label: 'Ville/Quartier', type: 'text', required: true }
          ],
          styles: [
            { id: 'pro', name: 'Professionnel', colors: { background: '#2C5282', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Montserrat' },
            { id: 'fresh', name: 'Fresh', colors: { background: '#10B981', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Poppins' }
          ],
          defaultStyle: 'pro'
        },
        {
          id: 'coup-coeur',
          name: 'Coup de coeur',
          description: 'Bien d\'exception',
          category: 'biens',
          categoryIcon: 'HeartIcon',
          badge: 'COUP DE COEUR',
          fields: [
            { id: 'type', label: 'Type de bien', type: 'text', required: true },
            { id: 'points', label: 'Points exceptionnels', type: 'textarea', required: true },
            { id: 'prix', label: 'Prix', type: 'price', suffix: '€', required: true }
          ],
          styles: [
            { id: 'premium', name: 'Premium', colors: { background: '#1A1A2E', text: '#D4AF37', accent: '#FFFFFF' }, font: 'Playfair Display' },
            { id: 'elegant', name: 'Elegant', colors: { background: '#722F37', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Cormorant Garamond' }
          ],
          defaultStyle: 'premium'
        }
      ]
    },
    {
      id: 'succes',
      name: 'Succes et temoignages',
      icon: 'AwardIcon',
      templates: [
        {
          id: 'bien-vendu',
          name: 'Bien vendu',
          description: 'Celebrez une vente',
          category: 'succes',
          categoryIcon: 'CheckIcon',
          badge: 'VENDU',
          fields: [
            { id: 'type', label: 'Type de bien', type: 'text', required: true },
            { id: 'quartier', label: 'Quartier', type: 'text' },
            { id: 'delai', label: 'Vendu en X jours', type: 'number' }
          ],
          styles: [
            { id: 'succes', name: 'Succes', colors: { background: '#10B981', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Bebas Neue' },
            { id: 'elegant', name: 'Elegant', colors: { background: '#1A3A5C', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Montserrat' }
          ],
          defaultStyle: 'succes'
        },
        {
          id: 'temoignage',
          name: 'Temoignage client',
          description: 'Partagez un avis client',
          category: 'succes',
          categoryIcon: 'StarIcon',
          fields: [
            { id: 'citation', label: 'Citation', type: 'textarea', required: true },
            { id: 'prenom', label: 'Prenom', type: 'text', required: true },
            { id: 'transaction', label: 'Type de transaction', type: 'text', placeholder: 'Ex: Achat appartement' }
          ],
          styles: [
            { id: 'confiance', name: 'Confiance', colors: { background: '#F4E4C9', text: '#1A3A5C', accent: '#C84B31' }, font: 'Libre Baskerville' },
            { id: 'moderne', name: 'Moderne', colors: { background: '#FFFFFF', text: '#2C3E50', accent: '#3498DB' }, font: 'Poppins' }
          ],
          defaultStyle: 'confiance'
        }
      ]
    },
    {
      id: 'services',
      name: 'Services',
      icon: 'BriefcaseIcon',
      templates: [
        {
          id: 'estimation',
          name: 'Estimation gratuite',
          description: 'Proposez une estimation',
          category: 'services',
          categoryIcon: 'HomeIcon',
          badge: 'ESTIMATION GRATUITE',
          fields: [
            { id: 'message', label: 'Message', type: 'textarea' },
            { id: 'contact', label: 'Contact', type: 'text' }
          ],
          styles: [
            { id: 'pro', name: 'Professionnel', colors: { background: '#1A3A5C', text: '#FFFFFF', accent: '#10B981' }, font: 'Montserrat' },
            { id: 'accueillant', name: 'Accueillant', colors: { background: '#F4E4C9', text: '#1A3A5C', accent: '#C84B31' }, font: 'Poppins' }
          ],
          defaultStyle: 'pro'
        }
      ]
    }
  ]
};

// ============================================
// BOULANGERIE / PATISSERIE TEMPLATES
// ============================================
export const bakeryTemplates: BusinessTemplates = {
  businessType: 'Boulangerie',
  businessTypeAlt: ['Patisserie', 'Boulangerie-Patisserie'],
  categories: [
    {
      id: 'produits',
      name: 'Produits',
      icon: 'CroissantIcon',
      templates: [
        {
          id: 'pain-jour',
          name: 'Pain du jour',
          description: 'Mettez en avant un pain special',
          category: 'produits',
          categoryIcon: 'CroissantIcon',
          badge: 'PAIN DU JOUR',
          fields: [
            { id: 'nom', label: 'Nom du pain', type: 'text', required: true },
            { id: 'description', label: 'Description', type: 'textarea' },
            { id: 'prix', label: 'Prix', type: 'price', suffix: '€', required: true }
          ],
          styles: [
            { id: 'artisan', name: 'Artisan', colors: { background: '#F4E4C9', text: '#7B3F00', accent: '#EB9605' }, font: 'Caveat' },
            { id: 'moderne', name: 'Moderne', colors: { background: '#FFFFFF', text: '#5D4037', accent: '#C84B31' }, font: 'Poppins' }
          ],
          defaultStyle: 'artisan'
        },
        {
          id: 'patisserie',
          name: 'Patisserie du moment',
          description: 'Presentez votre patisserie vedette',
          category: 'produits',
          categoryIcon: 'CakeIcon',
          badge: 'PATISSERIE',
          fields: [
            { id: 'nom', label: 'Nom du gateau', type: 'text', required: true },
            { id: 'description', label: 'Description', type: 'textarea' },
            { id: 'prixPart', label: 'Prix part', type: 'price', suffix: '€' },
            { id: 'prixEntier', label: 'Prix entier', type: 'price', suffix: '€' }
          ],
          styles: [
            { id: 'gourmand', name: 'Gourmand', colors: { background: '#7B3F00', text: '#FFFFFF', accent: '#FFD59A' }, font: 'Satisfy' },
            { id: 'elegant', name: 'Elegant', colors: { background: '#FFF8F0', text: '#5D4037', accent: '#B76E79' }, font: 'Playfair Display' }
          ],
          defaultStyle: 'gourmand'
        },
        {
          id: 'gateau-commande',
          name: 'Gateau sur commande',
          description: 'Proposez vos gateaux personnalises',
          category: 'produits',
          categoryIcon: 'CakeIcon',
          badge: 'SUR COMMANDE',
          fields: [
            { id: 'types', label: 'Types disponibles', type: 'textarea', required: true },
            { id: 'delai', label: 'Delai de commande', type: 'text', placeholder: 'Ex: 48h a l\'avance' },
            { id: 'contact', label: 'Contact', type: 'text' }
          ],
          styles: [
            { id: 'festif', name: 'Festif', colors: { background: '#FEB2B2', text: '#1A1A2E', accent: '#D4AF37' }, font: 'Dancing Script' },
            { id: 'pro', name: 'Professionnel', colors: { background: '#FFFFFF', text: '#5D4037', accent: '#C84B31' }, font: 'Montserrat' }
          ],
          defaultStyle: 'festif'
        }
      ]
    },
    {
      id: 'fetes',
      name: 'Evenements et fetes',
      icon: 'CalendarIcon',
      templates: [
        {
          id: 'galette',
          name: 'Galette des rois',
          description: 'Annoncez vos galettes',
          category: 'fetes',
          categoryIcon: 'CrownIcon',
          badge: 'GALETTE',
          fields: [
            { id: 'prix', label: 'Prix par taille', type: 'textarea', placeholder: 'Ex: 4 pers: 18€, 6 pers: 26€' },
            { id: 'dates', label: 'Dates disponibilite', type: 'text' }
          ],
          styles: [
            { id: 'royal', name: 'Royal', colors: { background: '#D4AF37', text: '#1A1A2E', accent: '#722F37' }, font: 'Abril Fatface' },
            { id: 'tradition', name: 'Tradition', colors: { background: '#F4E4C9', text: '#7B3F00', accent: '#D4AF37' }, font: 'Merriweather' }
          ],
          defaultStyle: 'royal'
        },
        {
          id: 'buche',
          name: 'Buche de Noel',
          description: 'Presentez vos buches',
          category: 'fetes',
          categoryIcon: 'GiftIcon',
          badge: 'BUCHE DE NOEL',
          fields: [
            { id: 'parfums', label: 'Parfums disponibles', type: 'textarea', required: true },
            { id: 'prix', label: 'Prix', type: 'text' },
            { id: 'dateLimite', label: 'Date limite commande', type: 'date' }
          ],
          styles: [
            { id: 'noel', name: 'Noel', colors: { background: '#722F37', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Great Vibes' },
            { id: 'elegant', name: 'Elegant', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#10B981' }, font: 'Playfair Display' }
          ],
          defaultStyle: 'noel'
        }
      ]
    }
  ]
};

// ============================================
// COMMERCE / BOUTIQUE TEMPLATES
// ============================================
export const shopTemplates: BusinessTemplates = {
  businessType: 'Boutique',
  businessTypeAlt: ['Commerce', 'Magasin', 'Shop'],
  categories: [
    {
      id: 'produits',
      name: 'Produits',
      icon: 'PackageIcon',
      templates: [
        {
          id: 'nouveau-produit',
          name: 'Nouveau produit',
          description: 'Annoncez une nouveaute',
          category: 'produits',
          categoryIcon: 'SparklesIcon',
          badge: 'NOUVEAU',
          fields: [
            { id: 'nom', label: 'Nom', type: 'text', required: true },
            { id: 'description', label: 'Description', type: 'textarea' },
            { id: 'prix', label: 'Prix', type: 'price', suffix: '€', required: true }
          ],
          styles: [
            { id: 'fresh', name: 'Fresh', colors: { background: '#10B981', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Poppins' },
            { id: 'elegant', name: 'Elegant', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Montserrat' }
          ],
          defaultStyle: 'fresh'
        },
        {
          id: 'best-seller',
          name: 'Produit vedette',
          description: 'Mettez en avant un best-seller',
          category: 'produits',
          categoryIcon: 'StarIcon',
          badge: 'BEST SELLER',
          fields: [
            { id: 'nom', label: 'Nom', type: 'text', required: true },
            { id: 'atouts', label: 'Atouts', type: 'textarea' },
            { id: 'prix', label: 'Prix', type: 'price', suffix: '€', required: true }
          ],
          styles: [
            { id: 'premium', name: 'Premium', colors: { background: '#D4AF37', text: '#1A1A2E', accent: '#FFFFFF' }, font: 'Bebas Neue' },
            { id: 'moderne', name: 'Moderne', colors: { background: '#FFFFFF', text: '#2C3E50', accent: '#FF6B6B' }, font: 'Poppins' }
          ],
          defaultStyle: 'premium'
        },
        {
          id: 'arrivage',
          name: 'Arrivage',
          description: 'Annoncez un arrivage',
          category: 'produits',
          categoryIcon: 'PackageIcon',
          badge: 'ARRIVAGE',
          fields: [
            { id: 'produits', label: 'Nouveaux produits', type: 'textarea', required: true },
            { id: 'date', label: 'Date', type: 'date' }
          ],
          styles: [
            { id: 'dynamique', name: 'Dynamique', colors: { background: '#3498DB', text: '#FFFFFF', accent: '#F7B731' }, font: 'Oswald' },
            { id: 'sobre', name: 'Sobre', colors: { background: '#FFFFFF', text: '#2C3E50', accent: '#10B981' }, font: 'Raleway' }
          ],
          defaultStyle: 'dynamique'
        }
      ]
    },
    {
      id: 'promos',
      name: 'Promos et soldes',
      icon: 'TagIcon',
      templates: [
        {
          id: 'soldes',
          name: 'Soldes',
          description: 'Annoncez vos soldes',
          category: 'promos',
          categoryIcon: 'TagIcon',
          badge: 'SOLDES',
          fields: [
            { id: 'reduction', label: 'Reduction', type: 'text', placeholder: 'Ex: Jusqu\'a -50%', required: true },
            { id: 'dates', label: 'Dates', type: 'text' },
            { id: 'conditions', label: 'Conditions', type: 'text' }
          ],
          styles: [
            { id: 'impact', name: 'Impact', colors: { background: '#FF1744', text: '#FFFFFF', accent: '#F7B731' }, font: 'Anton' },
            { id: 'chic', name: 'Chic', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Bebas Neue' }
          ],
          defaultStyle: 'impact'
        },
        {
          id: 'promo-flash',
          name: 'Promo flash',
          description: 'Offre limitee',
          category: 'promos',
          categoryIcon: 'ZapIcon',
          badge: 'PROMO FLASH',
          fields: [
            { id: 'produit', label: 'Produit', type: 'text', required: true },
            { id: 'prixBarre', label: 'Prix barre', type: 'price', suffix: '€' },
            { id: 'nouveauPrix', label: 'Nouveau prix', type: 'price', suffix: '€', required: true },
            { id: 'duree', label: 'Duree', type: 'text', placeholder: 'Ex: 24h seulement' }
          ],
          styles: [
            { id: 'urgent', name: 'Urgent', colors: { background: '#FF6B6B', text: '#FFFFFF', accent: '#F7B731' }, font: 'Bebas Neue' },
            { id: 'electrique', name: 'Electrique', colors: { background: '#3498DB', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Oswald' }
          ],
          defaultStyle: 'urgent'
        },
        {
          id: 'black-friday',
          name: 'Black Friday',
          description: 'Offres Black Friday',
          category: 'promos',
          categoryIcon: 'TagIcon',
          badge: 'BLACK FRIDAY',
          fields: [
            { id: 'date', label: 'Date', type: 'date' },
            { id: 'reductions', label: 'Reductions', type: 'textarea', required: true }
          ],
          styles: [
            { id: 'black', name: 'Black & Gold', colors: { background: '#000000', text: '#D4AF37', accent: '#FFFFFF' }, font: 'Anton' },
            { id: 'moderne', name: 'Moderne', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#FF6B6B' }, font: 'Bebas Neue' }
          ],
          defaultStyle: 'black'
        }
      ]
    }
  ]
};

// ============================================
// SALLE DE SPORT / COACH TEMPLATES
// ============================================
export const fitnessTemplates: BusinessTemplates = {
  businessType: 'Salle de sport',
  businessTypeAlt: ['Coach', 'Fitness', 'Gym', 'Coach sportif'],
  categories: [
    {
      id: 'offres',
      name: 'Offres et abonnements',
      icon: 'CreditCardIcon',
      templates: [
        {
          id: 'formules',
          name: 'Nos formules',
          description: 'Presentez vos abonnements',
          category: 'offres',
          categoryIcon: 'CreditCardIcon',
          fields: [
            {
              id: 'formules',
              label: 'Formules',
              type: 'repeatable',
              maxItems: 4,
              repeatableFields: [
                { id: 'nom', label: 'Nom', type: 'text', required: true },
                { id: 'prix', label: 'Prix', type: 'price', suffix: '€/mois', required: true }
              ]
            }
          ],
          styles: [
            { id: 'energie', name: 'Energie', colors: { background: '#FF6B00', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Bebas Neue' },
            { id: 'pro', name: 'Pro', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#00C853' }, font: 'Montserrat' }
          ],
          defaultStyle: 'energie'
        },
        {
          id: 'essai-gratuit',
          name: 'Offre d\'essai',
          description: 'Proposez un essai',
          category: 'offres',
          categoryIcon: 'GiftIcon',
          badge: 'ESSAI GRATUIT',
          fields: [
            { id: 'duree', label: 'Duree essai', type: 'text', placeholder: 'Ex: 7 jours', required: true },
            { id: 'prix', label: 'Prix', type: 'text', placeholder: 'Ex: Gratuit ou 1€' },
            { id: 'conditions', label: 'Conditions', type: 'textarea' }
          ],
          styles: [
            { id: 'motivant', name: 'Motivant', colors: { background: '#00C853', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Oswald' },
            { id: 'dynamique', name: 'Dynamique', colors: { background: '#FF6B00', text: '#FFFFFF', accent: '#1A1A2E' }, font: 'Bebas Neue' }
          ],
          defaultStyle: 'motivant'
        },
        {
          id: 'offre-rentree',
          name: 'Promo rentree',
          description: 'Offre de rentree',
          category: 'offres',
          categoryIcon: 'TagIcon',
          badge: 'RENTREE',
          fields: [
            { id: 'offre', label: 'Offre', type: 'text', required: true },
            { id: 'dates', label: 'Dates', type: 'text' }
          ],
          styles: [
            { id: 'power', name: 'Power', colors: { background: '#FF1744', text: '#FFFFFF', accent: '#F7B731' }, font: 'Anton' },
            { id: 'fresh', name: 'Fresh', colors: { background: '#2196F3', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Poppins' }
          ],
          defaultStyle: 'power'
        }
      ]
    },
    {
      id: 'cours',
      name: 'Cours et activites',
      icon: 'DumbbellIcon',
      templates: [
        {
          id: 'nouveau-cours',
          name: 'Nouveau cours',
          description: 'Annoncez un nouveau cours',
          category: 'cours',
          categoryIcon: 'DumbbellIcon',
          badge: 'NOUVEAU COURS',
          fields: [
            { id: 'nom', label: 'Nom du cours', type: 'text', required: true },
            { id: 'description', label: 'Description', type: 'textarea' },
            { id: 'horaire', label: 'Jour/heure', type: 'text' },
            { id: 'coach', label: 'Coach', type: 'text' }
          ],
          styles: [
            { id: 'energie', name: 'Energie', colors: { background: '#FF6B00', text: '#FFFFFF', accent: '#FFFF00' }, font: 'Bebas Neue' },
            { id: 'zen', name: 'Zen', colors: { background: '#87A878', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Raleway' }
          ],
          defaultStyle: 'energie'
        },
        {
          id: 'cours-jour',
          name: 'Cours du jour',
          description: 'Cours du jour',
          category: 'cours',
          categoryIcon: 'CalendarIcon',
          badge: 'AUJOURD\'HUI',
          fields: [
            { id: 'cours', label: 'Cours', type: 'text', required: true },
            { id: 'heure', label: 'Heure', type: 'time' },
            { id: 'places', label: 'Places restantes', type: 'number' }
          ],
          styles: [
            { id: 'urgent', name: 'Urgent', colors: { background: '#FF1744', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Anton' },
            { id: 'cool', name: 'Cool', colors: { background: '#2196F3', text: '#FFFFFF', accent: '#FFFF00' }, font: 'Oswald' }
          ],
          defaultStyle: 'urgent'
        },
        {
          id: 'defi-mois',
          name: 'Defi du mois',
          description: 'Lancez un defi',
          category: 'cours',
          categoryIcon: 'TrophyIcon',
          badge: 'DEFI',
          fields: [
            { id: 'nom', label: 'Nom du defi', type: 'text', required: true },
            { id: 'description', label: 'Description', type: 'textarea' },
            { id: 'recompense', label: 'Recompense', type: 'text' }
          ],
          styles: [
            { id: 'champion', name: 'Champion', colors: { background: '#D4AF37', text: '#1A1A2E', accent: '#FFFFFF' }, font: 'Bebas Neue' },
            { id: 'intense', name: 'Intense', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#FF1744' }, font: 'Anton' }
          ],
          defaultStyle: 'champion'
        }
      ]
    },
    {
      id: 'motivation',
      name: 'Motivation et resultats',
      icon: 'TrophyIcon',
      templates: [
        {
          id: 'transformation',
          name: 'Transformation client',
          description: 'Partagez un succes',
          category: 'motivation',
          categoryIcon: 'TrophyIcon',
          badge: 'TRANSFORMATION',
          fields: [
            { id: 'prenom', label: 'Prenom', type: 'text', required: true },
            { id: 'duree', label: 'Duree du parcours', type: 'text' },
            { id: 'programme', label: 'Programme suivi', type: 'text' }
          ],
          styles: [
            { id: 'succes', name: 'Succes', colors: { background: '#00C853', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Bebas Neue' },
            { id: 'inspirant', name: 'Inspirant', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#D4AF37' }, font: 'Montserrat' }
          ],
          defaultStyle: 'succes'
        },
        {
          id: 'citation',
          name: 'Citation motivation',
          description: 'Citation inspirante',
          category: 'motivation',
          categoryIcon: 'SparklesIcon',
          fields: [
            { id: 'citation', label: 'Citation', type: 'textarea', required: true }
          ],
          styles: [
            { id: 'power', name: 'Power', colors: { background: '#FF6B00', text: '#FFFFFF', accent: '#1A1A2E' }, font: 'Bebas Neue' },
            { id: 'zen', name: 'Zen', colors: { background: '#87A878', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Raleway' },
            { id: 'dark', name: 'Dark', colors: { background: '#1A1A2E', text: '#FFFFFF', accent: '#FF1744' }, font: 'Anton' }
          ],
          defaultStyle: 'power'
        },
        {
          id: 'conseil-nutrition',
          name: 'Conseil nutrition',
          description: 'Partagez un conseil',
          category: 'motivation',
          categoryIcon: 'LightbulbIcon',
          badge: 'NUTRITION',
          fields: [
            { id: 'titre', label: 'Titre', type: 'text', required: true },
            { id: 'conseil', label: 'Conseil', type: 'textarea', required: true }
          ],
          styles: [
            { id: 'healthy', name: 'Healthy', colors: { background: '#10B981', text: '#FFFFFF', accent: '#FFFFFF' }, font: 'Quicksand' },
            { id: 'clean', name: 'Clean', colors: { background: '#FFFFFF', text: '#2C3E50', accent: '#10B981' }, font: 'Poppins' }
          ],
          defaultStyle: 'healthy'
        }
      ]
    }
  ]
};

// ============================================
// EXPORT ALL TEMPLATES
// ============================================
export const allBusinessTemplates: BusinessTemplates[] = [
  restaurantTemplates,
  beautyTemplates,
  realEstateTemplates,
  bakeryTemplates,
  shopTemplates,
  fitnessTemplates
];

// Helper function to get templates for a specific business type
export function getTemplatesForBusiness(businessType: string): BusinessTemplates | null {
  const normalizedType = businessType.toLowerCase().trim();

  for (const templates of allBusinessTemplates) {
    if (templates.businessType.toLowerCase() === normalizedType) {
      return templates;
    }
    if (templates.businessTypeAlt) {
      for (const alt of templates.businessTypeAlt) {
        if (alt.toLowerCase() === normalizedType) {
          return templates;
        }
      }
    }
  }

  // Default to restaurant for unknown types
  return restaurantTemplates;
}

// Get all template categories for a business
export function getCategoriesForBusiness(businessType: string): TemplateCategory[] {
  const templates = getTemplatesForBusiness(businessType);
  return templates?.categories || [];
}

// Get a specific template by ID
export function getTemplateById(templateId: string): Template | null {
  for (const business of allBusinessTemplates) {
    for (const category of business.categories) {
      const template = category.templates.find(t => t.id === templateId);
      if (template) {
        return template;
      }
    }
  }
  return null;
}
