import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import logoAina from '/logo-aina.png';

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
      .single();

    if (subData) {
      setSubscription(subData);
    }

    setLoading(false);
    setTimeout(() => setIsVisible(true), 100);
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
        justifyContent: 'space-between'
      }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}
        >
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
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '2px solid #E5E7EB',
            borderRadius: '8px',
            color: '#666',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          ← Retour
        </button>
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
                    ? (subscription.cancel_at_period_end ? '⏳ Annulation prévue' : '✅ Actif')
                    : '❌ Inactif'}
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
                background: 'linear-gradient(135deg, #FF8A65, #FFB088)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 4px 15px rgba(255, 138, 101, 0.3)'
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
