import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

const locales = {
  'fr': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface EventType {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  event_type: string;
  source: string;
  status: string;
}

function CalendarPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [businessId, setBusinessId] = useState('');
  const [user, setUser] = useState<any>(null);

  // Formulaire nouvel événement
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventType, setNewEventType] = useState('custom');

  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);

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
    await loadBusinessAndEvents(session.user.id);
  };

  const loadBusinessAndEvents = async (userId: string) => {
    try {
      const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (businessError) {
        console.error('Erreur business:', businessError);
        setLoading(false);
        return;
      }

      if (businesses) {
        setBusinessId(businesses.id);
        await loadEvents(businesses.id);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const loadEvents = async (busId: string) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('business_id', busId)
        .order('event_date', { ascending: true });

      if (error) throw error;

      const formattedEvents = data.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.event_date),
        end: new Date(event.event_date),
        description: event.description,
        event_type: event.event_type,
        source: event.source,
        status: event.status,
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Erreur chargement événements:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    console.log('Ouverture modal');
    setModalOpen(true);
  };

  const closeModal = () => {
    console.log('Fermeture modal');
    setModalOpen(false);
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventDescription('');
    setNewEventType('custom');
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEventTitle || !newEventDate || !businessId) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            business_id: businessId,
            title: newEventTitle,
            description: newEventDescription || null,
            event_date: newEventDate,
            event_type: newEventType,
            source: 'manual',
            status: 'pending',
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const newEvent: EventType = {
        id: data.id,
        title: data.title,
        start: new Date(data.event_date),
        end: new Date(data.event_date),
        description: data.description,
        event_type: data.event_type,
        source: data.source,
        status: data.status,
      };

      setEvents([...events, newEvent]);
      closeModal();
      alert('✅ Événement ajouté avec succès !');
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('❌ Erreur : ' + error.message);
    }
  };

  const handleSelectEvent = (event: EventType) => {
    setSelectedEvent(event);
  };

  const handleGeneratePost = () => {
    if (selectedEvent) {
      navigate(`/generate?event=${selectedEvent.id}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #F8F9FA, white)' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF6B35' }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #F8F9FA, white)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo */}
          <svg width="120" height="40" viewBox="0 0 120 40" style={{ height: '40px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <defs>
              <linearGradient id="cal-logo" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#FF6B35', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#004E89', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <text x="60" y="28" fontFamily="Montserrat, sans-serif" fontSize="32" fontWeight="800" fill="url(#cal-logo)" textAnchor="middle">
              AiNa
            </text>
          </svg>

          {/* User menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
            >
              ← Dashboard
            </button>
            <span style={{ color: '#666' }}>{user?.email}</span>
            <button
              onClick={handleLogout}
              style={{ backgroundColor: '#f3f4f6', color: '#2C3E50', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Header avec bouton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#2C3E50', marginBottom: '8px' }}>📅 Calendrier</h1>
            <p style={{ color: '#666' }}>Gérez vos événements et posts</p>
          </div>
          <button
            onClick={openModal}
            style={{
              background: 'linear-gradient(to right, #FF6B35, #004E89)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '20px' }}>+</span>
            Nouvel événement
          </button>
        </div>

        {/* Calendrier */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', padding: '24px', height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            culture="fr"
            onSelectEvent={handleSelectEvent}
            messages={{
              next: "Suivant",
              previous: "Précédent",
              today: "Aujourd'hui",
              month: "Mois",
              week: "Semaine",
              day: "Jour",
              agenda: "Agenda",
              date: "Date",
              time: "Heure",
              event: "Événement",
              noEventsInRange: "Aucun événement dans cette période.",
            }}
          />
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginTop: '32px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255,107,53,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px' }}>📅</span>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2C3E50' }}>{events.length}</div>
                <div style={{ color: '#666', fontSize: '14px' }}>Événements totaux</div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(0,78,137,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px' }}>⏰</span>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2C3E50' }}>
                  {events.filter(e => e.status === 'pending').length}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>En attente</div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(247,184,1,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px' }}>✍️</span>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2C3E50' }}>
                  {events.filter(e => e.source === 'manual').length}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>Événements manuels</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Événement Sélectionné */}
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
            zIndex: 99999,
            padding: '16px'
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 10px 50px rgba(0,0,0,0.3)',
              maxWidth: '450px',
              width: '100%',
              padding: '32px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2C3E50', margin: 0 }}>📅 {selectedEvent.title}</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#999', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: '#666', marginBottom: '8px' }}>
                <strong>Date :</strong> {selectedEvent.start.toLocaleDateString('fr-FR')}
              </p>
              <p style={{ color: '#666', marginBottom: '8px' }}>
                <strong>Type :</strong> {selectedEvent.event_type}
              </p>
              {selectedEvent.description && (
                <p style={{ color: '#666' }}>
                  <strong>Description :</strong> {selectedEvent.description}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#2C3E50',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
              <button
                onClick={handleGeneratePost}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(to right, #FF6B35, #004E89)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                🤖 Générer un Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout Événement */}
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
            zIndex: 99999,
            padding: '16px'
          }}
          onClick={closeModal}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 10px 50px rgba(0,0,0,0.3)',
              maxWidth: '450px',
              width: '100%',
              padding: '32px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2C3E50', margin: 0 }}>Nouvel événement</h2>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#999', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddEvent}>
              {/* Titre */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2C3E50', marginBottom: '8px' }}>
                  Titre de l'événement *
                </label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Ex: Soirée DJ, Menu Saint-Valentin..."
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Date */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2C3E50', marginBottom: '8px' }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Type */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2C3E50', marginBottom: '8px' }}>
                  Type d'événement *
                </label>
                <select
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="custom">Événement personnalisé</option>
                  <option value="special_menu">Menu spécial</option>
                  <option value="party">Soirée</option>
                  <option value="promo">Promotion</option>
                  <option value="anniversary">Anniversaire</option>
                </select>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2C3E50', marginBottom: '8px' }}>
                  Description (optionnel)
                </label>
                <textarea
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  placeholder="Décrivez votre événement..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>

              {/* Boutons */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#2C3E50',
                    fontWeight: '600',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(to right, #FF6B35, #004E89)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPage;