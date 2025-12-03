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
  address?: string;
  platforms?: string[];
  keywords?: string[];
}

interface Tip {
  icon: string;
  title: string;
  content: string;
  category: 'timing' | 'content' | 'engagement' | 'strategy';
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

interface SavedPost {
  id: string;
  image_url: string;
  text_content?: string;
  description?: string;
  platform?: string;
  style?: string;
  created_at: string;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [autoEvents, setAutoEvents] = useState<AutoEvent[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [loadingTips, setLoadingTips] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'posts' | 'tips'>('home');
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

    // Vérifier si on revient de Stripe avec un session_id
    const urlParams = new URLSearchParams(window.location.search);
    const stripeSessionId = urlParams.get('session_id');

    if (stripeSessionId) {
      // Créer l'abonnement dans Supabase après paiement Stripe réussi
      console.log('Session Stripe détectée:', stripeSessionId);

      // Vérifier si l'abonnement existe déjà
      const { data: existingSubs, error: selectError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'active');

      console.log('Abonnements existants:', existingSubs, selectError);

      if (!existingSubs || existingSubs.length === 0) {
        // Créer l'abonnement
        const { data: newSub, error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: session.user.id,
            plan: 'monthly',
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            stripe_subscription_id: stripeSessionId
          })
          .select()
          .single();

        console.log('Résultat insertion:', newSub, insertError);

        if (insertError) {
          console.error('Erreur création abonnement:', insertError);
          alert('Erreur création abonnement: ' + insertError.message);
        }
      }

      // Nettoyer l'URL
      window.history.replaceState({}, '', '/dashboard');
    }

    // Vérifier l'abonnement
    const { data: subDataArray, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active');

    console.log('Vérification abonnement:', subDataArray, subError);

    const subData = subDataArray && subDataArray.length > 0 ? subDataArray[0] : null;

    if (!subData) {
      // Pas d'abonnement actif, rediriger vers pricing
      console.log('Pas d\'abonnement actif, redirection vers pricing');
      navigate('/pricing');
      return;
    }

    // Vérifier si l'abonnement n'a pas expiré
    if (new Date(subData.current_period_end) < new Date()) {
      console.log('Abonnement expiré');
      navigate('/pricing');
      return;
    }

    setSubscription(subData);
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

    // Charger les posts sauvegardés
    const { data: postsData } = await supabase
      .from('posts_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (postsData) {
      setSavedPosts(postsData);
    }
  };

