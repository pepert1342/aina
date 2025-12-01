// Configuration Gemini API - Utilisation directe de fetch
const GEMINI_API_KEY = 'AIzaSyCgsJKZROIcOF_Di7As4XX4dRIMWjGFFfE';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Fonction pour appeler l'API Gemini directement
async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
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

    // Parser les 3 versions
    const versions = text.split(/---VERSION \d---/).filter(v => v.trim());
    
    if (versions.length >= 3) {
      return versions.slice(0, 3).map(v => v.trim());
    }
    
    // Si le parsing échoue, retourner le texte brut
    return [text, '', ''];
  } catch (error) {
    console.error('Erreur génération texte:', error);
    throw error;
  }
}

// Fonction pour générer une description d'image (prompt pour image)
export async function generateImagePrompt(
  businessName: string,
  businessType: string,
  eventTitle: string,
  eventDescription: string,
  tone: string
): Promise<string> {
  const prompt = `Tu es un expert en création de visuels pour les réseaux sociaux.

Génère une description détaillée pour créer une image de post Instagram/Facebook pour :

**Commerce :** ${businessName} (${businessType})
**Événement :** ${eventTitle}
**Description :** ${eventDescription || 'Aucune description'}
**Ambiance souhaitée :** ${tone}

Règles pour la description d'image :
- Style photographique professionnel
- Couleurs chaleureuses et méditerranéennes
- Ambiance ${tone.toLowerCase()}
- Format carré (1:1) pour Instagram
- Pas de texte sur l'image
- Description en anglais pour meilleure génération

Réponds UNIQUEMENT avec la description de l'image en anglais, rien d'autre.
`;

  try {
    return await callGemini(prompt);
  } catch (error) {
    console.error('Erreur génération prompt image:', error);
    throw error;
  }
}