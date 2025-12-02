import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { getUpcomingEvents } from '../autoEvents';

interface Business {
  id: string;
  business_name: string;
  business_type: string;
  tone: string;
  logo_url?: string;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
}

interface AutoEvent {
  date: Date;
  title: string;
  type: string;
  icon: string;
  description: string;
  suggestPost: boolean;
  daysUntil: number;
}

function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [autoEvents, setAutoEvents] = useState<AutoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    // Charger les événements automatiques
    const upcoming = getUpcomingEvents(60); // 60 prochains jours
    setAutoEvents(upcoming.filter(e => e.suggestPost).slice(0, 5));
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/login');
      return;
    }

    setUser(session.user);
    await loadData(session.user.id);
    setLoading(false);
    setTimeout(() => setIsVisible(true), 100);
  };

  const loadData = async (userId: string) => {
    // Charger le commerce
    const { data: businessData } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (businessData) {
      setBusiness(businessData);
    }

    // Charger les événements à venir
    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(5);

    if (eventsData) {
      setEvents(eventsData);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FAFBFC, #F0F2F5)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #FF6B35, #004E89)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '800',
            fontSize: '24px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            A
          </div>
          <p style={{ color: '#666', fontWeight: '500' }}>Chargement...</p>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FAFBFC, #F0F2F5)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              background: 'linear-gradient(135deg, #FF6B35, #004E89)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '800',
              fontSize: '20px'
            }}>
              A
            </div>
            <span style={{ 
              fontSize: '24px', 
              fontWeight: '800',
              background: 'linear-gradient(135deg, #FF6B35, #004E89)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              AiNa
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 16px',
              backgroundColor: '#F5F5F7',
              borderRadius: '50px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #FF6B35, #004E89)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span style={{ color: '#1A1A2E', fontWeight: '500', fontSize: '14px' }}>
                {user?.email?.split('@')[0]}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                border: '2px solid #E5E7EB',
                borderRadius: '10px',
                color: '#666',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FF6B35';
                e.currentTarget.style.color = '#FF6B35';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.color = '#666';
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px 16px'
      }}>
        {/* Welcome Section - Réduit */}
        <div style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease-out'
        }}>
          <div style={{
            background: '#004E89',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Logo ou initiale */}
              {business?.logo_url ? (
                <img 
                  src={business.logo_url} 
                  alt="Logo" 
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    objectFit: 'cover',
                    border: '2px solid rgba(255,255,255,0.2)'
                  }}
                />
              ) : (
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '800',
                  fontSize: '22px'
                }}>
                  {business?.business_name?.charAt(0) || 'A'}
                </div>
              )}
              
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '2px' }}>
                  {getGreeting()} 👋
                </p>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'white',
                  margin: 0
                }}>
                  {business?.business_name || 'Bienvenue sur AiNa'}
                </h1>
              </div>
            </div>

            {!business && (
              <button
                onClick={() => navigate('/onboarding')}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #FF8A65, #FFB088)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Configurer →
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease-out 0.1s'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1A1A2E',
            marginBottom: '20px'
          }}>
            Actions rapides
          </h2>

          <div 
            className="dashboard-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '40px'
            }}
          >
            {/* Create Post */}
            <div
              onClick={() => navigate('/create')}
              style={{
                background: 'linear-gradient(135deg, #FF8A65, #FFB088)',
                borderRadius: '20px',
                padding: '28px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(255, 138, 101, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(255, 138, 101, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 138, 101, 0.3)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }} />
              <div style={{
                width: '56px',
                height: '56px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                fontSize: '24px'
              }}>
                ✨
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: 'white',
                marginBottom: '8px'
              }}>
                Nouveau Post
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' }}>
                Créez un post en décrivant simplement ce que vous voulez
              </p>
              <span style={{
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                Créer <span>→</span>
              </span>
            </div>

            {/* Calendar - Plus grand et mis en avant */}
            <div
              onClick={() => navigate('/calendar')}
              style={{
                background: 'linear-gradient(135deg, #004E89, #0077CC)',
                borderRadius: '20px',
                padding: '28px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0, 78, 137, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 78, 137, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 78, 137, 0.3)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '150px',
                height: '150px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-20px',
                left: '30%',
                width: '80px',
                height: '80px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '50%'
              }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                    fontSize: '24px'
                  }}>
                    📅
                  </div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'white',
                    marginBottom: '8px'
                  }}>
                    Calendrier
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' }}>
                    Gérez vos événements et planifiez vos publications
                  </p>
                  <span style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    Ouvrir le calendrier <span>→</span>
                  </span>
                </div>
                {/* Mini Calendar Preview */}
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '12px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ color: 'white', fontSize: '12px', fontWeight: '600', textAlign: 'center', marginBottom: '8px' }}>
                    {new Date().toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                      <div key={i} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '8px', textAlign: 'center' }}>{day}</div>
                    ))}
                    {Array.from({ length: 28 }, (_, i) => (
                      <div key={i} style={{ 
                        width: '16px', 
                        height: '16px', 
                        borderRadius: '4px',
                        backgroundColor: i + 1 === new Date().getDate() ? 'white' : 'transparent',
                        color: i + 1 === new Date().getDate() ? '#004E89' : 'rgba(255,255,255,0.7)',
                        fontSize: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: i + 1 === new Date().getDate() ? '700' : '400'
                      }}>
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Moodboard */}
            <div
              onClick={() => navigate('/moodboard')}
              style={{
                background: 'linear-gradient(135deg, #10B981, #34D399)',
                borderRadius: '20px',
                padding: '28px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.3)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }} />
              <div style={{
                width: '56px',
                height: '56px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                fontSize: '24px'
              }}>
                🎨
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: 'white',
                marginBottom: '8px'
              }}>
                Moodboard
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' }}>
                Logo, photos et infos de votre commerce
              </p>
              <span style={{
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                Personnaliser <span>→</span>
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease-out 0.2s'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1A1A2E'
            }}>
              Événements à venir
            </h2>
            <button
              onClick={() => navigate('/calendar')}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                border: '2px solid #E5E7EB',
                borderRadius: '10px',
                color: '#666',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FF6B35';
                e.currentTarget.style.color = '#FF6B35';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.color = '#666';
              }}
            >
              Voir tout →
            </button>
          </div>

          {events.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '48px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
              <h3 style={{ color: '#1A1A2E', fontWeight: '600', marginBottom: '8px' }}>
                Aucun événement à venir
              </h3>
              <p style={{ color: '#666', marginBottom: '24px' }}>
                Créez votre premier événement dans le calendrier
              </p>
              <button
                onClick={() => navigate('/calendar')}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #FF6B35, #FF8F5E)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Ajouter un événement
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {events.map((event, index) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/generate?event=${event.id}`)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(8px)';
                    e.currentTarget.style.borderColor = '#FF6B35';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: `linear-gradient(135deg, ${
                        index % 3 === 0 ? '#FF6B35, #FF8F5E' :
                        index % 3 === 1 ? '#004E89, #0066B3' :
                        '#10B981, #34D399'
                      })`,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '14px'
                    }}>
                      {new Date(event.event_date).getDate()}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: '600', color: '#1A1A2E', marginBottom: '4px' }}>
                        {event.title}
                      </h4>
                      <p style={{ color: '#666', fontSize: '14px' }}>
                        {new Date(event.event_date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                        {' • '}
                        {event.event_type}
                      </p>
                    </div>
                  </div>
                  <button style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #FF6B35, #FF8F5E)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    Générer →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggested Events - Auto Events */}
        {autoEvents.length > 0 && (
          <div style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out 0.3s',
            marginTop: '32px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1A1A2E',
                  marginBottom: '4px'
                }}>
                  💡 Événements à ne pas manquer
                </h2>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  Suggestions de posts pour les prochaines fêtes
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {autoEvents.map((event, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '2px solid #F0F0F5',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#FF6B35';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 107, 53, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#F0F0F5';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => navigate('/create')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      background: event.type === 'ferie' 
                        ? 'linear-gradient(135deg, #3B82F6, #60A5FA)'
                        : event.type === 'commercial'
                        ? 'linear-gradient(135deg, #FF6B35, #FF8F5E)'
                        : event.type === 'fete'
                        ? 'linear-gradient(135deg, #8B5CF6, #A78BFA)'
                        : 'linear-gradient(135deg, #10B981, #34D399)',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      flexShrink: 0
                    }}>
                      {event.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: '600', color: '#1A1A2E', marginBottom: '4px', fontSize: '16px' }}>
                        {event.title}
                      </h4>
                      <p style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>
                        {event.date.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </p>
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        backgroundColor: event.daysUntil <= 7 ? '#FEE2E2' : event.daysUntil <= 14 ? '#FEF3C7' : '#E0E7FF',
                        color: event.daysUntil <= 7 ? '#DC2626' : event.daysUntil <= 14 ? '#D97706' : '#4F46E5',
                        borderRadius: '50px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {event.daysUntil === 0 ? "Aujourd'hui !" : 
                         event.daysUntil === 1 ? 'Demain !' :
                         `Dans ${event.daysUntil} jours`}
                      </div>
                    </div>
                  </div>
                  <button style={{
                    width: '100%',
                    marginTop: '16px',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #FF6B35, #FF8F5E)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    ✨ Créer un post
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        @media (max-width: 768px) {
          /* Header mobile */
          header > div {
            padding: 12px 16px !important;
          }
          
          /* Cacher le nom utilisateur sur mobile */
          header span[style*="background: #F5F5F7"] {
            display: none !important;
          }
          
          /* Main padding */
          main {
            padding: 16px !important;
          }
          
          /* Welcome card */
          .welcome-section > div > div:first-child {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          
          /* Cards grid - 1 colonne */
          .dashboard-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          
          /* Card padding réduit */
          .dashboard-grid > div {
            padding: 20px !important;
          }
          
          /* Titres plus petits */
          h1 {
            font-size: 24px !important;
          }
          
          h2 {
            font-size: 18px !important;
          }
          
          /* Bouton déconnexion compact */
          button[style*="Déconnexion"] {
            padding: 8px 12px !important;
            font-size: 12px !important;
          }
          
          /* Events grid */
          .events-grid {
            grid-template-columns: 1fr !important;
          }
          
          /* Auto events grid */
          .auto-events-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        @media (max-width: 480px) {
          /* Très petit écran */
          main {
            padding: 12px !important;
          }
          
          h1 {
            font-size: 20px !important;
          }
          
          .dashboard-grid > div {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
