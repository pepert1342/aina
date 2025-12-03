import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { generateYearEvents } from '../autoEvents';
import logoAina from '/logo-aina.png';

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
  isAuto?: boolean; // true = événement automatique (fête, férié...)
}

function CalendarPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userEvents, setUserEvents] = useState<EventType[]>([]);
  const [autoEvents, setAutoEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<string>('month');

  // Tous les événements combinés
  const allEvents = [...userEvents, ...autoEvents];

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
    loadAutoEvents();
  }, []);

  const loadAutoEvents = () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    
    // Générer les événements pour cette année et l'année prochaine
    const eventsThisYear = generateYearEvents(currentYear);
    const eventsNextYear = generateYearEvents(nextYear);
    const allAutoEvents = [...eventsThisYear, ...eventsNextYear];
    
    // Convertir au format EventType
    const formattedAutoEvents: EventType[] = allAutoEvents.map((event, index) => ({
      id: `auto-${index}-${event.date.getTime()}`,
      title: event.title,
      start: event.date,
      end: event.date,
      event_type: event.type,
      description: event.description,
      isAuto: true
    }));
    
    setAutoEvents(formattedAutoEvents);
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    setUser(session.user);
    await loadEvents(session.user.id);
    setLoading(false);
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
        description: event.description,
        isAuto: false
      }));
      setUserEvents(formattedEvents);
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
          description: data.description,
          isAuto: false
        };
        setUserEvents(prev => [...prev, newEvent]);
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
    // Événements automatiques = style différent (bordure pointillée, plus transparent)
    if (event.isAuto) {
      const autoColors: Record<string, string> = {
        'ferie': '#3B82F6',
        'commercial': '#F59E0B', 
        'fete': '#8B5CF6',
        'saison': '#10B981'
      };
      const color = autoColors[event.event_type] || '#6B7280';
      return {
        style: {
          backgroundColor: `${color}30`,
          borderLeft: `4px solid ${color}`,
          borderRadius: '4px',
          color: color,
          fontWeight: '600',
          padding: '2px 6px',
          fontSize: '11px'
        }
      };
    }
    
    // Événements utilisateur = style normal
    const color = getEventColor(event.event_type);
    return {
      style: {
        backgroundColor: color,
        borderRadius: '6px',
        border: 'none',
        color: 'white',
        fontWeight: '600',
        padding: '2px 6px',
        fontSize: '12px'
      }
    };
  };

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
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
            fontSize: '24px'
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
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
        width: '100%'
      }}>
        <div style={{
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
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

          {/* Boutons à droite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={openModal}
              style={{
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #FF8A65, #FFB088)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '12px',
                boxShadow: '0 4px 15px rgba(255, 138, 101, 0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              + Événement
            </button>
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
                fontSize: '12px',
                whiteSpace: 'nowrap'
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        padding: '16px',
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden'
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

        {/* Calendar Container */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255, 107, 53, 0.1)'
        }}>
          <Calendar
            localizer={localizer}
            events={allEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            date={currentDate}
            onNavigate={handleNavigate}
            view={currentView}
            onView={handleViewChange}
            views={['month', 'week', 'day', 'agenda']}
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
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
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
                    boxSizing: 'border-box'
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
                    boxSizing: 'border-box'
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
                        gap: '6px'
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
                    fontFamily: 'inherit'
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
                    cursor: newTitle.trim() && newDate && !saving ? 'pointer' : 'not-allowed'
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
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            padding: '16px'
          }}
          onClick={closeEventModal}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '20px',
              width: '100%',
              maxWidth: '340px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header avec icône et badge */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                background: selectedEvent.isAuto 
                  ? `linear-gradient(135deg, ${
                      selectedEvent.event_type === 'ferie' ? '#3B82F6' :
                      selectedEvent.event_type === 'commercial' ? '#F59E0B' :
                      selectedEvent.event_type === 'fete' ? '#8B5CF6' : '#10B981'
                    }, ${
                      selectedEvent.event_type === 'ferie' ? '#60A5FA' :
                      selectedEvent.event_type === 'commercial' ? '#FBBF24' :
                      selectedEvent.event_type === 'fete' ? '#A78BFA' : '#34D399'
                    })`
                  : `linear-gradient(135deg, ${getEventColor(selectedEvent.event_type)}, ${getEventColor(selectedEvent.event_type)}99)`,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0
              }}>
                {selectedEvent.isAuto 
                  ? selectedEvent.title.split(' ')[0] 
                  : eventTypes.find(t => t.value === selectedEvent.event_type)?.icon || '📅'}
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A2E', marginBottom: '4px', lineHeight: '1.3' }}>
                  {selectedEvent.title}
                </h3>
                <p style={{ color: '#888', fontSize: '13px' }}>
                  {selectedEvent.start.toLocaleDateString('fr-FR', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short'
                  })}
                </p>
              </div>
              
              {/* Bouton fermer */}
              <button
                onClick={closeEventModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            {/* Badge type */}
            <div style={{ 
              display: 'inline-block',
              padding: '4px 10px',
              backgroundColor: selectedEvent.isAuto 
                ? `${
                    selectedEvent.event_type === 'ferie' ? '#3B82F6' :
                    selectedEvent.event_type === 'commercial' ? '#F59E0B' :
                    selectedEvent.event_type === 'fete' ? '#8B5CF6' : '#10B981'
                  }15`
                : `${getEventColor(selectedEvent.event_type)}15`,
              color: selectedEvent.isAuto 
                ? (selectedEvent.event_type === 'ferie' ? '#3B82F6' :
                   selectedEvent.event_type === 'commercial' ? '#F59E0B' :
                   selectedEvent.event_type === 'fete' ? '#8B5CF6' : '#10B981')
                : getEventColor(selectedEvent.event_type),
              borderRadius: '50px',
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              {selectedEvent.isAuto 
                ? (selectedEvent.event_type === 'ferie' ? '🏛️ Jour férié' :
                   selectedEvent.event_type === 'commercial' ? '🛍️ Commercial' :
                   selectedEvent.event_type === 'fete' ? '🎉 Fête' : '🌿 Saison')
                : selectedEvent.event_type}
            </div>

            {/* Description si présente */}
            {selectedEvent.description && (
              <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
                {selectedEvent.description}
              </p>
            )}

            {/* Bouton principal - Créer un post */}
            <button
              onClick={() => {
                closeEventModal();
                // Construire les paramètres URL avec les infos de l'événement
                const params = new URLSearchParams();
                params.set('title', selectedEvent.title);
                params.set('type', selectedEvent.event_type);
                if (selectedEvent.description) {
                  params.set('description', selectedEvent.description);
                }
                params.set('date', selectedEvent.start.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                }));
                params.set('isAuto', selectedEvent.isAuto ? 'true' : 'false');
                navigate(`/create?${params.toString()}`);
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #FF8A65, #FFB088)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '12px',
                boxShadow: '0 4px 12px rgba(255, 138, 101, 0.25)'
              }}
            >
              ✨ Créer un post
            </button>

            {/* Options Modifier / Supprimer */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '16px',
              paddingTop: '8px',
              borderTop: '1px solid #F0F0F0'
            }}>
              {!selectedEvent.isAuto && (
                <>
                  <button
                    onClick={() => {
                      // TODO: Implémenter la modification
                      alert('Fonctionnalité à venir');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#666',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Supprimer cet événement ?')) {
                        try {
                          const { error } = await supabase
                            .from('events')
                            .delete()
                            .eq('id', selectedEvent.id);
                          if (error) throw error;
                          setUserEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
                          closeEventModal();
                        } catch (err: any) {
                          alert('Erreur: ' + err.message);
                        }
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </>
              )}
              {selectedEvent.isAuto && (
                <span style={{ color: '#999', fontSize: '12px' }}>
                  📅 Événement suggéré automatiquement
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS for Calendar */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .rbc-calendar {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .rbc-toolbar {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 16px;
          background: linear-gradient(135deg, #FFF5F2, #F0F7FF);
          border-radius: 16px;
          gap: 12px;
        }
        
        .rbc-toolbar button {
          background: white;
          border: 2px solid #E5E7EB;
          border-radius: 10px;
          padding: 10px 18px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          font-size: 14px;
          color: #1A1A2E;
        }
        
        .rbc-toolbar button:hover {
          background-color: #FFF5F2;
          border-color: #FF6B35;
          color: #FF6B35;
        }
        
        .rbc-toolbar button.rbc-active {
          background: linear-gradient(135deg, #FF6B35, #FF8F5E);
          border-color: #FF6B35;
          color: white;
        }
        
        .rbc-toolbar-label {
          font-weight: 700;
          font-size: 18px;
          color: #1A1A2E;
          text-transform: capitalize;
        }
        
        .rbc-header {
          padding: 12px;
          font-weight: 600;
          color: #1A1A2E;
          background: linear-gradient(135deg, #FFF5F2, #F0F7FF);
          border-bottom: 2px solid #FFE5DC;
        }
        
        .rbc-month-view {
          border: none;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .rbc-month-row {
          border-color: #F0F0F5;
        }
        
        .rbc-day-bg {
          border-color: #F0F0F5;
        }
        
        .rbc-today {
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 107, 53, 0.05));
        }
        
        .rbc-date-cell {
          padding: 8px;
          font-weight: 500;
        }
        
        .rbc-off-range-bg {
          background-color: #FAFBFC;
        }
        
        .rbc-off-range {
          color: #CCC;
        }
        
        .rbc-event {
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .rbc-event:focus {
          outline: none;
        }
        
        .rbc-show-more {
          color: #FF6B35;
          font-weight: 600;
        }
        
        .rbc-btn-group {
          display: flex;
          gap: 4px;
        }
        
        /* MOBILE RESPONSIVE */
        @media (max-width: 768px) {
          /* Header */
          header > div {
            padding: 12px 16px !important;
            flex-wrap: wrap !important;
          }
          
          /* Cacher nav sur mobile */
          header nav {
            display: none !important;
          }
          
          /* Main */
          main {
            padding: 16px !important;
          }
          
          /* Titre */
          main h1 {
            font-size: 24px !important;
          }
          
          /* Cacher légende sur mobile */
          .event-legend {
            display: none !important;
          }
          
          /* Calendar container */
          main > div:last-of-type {
            padding: 12px !important;
          }
          
          /* Toolbar calendar */
          .rbc-toolbar {
            flex-direction: column !important;
            gap: 12px !important;
            padding: 12px !important;
          }
          
          .rbc-toolbar-label {
            font-size: 16px !important;
            order: -1 !important;
          }
          
          .rbc-toolbar button {
            padding: 8px 10px !important;
            font-size: 11px !important;
          }
          
          /* Calendar hauteur réduite */
          .rbc-calendar {
            height: 450px !important;
          }
          
          /* Events plus petits */
          .rbc-event {
            font-size: 10px !important;
            padding: 1px 3px !important;
          }
          
          /* Modal */
          .event-modal > div {
            margin: 16px !important;
            padding: 20px !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
          }
          
          /* Event types dans modal */
          .event-types-selector {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          
          .event-types-selector button {
            padding: 8px !important;
            font-size: 11px !important;
          }
        }
        
        @media (max-width: 480px) {
          .rbc-toolbar button {
            padding: 6px 8px !important;
            font-size: 10px !important;
          }
          
          .rbc-header {
            font-size: 11px !important;
            padding: 6px !important;
          }
          
          .rbc-date-cell {
            font-size: 11px !important;
            padding: 4px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default CalendarPage;
