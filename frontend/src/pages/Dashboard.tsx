import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getUpcomingEvents } from '../autoEvents';
import { getAllLocalEvents } from '../openagenda';
import {
  HomeIcon, SparklesIcon, CalendarIcon, CameraIcon, LightbulbIcon,
  DiamondIcon, PaletteIcon, LogoutIcon, ClockIcon, ImageIcon,
  MessageIcon, PhoneIcon, TrendingUpIcon, CheckIcon, RefreshIcon,
  PlusIcon, ArrowRightIcon, DownloadIcon, CopyIcon, TemplateIcon
} from '../components/Icons';
import { NotificationBell } from '../components/Notifications';

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
  id?: string;
  date: Date;
  title: string;
  type: string;
  icon: string;
  description: string;
  suggestPost: boolean;
  daysUntil: number;
  isManual?: boolean;
  isLocal?: boolean;
  city?: string;
  post_id?: string;
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

interface Template {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  text_content: string | null;
  description: string | null;
  platform: string | null;
  use_count: number;
  is_favorite: boolean;
  created_at: string;
}

function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [autoEvents, setAutoEvents] = useState<AutoEvent[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [loadingTips, setLoadingTips] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'posts' | 'tips' | 'stats'>('home');
  const [_showStatsPage, setShowStatsPage] = useState(false);
  void _showStatsPage;
  const [postsSubTab, setPostsSubTab] = useState<'posts' | 'templates'>('templates');
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SavedPost | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [_hiddenEventKeys, setHiddenEventKeys] = useState<Set<string>>(new Set());
  void _hiddenEventKeys;
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Gérer le paramètre tab dans l'URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'posts') {
      setActiveTab('posts');
    } else if (tabParam === 'tips') {
      setActiveTab('tips');
    } else if (tabParam === 'stats') {
      setActiveTab('stats');
      setShowStatsPage(true);
    }
  }, [searchParams]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      console.log('🔍 Dashboard: Vérification session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('❌ Erreur session:', sessionError);
        navigate('/login');
        return;
      }

      if (!session) {
        console.log('⚠️ Pas de session, redirection login');
        navigate('/login');
        return;
      }

      console.log('✅ Session trouvée:', session.user.email);
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
    console.log('🔍 Vérification abonnement pour user:', session.user.id);
    const { data: subDataArray, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active');

    console.log('📋 Résultat abonnement:', subDataArray, subError);

    if (subError) {
      console.error('❌ Erreur Supabase subscriptions:', subError);
      // En cas d'erreur Supabase, on continue quand même pour éviter le blocage
    }

    const subData = subDataArray && subDataArray.length > 0 ? subDataArray[0] : null;

    if (!subData) {
      // Pas d'abonnement actif, rediriger vers pricing
      console.log('⚠️ Pas d\'abonnement actif, redirection vers pricing');
      navigate('/pricing');
      return;
    }

    // Vérifier si l'abonnement n'a pas expiré
    if (new Date(subData.current_period_end) < new Date()) {
      console.log('⚠️ Abonnement expiré');
      navigate('/pricing');
      return;
    }

    console.log('✅ Abonnement valide, chargement des données...');
    setSubscription(subData);
    const businessData = await loadData(session.user.id);
    console.log('🏪 Business chargé:', businessData?.business_name, '- Adresse:', businessData?.address);

    // Charger les événements masqués d'abord
    const { data: hiddenData } = await supabase
      .from('hidden_events')
      .select('event_key')
      .eq('user_id', session.user.id);
    const hiddenKeys = new Set<string>(hiddenData?.map(e => e.event_key) || []);
    setHiddenEventKeys(hiddenKeys);

    await loadAllEvents(session.user.id, businessData?.address, hiddenKeys);
    setLoading(false);
    setTimeout(() => setIsVisible(true), 100);
    } catch (error) {
      console.error('❌ Erreur Dashboard checkUser:', error);
      setLoading(false);
    }
  };

  const loadData = async (userId: string): Promise<Business | null> => {
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

    // Charger les templates
    const { data: templatesData } = await supabase
      .from('post_templates')
      .select('*')
      .eq('user_id', userId)
      .order('is_favorite', { ascending: false })
      .order('use_count', { ascending: false });

    if (templatesData) {
      setTemplates(templatesData);
    }

    return businessData;
  };

  // Charger les événements masqués
  const _loadHiddenEvents = async (userId: string) => {
    const { data } = await supabase
      .from('hidden_events')
      .select('event_key')
      .eq('user_id', userId);

    if (data) {
      setHiddenEventKeys(new Set(data.map(e => e.event_key)));
    }
  };
  void _loadHiddenEvents;

  // Masquer un événement suggéré
  const hideEvent = async (eventKey: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('hidden_events')
      .insert({ user_id: user.id, event_key: eventKey });

    if (!error) {
      setHiddenEventKeys(prev => new Set([...prev, eventKey]));
      // Mettre à jour la liste des événements affichés
      setAutoEvents(prev => prev.filter(e => generateEventKey(e) !== eventKey));
    }
  };

  // Afficher une confirmation personnalisée
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
  };

  // Générer une clé unique pour un événement
  const generateEventKey = (event: AutoEvent): string => {
    const dateStr = event.date.toISOString().split('T')[0];
    const titleSlug = event.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${titleSlug}-${dateStr}`;
  };

  // Charger tous les événements (auto + manuels + locaux)
  const loadAllEvents = async (userId: string, businessAddress?: string, hiddenKeys?: Set<string>) => {
    // 1. Événements auto-générés (fêtes, jours fériés nationaux)
    const upcoming = getUpcomingEvents(60);
    const autoEventsData = upcoming.filter(e => e.suggestPost);

    // 2. Événements manuels de l'utilisateur
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);

    const { data: manualEvents } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .gte('event_date', today.toISOString().split('T')[0])
      .lte('event_date', futureDate.toISOString().split('T')[0])
      .order('event_date', { ascending: true });

    // 3. Convertir les événements manuels au format AutoEvent
    const manualEventsFormatted: AutoEvent[] = (manualEvents || []).map(event => {
      const eventDate = new Date(event.event_date);
      const timeDiff = eventDate.getTime() - today.getTime();
      const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      // Icône selon le type
      const iconMap: Record<string, string> = {
        'Promotion': '🏷️',
        'Événement': '🎉',
        'Fête': '🎊',
        'Nouveau produit': '✨',
        'Soirée': '🌙',
        'Jeu concours': '🎁',
        'Anniversaire': '🎂'
      };

      return {
        id: event.id,
        date: eventDate,
        title: event.title,
        type: event.event_type || 'Événement',
        icon: iconMap[event.event_type] || '📌',
        description: event.description || '',
        suggestPost: true,
        daysUntil: daysUntil,
        isManual: true,
        post_id: event.post_id
      };
    });

    // 4. Événements locaux (OpenAgenda) si adresse disponible
    let localEventsFormatted: AutoEvent[] = [];
    console.log('🗺️ Adresse business pour événements locaux:', businessAddress);
    if (businessAddress) {
      try {
        console.log('🗺️ Recherche événements locaux...');
        const localEvents = await getAllLocalEvents(businessAddress, {
          limit: 10,
          fromDate: today,
          toDate: futureDate
        });
        console.log('🗺️ Événements locaux trouvés:', localEvents.length, localEvents);

        localEventsFormatted = localEvents.map(event => {
          const eventDate = new Date(event.event_date);
          const timeDiff = eventDate.getTime() - today.getTime();
          const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

          return {
            id: event.id,
            date: eventDate,
            title: event.title,
            type: 'Local',
            icon: '📍',
            description: event.description || '',
            suggestPost: true,
            daysUntil: daysUntil,
            isLocal: true,
            city: event.city
          };
        });
      } catch (error) {
        console.error('Erreur chargement événements locaux:', error);
      }
    }

    // 5. Combiner, filtrer les masqués, et trier par date
    const allEvents = [...autoEventsData, ...manualEventsFormatted, ...localEventsFormatted]
      .filter(event => {
        // Ne pas filtrer les événements manuels (ils peuvent être supprimés autrement)
        if ((event as any).isManual) return true;
        // Filtrer les événements suggérés masqués
        const dateStr = event.date.toISOString().split('T')[0];
        const titleSlug = event.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const eventKey = `${titleSlug}-${dateStr}`;
        return !hiddenKeys?.has(eventKey);
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 8);

    setAutoEvents(allEvents);
  };

  // Générer les tips personnalisés selon le commerce
  const generateTips = (biz: Business): Tip[] => {
    const allTips: Tip[] = [];
    const type = biz.business_type;
    const address = biz.address?.toLowerCase() || '';
    const platforms = biz.platforms || ['Instagram'];
    const tone = biz.tone;

    // Détecter si c'est en Corse
    const isCorsica = address.includes('corse') || address.includes('ajaccio') ||
                      address.includes('bastia') || address.includes('porto-vecchio') ||
                      address.includes('calvi') || address.includes('bonifacio');

    // Fonction pour mélanger un tableau
    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

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
    allTips.push(timingTips[type] || {
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

    allTips.push(contentTips[type] || {
      icon: '📸',
      title: 'Contenu qui marche',
      content: 'Montrez les coulisses, présentez votre équipe, partagez des témoignages clients. L\'authenticité crée la confiance !',
      category: 'content'
    });

    // Tips engagement
    allTips.push({
      icon: '💬',
      title: 'Booster l\'engagement',
      content: `Posez des questions dans vos posts ("Quel est votre ${type === 'Restaurant' ? 'plat' : type === 'Bar' ? 'cocktail' : 'produit'} préféré ?"). Répondez TOUJOURS aux commentaires dans l\'heure. Utilisez les sondages en story !`,
      category: 'engagement'
    });

    // Tips stratégie selon les plateformes
    if (platforms.includes('Instagram')) {
      allTips.push({
        icon: '📱',
        title: 'Stratégie Instagram',
        content: `Postez 3-5 fois/semaine. Utilisez 20-25 hashtags pertinents (#${type.toLowerCase()}${isCorsica ? ' #corse #corsica' : ''} #local). Les Reels ont 2x plus de portée que les posts classiques.`,
        category: 'strategy'
      });
    }

    if (platforms.includes('Facebook')) {
      allTips.push({
        icon: '👍',
        title: 'Stratégie Facebook',
        content: 'Publiez 2-3 fois/semaine. Les événements Facebook sont puissants pour les soirées. Encouragez les avis clients et répondez-y !',
        category: 'strategy'
      });
    }

    if (platforms.includes('TikTok')) {
      allTips.push({
        icon: '🎵',
        title: 'Stratégie TikTok',
        content: 'Postez quotidiennement si possible. Utilisez les sons tendances. Les vidéos authentiques et drôles marchent mieux que les trop "pro".',
        category: 'strategy'
      });
    }

    // Tip local si Corse
    if (isCorsica) {
      allTips.push({
        icon: '🏝️',
        title: 'Tip Corse',
        content: 'Mettez en avant les produits locaux (charcuterie, fromages, vins corses). Utilisez #Corse #Corsica #VisitCorsica. En été, ciblez aussi les touristes avec du contenu en anglais.',
        category: 'strategy'
      });
    }

    // Tip selon le ton
    if (tone === 'Humour') {
      allTips.push({
        icon: '😄',
        title: 'Ton humoristique',
        content: 'Les mèmes et l\'autodérision fonctionnent bien ! N\'hésitez pas à surfer sur les tendances du moment. Restez authentique.',
        category: 'content'
      });
    } else if (tone === 'Luxe') {
      allTips.push({
        icon: '✨',
        title: 'Image premium',
        content: 'Privilégiez des photos très soignées, un feed harmonieux. Moins mais mieux : 2-3 posts/semaine de haute qualité suffisent.',
        category: 'content'
      });
    }

    // Tips génériques supplémentaires (pour la variété)
    const genericTips: Tip[] = [
      { icon: '🎯', title: 'Call-to-action efficace', content: 'Terminez chaque post par une question ou un appel à l\'action clair : "Réservez maintenant", "Dites-nous en commentaire", "Partagez avec un ami".', category: 'engagement' },
      { icon: '📊', title: 'Analysez vos stats', content: 'Consultez vos statistiques chaque semaine. Identifiez vos posts qui marchent le mieux et reproduisez ce format !', category: 'strategy' },
      { icon: '🎨', title: 'Feed harmonieux', content: 'Gardez une cohérence visuelle : mêmes filtres, mêmes couleurs. Votre feed est votre vitrine !', category: 'content' },
      { icon: '🔥', title: 'Surfez sur les tendances', content: 'Restez à l\'affût des trending topics et adaptez-les à votre activité. Un post tendance peut devenir viral !', category: 'strategy' },
      { icon: '🤝', title: 'Collaborations locales', content: 'Faites des partenariats avec d\'autres commerces locaux. Cross-postez pour toucher de nouvelles audiences !', category: 'strategy' },
      { icon: '📖', title: 'Racontez votre histoire', content: 'Les gens achètent des histoires, pas des produits. Partagez votre parcours, vos valeurs, vos moments de vie.', category: 'content' },
      { icon: '⭐', title: 'Avis clients', content: 'Encouragez les avis et partagez-les ! Un témoignage client vaut mieux que 10 posts promotionnels.', category: 'engagement' },
      { icon: '🎁', title: 'Jeux concours', content: 'Organisez un concours mensuel. "Likez + commentez + taguez un ami" booste l\'engagement et la visibilité.', category: 'engagement' },
      { icon: '📅', title: 'Planifiez à l\'avance', content: 'Préparez vos posts 1 semaine à l\'avance. La régularité est la clé du succès sur les réseaux !', category: 'strategy' },
      { icon: '🎬', title: 'Vidéos courtes', content: 'Les vidéos de moins de 30 secondes captent mieux l\'attention. Reels, TikTok, Shorts : pensez vertical !', category: 'content' },
      { icon: '💡', title: 'Éduquez votre audience', content: 'Partagez des conseils, astuces, tutoriels liés à votre domaine. Devenez LA référence locale !', category: 'content' },
      { icon: '🌟', title: 'Mettez en avant l\'équipe', content: 'Présentez vos collaborateurs ! Les clients aiment connaître les visages derrière l\'entreprise.', category: 'content' },
      { icon: '⚡', title: 'Stories quotidiennes', content: 'Postez 3-5 stories par jour. C\'est plus casual et garde votre compte actif dans l\'algorithme.', category: 'strategy' },
      { icon: '🏷️', title: 'Hashtags locaux', content: 'Utilisez des hashtags de votre ville/région. Vous serez plus visible pour les clients proches !', category: 'strategy' },
      { icon: '💬', title: 'Répondez vite', content: 'Répondez aux DM et commentaires en moins d\'1h. La réactivité crée la confiance et booste l\'algo.', category: 'engagement' }
    ];

    // Ajouter quelques tips génériques aléatoires
    const shuffledGeneric = shuffleArray(genericTips);
    allTips.push(...shuffledGeneric.slice(0, 3));

    // Mélanger tous les tips et en retourner 5-6
    const shuffledTips = shuffleArray(allTips);
    return shuffledTips.slice(0, 6);
  };

  // Charger les tips (renouvellement tous les 15 jours)
  const loadTips = async (forceRefresh = false) => {
    if (!business || !user) return;

    const TIPS_STORAGE_KEY = `aina_tips_${user?.id}`;
    const TIPS_DATE_KEY = `aina_tips_date_${user?.id}`;
    const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000; // 15 jours en millisecondes

    // Vérifier si on a des tips stockés et s'ils sont encore valides
    const storedTips = localStorage.getItem(TIPS_STORAGE_KEY);
    const storedDate = localStorage.getItem(TIPS_DATE_KEY);
    const now = Date.now();

    // Déterminer si c'est un renouvellement automatique (15 jours écoulés)
    let isAutoRenewal = false;
    if (storedDate) {
      const tipsAge = now - parseInt(storedDate);
      isAutoRenewal = tipsAge >= FIFTEEN_DAYS_MS;
    }

    // Si on a des tips valides et pas de forceRefresh, les utiliser
    if (!forceRefresh && storedTips && storedDate && !isAutoRenewal) {
      // Tips encore valides (moins de 15 jours)
      if (tips.length === 0) {
        setTips(JSON.parse(storedTips));
      }
      return;
    }

    // Générer de nouveaux tips
    setLoadingTips(true);
    setTimeout(async () => {
      const generatedTips = generateTips(business);
      setTips(generatedTips);

      // Stocker les nouveaux tips et la date
      localStorage.setItem(TIPS_STORAGE_KEY, JSON.stringify(generatedTips));
      localStorage.setItem(TIPS_DATE_KEY, now.toString());

      // Créer une notification pour informer l'utilisateur
      // Seulement si c'est un renouvellement automatique ou forcé (pas le premier chargement)
      if (forceRefresh || isAutoRenewal) {
        try {
          // Note: event_id est optionnel pour les notifications tips
          const { error } = await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              type: 'tips_renewed',
              title: '💡 Nouveaux conseils disponibles !',
              message: 'Vos conseils personnalisés ont été renouvelés. Découvrez les nouvelles astuces pour booster votre communication !',
              scheduled_for: new Date().toISOString()
            });

          if (error) {
            console.error('Erreur création notification tips:', error);
          }
        } catch (err) {
          console.error('Erreur création notification tips:', err);
        }
      }

      setLoadingTips(false);
    }, 500);
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
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFF8E7',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
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
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflowX: 'hidden',
      width: '100%',
      maxWidth: '100vw'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'rgba(255,248,231,0.95)',
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{
              fontSize: '28px',
              fontFamily: "'Titan One', cursive",
              color: '#C84B31'
            }}>
              AiNa
            </span>
          </div>

          {/* Notifications + User Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Cloche de notifications */}
            {user && <NotificationBell userId={user.id} />}

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
                {/* Overlay pour fermer le menu */}
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
                  {/* Email utilisateur */}
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

                  {/* Statut abonnement */}
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

                  {/* Calendrier */}
                  <div
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/calendar');
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
                    <CalendarIcon size={18} color="#1a3a5c" />
                    <p style={{ fontSize: '13px', fontWeight: '500', color: '#1A1A2E', margin: 0 }}>
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
                      setActiveTab('posts');
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

                  {/* Tips */}
                  <div
                    onClick={() => {
                      setShowUserMenu(false);
                      setActiveTab('tips');
                      loadTips();
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
                      setActiveTab('stats');
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

                  {/* Déconnexion */}
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

      {/* Tabs */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#FFF8E7'
      }}>
        <div style={{
          display: 'flex',
          backgroundColor: '#FFF8E7',
          border: '2px solid #1a3a5c',
          borderRadius: '14px',
          padding: '4px',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('home')}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              borderRadius: '10px',
              backgroundColor: activeTab === 'home' ? '#1a3a5c' : 'transparent',
              color: activeTab === 'home' ? '#FFF8E7' : '#C84B31',
              fontWeight: '700',
              fontFamily: "'Poppins', sans-serif",
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <HomeIcon size={16} color={activeTab === 'home' ? '#FFF8E7' : '#C84B31'} />
            Accueil
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              borderRadius: '10px',
              backgroundColor: activeTab === 'posts' ? '#1a3a5c' : 'transparent',
              color: activeTab === 'posts' ? '#FFF8E7' : '#C84B31',
              fontWeight: '700',
              fontFamily: "'Poppins', sans-serif",
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <CameraIcon size={16} color={activeTab === 'posts' ? '#FFF8E7' : '#C84B31'} />
            Posts {savedPosts.length > 0 && `(${savedPosts.length})`}
          </button>
          <button
            onClick={() => {
              setActiveTab('tips');
              loadTips();
            }}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              borderRadius: '10px',
              backgroundColor: activeTab === 'tips' ? '#1a3a5c' : 'transparent',
              color: activeTab === 'tips' ? '#FFF8E7' : '#C84B31',
              fontWeight: '700',
              fontFamily: "'Poppins', sans-serif",
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <LightbulbIcon size={16} color={activeTab === 'tips' ? '#FFF8E7' : '#C84B31'} />
            Tips
          </button>
        </div>
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
          background: 'linear-gradient(135deg, #a8d4f0, #c5e4f7)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
          color: '#1a3a5c',
          boxShadow: '0 8px 30px rgba(168, 212, 240, 0.4)'
        }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
            {getGreeting()}, {business?.business_name || 'there'}
          </h1>
          <p style={{ fontSize: '13px', opacity: 0.9 }}>
            {business?.logo_url
              ? 'Prêt à créer du contenu ?'
              : 'Configurez votre profil pour commencer'}
          </p>
        </div>

        {/* Actions rapides */}
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A2E', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
            <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
          </svg>
          Actions rapides
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {/* Créer un post */}
          <div
            onClick={() => navigate('/create')}
            style={{
              background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
              borderRadius: '14px',
              padding: '18px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(200, 75, 49, 0.3)'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px'
            }}>
              <SparklesIcon size={20} color="white" />
            </div>
            <h3 style={{ color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
              Nouveau Post
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', marginBottom: '8px' }}>
              Créez un post en décrivant ce que vous voulez
            </p>
            <span style={{ color: 'white', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Créer <ArrowRightIcon size={14} color="white" />
            </span>
          </div>

          {/* Calendrier */}
          <div
            onClick={() => navigate('/calendar')}
            style={{
              background: 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
              borderRadius: '14px',
              padding: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 4px 20px rgba(26, 58, 92, 0.3)'
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
                        backgroundColor: isToday ? '#c84b31' : 'transparent',
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

          {/* Moodboard */}
          <div
            onClick={() => navigate('/moodboard')}
            style={{
              background: 'linear-gradient(135deg, #2d5a45, #3d7a5f)',
              borderRadius: '14px',
              padding: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 4px 20px rgba(45, 90, 69, 0.3)'
            }}
          >
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PaletteIcon size={24} color="white" />
            </div>
            <div>
              <h3 style={{ color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                Moodboard
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                {business?.logo_url
                  ? 'Gérez votre identité visuelle'
                  : 'Configurez votre profil'}
              </p>
            </div>
          </div>
        </div>

        {/* Événements à venir */}
        {autoEvents.length > 0 && (
          <>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A2E', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={18} color="#1A1A2E" />
              Événements à venir
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {autoEvents.slice(0, 3).map((event, index) => (
                <div
                  key={index}
                  onClick={() => {
                    const dateStr = event.date.toISOString().split('T')[0];
                    navigate(`/calendar?date=${dateStr}${event.id ? `&eventId=${event.id}` : ''}`);
                  }}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: event.post_id ? '2px solid #1a3a5c' : (event.isLocal ? '2px solid #2196F3' : (event.isManual ? '2px solid #2d5a45' : '1px solid #E5E7EB')),
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: event.post_id ? '#e8f4fd' : (event.isLocal ? '#E3F2FD' : (event.isManual ? '#e8f5e9' : '#FFF5F2')),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    {event.post_id ? '📱' : event.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A2E', margin: 0 }}>
                        {event.title}
                      </h4>
                      {!event.post_id && event.isLocal && (
                        <span style={{
                          fontSize: '9px',
                          padding: '2px 6px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>Local{event.city ? ` • ${event.city}` : ''}</span>
                      )}
                      {!event.post_id && !event.isLocal && !event.isManual && (
                        <span style={{
                          fontSize: '9px',
                          padding: '2px 6px',
                          backgroundColor: '#FF6B35',
                          color: 'white',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>National</span>
                      )}
                      {!event.post_id && event.isManual && (
                        <span style={{
                          fontSize: '9px',
                          padding: '2px 6px',
                          backgroundColor: '#2d5a45',
                          color: 'white',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>Mon événement</span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>
                      {event.daysUntil === 0 ? "Aujourd'hui" : event.daysUntil === 1 ? 'Demain' : `Dans ${event.daysUntil} jours`}
                    </p>
                  </div>
                  {!event.post_id && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const params = new URLSearchParams();
                          params.set('title', event.title);
                          params.set('type', event.type);
                          if (event.description) {
                            params.set('description', event.description);
                          }
                          params.set('date', event.date.toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          }));
                          // Ajouter l'eventId si c'est un événement manuel
                          if (event.isManual && event.id) {
                            params.set('eventId', event.id);
                          }
                          navigate(`/create?${params.toString()}`);
                        }}
                        style={{
                          padding: '8px 12px',
                          background: event.isManual
                            ? 'linear-gradient(135deg, #2d5a45, #3d7a5f)'
                            : 'linear-gradient(135deg, #c84b31, #e06b4f)',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >Créer</button>
                      {/* Bouton masquer pour événements suggérés (pas manuels) */}
                      {!event.isManual && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showConfirm(
                              'Masquer la suggestion',
                              `Masquer "${event.title}" ? Il n'apparaîtra plus dans vos suggestions.`,
                              () => {
                                hideEvent(generateEventKey(event));
                                closeConfirmModal();
                              }
                            );
                          }}
                          title="Masquer cet événement"
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: '1px solid #E5E7EB',
                            background: 'white',
                            color: '#999',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#FEE2E2';
                            e.currentTarget.style.color = '#DC2626';
                            e.currentTarget.style.borderColor = '#DC2626';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.color = '#999';
                            e.currentTarget.style.borderColor = '#E5E7EB';
                          }}
                        >×</button>
                      )}
                    </div>
                  )}
                  {event.post_id && (
                    <div style={{
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #1a3a5c, #2d5a7c)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'white'
                    }}>
                      Post planifié
                    </div>
                  )}
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
                  background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >+ Nouveau</button>
            </div>

            {/* Sous-onglets Posts / Templates */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <button
                onClick={() => setPostsSubTab('posts')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: postsSubTab === 'posts' ? 'none' : '2px solid #E5E7EB',
                  background: postsSubTab === 'posts' ? 'linear-gradient(135deg, #1a3a5c, #2a5a7c)' : 'white',
                  color: postsSubTab === 'posts' ? 'white' : '#666',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <ImageIcon size={14} color={postsSubTab === 'posts' ? 'white' : '#666'} />
                Posts ({savedPosts.length})
              </button>
              <button
                onClick={() => setPostsSubTab('templates')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: postsSubTab === 'templates' ? 'none' : '2px solid #E5E7EB',
                  background: postsSubTab === 'templates' ? 'linear-gradient(135deg, #8B5CF6, #A78BFA)' : 'white',
                  color: postsSubTab === 'templates' ? 'white' : '#666',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <TemplateIcon size={14} color={postsSubTab === 'templates' ? 'white' : '#666'} />
                Templates ({templates.length})
              </button>
            </div>

            {/* Contenu Posts */}
            {postsSubTab === 'posts' && (
            <>
            {savedPosts.length === 0 ? (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '40px 20px',
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 16px',
                  backgroundColor: '#F0F7FF',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CameraIcon size={32} color="#1a3a5c" />
                </div>
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
                    background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
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
                  <SparklesIcon size={18} color="#1a3a5c" />
                  <p style={{ fontSize: '12px', color: '#1a3a5c', margin: 0 }}>
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
                      <div style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
                        <img
                          src={post.image_url}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {/* Overlay avec boutons */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(0,0,0,0.4)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          opacity: 0,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                        >
                          {/* Bouton Voir */}
                          <button
                            onClick={() => {
                              setSelectedPost(post);
                              setShowPostModal(true);
                            }}
                            style={{
                              backgroundColor: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            Voir le post
                          </button>
                        </div>
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
                        {post.text_content && (
                          <p style={{
                            fontSize: '10px',
                            color: '#888',
                            margin: '4px 0 0 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {post.text_content.substring(0, 50)}...
                          </p>
                        )}
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
                              color: '#1a3a5c'
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

            {/* Contenu Templates */}
            {postsSubTab === 'templates' && (
              <>
                {templates.length === 0 ? (
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '40px 20px',
                    textAlign: 'center',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    border: '1px solid #E5E7EB'
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      margin: '0 auto 16px',
                      backgroundColor: '#F3E8FF',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <TemplateIcon size={32} color="#8B5CF6" />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A2E', marginBottom: '8px' }}>
                      Aucun template
                    </h3>
                    <p style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
                      Sauvegardez un post comme template pour le réutiliser facilement
                    </p>
                    <button
                      onClick={() => navigate('/create')}
                      style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >Créer un post</button>
                  </div>
                ) : (
                  <>
                    <div style={{
                      backgroundColor: '#F3E8FF',
                      borderRadius: '10px',
                      padding: '12px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span style={{ fontSize: '18px' }}>💡</span>
                      <p style={{ fontSize: '12px', color: '#6B21A8', margin: 0 }}>
                        Cliquez sur "Utiliser" pour créer un nouveau post basé sur ce template
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                            border: template.is_favorite ? '2px solid #F59E0B' : '1px solid #E5E7EB'
                          }}
                        >
                          <div style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
                            {template.image_url ? (
                              <img
                                src={template.image_url}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: '#F3E8FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <TemplateIcon size={32} color="#8B5CF6" />
                              </div>
                            )}
                            {/* Badge favori */}
                            {template.is_favorite && (
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                backgroundColor: '#F59E0B',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>⭐</div>
                            )}
                            {/* Badge catégorie */}
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              left: '8px',
                              backgroundColor: 'rgba(139, 92, 246, 0.9)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '10px',
                              color: 'white',
                              fontWeight: '600'
                            }}>
                              {template.category === 'promotion' ? '🏷️' :
                               template.category === 'nouveau_produit' ? '✨' :
                               template.category === 'evenement' ? '🎉' :
                               template.category === 'quotidien' ? '📅' : '📌'} {template.name.substring(0, 12)}{template.name.length > 12 ? '...' : ''}
                            </div>
                          </div>
                          <div style={{ padding: '10px' }}>
                            <p style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#1A1A2E',
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {template.name}
                            </p>
                            <p style={{
                              fontSize: '10px',
                              color: '#888',
                              margin: '4px 0',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {template.text_content?.substring(0, 40) || template.description?.substring(0, 40) || 'Aucune description'}...
                            </p>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: '8px'
                            }}>
                              <span style={{ fontSize: '10px', color: '#888' }}>
                                Utilisé {template.use_count}x
                              </span>
                              <button
                                onClick={() => {
                                  // Naviguer vers CreatePost avec le template
                                  const params = new URLSearchParams();
                                  params.set('templateId', template.id);
                                  if (template.text_content) params.set('templateText', template.text_content);
                                  if (template.image_url) params.set('templateImage', template.image_url);
                                  if (template.description) params.set('templateDesc', template.description);
                                  if (template.platform) params.set('platform', template.platform);
                                  navigate(`/create?${params.toString()}`);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: 'linear-gradient(135deg, #10B981, #34D399)',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: 'white',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                Utiliser
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* TAB: Tips */}
        {activeTab === 'tips' && (
          <>
            {/* Header Tips */}
            <div style={{
              background: 'linear-gradient(135deg, #2d5a45, #3d7a5f)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '16px',
              color: 'white',
              boxShadow: '0 8px 30px rgba(45, 90, 69, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <LightbulbIcon size={24} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                    Conseils Community Manager
                  </h2>
                  <p style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                    Personnalisés pour {business?.business_name || 'votre commerce'}
                  </p>
                </div>
                {/* Badge renouvellement */}
                {(() => {
                  const storedDate = localStorage.getItem(`aina_tips_date_${user?.id}`);
                  if (storedDate) {
                    const daysElapsed = Math.floor((Date.now() - parseInt(storedDate)) / (24 * 60 * 60 * 1000));
                    const daysRemaining = Math.max(0, 15 - daysElapsed);
                    return (
                      <div style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        🔄 {daysRemaining > 0 ? `Renouvellement dans ${daysRemaining}j` : 'Nouveaux conseils !'}
                      </div>
                    );
                  }
                  return null;
                })()}
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
                <div style={{
                  width: '56px',
                  height: '56px',
                  margin: '0 auto 16px',
                  backgroundColor: '#F0F7FF',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <SparklesIcon size={28} color="#1a3a5c" />
                </div>
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
                <div style={{
                  width: '56px',
                  height: '56px',
                  margin: '0 auto 16px',
                  backgroundColor: '#e8f5e9',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <LightbulbIcon size={28} color="#2d5a45" />
                </div>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  Complétez votre Moodboard pour recevoir des conseils personnalisés
                </p>
                <button
                  onClick={() => navigate('/moodboard')}
                  style={{
                    marginTop: '16px',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #2d5a45, #3d7a5f)',
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

                  const categoryInfo: Record<string, { title: string; color: string; bgColor: string; icon: React.ReactNode }> = {
                    'timing': { title: 'Quand publier', color: '#DC2626', bgColor: '#FEE2E2', icon: <ClockIcon size={16} color="#DC2626" /> },
                    'content': { title: 'Quel contenu', color: '#059669', bgColor: '#D1FAE5', icon: <ImageIcon size={16} color="#059669" /> },
                    'engagement': { title: 'Engagement', color: '#D97706', bgColor: '#FEF3C7', icon: <MessageIcon size={16} color="#D97706" /> },
                    'strategy': { title: 'Stratégie', color: '#2d5a45', bgColor: '#e8f5e9', icon: <PhoneIcon size={16} color="#2d5a45" /> }
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
                        {info.icon}
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
                    loadTips(true); // forceRefresh = true
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
                  <RefreshIcon size={16} color="#666" />
                  Actualiser les conseils
                </button>
              </div>
            )}
          </>
        )}

        {/* TAB: Statistiques */}
        {activeTab === 'stats' && (
          <>
            {/* Header Stats */}
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
                  justifyContent: 'center'
                }}>
                  <TrendingUpIcon size={24} color="white" />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                    Tableau de bord
                  </h2>
                  <p style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                    Statistiques et historique d'utilisation
                  </p>
                </div>
              </div>
            </div>

            {/* Statistiques principales */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '16px'
            }}>
              {/* Posts cette semaine */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#DBEAFE',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}>
                  <CalendarIcon size={18} color="#3B82F6" />
                </div>
                <p style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Cette semaine</p>
                <p style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A2E', margin: 0 }}>
                  {savedPosts.filter(p => {
                    const postDate = new Date(p.created_at);
                    const now = new Date();
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return postDate >= weekAgo;
                  }).length}
                </p>
                <p style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>posts créés</p>
              </div>

              {/* Posts ce mois */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#E8F5E9',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}>
                  <CameraIcon size={18} color="#2d5a45" />
                </div>
                <p style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Ce mois</p>
                <p style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A2E', margin: 0 }}>
                  {savedPosts.filter(p => {
                    const postDate = new Date(p.created_at);
                    const now = new Date();
                    return postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
                <p style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>posts créés</p>
              </div>

              {/* Total posts */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}>
                  <ImageIcon size={18} color="#D97706" />
                </div>
                <p style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Total</p>
                <p style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A2E', margin: 0 }}>
                  {savedPosts.length}
                </p>
                <p style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>posts sauvegardés</p>
              </div>

              {/* Templates */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#F3E8FF',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}>
                  <SparklesIcon size={18} color="#8B5CF6" />
                </div>
                <p style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Templates</p>
                <p style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A2E', margin: 0 }}>
                  {templates.length}
                </p>
                <p style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>créés</p>
              </div>
            </div>

            {/* Historique d'utilisation */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              border: '1px solid #E5E7EB'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#1A1A2E',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ClockIcon size={16} color="#8B5CF6" />
                Historique récent
              </h3>

              {savedPosts.length === 0 ? (
                <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                  Aucun post créé pour le moment
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {savedPosts.slice(0, 5).map((post, _index) => (
                    <div
                      key={post.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '10px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSelectedPost(post);
                        setShowPostModal(true);
                      }}
                    >
                      <img
                        src={post.image_url}
                        alt=""
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          objectFit: 'cover'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A2E', margin: 0 }}>
                          {post.platform || 'Post'} - {post.style || 'Standard'}
                        </p>
                        <p style={{ fontSize: '11px', color: '#888', margin: '2px 0 0' }}>
                          {new Date(post.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <ArrowRightIcon size={16} color="#888" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Posts les plus performants - À venir */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              border: '1px solid #E5E7EB',
              opacity: 0.7
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#1A1A2E',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <TrendingUpIcon size={16} color="#10B981" />
                Posts les plus performants
                <span style={{
                  fontSize: '10px',
                  backgroundColor: '#E5E7EB',
                  color: '#666',
                  padding: '2px 8px',
                  borderRadius: '50px',
                  fontWeight: '600'
                }}>
                  (à venir)
                </span>
              </h3>
              <p style={{ fontSize: '12px', color: '#888', margin: '12px 0 0' }}>
                Bientôt disponible : analyse des performances de vos publications avec connexion aux réseaux sociaux.
              </p>
            </div>

            {/* Publication automatique - À venir */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              border: '1px solid #E5E7EB',
              opacity: 0.7
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#1A1A2E',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CalendarIcon size={16} color="#3B82F6" />
                Publication automatique
                <span style={{
                  fontSize: '10px',
                  backgroundColor: '#E5E7EB',
                  color: '#666',
                  padding: '2px 8px',
                  borderRadius: '50px',
                  fontWeight: '600'
                }}>
                  (à venir)
                </span>
              </h3>
              <p style={{ fontSize: '12px', color: '#888', margin: '12px 0 0' }}>
                Bientôt disponible : publication automatique de vos posts planifiés directement sur Instagram, Facebook et TikTok.
              </p>
            </div>
          </>
        )}

      </main>

      {/* Modal voir post */}
      {showPostModal && selectedPost && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 1000
        }}
        onClick={() => setShowPostModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1A1A2E' }}>
                Détails du post
              </h3>
              <button
                onClick={() => setShowPostModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            {/* Image */}
            <div style={{ padding: '16px' }}>
              <img
                src={selectedPost.image_url}
                alt=""
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}
              />
            </div>

            {/* Légende */}
            <div style={{ padding: '0 16px 16px' }}>
              <div style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#666' }}>
                    Légende
                  </span>
                  {selectedPost.text_content && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedPost.text_content || '');
                        alert('✅ Légende copiée !');
                      }}
                      style={{
                        backgroundColor: '#1a3a5c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <CopyIcon size={12} />
                      Copier
                    </button>
                  )}
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#1A1A2E',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  margin: 0
                }}>
                  {selectedPost.text_content || 'Aucune légende enregistrée'}
                </p>
              </div>
            </div>

            {/* Infos */}
            <div style={{ padding: '0 16px 16px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedPost.platform && (
                  <span style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    backgroundColor: '#F0F7FF',
                    borderRadius: '6px',
                    color: '#1a3a5c',
                    fontWeight: '500'
                  }}>
                    {selectedPost.platform}
                  </span>
                )}
                <span style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  backgroundColor: '#F0FDF4',
                  borderRadius: '6px',
                  color: '#059669',
                  fontWeight: '500'
                }}>
                  {new Date(selectedPost.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Boutons */}
            <div style={{ padding: '0 16px 12px', display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedPost.image_url;
                  link.download = `post-${selectedPost.id}.png`;
                  link.click();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#1a3a5c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <DownloadIcon size={14} />
                Télécharger
              </button>
              <button
                onClick={() => setShowPostModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
            </div>

            {/* Bouton Supprimer */}
            <div style={{ padding: '0 16px 20px' }}>
              <button
                onClick={() => {
                  showConfirm(
                    'Supprimer le post',
                    'Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.',
                    async () => {
                      try {
                        await supabase
                          .from('posts')
                          .delete()
                          .eq('id', selectedPost.id);

                        // Mettre à jour la liste
                        setSavedPosts(savedPosts.filter(p => p.id !== selectedPost.id));
                        setShowPostModal(false);
                        closeConfirmModal();
                      } catch (error) {
                        alert('Erreur lors de la suppression');
                      }
                    }
                  );
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  color: '#DC2626',
                  border: '2px solid #DC2626',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                Supprimer ce post
              </button>
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
              margin: '16px',
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
                margin: 0
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
    </div>
  );
}

export default Dashboard;