  // Générer les tips personnalisés selon le commerce
  const generateTips = (biz: Business): Tip[] => {
    const tips: Tip[] = [];
    const type = biz.business_type;
    const address = biz.address?.toLowerCase() || '';
    const platforms = biz.platforms || ['Instagram'];
    const tone = biz.tone;

    // Détecter si c'est en Corse
    const isCorsica = address.includes('corse') || address.includes('ajaccio') ||
                      address.includes('bastia') || address.includes('porto-vecchio') ||
                      address.includes('calvi') || address.includes('bonifacio');

    // Tips sur les horaires selon le type de commerce
    const timingTips: Record<string, Tip> = {
      'Restaurant': {
        icon: '⏰',
        title: 'Meilleurs horaires',
        content: `Publiez entre 11h-12h (avant le déjeuner) et 18h-19h (avant le dîner). Le week-end, postez aussi vers 10h pour le brunch. ${isCorsica ? 'En Corse, adaptez aux horaires locaux : déjeuner vers 13h, dîner vers 21h.' : ''}`,
        category: 'timing'
      },
      'Bar': {
        icon: '🌙',
        title: 'Meilleurs horaires',
        content: `Publiez en fin d'après-midi (17h-19h) pour attirer la clientèle de l'apéro. Le jeudi et vendredi sont vos meilleurs jours. ${isCorsica ? 'En été, profitez des soirées qui commencent tard !' : ''}`,
        category: 'timing'
      },
      'Boulangerie': {
        icon: '🌅',
        title: 'Meilleurs horaires',
        content: 'Postez tôt le matin (7h-8h) quand les gens pensent au petit-déjeuner, ou vers 16h pour le goûter. Le samedi matin est idéal pour les viennoiseries !',
        category: 'timing'
      },
      'Coiffeur': {
        icon: '📅',
        title: 'Meilleurs horaires',
        content: 'Publiez le mardi-mercredi pour les RDV du week-end. Les stories "avant/après" marchent très bien le samedi après-midi.',
        category: 'timing'
      },
      'Esthétique': {
        icon: '💆',
        title: 'Meilleurs horaires',
        content: 'Postez en début de semaine (lundi-mardi) pour les réservations week-end. Les offres "dernière minute" le jeudi fonctionnent bien.',
        category: 'timing'
      },
      'Boutique': {
        icon: '🛍️',
        title: 'Meilleurs horaires',
        content: 'Publiez le mercredi et jeudi soir (18h-20h) pour les achats du week-end. Les nouveautés le vendredi créent de l\'urgence.',
        category: 'timing'
      }
    };

    // Ajouter le tip timing correspondant
    tips.push(timingTips[type] || {
      icon: '⏰',
      title: 'Meilleurs horaires',
      content: 'Publiez entre 12h-13h (pause déjeuner) et 18h-20h (sortie du travail). Évitez les lundis matins.',
      category: 'timing'
    });

    // Tips sur le contenu selon le type
    const contentTips: Record<string, Tip> = {
      'Restaurant': {
        icon: '📸',
        title: 'Contenu qui marche',
        content: 'Photos de plats en gros plan, coulisses en cuisine, présentation du chef. Les vidéos courtes de préparation cartonnent ! Montrez aussi l\'ambiance de votre salle.',
        category: 'content'
      },
      'Bar': {
        icon: '🍹',
        title: 'Contenu qui marche',
        content: 'Cocktails signature, ambiance soirée, événements (concerts, matchs). Les reels de préparation de cocktails sont très engageants !',
        category: 'content'
      },
      'Boulangerie': {
        icon: '🥐',
        title: 'Contenu qui marche',
        content: 'Sortie du four en vidéo, pains spéciaux, façonnage artisanal. Le pain au levain et les viennoiseries génèrent beaucoup d\'engagement.',
        category: 'content'
      },
      'Coiffeur': {
        icon: '✂️',
        title: 'Contenu qui marche',
        content: 'Transformations avant/après, tendances coupes, tutoriels coiffage. Montrez votre équipe et l\'ambiance du salon.',
        category: 'content'
      },
      'Esthétique': {
        icon: '✨',
        title: 'Contenu qui marche',
        content: 'Résultats de soins, nouveaux produits, conseils beauté. Les vidéos ASMR de massages ou soins du visage fonctionnent très bien.',
        category: 'content'
      },
      'Boutique': {
        icon: '👗',
        title: 'Contenu qui marche',
        content: 'Nouveautés en story, looks complets, coulisses des achats. Les essayages en vidéo et les "hauls" génèrent beaucoup de vues.',
        category: 'content'
      }
    };

    tips.push(contentTips[type] || {
      icon: '📸',
      title: 'Contenu qui marche',
      content: 'Montrez les coulisses, présentez votre équipe, partagez des témoignages clients. L\'authenticité crée la confiance !',
      category: 'content'
    });

    // Tips engagement
    tips.push({
      icon: '💬',
      title: 'Booster l\'engagement',
      content: `Posez des questions dans vos posts ("Quel est votre ${type === 'Restaurant' ? 'plat' : type === 'Bar' ? 'cocktail' : 'produit'} préféré ?"). Répondez TOUJOURS aux commentaires dans l\'heure. Utilisez les sondages en story !`,
      category: 'engagement'
    });

    // Tips stratégie selon les plateformes
    if (platforms.includes('Instagram')) {
      tips.push({
        icon: '📱',
        title: 'Stratégie Instagram',
        content: `Postez 3-5 fois/semaine. Utilisez 20-25 hashtags pertinents (#${type.toLowerCase()}${isCorsica ? ' #corse #corsica' : ''} #local). Les Reels ont 2x plus de portée que les posts classiques.`,
        category: 'strategy'
      });
    }

    if (platforms.includes('Facebook')) {
      tips.push({
        icon: '👍',
        title: 'Stratégie Facebook',
        content: 'Publiez 2-3 fois/semaine. Les événements Facebook sont puissants pour les soirées. Encouragez les avis clients et répondez-y !',
        category: 'strategy'
      });
    }

    if (platforms.includes('TikTok')) {
      tips.push({
        icon: '🎵',
        title: 'Stratégie TikTok',
        content: 'Postez quotidiennement si possible. Utilisez les sons tendances. Les vidéos authentiques et drôles marchent mieux que les trop "pro".',
        category: 'strategy'
      });
    }

    // Tip local si Corse
    if (isCorsica) {
      tips.push({
        icon: '🏝️',
        title: 'Tip Corse',
        content: 'Mettez en avant les produits locaux (charcuterie, fromages, vins corses). Utilisez #Corse #Corsica #VisitCorsica. En été, ciblez aussi les touristes avec du contenu en anglais.',
        category: 'strategy'
      });
    }

    // Tip selon le ton
    if (tone === 'Humour') {
      tips.push({
        icon: '😄',
        title: 'Ton humoristique',
        content: 'Les mèmes et l\'autodérision fonctionnent bien ! N\'hésitez pas à surfer sur les tendances du moment. Restez authentique.',
        category: 'content'
      });
    } else if (tone === 'Luxe') {
      tips.push({
        icon: '✨',
        title: 'Image premium',
        content: 'Privilégiez des photos très soignées, un feed harmonieux. Moins mais mieux : 2-3 posts/semaine de haute qualité suffisent.',
        category: 'content'
      });
    }

    return tips;
  };

