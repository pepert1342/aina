import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import logoAina from '/logo-aina.png';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51Sa51O7zjlETwK15vLdjukeWvtPWzQB8dlx0iPV1cwysWOqQisfZB0rUWEkGoFwOgU1jcuWRFf2AHJ1EVytwAU2B00I4RpDIpR';

// Prix Stripe
const PRICES = {
  monthly: {
    id: 'price_1Sa55Z7zjlETwK15FYLLGruq',
    amount: 49,
    interval: 'mois'
  },
  yearly: {
    id: 'price_1Sa56E7zjlETwK15pwkpfOjb',
    amount: 490,
    interval: 'an',
    savings: '2 mois offerts'
  }
};

function Pricing() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Codes promo valides
  const validPromoCodes: Record<string, number> = {
    'PEPE20': 20,
    'AINA20': 20,
    'LAUNCH20': 20
  };

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    setUser(session.user);

    // Vérifier si déjà abonné
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single();

    if (subscription) {
      navigate('/dashboard');
      return;
    }

    setLoading(false);
    setTimeout(() => setIsVisible(true), 100);
  };

  const applyPromoCode = () => {
    const code = promoCode.toUpperCase().trim();
    if (validPromoCodes[code]) {
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoApplied(false);
      setPromoError('Code promo invalide');
    }
  };

  const getDiscountedPrice = (price: number) => {
    if (promoApplied) {
      const discount = validPromoCodes[promoCode.toUpperCase().trim()] || 0;
      return price * (1 - discount / 100);
    }
    return price;
  };

  const handleSubscribe = async () => {
    if (!user) return;
    setProcessing(true);

    try {
      // Appeler le backend pour créer une session Stripe Checkout
      const response = await fetch('http://localhost:3001/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          priceType: selectedPlan,
          promoCode: promoApplied ? promoCode.toUpperCase().trim() : null
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        // Rediriger vers Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('URL de paiement non reçue');
      }
    } catch (error: any) {
      console.error('Erreur:', error);

      // Fallback: créer l'abonnement en mode test si backend non disponible
      const confirmTest = window.confirm('Erreur de connexion au serveur de paiement. Voulez-vous continuer en mode test ?');

      if (confirmTest) {
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert([{
            user_id: user.id,
            plan: selectedPlan,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + (selectedPlan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
            stripe_customer_id: 'test_customer_' + user.id,
            stripe_subscription_id: 'test_sub_' + Date.now()
          }]);

        if (!insertError) {
          navigate('/dashboard');
        } else {
          alert('Erreur lors de la création de l\'abonnement test');
        }
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F0F7FF, #FFFFFF)',
        fontFamily: "'Inter', -apple-system, sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <img src={logoAina} alt="AiNa" style={{ width: '60px', height: '60px', marginBottom: '16px' }} />
          <p style={{ color: '#666' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  const monthlyPrice = getDiscountedPrice(PRICES.monthly.amount);
  const yearlyPrice = getDiscountedPrice(PRICES.yearly.amount);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0F7FF 0%, #FFFFFF 50%, #FFF5F2 100%)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.5s ease'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderBottom: '1px solid #E5E7EB',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <img src={logoAina} alt="AiNa" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
          <span style={{
            fontSize: '22px',
            fontWeight: '800',
            fontFamily: "'Poppins', sans-serif",
            background: 'linear-gradient(135deg, #FF8A65, #004E89)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>AiNa</span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '24px 16px', maxWidth: '500px', margin: '0 auto' }}>
        {/* Success Badge */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #10B981, #34D399)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '36px',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.3)'
          }}>
            🎉
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A2E', marginBottom: '8px' }}>
            Votre IA est prête !
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Choisissez votre formule pour commencer à créer
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {/* Plan Mensuel */}
          <div
            onClick={() => setSelectedPlan('monthly')}
            style={{
              padding: '20px',
              borderRadius: '16px',
              border: `3px solid ${selectedPlan === 'monthly' ? '#FF8A65' : '#E5E7EB'}`,
              backgroundColor: selectedPlan === 'monthly' ? '#FFF5F2' : 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A2E', marginBottom: '4px' }}>
                  Mensuel
                </h3>
                <p style={{ fontSize: '13px', color: '#666' }}>Sans engagement</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {promoApplied && (
                  <span style={{
                    fontSize: '14px',
                    color: '#999',
                    textDecoration: 'line-through',
                    display: 'block'
                  }}>
                    {PRICES.monthly.amount}€
                  </span>
                )}
                <span style={{ fontSize: '28px', fontWeight: '800', color: '#FF8A65' }}>
                  {monthlyPrice.toFixed(0)}€
                </span>
                <span style={{ fontSize: '14px', color: '#666' }}>/mois</span>
              </div>
            </div>
            {selectedPlan === 'monthly' && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '16px',
                backgroundColor: '#FF8A65',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '50px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                Sélectionné
              </div>
            )}
          </div>

          {/* Plan Annuel */}
          <div
            onClick={() => setSelectedPlan('yearly')}
            style={{
              padding: '20px',
              borderRadius: '16px',
              border: `3px solid ${selectedPlan === 'yearly' ? '#004E89' : '#E5E7EB'}`,
              backgroundColor: selectedPlan === 'yearly' ? '#F0F7FF' : 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '16px',
              background: 'linear-gradient(135deg, #10B981, #34D399)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '50px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              💰 Économisez 17%
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A2E', marginBottom: '4px' }}>
                  Annuel
                </h3>
                <p style={{ fontSize: '13px', color: '#666' }}>2 mois offerts</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {promoApplied && (
                  <span style={{
                    fontSize: '14px',
                    color: '#999',
                    textDecoration: 'line-through',
                    display: 'block'
                  }}>
                    {PRICES.yearly.amount}€
                  </span>
                )}
                <span style={{ fontSize: '28px', fontWeight: '800', color: '#004E89' }}>
                  {yearlyPrice.toFixed(0)}€
                </span>
                <span style={{ fontSize: '14px', color: '#666' }}>/an</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#10B981', marginTop: '8px', fontWeight: '600' }}>
              Soit {(yearlyPrice / 12).toFixed(2)}€/mois
            </p>
            {selectedPlan === 'yearly' && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '16px',
                backgroundColor: '#004E89',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '50px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                Sélectionné
              </div>
            )}
          </div>
        </div>

        {/* Code Promo */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid #E5E7EB'
        }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1A1A2E', marginBottom: '8px' }}>
            🎁 Code promo / Parrainage
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                setPromoApplied(false);
                setPromoError('');
              }}
              placeholder="Ex: PEPE20"
              style={{
                flex: 1,
                padding: '12px',
                border: `2px solid ${promoApplied ? '#10B981' : promoError ? '#DC2626' : '#E5E7EB'}`,
                borderRadius: '10px',
                fontSize: '14px',
                textTransform: 'uppercase'
              }}
            />
            <button
              onClick={applyPromoCode}
              disabled={!promoCode.trim()}
              style={{
                padding: '12px 20px',
                backgroundColor: promoCode.trim() ? '#1A1A2E' : '#E5E7EB',
                border: 'none',
                borderRadius: '10px',
                color: promoCode.trim() ? 'white' : '#999',
                fontWeight: '600',
                cursor: promoCode.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Appliquer
            </button>
          </div>
          {promoApplied && (
            <p style={{ fontSize: '13px', color: '#10B981', marginTop: '8px', fontWeight: '600' }}>
              ✅ Code appliqué : -{validPromoCodes[promoCode.toUpperCase().trim()]}%
            </p>
          )}
          {promoError && (
            <p style={{ fontSize: '13px', color: '#DC2626', marginTop: '8px' }}>
              ❌ {promoError}
            </p>
          )}
        </div>

        {/* Features */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid #E5E7EB'
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A2E', marginBottom: '12px' }}>
            ✨ Inclus dans votre abonnement :
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              'Posts illimités avec texte + image IA',
              'Calibrage IA personnalisé',
              'Logo automatique sur vos images',
              'Calendrier des événements',
              'Conseils Community Manager',
              'Support prioritaire'
            ].map((feature, index) => (
              <li key={index} style={{
                padding: '8px 0',
                borderBottom: index < 5 ? '1px solid #F3F4F6' : 'none',
                fontSize: '13px',
                color: '#444',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ color: '#10B981' }}>✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleSubscribe}
          disabled={processing}
          style={{
            width: '100%',
            padding: '18px',
            background: processing ? '#E5E7EB' : 'linear-gradient(135deg, #FF8A65, #FFB088)',
            border: 'none',
            borderRadius: '14px',
            color: processing ? '#999' : 'white',
            fontWeight: '700',
            fontSize: '16px',
            cursor: processing ? 'not-allowed' : 'pointer',
            boxShadow: processing ? 'none' : '0 8px 30px rgba(255, 138, 101, 0.4)',
            marginBottom: '16px'
          }}
        >
          {processing ? '⏳ Traitement...' : `🚀 S'abonner - ${selectedPlan === 'monthly' ? monthlyPrice.toFixed(0) + '€/mois' : yearlyPrice.toFixed(0) + '€/an'}`}
        </button>

        {/* Security badges */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
            🔒 Paiement sécurisé par Stripe
          </p>
          <p style={{ fontSize: '11px', color: '#999' }}>
            Annulation possible à tout moment depuis votre profil
          </p>
        </div>
      </main>
    </div>
  );
}

export default Pricing;
