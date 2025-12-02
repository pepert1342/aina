import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { getUpcomingEvents } from '../autoEvents';
import logoAina from '/logo-aina.png';

interface Business {
  id: string;
  business_name: string;
  business_type: string;
  tone: string;
  logo_url?: string;
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
  const [autoEvents, setAutoEvents] = useState<AutoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    const upcoming = getUpcomingEvents(60);
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
    const { data: businessData } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (businessData) {
      setBusiness(businessData);
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

  // Mini calendrier
  const today = new Date();
  const currentMonth = today.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F0F7FF, #FFFFFF)',
        fontFamily: "'Inter', sans-serif"
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
      fontFamily: "'Inter', sans-serif",
      overflowX: 'hidden',
      width: '100%',
      maxWidth: '100vw'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%'
      }}>
        <div style={{
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <img 
              src={logoAina} 
              alt="AiNa" 
              style={{ width: '44px', height: '44px', objectFit: 'contain' }}
            />
            <span style={{ 
              fontSize: '22px', 
              fontWeight: '800',
              fontFamily: "'Poppins', sans-serif",
              background: 'linear-gradient(135deg, #FF8A65, #004E89)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              AiNa
            </span>
          </div>

          {/* User + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF8A65, #004E89)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                color: '#666',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >Déconnexion</button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{
        padding: '16px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        
        {/* Welcome Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #004E89, #0077CC)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
          color: 'white',
          boxShadow: '0 8px 30px rgba(0, 78, 137, 0.3)'
        }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
            {getGreeting()}, {business?.business_name || 'there'} 👋
          </h1>
          <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '12px' }}>
            Prêt à créer du contenu ?
          </p>
          <button
            onClick={() => navigate('/moodboard')}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #FF8A65, #FFB088)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >Configurer →</button>
        </div>

        {/* Actions rapides */}
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A2E', marginBottom: '12px' }}>
          Actions rapides
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {/* Créer un post */}
          <div
            onClick={() => navigate('/create')}
            style={{
              background: 'linear-gradient(135deg, #FF8A65, #FFB088)',
              borderRadius: '14px',
              padding: '18px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(255, 138, 101, 0.3)'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
            <h3 style={{ color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
              Nouveau Post
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', marginBottom: '8px' }}>
              Créez un post en décrivant ce que vous voulez
            </p>
            <span style={{ color: 'white', fontWeight: '600', fontSize: '13px' }}>Créer →</span>
          </div>

          {/* Calendrier */}
          <div
            onClick={() => navigate('/calendar')}
            style={{
              background: 'linear-gradient(135deg, #004E89, #0077CC)',
              borderRadius: '14px',
              padding: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 4px 20px rgba(0, 78, 137, 0.3)'
            }}
          >
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: '12px',
              padding: '12px',
              minWidth: '80px'
            }}>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '12px', textAlign: 'center', marginBottom: '6px' }}>
                {currentMonth}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                  <span key={i} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '8px', textAlign: 'center' }}>{d}</span>
                ))}
                {Array.from({ length: adjustedFirstDay }).map((_, i) => (
                  <span key={`empty-${i}`}></span>
                ))}
                {Array.from({ length: 7 }).map((_, i) => {
                  const day = i + 1;
                  const isToday = day === today.getDate();
                  return (
                    <span
                      key={day}
                      style={{
                        fontSize: '8px',
                        textAlign: 'center',
                        color: 'white',
                        backgroundColor: isToday ? '#FF8A65' : 'transparent',
                        borderRadius: '50%',
                        width: '12px',
                        height: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >{day}</span>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 style={{ color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                Calendrier
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                Planifiez vos publications
              </p>
            </div>
          </div>
        </div>

        {/* Événements à venir */}
        {autoEvents.length > 0 && (
          <>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A2E', marginBottom: '12px' }}>
              📅 Événements à venir
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {autoEvents.slice(0, 3).map((event, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#FFF5F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    {event.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A2E' }}>
                      {event.title}
                    </h4>
                    <p style={{ fontSize: '12px', color: '#888' }}>
                      Dans {event.daysUntil} jour{event.daysUntil > 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/create')}
                    style={{
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #FF8A65, #FFB088)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >Créer</button>
                </div>
              ))}
            </div>
          </>
        )}

      </main>
    </div>
  );
}

export default Dashboard;