  // Charger les tips quand on clique sur l'onglet
  const loadTips = () => {
    if (business && tips.length === 0) {
      setLoadingTips(true);
      setTimeout(() => {
        const generatedTips = generateTips(business);
        setTips(generatedTips);
        setLoadingTips(false);
      }, 500);
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
            <div
              onClick={() => navigate('/subscription')}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF8A65, #004E89)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
              title="Mon abonnement"
            >
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => navigate('/subscription')}
              style={{
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: '1px solid #10B981',
                borderRadius: '8px',
                color: '#10B981',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              {subscription?.plan === 'yearly' ? 'Pro Annuel' : 'Pro'}
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
                fontSize: '12px'
              }}
            >Déconnexion</button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        backgroundColor: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '0 16px'
      }}>
        <button
          onClick={() => setActiveTab('home')}
          style={{
            flex: 1,
            padding: '14px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'home' ? '3px solid #FF8A65' : '3px solid transparent',
            color: activeTab === 'home' ? '#FF8A65' : '#888',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          🏠 Accueil
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          style={{
            flex: 1,
            padding: '14px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'posts' ? '3px solid #FF8A65' : '3px solid transparent',
            color: activeTab === 'posts' ? '#FF8A65' : '#888',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          📸 Posts {savedPosts.length > 0 && `(${savedPosts.length})`}
        </button>
        <button
          onClick={() => {
            setActiveTab('tips');
            loadTips();
          }}
          style={{
            flex: 1,
            padding: '14px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'tips' ? '3px solid #FF8A65' : '3px solid transparent',
            color: activeTab === 'tips' ? '#FF8A65' : '#888',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          💡 Tips
        </button>
      </div>

      {/* Main */}
      <main style={{
        padding: '16px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out',
        width: '100%',
        boxSizing: 'border-box'
      }}>

        {/* TAB: Accueil */}
        {activeTab === 'home' && (
          <>
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
            {business?.logo_url && business?.photos && business.photos.length > 0
              ? 'Prêt à créer du contenu ?'
              : 'Configurez votre profil pour commencer'}
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
          >{business?.logo_url && business?.photos && business.photos.length > 0 ? 'Moodboard →' : 'Configurer →'}</button>
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
          </>
        )}

        {/* TAB: Mes Posts */}
        {activeTab === 'posts' && (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A2E', margin: 0 }}>
                Mes Posts
              </h2>
              <button
                onClick={() => navigate('/create')}
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
              >+ Nouveau</button>
            </div>

            {savedPosts.length === 0 ? (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '40px 20px',
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📸</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A2E', marginBottom: '8px' }}>
                  Aucun post sauvegardé
                </h3>
                <p style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
                  Créez votre premier post et sauvegardez-le pour que l'IA apprenne votre style
                </p>
                <button
                  onClick={() => navigate('/create')}
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
                >Créer mon premier post</button>
              </div>
            ) : (
              <>
                <div style={{
                  backgroundColor: '#F0F7FF',
                  borderRadius: '10px',
                  padding: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '20px' }}>🤖</span>
                  <p style={{ fontSize: '12px', color: '#004E89', margin: 0 }}>
                    L'IA s'inspire de vos {savedPosts.length} post(s) pour rester cohérente avec votre style
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {savedPosts.map((post) => (
                    <div
                      key={post.id}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        border: '1px solid #E5E7EB'
                      }}
                    >
                      <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
                        <img
                          src={post.image_url}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ padding: '10px' }}>
                        <p style={{
                          fontSize: '11px',
                          color: '#666',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {post.description || 'Post sauvegardé'}
                        </p>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '6px'
                        }}>
                          <span style={{ fontSize: '10px', color: '#888' }}>
                            {new Date(post.created_at).toLocaleDateString('fr-FR')}
                          </span>
                          {post.platform && (
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              backgroundColor: '#F0F7FF',
                              borderRadius: '4px',
                              color: '#004E89'
                            }}>
                              {post.platform}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* TAB: Tips */}
        {activeTab === 'tips' && (
          <>
            {/* Header Tips */}
            <div style={{
              background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '16px',
              color: 'white',
              boxShadow: '0 8px 30px rgba(139, 92, 246, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  💡
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                    Conseils Community Manager
                  </h2>
                  <p style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                    Personnalisés pour {business?.business_name || 'votre commerce'}
                  </p>
                </div>
              </div>
            </div>

            {loadingTips ? (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>🤖</div>
                <p style={{ color: '#666', fontSize: '14px' }}>Analyse de votre profil en cours...</p>
              </div>
            ) : tips.length === 0 ? (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>📋</div>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  Complétez votre Moodboard pour recevoir des conseils personnalisés
                </p>
                <button
                  onClick={() => navigate('/moodboard')}
                  style={{
                    marginTop: '16px',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Aller au Moodboard
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Catégories de tips */}
                {['timing', 'content', 'engagement', 'strategy'].map((category) => {
                  const categoryTips = tips.filter(t => t.category === category);
                  if (categoryTips.length === 0) return null;

                  const categoryInfo: Record<string, { title: string; color: string; bgColor: string }> = {
                    'timing': { title: '⏰ Quand publier', color: '#DC2626', bgColor: '#FEE2E2' },
                    'content': { title: '📸 Quel contenu', color: '#059669', bgColor: '#D1FAE5' },
                    'engagement': { title: '💬 Engagement', color: '#D97706', bgColor: '#FEF3C7' },
                    'strategy': { title: '📱 Stratégie', color: '#7C3AED', bgColor: '#EDE9FE' }
                  };

                  const info = categoryInfo[category];

                  return (
                    <div key={category}>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: info.color,
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {info.title}
                      </h3>
                      {categoryTips.map((tip, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '10px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                            border: '1px solid #E5E7EB',
                            borderLeft: `4px solid ${info.color}`
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              backgroundColor: info.bgColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px',
                              flexShrink: 0
                            }}>
                              {tip.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{
                                fontSize: '14px',
                                fontWeight: '700',
                                color: '#1A1A2E',
                                marginBottom: '6px'
                              }}>
                                {tip.title}
                              </h4>
                              <p style={{
                                fontSize: '13px',
                                color: '#555',
                                lineHeight: '1.5',
                                margin: 0
                              }}>
                                {tip.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}

                {/* Bouton rafraîchir */}
                <button
                  onClick={() => {
                    setTips([]);
                    loadTips();
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    color: '#666',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  🔄 Actualiser les conseils
                </button>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}

export default Dashboard;
