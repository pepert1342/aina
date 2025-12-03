// server/index.js - Backend pour Imagen 3 + Stripe
const express = require('express');
const cors = require('cors');
const { GoogleAuth } = require('google-auth-library');
const Stripe = require('stripe');

const app = express();
app.use(cors());

// Stripe configuration
const STRIPE_SECRET_KEY = 'sk_test_51Sa51O7zjlETwK15TJTdWIH100jg8aKfBszdWnSgL972N4Kbhqeg2pgdvOI1lpmtKghdGLSijqsFAfSbvJpk0xoh00phWe9xi6';
const stripe = new Stripe(STRIPE_SECRET_KEY);

const STRIPE_PRICES = {
  monthly: 'price_1Sa55Z7zjlETwK15FYLLGruq',
  yearly: 'price_1Sa56E7zjlETwK15pwkpfOjb'
};

// Webhook needs raw body
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));

// Configuration Google Cloud
const PROJECT_ID = 'gen-lang-client-0402380168';
const LOCATION = 'us-central1';

// Credentials du Service Account
const credentials = {
  "type": "service_account",
  "project_id": "gen-lang-client-0402380168",
  "private_key_id": "eddd8213d74757758ca22ff2141951d5a5d072bb",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDR1D1N0e+GiFx4\nElwGAK6weXy6Jb1yHxqWNinSTPaplaUlLi6X7cU9X3ElUI1l5ZnBGTRfY5TLE5L4\n4JPaEHfv5T/0hG5B+9/XPWIxttAaHBafn+nZDvj0LIYWBfv0pNzaV1fYMckGu6V+\ntJqhJsWefuls2m894EWbGzyUGlC1C/FKQB2C8pve0Ii7iKGqOgU5srNo/3Flwenx\n1Z8MLun+YIklzBDPeErY8HWWrYuVAwS9/vvikc8Pvdp3EQfOvcUpzdtePZf8mm2U\nnL+oLfECzMu0r1Yen5qgX2DL5z3BStBi3POfQswf7dBK7apaANY0mOY/WxZguBfq\nXE8Vo9TRAgMBAAECggEAW1w04QhSaVpAIMulo7tyVEZhR0+dX+4pDlRA+18lWwtc\nH4cvJFmTsrg2tI+RMVe6DXii9BGQvKcmLBTka2MWRa6knRt4QmSfvsDsW0cE7wlh\n1Fi1YhwBy5cDPt2WKZwKyUqUZf6vT64uTa/nT9lo3CzYB9xH6UIYLIO8aaPXliv1\nxDyJxjsxFEjgX9Qyb/mNn+pcvSKO8mVOuFTut6vzOiiiqLzWJzKXtti/isORGdQe\nYsNINrRRqPI3GNtXMIVcJHdT4LuwPoFC5dIvJWZisT6N8hkutMApngv8E3YgnZs8\nT4XPnVe9c/enDwwYQyL5Sr9GZECvOCSeNvAj0Je9fQKBgQD296S9Tc6dv9sKl1my\ngFi+7a31eiC6WqgErcVhbonmGRvZLzi3IukLfOt7wGcjJYovlmUj7kFZA7H54uWH\nODQHcFMW4mZYgS3Z2z8+NT6ao0b1UIbLKwKD3hfd5AES0T/pOYQxgPxW4xVNkqgE\nf2KYffJEb3LTRB67jxUnOKWzdwKBgQDZgN6yiBT0KIp1Ivwpl9DqDrCcYmkUrb35\nIcKAsuRWJ1poqe/mj6x+xADT38+JoE9/0cYwidhwHVOV6KsBA/LjryrLA7Cyqikp\ne8slWhaWLB+LHXHAYIvHmh4m5Aof4yJPaWttNhB18KjKkyNNa6FeRfk4zkF/L562\nqHcMJyL79wKBgE1mASgeyWEg7oncMw1BMg7sODeVhcpBfSSyPQiy9t65AcRIC1NB\nyp2CEd7fxrL6IduWG65uDebSxKVW2a5OC+hE6JVkcMTN/0umbaSWVT9ramKZURU9\nLnWbVgmBWmDGWWxDTU2iafLlChkcnDGEpqa52gJelzLkx2jqh6uaEjwzAoGAalPL\nim9n/uwKs7TEnPiwkptXzzt0rz04T6AnW48YfN2EHwJkWswFwXrEBM+2v0r1UkEU\nqAnbGwPbJr+1SSvLA29Qdip5qP3yXWs9JidiP0uWqAVe5HLOIme/MbftEyWQUk3w\nzFTPuzhI667+ZQymuFVwvkpmTmzTI+w7Nl+zhIUCgYAidczfrxuZezox3Ug2lkes\nCUvS6j5rgwpmdEiKbp/f6HCuM0dKmTNRa934Ou5WSTXIHWrhZ3Y3haNct9Trbuxw\nU6MCZdo5J0fBdj6l+lTt1mToesgtJylK41yCpkAtwWxwRMANNSo4KbYL0vIw6mMr\nksWVmImxffyGhomEIsfQJA==\n-----END PRIVATE KEY-----\n",
  "client_email": "aina-backend@gen-lang-client-0402380168.iam.gserviceaccount.com",
  "client_id": "113766296137763425724",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/aina-backend%40gen-lang-client-0402380168.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
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
