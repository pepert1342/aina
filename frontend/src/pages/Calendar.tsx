import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'fr': fr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface EventType {
  id: string;
  title: string;
  start: Date;
  end: Date;
  event_type: string;
  description?: string;
}

function CalendarPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState('Promotion');
  const [newDescription, setNewDescription] = useState('');

  const eventTypes = [
    { value: 'Promotion', icon: '🏷️', color: '#FF6B35' },
    { value: 'Événement', icon: '🎉', color: '#8B5CF6' },
    { value: 'Fête', icon: '🎊', color: '#EC4899' },
    { value: 'Nouveau produit', icon: '✨', color: '#10B981' },
    { value: 'Soirée', icon: '🌙', color: '#004E89' },
    { value: 'Jeu concours', icon: '🎁', color: '#F59E0B' },
    { value: 'Anniversaire', icon: '🎂', color: '#EF4444' }
  ];

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
    await loadEvents(session.user.id);
    setLoading(false);
    setTimeout(() => setIsVisible(true), 100);
  };

  const loadEvents = async (userId: string) => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId);

    if (data) {
      const formattedEvents = data.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.event_date),
        end: new Date(event.event_date),
        event_type: event.event_type,
        description: event.description
      }));
      setEvents(formattedEvents);
    }
  };

  const handleAddEvent = async () => {
    if (!newTitle.trim() || !newDate || !user) {
      alert('Veuillez remplir le titre et la date');
      return;
    }

    setSaving(true);
    
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          user_id: user.id,
          title: newTitle.trim(),
          event_date: newDate,
          event_type: newType,
          description: newDescription.trim() || null
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur Supabase:', error);
        alert('Erreur lors de l\'ajout: ' + error.message);
        return;
      }

      if (data) {
        const newEvent: EventType = {
          id: data.id,
          title: data.title,
          start: new Date(data.event_date),
          end: new Date(data.event_date),
          event_type: data.event_type,
          description: data.description
        };
        setEvents(prev => [...prev, newEvent]);
        closeModal();
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      alert('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectEvent = (event: EventType) => {
    setSelectedEvent(event);
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
  };

  const openModal = () => {
    setNewTitle('');
    setNewDate('');
    setNewType('Promotion');
    setNewDescription('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setNewTitle('');
    setNewDate('');
    setNewType('Promotion');
    setNewDescription('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getEventColor = (eventType: string) => {
    const type = eventTypes.find(t => t.value === eventType);
    return type?.color || '#FF6B35';
  };

  const eventStyleGetter = (event: EventType) => {
    const color = getEventColor(event.event_type);
    return {
      style: {
        backgroundColor: color,
        borderRadius: '8px',
        border: 'none',
        color: 'white',
        fontWeight: '600',
        padding: '2px 8px'
      }
    };
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FFF5F2, #F0F7FF)',
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
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFF5F2 0%, #F0F7FF 50%, #F5F0FF 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
              onClick={() => navigate('/dashboard')}
            >
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

            <nav style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#666',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Dashboard
              </button>
              <button
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#FF6B3515',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#FF6B35',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Calendrier
              </button>
              <button
                onClick={() => navigate('/create')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#666',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Créer un post
              </button>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={openModal}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #FF6B35, #FF8F5E)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)'
              }}
            >
              + Nouvel événement
            </button>
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
                fontSize: '14px'
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
        padding: '32px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out'
      }}>
        {/* Page Title */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1A1A2E', marginBottom: '8px' }}>
            📅 Calendrier
          </h1>
          <p style={{ color: '#666' }}>
            Planifiez vos événements et générez des posts automatiquement
          </p>
        </div>

        {/* Event Types Legend */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {eventTypes.map(type => (
            <div
              key={type.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: 'white',
                borderRadius: '50px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: `2px solid ${type.color}20`
              }}
            >
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: type.color
              }} />
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#1A1A2E' }}>
                {type.icon} {type.value}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255, 107, 53, 0.1)'
        }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            messages={{
              next: "Suivant",
              previous: "Précédent",
              today: "Aujourd'hui",
              month: "Mois",
              week: "Semaine",
              day: "Jour",
              agenda: "Agenda",
              noEventsInRange: "Aucun événement prévu"
            }}
          />
        </div>
      </main>

      {/* Add Event Modal */}
      {modalOpen && (
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
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '32px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              animation: 'slideUp 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A2E', marginBottom: '24px' }}>
              ✨ Nouvel événement
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1A1A2E', fontSize: '14px' }}>
                  Titre de l'événement *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Soirée Jazz"
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#FF6B35';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(255, 107, 53, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Date */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1A1A2E', fontSize: '14px' }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#FF6B35';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(255, 107, 53, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Type */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1A1A2E', fontSize: '14px' }}>
                  Type d'événement
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {eventTypes.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setNewType(type.value)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `2px solid ${newType === type.value ? type.color : '#E5E7EB'}`,
                        backgroundColor: newType === type.value ? `${type.color}15` : 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {type.icon} {type.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1A1A2E', fontSize: '14px' }}>
                  Description (optionnel)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Décrivez votre événement..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#FF6B35';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(255, 107, 53, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    flex: 1,
                    padding: '16px',
                    backgroundColor: '#F5F5F7',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#666',
                    fontWeight: '600',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAddEvent}
                  disabled={!newTitle.trim() || !newDate || saving}
                  style={{
                    flex: 1,
                    padding: '16px',
                    background: newTitle.trim() && newDate && !saving
                      ? 'linear-gradient(135deg, #FF6B35, #FF8F5E)' 
                      : '#E5E7EB',
                    border: 'none',
                    borderRadius: '12px',
                    color: newTitle.trim() && newDate && !saving ? 'white' : '#999',
                    fontWeight: '700',
                    fontSize: '16px',
                    cursor: newTitle.trim() && newDate && !saving ? 'pointer' : 'not-allowed',
                    boxShadow: newTitle.trim() && newDate && !saving 
                      ? '0 4px 15px rgba(255, 107, 53, 0.4)' 
                      : 'none'
                  }}
                >
                  {saving ? '⏳ Ajout...' : '✓ Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
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
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={closeEventModal}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '32px',
              width: '100%',
              maxWidth: '450px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              animation: 'slideUp 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '64px',
              height: '64px',
              background: `linear-gradient(135deg, ${getEventColor(selectedEvent.event_type)}, ${getEventColor(selectedEvent.event_type)}99)`,
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '20px'
            }}>
              {eventTypes.find(t => t.value === selectedEvent.event_type)?.icon || '📅'}
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A2E', marginBottom: '8px' }}>
              {selectedEvent.title}
            </h2>
            
            <p style={{ color: '#666', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📅 {selectedEvent.start.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })}
            </p>
            
            <p style={{ 
              display: 'inline-block',
              padding: '6px 12px',
              backgroundColor: `${getEventColor(selectedEvent.event_type)}20`,
              color: getEventColor(selectedEvent.event_type),
              borderRadius: '50px',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              {selectedEvent.event_type}
            </p>

            {selectedEvent.description && (
              <p style={{ color: '#666', marginBottom: '24px', lineHeight: '1.6' }}>
                {selectedEvent.description}
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={closeEventModal}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#F5F5F7',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#666',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  closeEventModal();
                  navigate(`/generate?event=${selectedEvent.id}`);
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #FF6B35, #FF8F5E)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)'
                }}
              >
                🤖 Générer un post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .rbc-calendar {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        
        .rbc-header {
          padding: 14px !important;
          font-weight: 600 !important;
          color: #1A1A2E !important;
          background: linear-gradient(135deg, #FFF5F2, #F0F7FF) !important;
          border-bottom: 2px solid #FFE5DC !important;
        }
        
        .rbc-month-view {
          border: none !important;
          border-radius: 16px !important;
          overflow: hidden !important;
        }
        
        .rbc-month-row {
          border-color: #F0F0F5 !important;
        }
        
        .rbc-day-bg {
          border-color: #F0F0F5 !important;
        }
        
        .rbc-today {
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 107, 53, 0.05)) !important;
        }
        
        .rbc-date-cell {
          padding: 8px !important;
          font-weight: 500 !important;
        }
        
        .rbc-button-link {
          color: #1A1A2E !important;
          font-weight: 600 !important;
        }
        
        .rbc-toolbar {
          margin-bottom: 20px !important;
          padding: 16px !important;
          background: linear-gradient(135deg, #FFF5F2, #F0F7FF) !important;
          border-radius: 16px !important;
        }
        
        .rbc-toolbar button {
          border-radius: 10px !important;
          padding: 10px 18px !important;
          border: 2px solid #E5E7EB !important;
          font-weight: 500 !important;
          background: white !important;
          transition: all 0.2s ease !important;
        }
        
        .rbc-toolbar button:hover {
          background-color: #FFF5F2 !important;
          border-color: #FF6B35 !important;
        }
        
        .rbc-toolbar button.rbc-active {
          background: linear-gradient(135deg, #FF6B35, #FF8F5E) !important;
          border-color: #FF6B35 !important;
          color: white !important;
        }
        
        .rbc-off-range-bg {
          background-color: #FAFBFC !important;
        }
        
        .rbc-off-range {
          color: #CCC !important;
        }
        
        .rbc-event {
          border: none !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        
        .rbc-event:focus {
          outline: none !important;
        }
        
        .rbc-show-more {
          color: #FF6B35 !important;
          font-weight: 600 !important;
        }
      `}</style>
    </div>
  );
}

export default CalendarPage;
