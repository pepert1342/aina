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

interface Event {
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
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [businessId, setBusinessId] = useState('');
  const [user, setUser] = useState<any>(null);

  // Formulaire nouvel événement
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventType, setNewEventType] = useState('custom');

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
      // Charger le commerce de l'utilisateur
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

  const loadEvents = async (businessId: string) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('business_id', businessId)
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

      // Ajouter l'événement à la liste
      const newEvent: Event = {
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

      // Réinitialiser le formulaire
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventDescription('');
      setNewEventType('custom');
      setShowAddModal(false);

      alert('✅ Événement ajouté avec succès !');
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('❌ Erreur : ' + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-light to-white flex items-center justify-center">
        <div className="text-2xl font-bold text-coral">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <svg width="120" height="40" viewBox="0 0 120 40" className="h-10 cursor-pointer" onClick={() => navigate('/dashboard')}>
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-coral transition-colors font-semibold"
              >
                ← Dashboard
              </button>
              <span className="text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-text-dark px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header avec bouton */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-text-dark mb-2">📅 Calendrier</h1>
            <p className="text-gray-600">Gérez vos événements et posts</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-coral to-ocean text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Nouvel événement
          </button>
        </div>

        {/* Calendrier */}
        <div className="bg-white rounded-2xl shadow-xl p-6" style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            culture="fr"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-coral/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-dark">{events.length}</div>
                <div className="text-gray-600 text-sm">Événements totaux</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-ocean/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏰</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-dark">
                  {events.filter(e => e.status === 'pending').length}
                </div>
                <div className="text-gray-600 text-sm">En attente</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✍️</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-dark">
                  {events.filter(e => e.source === 'manual').length}
                </div>
                <div className="text-gray-600 text-sm">Événements manuels</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Ajout Événement */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-text-dark">Nouvel événement</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-6">
              {/* Titre */}
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">
                  Titre de l'événement *
                </label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Ex: Soirée DJ, Menu Saint-Valentin..."
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-coral focus:outline-none transition-colors"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-coral focus:outline-none transition-colors"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">
                  Type d'événement *
                </label>
                <select
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-coral focus:outline-none transition-colors"
                >
                  <option value="custom">Événement personnalisé</option>
                  <option value="special_menu">Menu spécial</option>
                  <option value="party">Soirée</option>
                  <option value="promo">Promotion</option>
                  <option value="anniversary">Anniversaire</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  placeholder="Décrivez votre événement..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-coral focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-lg font-semibold text-text-dark hover:border-coral transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-coral to-ocean text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all"
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