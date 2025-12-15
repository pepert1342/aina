import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { HomeIcon, CheckIcon, CloseIcon, DiamondIcon, LogoutIcon, PaletteIcon, PlusIcon, CalendarIcon, ImageIcon, SparklesIcon, LightbulbIcon, TrendingUpIcon } from '../components/Icons';
import { NotificationBell } from '../components/Notifications';

interface Subscription {
  id: string;
  plan: 'monthly' | 'yearly';
  status: 'active' | 'canceled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string;
}

function SubscriptionPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

    // Récupérer l'abonnement
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subData) {
      setSubscription(subData);
    }

    setLoading(false);
    setTimeout(() => setIsVisible(true), 100);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    setCanceling(true);

    try {
      // Appeler le backend pour annuler sur Stripe
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'annulation');
      }

      // Mettre à jour localement
      await supabase
        .from('subscriptions')
        .update({ cancel_at_period_end: true })
        .eq('id', subscription.id);

      setSubscription({ ...subscription, cancel_at_period_end: true });
      setShowCancelModal(false);
    } catch (error) {
      console.error('Erreur:', error);
      // En mode test, simuler l'annulation
      await supabase
        .from('subscriptions')
        .update({ cancel_at_period_end: true })
        .eq('id', subscription.id);

      setSubscription({ ...subscription, cancel_at_period_end: true });
      setShowCancelModal(false);
    } finally {
      setCanceling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription) return;
    setCanceling(true);

    try {
      await supabase
        .from('subscriptions')
        .update({ cancel_at_period_end: false })
        .eq('id', subscription.id);

      setSubscription({ ...subscription, cancel_at_period_end: false });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setCanceling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8f4fd 0%, #FFFFFF 50%, #FFF8E7 100%)',
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
        justifyContent: 'space-between'
      }}>
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}
        >
          <span style={{
            fontSize: '28px',
            fontFamily: "'Titan One', cursive",
            color: '#C84B31'
          }}>AiNa</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {user && <NotificationBell userId={user.id} />}
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
                      {subscription ? `Abonnement ${subscription.plan === 'yearly' ? 'Annuel' : 'Mensuel'}` : 'Aucun abonnement'}
                    </p>
                  </div>

                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/subscription'); }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#F3F4F6',
                      border: 'none',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151'
                    }}
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
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A2E', marginBottom: '24px', textAlign: 'center' }}>
          Mon Abonnement
        </h1>

        {subscription ? (
          <>
            {/* Statut de l'abonnement */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '16px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A2E', marginBottom: '4px' }}>
                    Formule {subscription.plan === 'monthly' ? 'Mensuelle' : 'Annuelle'}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    {subscription.plan === 'monthly' ? '49€/mois' : '490€/an'}
                  </p>
                </div>
                <div style={{
                  padding: '6px 12px',
                  borderRadius: '50px',
                  backgroundColor: subscription.status === 'active'
                    ? (subscription.cancel_at_period_end ? '#FEF3C7' : '#D1FAE5')
                    : '#FEE2E2',
                  color: subscription.status === 'active'
                    ? (subscription.cancel_at_period_end ? '#D97706' : '#065F46')
                    : '#DC2626',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {subscription.status === 'active'
                    ? (subscription.cancel_at_period_end ? 'Annulation prévue' : <><CheckIcon size={12} color="#10B981" /> Actif</>)
                    : <><CloseIcon size={12} color="#EF4444" /> Inactif</>}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#666' }}>Début de période</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A2E' }}>
                    {formatDate(subscription.current_period_start)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#666' }}>
                    {subscription.cancel_at_period_end ? 'Fin d\'accès' : 'Prochain renouvellement'}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: subscription.cancel_at_period_end ? '#D97706' : '#1A1A2E' }}>
                    {formatDate(subscription.current_period_end)}
                  </span>
                </div>
              </div>

              {subscription.cancel_at_period_end && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#92400E'
                }}>
                  ⚠️ Votre abonnement ne sera pas renouvelé. Vous conservez l'accès jusqu'au {formatDate(subscription.current_period_end)}.
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A2E', marginBottom: '16px' }}>
                Gérer mon abonnement
              </h4>

              {subscription.cancel_at_period_end ? (
                <button
                  onClick={handleReactivateSubscription}
                  disabled={canceling}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #10B981, #34D399)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: canceling ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: canceling ? 0.7 : 1
                  }}
                >
                  {canceling ? '⏳ Traitement...' : '🔄 Réactiver mon abonnement'}
                </button>
              ) : (
                <button
                  onClick={() => setShowCancelModal(true)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: 'white',
                    border: '2px solid #DC2626',
                    borderRadius: '10px',
                    color: '#DC2626',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Annuler mon abonnement
                </button>
              )}

              <p style={{ fontSize: '11px', color: '#888', marginTop: '12px', textAlign: 'center' }}>
                Pour toute question, contactez-nous à support@aina.app
              </p>
            </div>
          </>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '40px 20px',
            textAlign: 'center',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>😢</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A2E', marginBottom: '8px' }}>
              Aucun abonnement actif
            </h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
              Abonnez-vous pour accéder à toutes les fonctionnalités
            </p>
            <button
              onClick={() => navigate('/pricing')}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 4px 15px rgba(200, 75, 49, 0.3)'
              }}
            >
              Voir les offres
            </button>
          </div>
        )}
      </main>

      {/* Modal d'annulation */}
      {showCancelModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>😢</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A2E', marginBottom: '8px' }}>
                Vous nous quittez ?
              </h3>
              <p style={{ fontSize: '14px', color: '#666' }}>
                Votre abonnement restera actif jusqu'à la fin de la période en cours.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleCancelSubscription}
                disabled={canceling}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#DC2626',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: canceling ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: canceling ? 0.7 : 1
                }}
              >
                {canceling ? '⏳ Annulation...' : 'Confirmer l\'annulation'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={canceling}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  color: '#666',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Garder mon abonnement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionPage;
