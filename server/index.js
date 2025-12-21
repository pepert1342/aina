// server/index.js - Backend pour Imagen 3 + Stripe
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleAuth } = require('google-auth-library');
const Stripe = require('stripe');

const app = express();
app.use(cors());

// Stripe configuration - depuis les variables d'environnement
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(STRIPE_SECRET_KEY);

const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_1Sa55Z7zjlETwK15FYLLGruq',
  yearly: process.env.STRIPE_PRICE_YEARLY || 'price_1Sa56E7zjlETwK15pwkpfOjb'
};

// Webhook needs raw body
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));

// Configuration Google Cloud - depuis les variables d'environnement
const PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const LOCATION = process.env.GOOGLE_LOCATION || 'us-central1';

// Credentials du Service Account depuis les variables d'environnement
const credentials = {
  type: "service_account",
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
};

// Créer le client d'authentification
const auth = new GoogleAuth({
  credentials: credentials,
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

// Endpoint pour générer une image avec Imagen 3
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt requis' });
    }

    console.log('🎨 Génération image avec prompt:', prompt.substring(0, 100) + '...');

    // Obtenir le token d'accès
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    // Appeler Imagen 3
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagen-3.0-generate-001:predict`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: prompt
          }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
          safetyFilterLevel: "block_few",
          personGeneration: "allow_adult"
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erreur Imagen:', error);
      return res.status(response.status).json({ error: 'Erreur génération image', details: error });
    }

    const data = await response.json();
    
    if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
      const base64Image = data.predictions[0].bytesBase64Encoded;
      console.log('✅ Image générée avec succès');
      return res.json({ 
        success: true, 
        image: `data:image/png;base64,${base64Image}` 
      });
    }

    return res.status(500).json({ error: 'Aucune image dans la réponse' });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour générer du texte avec Gemini
app.post('/api/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt requis' });
    }

    console.log('📝 Génération texte...');

    // Obtenir le token d'accès
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    // Appeler Gemini 2.0 Flash
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/gemini-2.0-flash-001:generateContent`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erreur Gemini:', error);
      return res.status(response.status).json({ error: 'Erreur génération texte', details: error });
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      console.log('✅ Texte généré avec succès');
      return res.json({ success: true, text: text });
    }

    return res.status(500).json({ error: 'Aucun texte dans la réponse' });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// STRIPE ENDPOINTS
// ============================================

// Créer une session Stripe Checkout
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { userId, email, priceType, promoCode } = req.body;

    if (!userId || !email || !priceType) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const priceId = STRIPE_PRICES[priceType];
    if (!priceId) {
      return res.status(400).json({ error: 'Type de prix invalide' });
    }

    console.log('💳 Création session Stripe pour:', email, priceType);

    // Chercher ou créer le customer Stripe
    let customer;
    const existingCustomers = await stripe.customers.list({ email: email, limit: 1 });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email,
        metadata: { userId: userId }
      });
    }

    // Préparer les options de la session
    const sessionOptions = {
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'http://localhost:5173'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/pricing`,
      metadata: {
        userId: userId,
        priceType: priceType
      },
      subscription_data: {
        metadata: {
          userId: userId,
          priceType: priceType
        }
      }
    };

    // Ajouter le code promo si présent
    if (promoCode) {
      // Map des codes promo vers leurs IDs Stripe
      const PROMO_CODE_IDS = {
        'PEPE20': 'promo_1SaE9p7zjlETwK157vjvH8eP',
        'AINA20': 'promo_1SaE9p7zjlETwK157vjvH8eP',
        'LAUNCH20': 'promo_1SaE9p7zjlETwK157vjvH8eP'
      };

      const promoId = PROMO_CODE_IDS[promoCode.toUpperCase()];
      if (promoId) {
        sessionOptions.discounts = [{ promotion_code: promoId }];
        console.log('✅ Code promo appliqué:', promoCode, '->', promoId);
      } else {
        console.log('⚠️ Code promo non reconnu:', promoCode);
      }
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    console.log('✅ Session créée:', session.id);
    res.json({ url: session.url });

  } catch (error) {
    console.error('❌ Erreur Stripe:', error);
    res.status(500).json({ error: error.message });
  }
});

// Annuler un abonnement
app.post('/api/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'subscriptionId requis' });
    }

    console.log('🔄 Annulation abonnement:', subscriptionId);

    // Annuler à la fin de la période
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    console.log('✅ Abonnement annulé à la fin de la période');
    res.json({ success: true, subscription });

  } catch (error) {
    console.error('❌ Erreur annulation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Réactiver un abonnement
app.post('/api/reactivate-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'subscriptionId requis' });
    }

    console.log('🔄 Réactivation abonnement:', subscriptionId);

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });

    console.log('✅ Abonnement réactivé');
    res.json({ success: true, subscription });

  } catch (error) {
    console.error('❌ Erreur réactivation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook Stripe pour les événements
app.post('/api/stripe-webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  // En production, ajoutez votre webhook secret ici
  // const endpointSecret = 'whsec_...';

  let event;

  try {
    // En mode test, on parse directement
    event = JSON.parse(req.body.toString());
    console.log('📩 Webhook Stripe reçu:', event.type);
  } catch (err) {
    console.error('❌ Erreur webhook:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer les événements
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('✅ Paiement réussi pour:', session.customer_email);
      // Ici vous pouvez ajouter la logique pour créer l'abonnement dans Supabase
      // via un appel API ou directement si vous avez le client Supabase
      break;

    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log('🔄 Abonnement mis à jour:', subscription.id);
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      console.log('❌ Abonnement supprimé:', deletedSub.id);
      break;

    case 'invoice.payment_failed':
      const invoice = event.data.object;
      console.log('❌ Paiement échoué pour:', invoice.customer_email);
      break;

    default:
      console.log('📩 Événement non géré:', event.type);
  }

  res.json({ received: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AiNa Backend running 🚀', stripe: 'configured' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 AiNa Backend running on http://localhost:${PORT}`);
  console.log(`📋 Project ID: ${PROJECT_ID}`);
  console.log(`📍 Location: ${LOCATION}`);
});
