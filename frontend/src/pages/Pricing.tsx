import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { HomeIcon, SparklesIcon, CheckIcon, CloseIcon, DiamondIcon, LogoutIcon, PaletteIcon, PlusIcon, CalendarIcon, ImageIcon, LightbulbIcon, TrendingUpIcon } from '../components/Icons';

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
  };

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
      .maybeSingle();

    if (subscription) {
      navigate('/dashboard');
      return;
    }

    setLoading(false);
    setTimeout(() => setIsVisible(true), 100);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
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
      showConfirm(
        'Mode Test',
        'Erreur de connexion au serveur de paiement. Voulez-vous continuer en mode test ?',
        async () => {
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
            closeConfirmModal();
            navigate('/dashboard');
          } else {
            alert('Erreur lors de la création de l\'abonnement test');
          }
        }
      );
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
        background: '#FFF8E7',
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            animation: 'spin 1.5s ease-in-out infinite'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C84B31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
            </svg>
          </div>
          <span style={{
            fontSize: '32px',
            fontFamily: "'Titan One', cursive",
            color: '#C84B31',
            display: 'block',
            marginBottom: '8px'
          }}>AiNa</span>
          <p style={{ color: '#666' }}>Chargement...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            50% { transform: rotate(180deg); }
            100% { transform: rotate(180deg); }
          }
        `}</style>
      </div>
    );
  }

  const monthlyPrice = getDiscountedPrice(PRICES.monthly.amount);
  const yearlyPrice = getDiscountedPrice(PRICES.yearly.amount);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFF8E7',
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.5s ease'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'rgba(255,248,231,0.95)',
        borderBottom: '1px solid #E5E7EB',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{
            fontSize: '28px',
            fontFamily: "'Titan One', cursive",
            color: '#C84B31'
          }}>AiNa</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              boxShadow: '0 4px 15px rgba(26, 58, 92, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <HomeIcon size={14} color="white" /> Accueil
          </button>

          {/* Menu Profil */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(200, 75, 49, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              P
            </button>

            {showUserMenu && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 99
                  }}
                  onClick={() => setShowUserMenu(false)}
                />
                <div style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  padding: '8px',
                  minWidth: '220px',
                  zIndex: 100,
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{
                    padding: '12px',
                    borderBottom: '1px solid #E5E7EB',
                    marginBottom: '8px'
                  }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A2E', margin: 0 }}>
                      {user?.email}
                    </p>
                    <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0' }}>
                      Aucun abonnement actif
                    </p>
                  </div>

                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/subscription'); }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <DiamondIcon size={18} color="#2d5a45" />
                    Mon abonnement
                  </button>

                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/create'); }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <PlusIcon size={18} color="#c84b31" />
                    Nouveau Post
                  </button>

                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/calendar'); }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <CalendarIcon size={18} color="#1a3a5c" />
                    Calendrier
                  </button>

                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/moodboard'); }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <PaletteIcon size={18} color="#2d5a45" />
                    Moodboard
                  </button>

                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/dashboard?tab=posts'); }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <ImageIcon size={18} color="#8B5CF6" />
                    Mes Posts
                  </button>

                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/dashboard?tab=tips'); }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <LightbulbIcon size={18} color="#2d5a45" />
                    Tips & Conseils
                  </button>

                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/dashboard?tab=stats'); }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <TrendingUpIcon size={18} color="#8B5CF6" />
                    Statistiques
                  </button>

                  <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '8px 0' }} />

                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#DC2626',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <LogoutIcon size={18} color="#DC2626" />
                    Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '24px 16px', maxWidth: '500px', margin: '0 auto' }}>
        {/* Success Badge */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1A1A2E', marginBottom: '8px' }}>
            <span style={{ fontFamily: "'Titan One', cursive", color: '#C84B31', fontSize: '28px', letterSpacing: '1px' }}>AiNa</span> est prête !
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
              border: `3px solid ${selectedPlan === 'monthly' ? '#1a3a5c' : '#E5E7EB'}`,
              backgroundColor: selectedPlan === 'monthly' ? '#e8f4fd' : 'white',
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
                <span style={{ fontSize: '28px', fontWeight: '800', color: '#1a3a5c' }}>
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
                backgroundColor: '#1a3a5c',
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
              border: `3px solid ${selectedPlan === 'yearly' ? '#1a3a5c' : '#E5E7EB'}`,
              backgroundColor: selectedPlan === 'yearly' ? '#e8f4fd' : 'white',
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
                <span style={{ fontSize: '28px', fontWeight: '800', color: '#1a3a5c' }}>
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
                backgroundColor: '#1a3a5c',
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
              <CloseIcon size={14} color="#EF4444" /> {promoError}
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
            <SparklesIcon size={16} color="#c84b31" /> Inclus dans votre abonnement :
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
                <CheckIcon size={14} color="#10B981" />
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
            background: processing ? '#E5E7EB' : 'linear-gradient(135deg, #c84b31, #e06b4f)',
            border: 'none',
            borderRadius: '14px',
            color: processing ? '#999' : 'white',
            fontWeight: '700',
            fontSize: '16px',
            cursor: processing ? 'not-allowed' : 'pointer',
            boxShadow: processing ? 'none' : '0 8px 30px rgba(200, 75, 49, 0.4)',
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

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={closeConfirmModal}
        >
          <div
            style={{
              backgroundColor: '#FFF8E7',
              borderRadius: '20px',
              padding: '0',
              width: '100%',
              maxWidth: '340px',
              margin: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              border: '3px solid #c84b31',
              overflow: 'hidden',
              fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #c84b31, #e05a40)',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>
                ⚠️
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: 'white',
                margin: 0
              }}>
                {confirmModal.title}
              </h3>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              <p style={{
                fontSize: '15px',
                color: '#1A1A2E',
                margin: '0 0 24px 0',
                lineHeight: '1.5',
                textAlign: 'center'
              }}>
                {confirmModal.message}
              </p>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={closeConfirmModal}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: 'white',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    color: '#666',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'linear-gradient(135deg, #c84b31, #e05a40)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(200, 75, 49, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pricing;
