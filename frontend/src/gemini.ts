// Configuration Gemini API
const GEMINI_API_KEY = 'AIzaSyCgsJKZROIcOF_Di7As4XX4dRIMWjGFFfE';
const TEXT_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const IMAGE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

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

// Fonction pour générer une image avec Gemini
export async function generateImage(
  businessName: string,
  businessType: string,
  eventTitle: string,
  eventDescription: string,
  tone: string
): Promise<string> {
  
  const imagePrompt = `Generate a professional social media image for a ${businessType} called "${businessName}". 
The image is for an event: "${eventTitle}". 
${eventDescription ? `Description: ${eventDescription}.` : ''}
Style: ${tone}, warm Mediterranean colors, professional food/restaurant photography style.
The image should be appetizing, inviting, and suitable for Instagram.
Do NOT include any text in the image.`;

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

// Fonction pour générer un texte de post
export async function generatePostText(
  businessName: string,
  businessType: string,
  eventTitle: string,
  eventDescription: string,
  tone: string,
  platform: string
): Promise<string[]> {
  const prompt = `Tu es un expert en community management pour les petits commerces en France.

Génère 3 versions différentes d'un post ${platform} pour ce commerce :

**Commerce :** ${businessName} (${businessType})
**Événement :** ${eventTitle}
**Description :** ${eventDescription || 'Aucune description'}
**Ton souhaité :** ${tone}
**Plateforme :** ${platform}

Règles :
- Écris en français
- Utilise des emojis pertinents
- Adapte le ton selon la demande (${tone})
- Inclus un appel à l'action
- Version courte (~50 mots), moyenne (~100 mots), longue (~150 mots)
- Ajoute 5-10 hashtags pertinents à la fin

Format de réponse (respecte exactement ce format) :
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

export async function generateImagePrompt(
  businessName: string,
  businessType: string,
  eventTitle: string,
  eventDescription: string,
  tone: string
): Promise<string> {
  const prompt = `Génère une description d'image en anglais pour : ${businessName} (${businessType}) - ${eventTitle}. Style: ${tone}.`;

  try {
    return await callGemini(prompt);
  } catch (error) {
    console.error('Erreur génération prompt image:', error);
    throw error;
  }
}
