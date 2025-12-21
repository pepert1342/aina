// Configuration - Appels via le backend sécurisé
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://aina-backend-rla4.onrender.com';

// Interface pour les données du Moodboard - EXPORTÉE
export interface MoodboardData {
  keywords?: string[];
  logo_url?: string;
  photos?: string[];
  address?: string;
}

// Fonction pour appeler l'API Gemini via le backend
async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/generate-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error);
    throw new Error(error.error || 'Erreur API Gemini');
  }

  const data = await response.json();
  return data.text;
}

// Fonction pour générer une image avec Gemini + Moodboard
export async function generateImage(
  businessName: string,
  businessType: string,
  eventTitle: string,
  eventDescription: string,
  tone: string,
  moodboard?: MoodboardData
): Promise<string> {

  // Construire la liste des mots-clés du Moodboard
  const keywordsStr = moodboard?.keywords?.length
    ? `Key visual elements and ambiance: ${moodboard.keywords.join(', ')}.`
    : '';

  // Adapter le style selon le type de commerce
  const businessStyles: Record<string, string> = {
    'Restaurant': 'warm lighting, appetizing food presentation, cozy dining atmosphere',
    'Bar': 'moody lighting, craft cocktails, social atmosphere, evening vibes',
    'Boulangerie': 'golden pastries, rustic wooden elements, morning light, artisanal bread',
    'Coiffeur': 'clean modern salon, stylish haircuts, mirrors, professional tools',
    'Esthétique': 'spa atmosphere, soft lighting, wellness, beauty products, relaxation',
    'Boutique': 'elegant product display, shopping experience, curated items',
    'Autre': 'professional, welcoming, high-quality'
  };

  const styleForBusiness = businessStyles[businessType] || businessStyles['Autre'];

  // Adapter selon le ton
  const toneStyles: Record<string, string> = {
    'Professionnel': 'clean, corporate, sophisticated, minimal',
    'Familial': 'warm, welcoming, friendly, homey, comfortable',
    'Jeune': 'vibrant, colorful, dynamic, trendy, fun',
    'Luxe': 'elegant, refined, premium, gold accents, high-end',
    'Humour': 'playful, light-hearted, creative, quirky'
  };

  const styleForTone = toneStyles[tone] || toneStyles['Familial'];

  // Construire le prompt enrichi
  const imagePrompt = `Generate a stunning professional social media image for a ${businessType} called "${businessName}".

EVENT/SUBJECT: "${eventTitle}"
${eventDescription ? `CONTEXT: ${eventDescription}` : ''}

VISUAL STYLE REQUIREMENTS:
- Business atmosphere: ${styleForBusiness}
- Mood and tone: ${styleForTone}
${keywordsStr}
${moodboard?.address ? `- Location inspiration: ${moodboard.address} (Mediterranean/Corsican vibes if applicable)` : ''}

TECHNICAL REQUIREMENTS:
- Professional photography quality
- Perfect for Instagram/Facebook
- Warm, inviting colors
- High contrast, sharp details
- DO NOT include ANY text, words, letters, or watermarks in the image
- The image should tell a story and evoke emotion

Create an image that would make someone stop scrolling and want to visit this place or learn more.`;

  const response = await fetch(`${BACKEND_URL}/api/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: imagePrompt })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Image API Error:', error);
    throw new Error(error.error || 'Erreur génération image');
  }

  const data = await response.json();
  return data.image;
}

// Fonction pour générer un texte de post avec mots-clés
export async function generatePostText(
  businessName: string,
  businessType: string,
  eventTitle: string,
  eventDescription: string,
  tone: string,
  platform: string,
  moodboard?: MoodboardData
): Promise<string[]> {

  // Construire les informations du Moodboard
  const keywordsStr = moodboard?.keywords?.length
    ? `\n**Mots-clés de l'univers du commerce :** ${moodboard.keywords.join(', ')}`
    : '';

  const locationStr = moodboard?.address
    ? `\n**Localisation :** ${moodboard.address}`
    : '';

  // Adapter les consignes selon le ton
  const toneInstructions: Record<string, string> = {
    'Professionnel': 'Sois formel, utilise un vocabulaire soutenu, inspire confiance',
    'Familial': 'Sois chaleureux, accueillant, utilise "nous" et "vous", crée une ambiance conviviale',
    'Jeune': 'Sois dynamique, utilise un langage moderne, des expressions tendance, beaucoup d\'emojis',
    'Luxe': 'Sois raffiné, utilise un vocabulaire élégant, évoque l\'exclusivité et la qualité premium',
    'Humour': 'Sois drôle, utilise des jeux de mots, de l\'autodérision, reste léger et sympathique'
  };

  const toneInstruction = toneInstructions[tone] || toneInstructions['Familial'];

  // Adapter selon la plateforme
  const platformInstructions: Record<string, string> = {
    'Instagram': 'Optimisé pour Instagram : accrocheur, visuel, emojis, 20-30 hashtags max',
    'Facebook': 'Optimisé pour Facebook : plus conversationnel, encourage les commentaires, 5-10 hashtags',
    'TikTok': 'Optimisé pour TikTok : très court, punchy, tendance, emojis, 5-8 hashtags tendance'
  };

  const platformInstruction = platformInstructions[platform] || platformInstructions['Instagram'];

  const prompt = `Tu es un expert en community management pour les petits commerces en France.

Génère 3 versions différentes d'un post ${platform} pour ce commerce :

**Commerce :** ${businessName} (${businessType})
**Événement/Sujet :** ${eventTitle}
**Description :** ${eventDescription || 'Aucune description'}
**Ton souhaité :** ${tone}
**Plateforme :** ${platform}${keywordsStr}${locationStr}

CONSIGNES DE TON : ${toneInstruction}

CONSIGNES PLATEFORME : ${platformInstruction}

Règles IMPORTANTES :
- Écris UNIQUEMENT en français
- Utilise des emojis pertinents et adaptés au ton
- Adapte le style selon le ton demandé (${tone})
- Inclus un appel à l'action engageant
- Version courte (~50 mots), moyenne (~100 mots), longue (~150 mots)
- Les hashtags doivent être pertinents pour ${businessType} et ${platform}
${moodboard?.keywords?.length ? `- Intègre subtilement l'univers du commerce via les mots-clés : ${moodboard.keywords.join(', ')}` : ''}

Format de réponse (respecte EXACTEMENT ce format) :
---VERSION 1---
[texte version courte avec hashtags]
---VERSION 2---
[texte version moyenne avec hashtags]
---VERSION 3---
[texte version longue avec hashtags]
`;

  try {
    const text = await callGemini(prompt);
    const versions = text.split(/---VERSION \d---/).filter(v => v.trim());

    if (versions.length >= 3) {
      return versions.slice(0, 3).map(v => v.trim());
    }

    return [text, '', ''];
  } catch (error) {
    console.error('Erreur génération texte:', error);
    throw error;
  }
}

// Fonction pour générer une image à partir d'un template existant
export async function generateImageFromTemplate(
  templateImageUrl: string,
  modifications: string,
  businessName: string,
  businessType: string,
  tone: string
): Promise<string> {

  // Convertir l'URL de l'image en base64 si nécessaire
  let imageBase64 = templateImageUrl;

  if (templateImageUrl.startsWith('data:')) {
    // Déjà en base64, extraire juste les données
    const matches = templateImageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      imageBase64 = matches[2];
    }
  } else {
    // URL externe - fetch et convertir en base64
    try {
      const response = await fetch(templateImageUrl);
      const blob = await response.blob();
      imageBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Enlever le préfixe data:...
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Erreur fetch image template:', error);
      throw new Error('Impossible de charger l\'image du template');
    }
  }

  const response = await fetch(`${BACKEND_URL}/api/modify-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64,
      modifications,
      businessName,
      businessType,
      tone
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Image Template API Error:', error);
    throw new Error(error.error || 'Erreur génération image depuis template');
  }

  const data = await response.json();
  return data.image;
}

