// Configuration Gemini API
const GEMINI_API_KEY = 'AIzaSyCgsJKZROIcOF_Di7As4XX4dRIMWjGFFfE';
const TEXT_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const IMAGE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

// Interface pour les données du Moodboard
export interface MoodboardData {
  keywords?: string[];
  logo_url?: string;
  photos?: string[];
  address?: string;
}

// Fonction pour appeler l'API Gemini pour le texte
async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(`${TEXT_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error);
    throw new Error(error.error?.message || 'Erreur API Gemini');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
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

  const response = await fetch(`${IMAGE_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: imagePrompt
        }]
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Image API Error:', error);
    throw new Error(error.error?.message || 'Erreur génération image');
  }

  const data = await response.json();
  
  // Chercher l'image dans la réponse
  const parts = data.candidates[0].content.parts;
  for (const part of parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error('Aucune image générée');
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

// Fonction pour générer un prompt d'image (utilitaire)
export async function generateImagePrompt(
  businessName: string,
  businessType: string,
  eventTitle: string,
  eventDescription: string,
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
