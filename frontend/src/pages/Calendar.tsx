import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { generateYearEvents } from '../autoEvents';
import { HomeIcon, SparklesIcon, PlusIcon, CheckIcon, LoaderIcon, DiamondIcon, LogoutIcon, PaletteIcon, DownloadIcon, CopyIcon, ImageIcon, LightbulbIcon, TrendingUpIcon } from '../components/Icons';
import { NotificationBell } from '../components/Notifications';

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
  post_id?: string;
  post_image_url?: string;
  post_text?: string;
}

function CalendarPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [userEvents, setUserEvents] = useState<EventType[]>([]);
  const [autoEvents, setAutoEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const [hiddenEventKeys, setHiddenEventKeys] = useState<Set<string>>(new Set());
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  // Afficher une confirmation personnalisée
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
  };

  // Générer une clé unique pour un événement
  const generateEventKey = (event: EventType): string => {
    const dateStr = event.start.toISOString().split('T')[0];
    const titleSlug = event.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${titleSlug}-${dateStr}`;
  };

  // Masquer un événement suggéré
  const hideEvent = async (event: EventType) => {
    if (!user) return;
    const eventKey = generateEventKey(event);

    const { error } = await supabase
      .from('hidden_events')
      .insert({ user_id: user.id, event_key: eventKey });

    if (!error) {
      setHiddenEventKeys(prev => new Set([...prev, eventKey]));
      setAutoEvents(prev => prev.filter(e => generateEventKey(e) !== eventKey));
      setSelectedEvent(null); // Fermer le popup
    }
  };

  // Tous les événements combinés (filtrés)
  const allEvents = [...userEvents, ...autoEvents.filter(e => !hiddenEventKeys.has(generateEventKey(e)))];

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('12:00');
  const [newType, setNewType] = useState('Promotion');
  const [newDescription, setNewDescription] = useState('');

  const eventTypes = [
    { value: 'Promotion', icon: '🏷️', color: '#c84b31' },
    { value: 'Événement', icon: '🎉', color: '#2d5a45' },
    { value: 'Fête', icon: '🎊', color: '#EC4899' },
    { value: 'Nouveau produit', icon: '✨', color: '#10B981' },
    { value: 'Soirée', icon: '🌙', color: '#1a3a5c' },
    { value: 'Jeu concours', icon: '🎁', color: '#F59E0B' },
    { value: 'Anniversaire', icon: '🎂', color: '#EF4444' }
  ];

  useEffect(() => {
    checkUser();
    loadAutoEvents();

    // Lire les paramètres URL
    const dateParam = searchParams.get('date');
    const eventIdParam = searchParams.get('eventId');

    if (dateParam) {
      setCurrentDate(new Date(dateParam));
    }
    if (eventIdParam) {
      setPendingEventId(eventIdParam);
    }
  }, []);

  // Ouvrir automatiquement l'événement quand les données sont chargées
  useEffect(() => {
    if (pendingEventId && userEvents.length > 0) {
      const eventToOpen = userEvents.find(e => e.id === pendingEventId);
      if (eventToOpen) {
        setSelectedEvent(eventToOpen);
        setPendingEventId(null);
      }
    }
  }, [pendingEventId, userEvents]);

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

    // Charger les événements masqués
    const { data: hiddenData } = await supabase
      .from('hidden_events')
      .select('event_key')
      .eq('user_id', session.user.id);
    if (hiddenData) {
      setHiddenEventKeys(new Set(hiddenData.map(e => e.event_key)));
    }

    // Charger l'abonnement
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (subData) setSubscription(subData);

    setLoading(false);
  };

  const loadEvents = async (userId: string) => {
    // Charger les événements
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Erreur chargement events:', error);
      return;
    }

    if (data) {
      // Récupérer les post_ids qui existent
      const postIds = data.filter(e => e.post_id).map(e => e.post_id);

      // Charger les posts associés si il y en a
      const postsMap: Record<string, any> = {};
      if (postIds.length > 0) {
        const { data: postsData } = await supabase
          .from('posts_history')
          .select('id, image_url, text_content')
          .in('id', postIds);

        if (postsData) {
          postsData.forEach(post => {
            postsMap[post.id] = post;
          });
        }
      }

      const formattedEvents = data.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.event_date),
        end: new Date(event.event_date),
        event_type: event.event_type,
        description: event.description,
        isAuto: false,
        post_id: event.post_id,
        post_image_url: event.post_id ? postsMap[event.post_id]?.image_url : undefined,
        post_text: event.post_id ? postsMap[event.post_id]?.text_content : undefined
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

    // Combiner date et heure
    const eventDateTime = `${newDate}T${newTime}:00`;

    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          user_id: user.id,
          title: newTitle.trim(),
          event_date: eventDateTime,
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
    setNewTime('12:00');
    setNewType('Promotion');
    setNewDescription('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setNewTitle('');
    setNewDate('');
    setNewTime('12:00');
    setNewType('Promotion');
    setNewDescription('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Fonction pour générer un fichier ICS (iCalendar)
  const generateICS = (events: EventType[]): string => {
    const formatDateICS = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };

    const escapeICS = (text: string): string => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AiNa//Calendrier Commercial//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:AiNa - Calendrier Commercial',
      'X-WR-TIMEZONE:Europe/Paris'
    ].join('\r\n');

    events.forEach(event => {
      const startDate = formatDateICS(event.start);
      const endDate = formatDateICS(new Date(event.start.getTime() + 60 * 60 * 1000)); // +1h par défaut
      const uid = `${event.id}@aina-app.com`;
      const now = formatDateICS(new Date());

      icsContent += '\r\n' + [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${escapeICS(event.title)}`,
        event.description ? `DESCRIPTION:${escapeICS(event.description)}` : '',
        `CATEGORIES:${event.event_type}`,
        'END:VEVENT'
      ].filter(line => line).join('\r\n');
    });

    icsContent += '\r\nEND:VCALENDAR';
    return icsContent;
  };

  // Exporter tous les événements
  const handleExportCalendar = (eventsToExport: 'all' | 'user' | 'auto' = 'all') => {
    let events: EventType[] = [];
    let filename = 'aina-calendrier';

    switch (eventsToExport) {
      case 'user':
        events = userEvents;
        filename = 'aina-mes-evenements';
        break;
      case 'auto':
        events = autoEvents;
        filename = 'aina-evenements-sugeres';
        break;
      default:
        events = allEvents;
        filename = 'aina-calendrier-complet';
    }

    if (events.length === 0) {
      alert('Aucun événement à exporter');
      return;
    }

    const icsContent = generateICS(events);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Exporter un seul événement
  const handleExportSingleEvent = (event: EventType) => {
    const icsContent = generateICS([event]);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `aina-${event.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getEventColor = (eventType: string) => {
    const type = eventTypes.find(t => t.value === eventType);
    return type?.color || '#c84b31';
  };

  const eventStyleGetter = (event: EventType) => {
    // Événements automatiques = style différent (bordure pointillée, plus transparent)
    if (event.isAuto) {
      const autoColors: Record<string, string> = {
        'ferie': '#3B82F6',
        'commercial': '#F59E0B', 
        'fete': '#2d5a45',
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

  const handleViewChange = (view: 'month' | 'week' | 'day' | 'agenda') => {
    setCurrentView(view);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFF8E7',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
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
      background: '#FFF8E7',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'rgba(255,248,231,0.95)',
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
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            <span style={{
              fontSize: '28px',
              fontFamily: "'Titan One', cursive",
              color: '#C84B31'
            }}>
              AiNa
            </span>
          </div>

          {/* Boutons à droite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <HomeIcon size={14} color="white" /> Accueil
            </button>

            {/* User Menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#C84B31',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF8E7',
                  fontSize: '15px',
                  fontFamily: "'Titan One', cursive",
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(200, 75, 49, 0.3)'
                }}
              >
                {user?.email?.charAt(0).toUpperCase()}
              </button>

              {/* Menu déroulant */}
              {showUserMenu && (
                <>
                  <div
                    onClick={() => setShowUserMenu(false)}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 99
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '48px',
                    right: 0,
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    border: '1px solid #E5E7EB',
                    minWidth: '200px',
                    zIndex: 100,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #E5E7EB',
                      backgroundColor: '#F9FAFB'
                    }}>
                      <p style={{ fontSize: '12px', color: '#888', margin: '0 0 4px 0' }}>Connecté en tant que</p>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A2E', margin: 0, wordBreak: 'break-all' }}>
                        {user?.email}
                      </p>
                    </div>

                    <div
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/subscription');
                      }}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #E5E7EB',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <DiamondIcon size={18} color="#2d5a45" />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A2E', margin: 0 }}>
                          Mon abonnement
                        </p>
                        <p style={{ fontSize: '11px', color: '#10B981', margin: '2px 0 0', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {subscription?.plan === 'yearly' ? 'Pro Annuel' : 'Pro Mensuel'} <CheckIcon size={12} color="#10B981" />
                        </p>
                      </div>
                    </div>

                    {/* Nouveau Post */}
                    <div
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/create');
                      }}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #E5E7EB',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <PlusIcon size={18} color="#c84b31" />
                      <p style={{ fontSize: '13px', fontWeight: '500', color: '#1A1A2E', margin: 0 }}>
                        Nouveau Post
                      </p>
                    </div>

                    {/* Calendrier (page actuelle) */}
                    <div
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        backgroundColor: '#e8f4fd',
                        borderBottom: '1px solid #E5E7EB'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a3a5c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#1a3a5c', margin: 0 }}>
                        Calendrier
                      </p>
                    </div>

                    {/* Moodboard */}
                    <div
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/moodboard');
                      }}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #E5E7EB',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <PaletteIcon size={18} color="#2d5a45" />
                      <p style={{ fontSize: '13px', fontWeight: '500', color: '#1A1A2E', margin: 0 }}>
                        Moodboard
                      </p>
                    </div>

                    {/* Mes Posts */}
                    <div
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/dashboard?tab=posts');
                      }}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #E5E7EB',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <ImageIcon size={18} color="#8B5CF6" />
                      <p style={{ fontSize: '13px', fontWeight: '500', color: '#1A1A2E', margin: 0 }}>
                        Mes Posts
                      </p>
                    </div>

                    {/* Tips & Conseils */}
                    <div
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/dashboard?tab=tips');
                      }}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #E5E7EB',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <LightbulbIcon size={18} color="#2d5a45" />
                      <p style={{ fontSize: '13px', fontWeight: '500', color: '#1A1A2E', margin: 0 }}>
                        Tips & Conseils
                      </p>
                    </div>

                    {/* Statistiques */}
                    <div
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/dashboard?tab=stats');
                      }}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #E5E7EB',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <TrendingUpIcon size={18} color="#8B5CF6" />
                      <p style={{ fontSize: '13px', fontWeight: '500', color: '#1A1A2E', margin: 0 }}>
                        Statistiques
                      </p>
                    </div>

                    <div
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <LogoutIcon size={18} color="#DC2626" />
                      <p style={{ fontSize: '13px', fontWeight: '500', color: '#DC2626', margin: 0 }}>
                        Déconnexion
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
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
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1A1A2E', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              background: 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}>
              <div style={{ color: 'white', fontSize: '8px', fontWeight: '700', marginBottom: '2px' }}>
                {new Date().toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
              </div>
              <div style={{ color: 'white', fontSize: '16px', fontWeight: '800', lineHeight: '1' }}>
                {new Date().getDate()}
              </div>
            </div>
            Calendrier
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

        {/* Bouton Ajouter Événement */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <button
            onClick={openModal}
            style={{
              padding: '14px 24px',
              background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(200, 75, 49, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <PlusIcon size={16} color="white" />
            Ajouter un événement
          </button>
        </div>

        {/* Calendar Container */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(26, 58, 92, 0.12)',
          border: '3px solid #1a3a5c'
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
            onView={handleViewChange as (view: any) => void}
            views={['month', 'week', 'day', 'agenda']}
            messages={{
              next: "›",
              previous: "‹",
              today: "Aujourd'hui",
              month: "Mois",
              week: "Semaine",
              day: "Jour",
              agenda: "Agenda",
              noEventsInRange: "Aucun événement prévu"
            }}
          />
        </div>

        {/* Bouton Exporter en bas */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={() => handleExportCalendar('all')}
            style={{
              padding: '14px 24px',
              background: 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(26, 58, 92, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <DownloadIcon size={16} color="white" />
            Exporter le calendrier
          </button>
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
              backgroundColor: '#FFF8E7',
              borderRadius: '20px',
              padding: '24px',
              width: '100%',
              maxWidth: '380px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              border: '2px solid #c84b31'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header avec couleur */}
            <div style={{
              background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <PlusIcon size={20} color="white" />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>
                Nouvel événement
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#1A1A2E', fontSize: '13px' }}>
                  Titre *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Soirée Jazz"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Date */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#1A1A2E', fontSize: '13px' }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Heure */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#1A1A2E', fontSize: '13px' }}>
                  Heure
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Type */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#1A1A2E', fontSize: '13px' }}>
                  Type
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {eventTypes.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setNewType(type.value)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: `2px solid ${newType === type.value ? type.color : '#E5E7EB'}`,
                        backgroundColor: newType === type.value ? `${type.color}20` : 'white',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {type.icon} {type.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#1A1A2E', fontSize: '13px' }}>
                  Description (optionnel)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Décrivez votre événement..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '2px solid #E5E7EB',
                    borderRadius: '10px',
                    color: '#666',
                    fontWeight: '600',
                    fontSize: '14px',
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
                    padding: '12px',
                    background: newTitle.trim() && newDate && !saving
                      ? 'linear-gradient(135deg, #c84b31, #e06b4f)'
                      : '#E5E7EB',
                    border: 'none',
                    borderRadius: '10px',
                    color: newTitle.trim() && newDate && !saving ? 'white' : '#999',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: newTitle.trim() && newDate && !saving ? 'pointer' : 'not-allowed'
                  }}
                >
                  {saving ? <><LoaderIcon size={14} color="#999" /> Ajout...</> : <><CheckIcon size={14} color="white" /> Ajouter</>}
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
                      selectedEvent.event_type === 'fete' ? '#2d5a45' : '#10B981'
                    }, ${
                      selectedEvent.event_type === 'ferie' ? '#60A5FA' :
                      selectedEvent.event_type === 'commercial' ? '#FBBF24' :
                      selectedEvent.event_type === 'fete' ? '#3d7a5f' : '#34D399'
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
                    selectedEvent.event_type === 'fete' ? '#2d5a45' : '#10B981'
                  }15`
                : `${getEventColor(selectedEvent.event_type)}15`,
              color: selectedEvent.isAuto 
                ? (selectedEvent.event_type === 'ferie' ? '#3B82F6' :
                   selectedEvent.event_type === 'commercial' ? '#F59E0B' :
                   selectedEvent.event_type === 'fete' ? '#2d5a45' : '#10B981')
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

            {/* Post planifié associé */}
            {selectedEvent.post_image_url && (
              <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '16px',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <ImageIcon size={16} color="#1a3a5c" />
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#1a3a5c' }}>Post planifié</span>
                </div>
                <img
                  src={selectedEvent.post_image_url}
                  alt="Post planifié"
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    maxHeight: '200px',
                    objectFit: 'cover'
                  }}
                />
                {selectedEvent.post_text && (
                  <p style={{
                    fontSize: '11px',
                    color: '#666',
                    margin: '0 0 10px 0',
                    padding: '8px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    lineHeight: '1.4'
                  }}>
                    {selectedEvent.post_text.substring(0, 150)}...
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedEvent.post_image_url!;
                      link.download = `post-planifie.png`;
                      link.click();
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <DownloadIcon size={12} />
                    Image
                  </button>
                  {selectedEvent.post_text && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedEvent.post_text || '');
                        alert('Texte copié !');
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#1a3a5c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <CopyIcon size={12} />
                      Texte
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Bouton principal - Créer un post (seulement si pas de post planifié) */}
            {!selectedEvent.post_id && (
              <button
                onClick={async () => {
                  // Construire les paramètres URL avec les infos de l'événement
                  const params = new URLSearchParams();
                  params.set('title', selectedEvent.title);
                  params.set('type', selectedEvent.event_type);
                  if (selectedEvent.description) {
                    params.set('description', selectedEvent.description);
                  }
                  // Date au format ISO pour CreatePost
                  const isoDate = selectedEvent.start.toISOString().split('T')[0];
                  params.set('date', isoDate);
                  params.set('isAuto', selectedEvent.isAuto ? 'true' : 'false');

                  // Si c'est un événement auto (suggéré), on doit d'abord le créer en base
                  if (selectedEvent.isAuto && user) {
                    try {
                      const { data: newEvent, error } = await supabase
                        .from('events')
                        .insert([{
                          user_id: user.id,
                          title: selectedEvent.title,
                          event_date: isoDate,
                          event_type: selectedEvent.event_type,
                          description: selectedEvent.description || null,
                          is_auto: false // Une fois créé, il devient un événement manuel
                        }])
                        .select()
                        .single();

                      if (error) {
                        console.error('Erreur création événement:', error);
                        alert('Erreur lors de la création de l\'événement');
                        return;
                      }

                      if (newEvent) {
                        params.set('eventId', newEvent.id);
                      }
                    } catch (err) {
                      console.error('Erreur:', err);
                      alert('Erreur lors de la création de l\'événement');
                      return;
                    }
                  } else if (selectedEvent.id) {
                    // Événement manuel existant
                    params.set('eventId', selectedEvent.id);
                  }

                  closeEventModal();
                  navigate(`/create?${params.toString()}`);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginBottom: '12px',
                  boxShadow: '0 4px 12px rgba(200, 75, 49, 0.25)'
                }}
              >
                <SparklesIcon size={14} color="white" /> Créer un post
              </button>
            )}

            {/* Bouton exporter vers calendrier */}
            <button
              onClick={() => handleExportSingleEvent(selectedEvent)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '12px',
                boxShadow: '0 4px 12px rgba(26, 58, 92, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <DownloadIcon size={14} color="white" /> Ajouter à mon calendrier
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
                    onClick={() => {
                      showConfirm(
                        'Supprimer l\'événement',
                        `Voulez-vous vraiment supprimer "${selectedEvent.title}" ?`,
                        async () => {
                          try {
                            const { error } = await supabase
                              .from('events')
                              .delete()
                              .eq('id', selectedEvent.id);
                            if (error) throw error;
                            setUserEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
                            closeEventModal();
                            closeConfirmModal();
                          } catch (err: any) {
                            alert('Erreur: ' + err.message);
                          }
                        }
                      );
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
                <button
                  onClick={() => {
                    showConfirm(
                      'Masquer la suggestion',
                      `Masquer "${selectedEvent.title}" ? Il n'apparaîtra plus dans votre calendrier.`,
                      () => {
                        hideEvent(selectedEvent);
                        closeConfirmModal();
                      }
                    );
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
                  🚫 Masquer cette suggestion
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
                margin: 0,
                fontFamily: "'Plus Jakarta Sans', sans-serif"
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
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
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
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
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

      {/* CSS for Calendar */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .rbc-calendar {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .rbc-toolbar {
          display: flex;
          flex-wrap: nowrap;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 14px 20px;
          background: linear-gradient(135deg, #ffffff, #fafbfc);
          border-radius: 20px;
          gap: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          border: 1px solid rgba(0,0,0,0.04);
        }

        .rbc-btn-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rbc-toolbar button {
          background: #F5F5F7;
          border: none;
          border-radius: 12px;
          padding: 10px 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          font-size: 13px;
          color: #555;
        }

        /* Boutons de navigation (Précédent / Suivant) */
        .rbc-btn-group:first-child button {
          background: linear-gradient(145deg, #1a3a5c, #2d5a7c) !important;
          color: white !important;
          padding: 16px 28px !important;
          border-radius: 14px !important;
          font-weight: 700 !important;
          font-size: 16px !important;
          box-shadow: 0 4px 15px rgba(26, 58, 92, 0.3) !important;
          border: none !important;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: clip !important;
          min-width: fit-content !important;
          width: auto !important;
          max-width: none !important;
        }

        /* Bouton Aujourd'hui en orange */
        .rbc-toolbar-label + .rbc-btn-group button:first-child,
        .rbc-btn-group:first-child button:first-child {
          background: linear-gradient(145deg, #c84b31, #e05a40) !important;
          box-shadow: 0 4px 15px rgba(200, 75, 49, 0.35) !important;
        }

        .rbc-btn-group:first-child button:first-child:hover {
          box-shadow: 0 6px 20px rgba(200, 75, 49, 0.45) !important;
        }

        .rbc-btn-group:first-child button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(26, 58, 92, 0.4) !important;
        }

        .rbc-btn-group:first-child button:active {
          transform: translateY(0);
        }

        /* Boutons de vue (Mois, Semaine, Jour, Agenda) */
        .rbc-btn-group:last-child {
          background: #FFF8E7;
          border: 2px solid #c84b31;
          padding: 5px;
          border-radius: 14px;
          gap: 3px;
        }

        .rbc-btn-group:last-child button {
          background: transparent;
          border-radius: 10px;
          padding: 10px 16px;
          font-size: 13px;
          color: #666;
          font-weight: 500;
        }

        .rbc-btn-group:last-child button:hover {
          background: rgba(255,255,255,0.5);
          color: #333;
        }

        .rbc-toolbar button.rbc-active {
          background: white !important;
          color: #1A1A2E !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          font-weight: 600;
        }

        .rbc-toolbar-label {
          font-weight: 800;
          font-size: 24px;
          color: #1A1A2E;
          text-transform: capitalize;
          letter-spacing: -0.5px;
          flex: 1;
          text-align: center;
        }

        .rbc-header {
          padding: 14px 12px;
          font-weight: 600;
          color: #1A1A2E;
          background: linear-gradient(180deg, #FFF8E7, #FFF5E0);
          border-bottom: 2px solid #f0e4d6;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rbc-month-view {
          border: none;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
        }

        .rbc-month-row {
          border-color: #F0F0F5;
        }

        .rbc-day-bg {
          border-color: #F0F0F5;
          transition: background 0.2s ease;
        }

        .rbc-day-bg:hover {
          background: rgba(200, 75, 49, 0.03);
        }

        .rbc-today {
          background: linear-gradient(135deg, rgba(200, 75, 49, 0.12), rgba(200, 75, 49, 0.06)) !important;
        }

        .rbc-date-cell {
          padding: 10px 8px 4px;
          font-weight: 600;
          font-size: 13px;
        }

        .rbc-date-cell.rbc-now {
          font-weight: 800;
          color: #c84b31;
        }

        .rbc-off-range-bg {
          background-color: #FAFBFC;
        }

        .rbc-off-range {
          color: #CCC;
        }

        .rbc-event {
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .rbc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .rbc-event:focus {
          outline: none;
        }

        .rbc-show-more {
          color: #c84b31;
          font-weight: 700;
          font-size: 11px;
          padding: 2px 6px;
          background: rgba(200, 75, 49, 0.1);
          border-radius: 4px;
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

          /* Toolbar calendar - disposition mobile */
          .rbc-toolbar {
            flex-wrap: wrap !important;
            justify-content: center !important;
            gap: 12px !important;
            padding: 14px !important;
          }

          .rbc-toolbar-label {
            font-size: 20px !important;
            order: -1 !important;
            width: 100% !important;
            margin-bottom: 8px !important;
          }

          .rbc-btn-group:first-child {
            order: 0 !important;
          }

          .rbc-btn-group:last-child {
            order: 1 !important;
            width: 100% !important;
            justify-content: center !important;
          }

          /* Boutons nav mobile */
          .rbc-btn-group:first-child button {
            padding: 10px 16px !important;
            font-size: 12px !important;
          }

          /* Boutons vue mobile */
          .rbc-btn-group:last-child button {
            padding: 8px 12px !important;
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
          .rbc-toolbar-label {
            font-size: 18px !important;
          }

          .rbc-btn-group:first-child button {
            padding: 8px 12px !important;
            font-size: 11px !important;
          }

          .rbc-btn-group:last-child button {
            padding: 6px 10px !important;
            font-size: 10px !important;
          }

          .rbc-header {
            font-size: 10px !important;
            padding: 8px 4px !important;
            letter-spacing: 0 !important;
          }

          .rbc-date-cell {
            font-size: 11px !important;
            padding: 6px 4px 2px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default CalendarPage;