// Interface pour les messages de conversation
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Fonction pour modifier une image existante avec le contexte de conversation
export async function modifyImageWithConversation(
  currentImageUrl: string,
  modification: string,
  conversationHistory: ConversationMessage[],
  businessName: string,
  businessType: string,
  tone: string
): Promise<string> {

  // Convertir l'URL de l'image en base64
  let imageBase64 = currentImageUrl;

  if (currentImageUrl.startsWith('data:')) {
    const matches = currentImageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      imageBase64 = matches[2];
    }
  } else {
    try {
      const response = await fetch(currentImageUrl);
      const blob = await response.blob();
      imageBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Erreur fetch image:', error);
      throw new Error('Impossible de charger l\'image actuelle');
    }
  }

  const response = await fetch(`${BACKEND_URL}/api/modify-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64,
      modifications: modification,
      conversationHistory,
      businessName,
      businessType,
      tone
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Image Modification API Error:', error);
    throw new Error(error.error || 'Erreur modification image');
  }

  const data = await response.json();
  return data.image;
}

// Fonction pour générer un prompt d'image (utilitaire)
export async function generateImagePrompt(
  businessName: string,
  businessType: string,
  eventTitle: string,
  _eventDescription: string,
  tone: string,
  moodboard?: MoodboardData
): Promise<string> {
  const keywordsStr = moodboard?.keywords?.length
    ? `Visual keywords: ${moodboard.keywords.join(', ')}.`
    : '';

  const prompt = `Generate a detailed image description in English for: ${businessName} (${businessType}) - ${eventTitle}.
Style: ${tone}. ${keywordsStr}
The description should be vivid and suitable for AI image generation.`;

  try {
    return await callGemini(prompt);
  } catch (error) {
    console.error('Erreur génération prompt image:', error);
    throw error;
  }
}
