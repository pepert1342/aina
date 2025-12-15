import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { generatePostText, generateImage, generateImageFromTemplate, modifyImageWithConversation } from '../gemini';
import ImageEditor from '../components/ImageEditor';
import {
  HomeIcon, SparklesIcon, PaletteIcon, TextIcon, CalendarIcon,
  CameraIcon, ImageIcon, TagIcon, SettingsIcon, DownloadIcon,
  SaveIcon, CopyIcon, RefreshIcon, CheckIcon, AlertIcon,
  EditIcon, UploadIcon, CloseIcon, SquareIcon, RectangleVerticalIcon,
  LoaderIcon, DiamondIcon, LogoutIcon, PlusIcon, TemplateIcon, TrendingUpIcon, LightbulbIcon
} from '../components/Icons';
import { NotificationBell } from '../components/Notifications';

type LogoPosition = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
type LogoSize = 'small' | 'medium' | 'large';
type PhotoMode = 'direct' | 'inspiration' | null;

interface Business {
  id: string;
  business_name: string;
  business_type: string;
  tone: string;
  keywords?: string[];
  logo_url?: string;
  photos?: string[];
  address?: string;
  preferred_style?: string;
}

interface SavedPost {
  id: string;
  image_url: string;
  text_content?: string;
  description?: string;
  platform?: string;
  style?: string;
}

function CreatePost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  // Paramètres d'événement depuis l'URL
  const eventTitle = searchParams.get('title');
  const eventType = searchParams.get('type');
  const eventDescription = searchParams.get('description');
  const eventDate = searchParams.get('date');
  const eventId = searchParams.get('eventId'); // ID de l'événement à affilier

  // Paramètres de template depuis l'URL
  const templateId = searchParams.get('templateId');
  const templateText = searchParams.get('templateText');
  const templateImage = searchParams.get('templateImage');
  const templateDesc = searchParams.get('templateDesc');
  const templatePlatform = searchParams.get('platform');

  // Mode conversation pour l'image - Interface
  interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    imageUrl?: string;
  }

  // Mode template
  const [isTemplateMode, setIsTemplateMode] = useState(false);
  const [templateModifications, setTemplateModifications] = useState('');
  const [templateOriginalImage, setTemplateOriginalImage] = useState<string | null>(null); // Image originale du template
  const [templateNewImage, setTemplateNewImage] = useState<string | null>(null); // Nouvelle image générée
  const [generatingTemplateImage, setGeneratingTemplateImage] = useState(false);
  const [templateEditedText, setTemplateEditedText] = useState(''); // Texte du template éditable
  const [isEditingTemplateText, setIsEditingTemplateText] = useState(false); // Mode édition texte template
  const [templateConversation, setTemplateConversation] = useState<ConversationMessage[]>([]); // Conversation pour modifications template
  const [templateModificationInput, setTemplateModificationInput] = useState(''); // Input pour modifier image template

  // Form - Descriptions séparées
  const [imageDescription, setImageDescription] = useState('');
  const [textDescription, setTextDescription] = useState('');

  // Pré-remplir les descriptions si on vient d'un événement
  useEffect(() => {
    if (eventTitle) {
      // Construire une description pour l'image basée sur l'événement
      let imgDesc = '';
      let txtDesc = '';

      // Adapter selon le type d'événement
      const typeLabels: Record<string, string> = {
        'ferie': 'jour férié',
        'commercial': 'événement commercial',
        'fete': 'fête',
        'promotion': 'promotion',
        'autre': 'événement'
      };

      const typeLabel = typeLabels[eventType || ''] || 'événement';

      // Formatter la date pour l'affichage
      const formattedDate = eventDate
        ? new Date(eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
        : '';

      // Description pour l'image
      imgDesc = `Visuel pour ${eventTitle}`;
      if (formattedDate) {
        imgDesc += ` (${formattedDate})`;
      }
      imgDesc += `. Créer une image attrayante et festive pour promouvoir cet ${typeLabel}.`;

      // Description pour la légende
      txtDesc = `Post pour ${eventTitle}`;
      if (formattedDate) {
        txtDesc += ` le ${formattedDate}`;
      }
      txtDesc += '.';
      if (eventDescription) {
        txtDesc += ` ${eventDescription}`;
      }
      txtDesc += ` Créer une légende engageante pour cet ${typeLabel}.`;

      setImageDescription(imgDesc);
      setTextDescription(txtDesc);
    }
  }, [eventTitle, eventType, eventDescription, eventDate]);

  // Pré-remplir si on vient d'un template
  useEffect(() => {
    if (templateId) {
      setIsTemplateMode(true);

      // Charger l'image du template (originale)
      if (templateImage) {
        setTemplateOriginalImage(templateImage);
        setGeneratedImage(templateImage); // Aussi pour l'affichage initial
      }

      // Charger le texte du template
      if (templateText) {
        setGeneratedTexts([templateText]);
        setEditedTexts([templateText]);
        setSelectedVersion(0);
        setTemplateEditedText(templateText); // Texte éditable du template
      }

      // Charger la description
      if (templateDesc) {
        setImageDescription(templateDesc);
        setTextDescription(templateDesc);
      }

      // Charger la plateforme
      if (templatePlatform) {
        setSelectedPlatform(templatePlatform);
      }

      // Incrémenter le compteur d'utilisation
      supabase
        .from('post_templates')
        .update({ use_count: supabase.rpc('increment_template_use', { template_id: templateId }) })
        .eq('id', templateId);
    }
  }, [templateId, templateText, templateImage, templateDesc, templatePlatform]);

  const [selectedPlatform, setSelectedPlatform] = useState('Instagram');
  const [selectedFormat, setSelectedFormat] = useState('carre');

  // Contrôles avancés pour l'image
  const [imageStyle, setImageStyle] = useState('photo_realiste');
  const [imageAmbiance, setImageAmbiance] = useState('');
  const [imageColors, setImageColors] = useState('');

  // Generation
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedTexts, setGeneratedTexts] = useState<string[]>([]);
  const [editedTexts, setEditedTexts] = useState<string[]>([]); // Textes modifiés par l'utilisateur
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // Index du texte en cours d'édition
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');

  // Mode conversation pour l'image (normal mode)
  const [imageConversation, setImageConversation] = useState<ConversationMessage[]>([]);
  const [modificationInput, setModificationInput] = useState('');

  // Historique pour IA
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Planification
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [scheduling, setScheduling] = useState(false);
  const [scheduled, setScheduled] = useState(false);

  // Affiliation à un événement existant
  const [affiliating, setAffiliating] = useState(false);
  const [affiliated, setAffiliated] = useState(false);

  // Templates
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('autre');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);

  // Phase 4: Photo upload + Logo
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [photoMode, setPhotoMode] = useState<PhotoMode>(null);
  const [showLogoOptions, setShowLogoOptions] = useState(false);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('bottom-right');
  const [logoSize, setLogoSize] = useState<LogoSize>('medium');
  const [addLogo, setAddLogo] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Éditeur d'image
  const [showImageEditor, setShowImageEditor] = useState(false);

  // Onglets
  const [activeTab, setActiveTab] = useState<'image' | 'texte'>('image');


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

    const { data: businessData } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (businessData) setBusiness(businessData);

    // Charger l'abonnement
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (subData) setSubscription(subData);

    // Charger l'historique des posts pour l'IA
    const { data: postsData } = await supabase
      .from('posts_history')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (postsData) setSavedPosts(postsData);

    setLoading(false);
    setTimeout(() => setIsVisible(true), 100);
  };

  // Gestion upload photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPhoto(reader.result as string);
        setPhotoMode(null); // Reset le mode pour forcer le choix
      };
      reader.readAsDataURL(file);
    }
  };

  const removeUploadedPhoto = () => {
    setUploadedPhoto(null);
    setPhotoMode(null);
  };

  // Position CSS du logo
  const getLogoPositionStyle = (position: LogoPosition): React.CSSProperties => {
    const positions: Record<LogoPosition, React.CSSProperties> = {
      'top-left': { top: '10px', left: '10px' },
      'top-center': { top: '10px', left: '50%', transform: 'translateX(-50%)' },
      'top-right': { top: '10px', right: '10px' },
      'middle-left': { top: '50%', left: '10px', transform: 'translateY(-50%)' },
      'middle-center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
      'middle-right': { top: '50%', right: '10px', transform: 'translateY(-50%)' },
      'bottom-left': { bottom: '10px', left: '10px' },
      'bottom-center': { bottom: '10px', left: '50%', transform: 'translateX(-50%)' },
      'bottom-right': { bottom: '10px', right: '10px' }
    };
    return positions[position];
  };

  // Taille du logo en pixels
  const getLogoSizePixels = (size: LogoSize): number => {
    const sizes: Record<LogoSize, number> = {
      'small': 40,
      'medium': 60,
      'large': 80
    };
    return sizes[size];
  };

  const handleGenerateText = async () => {
    if (!business || !textDescription.trim()) {
      setError('Veuillez décrire votre légende');
      return;
    }

    setGenerating(true);
    setError('');
    setGeneratedTexts([]);
    setSelectedVersion(null);

    try {
      // Construire le contexte avec l'historique des posts
      const previousDescriptions = savedPosts
        .filter(p => p.description)
        .map(p => p.description)
        .slice(0, 5);

      const moodboard = {
        keywords: business.keywords,
        logo_url: business.logo_url,
        photos: business.photos,
        address: business.address
      };

      // Ajouter le contexte historique dans la description
      let enrichedDescription = previousDescriptions.length > 0
        ? `${textDescription}\n\n[CONTEXTE - Posts précédents pour cohérence de style: ${previousDescriptions.join(' | ')}]`
        : textDescription;

      // Si mode template avec modifications, ajouter le contexte
      if (isTemplateMode && templateText && templateModifications.trim()) {
        enrichedDescription = `IMPORTANT: Tu dois adapter ce texte existant avec les modifications demandées.

TEXTE ORIGINAL DU TEMPLATE:
"""
${templateText}
"""

MODIFICATIONS DEMANDÉES:
${templateModifications}

Adapte le texte original en appliquant les modifications demandées. Garde le même style et la même structure, mais change les éléments spécifiés (dates, noms, événements, etc.).

${enrichedDescription}`;
      }

      const texts = await generatePostText(
        business.business_name,
        business.business_type,
        enrichedDescription,
        '',
        business.tone || 'Familial',
        selectedPlatform,
        moodboard
      );
      setGeneratedTexts(texts);
      setEditedTexts(texts); // Initialiser les textes éditables avec les textes générés
      setEditingIndex(null);
    } catch (error: any) {
      setError('Erreur: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  // Mettre à jour un texte édité
  const handleTextEdit = (index: number, newText: string) => {
    const updated = [...editedTexts];
    updated[index] = newText;
    setEditedTexts(updated);
  };

  // Régénérer uniquement le texte (pas l'image)
  const handleRegenerateText = async () => {
    if (!business || !textDescription.trim()) return;

    setGenerating(true);
    setError('');

    try {
      const previousDescriptions = savedPosts
        .filter(p => p.description)
        .map(p => p.description)
        .slice(0, 5);

      const moodboard = {
        keywords: business.keywords,
        logo_url: business.logo_url,
        photos: business.photos,
        address: business.address
      };

      let enrichedDescription = previousDescriptions.length > 0
        ? `${textDescription}\n\n[CONTEXTE - Posts précédents pour cohérence de style: ${previousDescriptions.join(' | ')}]`
        : textDescription;

      // Si mode template avec modifications, ajouter le contexte
      if (isTemplateMode && templateText && templateModifications.trim()) {
        enrichedDescription = `IMPORTANT: Tu dois adapter ce texte existant avec les modifications demandées.

TEXTE ORIGINAL DU TEMPLATE:
"""
${templateText}
"""

MODIFICATIONS DEMANDÉES:
${templateModifications}

Adapte le texte original en appliquant les modifications demandées. Garde le même style et la même structure, mais change les éléments spécifiés (dates, noms, événements, etc.).

${enrichedDescription}`;
      }

      const texts = await generatePostText(
        business.business_name,
        business.business_type,
        enrichedDescription,
        '',
        business.tone || 'Familial',
        selectedPlatform,
        moodboard
      );
      setGeneratedTexts(texts);
      setEditedTexts(texts);
      setEditingIndex(null);
    } catch (error: any) {
      setError('Erreur: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!business || !imageDescription.trim()) {
      setImageError('Veuillez décrire votre visuel');
      return;
    }

    // Si photo uploadée en mode "direct", on l'utilise directement
    if (uploadedPhoto && photoMode === 'direct') {
      setGeneratedImage(uploadedPhoto);
      return;
    }

    setGeneratingImage(true);
    setImageError('');
    setGeneratedImage(null);

    try {
      // Si photo uploadée en mode "inspiration", utiliser la nouvelle méthode avec image en entrée
      if (uploadedPhoto && photoMode === 'inspiration') {
        // Construire la description enrichie
        let modifications = imageDescription;

        // Ajouter le style
        const styleLabels: Record<string, string> = {
          'photo_realiste': 'Photo réaliste, haute qualité, professionnelle',
          'illustration': 'Illustration graphique, design moderne',
          'aquarelle': 'Style aquarelle artistique',
          'minimaliste': 'Design minimaliste, épuré, moderne',
          'vintage': 'Style vintage, rétro',
          'flat_design': 'Flat design, couleurs vives, vectoriel'
        };
        modifications += `\n\nStyle: ${styleLabels[imageStyle] || 'Photo réaliste'}`;
        modifications += `\nFormat: ${selectedFormat === 'carre' ? 'carré 1:1' : 'story vertical 9:16'}`;

        if (imageAmbiance) {
          modifications += `\nAmbiance: ${imageAmbiance}`;
        }
        if (imageColors) {
          modifications += `\nCouleurs: ${imageColors}`;
        }

        const imageData = await generateImageFromTemplate(
          uploadedPhoto,
          modifications,
          business.business_name,
          business.business_type,
          business.tone || 'Familial'
        );
        setGeneratedImage(imageData);
      } else {
        // Mode normal sans photo d'inspiration
        const moodboard = {
          keywords: business.keywords,
          logo_url: business.logo_url,
          photos: business.photos || [],
          address: business.address
        };

        // Construire la description enrichie avec les contrôles avancés
        let enrichedDescription = `Format: ${selectedFormat === 'carre' ? 'carré 1:1' : 'story vertical 9:16'}`;

        // Style d'image
        const styleLabels: Record<string, string> = {
          'photo_realiste': 'Photo réaliste, haute qualité, professionnelle',
          'illustration': 'Illustration graphique, design moderne',
          'aquarelle': 'Style aquarelle artistique',
          'minimaliste': 'Design minimaliste, épuré, moderne',
          'vintage': 'Style vintage, rétro',
          'flat_design': 'Flat design, couleurs vives, vectoriel'
        };
        enrichedDescription += `\n\nSTYLE: ${styleLabels[imageStyle] || 'Photo réaliste'}`;

        // Ambiance
        if (imageAmbiance) {
          enrichedDescription += `\nAMBIANCE: ${imageAmbiance}`;
        }

        // Couleurs
        if (imageColors) {
          enrichedDescription += `\nCOULEURS DOMINANTES: ${imageColors}`;
        }

        const imageData = await generateImage(
          business.business_name,
          business.business_type,
          imageDescription,
          enrichedDescription,
          business.tone || 'Familial',
          moodboard
        );
        setGeneratedImage(imageData);
        // Ajouter à l'historique de conversation
        setImageConversation([
          { role: 'user', content: imageDescription },
          { role: 'assistant', content: 'Image générée', imageUrl: imageData }
        ]);
      }
    } catch (error: any) {
      setImageError('Erreur: ' + error.message);
    } finally {
      setGeneratingImage(false);
    }
  };

  // Fonction pour modifier l'image existante avec une demande conversationnelle
  const handleModifyImage = async () => {
    if (!business || !modificationInput.trim() || !generatedImage) {
      setImageError('Veuillez décrire la modification souhaitée');
      return;
    }

    setGeneratingImage(true);
    setImageError('');

    try {
      const imageData = await modifyImageWithConversation(
        generatedImage,
        modificationInput,
        imageConversation.filter(msg => msg.role === 'user').map(msg => ({ role: msg.role, content: msg.content })),
        business.business_name,
        business.business_type,
        business.tone || 'Familial'
      );

      // Ajouter à l'historique de conversation
      setImageConversation(prev => [
        ...prev,
        { role: 'user', content: modificationInput },
        { role: 'assistant', content: 'Modification appliquée', imageUrl: imageData }
      ]);

      setGeneratedImage(imageData);
      setModificationInput(''); // Réinitialiser le champ de saisie
    } catch (error: any) {
      setImageError('Erreur: ' + error.message);
    } finally {
      setGeneratingImage(false);
    }
  };

  // Fonction pour remettre à zéro et recommencer
  const handleResetImage = () => {
    setGeneratedImage(null);
    setImageConversation([]);
    setModificationInput('');
    setImageError('');
  };

  // Fonction pour générer une nouvelle image basée sur le template + modifications
  const handleGenerateTemplateImage = async () => {
    if (!business || !templateModifications.trim() || !templateOriginalImage) {
      setImageError('Veuillez décrire les modifications souhaitées');
      return;
    }

    setGeneratingTemplateImage(true);
    setImageError('');

    try {
      // Utiliser la nouvelle fonction qui envoie l'image du template directement à l'IA
      const imageData = await generateImageFromTemplate(
        templateOriginalImage,
        templateModifications,
        business.business_name,
        business.business_type,
        business.tone || 'Familial'
      );

      setTemplateNewImage(imageData);
      setGeneratedImage(imageData); // Mettre à jour l'image affichée
      // Initialiser la conversation avec la première modification
      setTemplateConversation([
        { role: 'user', content: templateModifications },
        { role: 'assistant', content: 'Image générée avec les modifications', imageUrl: imageData }
      ]);
    } catch (error: any) {
      setImageError('Erreur: ' + error.message);
    } finally {
      setGeneratingTemplateImage(false);
    }
  };

  // Fonction pour modifier l'image du template de manière conversationnelle
  const handleModifyTemplateImage = async () => {
    if (!business || !templateModificationInput.trim() || !templateNewImage) {
      setImageError('Veuillez décrire la modification souhaitée');
      return;
    }

    setGeneratingTemplateImage(true);
    setImageError('');

    try {
      const imageData = await modifyImageWithConversation(
        templateNewImage,
        templateModificationInput,
        templateConversation.filter(msg => msg.role === 'user').map(msg => ({ role: msg.role, content: msg.content })),
        business.business_name,
        business.business_type,
        business.tone || 'Familial'
      );

      // Ajouter à l'historique de conversation
      setTemplateConversation(prev => [
        ...prev,
        { role: 'user', content: templateModificationInput },
        { role: 'assistant', content: 'Modification appliquée', imageUrl: imageData }
      ]);

      setTemplateNewImage(imageData);
      setGeneratedImage(imageData);
      setTemplateModificationInput(''); // Réinitialiser le champ
    } catch (error: any) {
      setImageError('Erreur: ' + error.message);
    } finally {
      setGeneratingTemplateImage(false);
    }
  };

  // Fonction pour remettre à zéro le template et recommencer
  const handleResetTemplate = () => {
    setTemplateNewImage(null);
    if (templateImage) {
      setGeneratedImage(templateImage); // Revenir à l'image originale
    }
    setTemplateConversation([]);
    setTemplateModificationInput('');
    setTemplateModifications('');
    setImageError('');
  };

  const handleGenerateAll = async () => {
    await Promise.all([handleGenerateText(), handleGenerateImage()]);
  };

  const handleCopyText = () => {
    if (selectedVersion === null) return;
    // Copier le texte édité (pas l'original)
    navigator.clipboard.writeText(editedTexts[selectedVersion]);
    alert('✅ Texte copié !');
  };

  // Fonction pour calculer la position du logo sur le canvas
  const getLogoCanvasPosition = (
    canvasWidth: number,
    canvasHeight: number,
    logoWidth: number,
    logoHeight: number,
    position: LogoPosition
  ): { x: number; y: number } => {
    const margin = 20;
    const positions: Record<LogoPosition, { x: number; y: number }> = {
      'top-left': { x: margin, y: margin },
      'top-center': { x: (canvasWidth - logoWidth) / 2, y: margin },
      'top-right': { x: canvasWidth - logoWidth - margin, y: margin },
      'middle-left': { x: margin, y: (canvasHeight - logoHeight) / 2 },
      'middle-center': { x: (canvasWidth - logoWidth) / 2, y: (canvasHeight - logoHeight) / 2 },
      'middle-right': { x: canvasWidth - logoWidth - margin, y: (canvasHeight - logoHeight) / 2 },
      'bottom-left': { x: margin, y: canvasHeight - logoHeight - margin },
      'bottom-center': { x: (canvasWidth - logoWidth) / 2, y: canvasHeight - logoHeight - margin },
      'bottom-right': { x: canvasWidth - logoWidth - margin, y: canvasHeight - logoHeight - margin }
    };
    return positions[position];
  };

  // Télécharger l'image avec logo fusionné via Canvas
  const handleDownloadImage = async () => {
    if (!generatedImage) return;

    // Si pas de logo activé, télécharger directement
    if (!addLogo || !business?.logo_url) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `post-${Date.now()}.png`;
      link.click();
      return;
    }

    // Créer le canvas pour fusionner image + logo
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Charger l'image principale
    const mainImage = new Image();
    mainImage.crossOrigin = 'anonymous';

    mainImage.onload = async () => {
      // Définir la taille du canvas selon le format
      let canvasWidth = mainImage.width;
      let canvasHeight = mainImage.height;

      // Si l'image est plus petite, utiliser des dimensions par défaut
      if (canvasWidth < 500) {
        canvasWidth = selectedFormat === 'carre' ? 1080 : selectedFormat === 'story' ? 1080 : 1920;
        canvasHeight = selectedFormat === 'carre' ? 1080 : selectedFormat === 'story' ? 1920 : 1080;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Dessiner l'image principale
      ctx.drawImage(mainImage, 0, 0, canvasWidth, canvasHeight);

      // Charger et dessiner le logo
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';

      logoImg.onload = () => {
        // Calculer la taille du logo (proportionnel à la taille du canvas)
        const logoScale = canvasWidth / 400; // Ratio de base
        const sizes: Record<LogoSize, number> = {
          'small': 60 * logoScale,
          'medium': 90 * logoScale,
          'large': 120 * logoScale
        };
        const logoDisplaySize = sizes[logoSize];

        // Calculer la position
        const pos = getLogoCanvasPosition(canvasWidth, canvasHeight, logoDisplaySize, logoDisplaySize, logoPosition);

        // Dessiner le logo
        ctx.drawImage(logoImg, pos.x, pos.y, logoDisplaySize, logoDisplaySize);

        // Télécharger l'image fusionnée
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `post-${business.business_name}-${Date.now()}.png`;
        link.click();
      };

      logoImg.onerror = () => {
        // Si le logo ne charge pas, télécharger sans
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `post-${Date.now()}.png`;
        link.click();
      };

      logoImg.src = business.logo_url!;
    };

    mainImage.onerror = () => {
      // Fallback: télécharger l'image originale
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `post-${Date.now()}.png`;
      link.click();
    };

    mainImage.src = generatedImage;
  };

  const handleSavePost = async () => {
    if (!generatedImage || !user || !business) return;

    setSaving(true);
    try {
      // Récupérer la légende : en mode template utiliser templateEditedText, sinon version sélectionnée/éditée
      const textToSave = isTemplateMode
        ? (templateEditedText || templateText || null)
        : (selectedVersion !== null
          ? editedTexts[selectedVersion]
          : (editedTexts[0] || generatedTexts[0] || null));

      const { error } = await supabase
        .from('posts_history')
        .insert([{
          user_id: user.id,
          business_id: business.id,
          image_url: generatedImage,
          text_content: textToSave,
          description: imageDescription || textDescription,
          platform: selectedPlatform,
          tone: business.tone,
          style: business.preferred_style
        }]);

      if (error) throw error;

      setSaved(true);
      // Ajouter le post à la liste locale
      setSavedPosts(prev => [{
        id: Date.now().toString(),
        image_url: generatedImage,
        text_content: textToSave || undefined,
        description: imageDescription || textDescription,
        platform: selectedPlatform,
        style: business.preferred_style
      }, ...prev]);

      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur sauvegarde: ' + (error.message || JSON.stringify(error)));
    } finally {
      setSaving(false);
    }
  };

  // Planifier le post dans le calendrier
  const handleSchedulePost = async () => {
    if (!generatedImage || !user || !business || !scheduleDate) return;

    setScheduling(true);
    try {
      // Combiner date et heure
      const scheduledDateTime = `${scheduleDate}T${scheduleTime}:00`;

      // Récupérer la légende : en mode template utiliser templateEditedText, sinon version sélectionnée/éditée
      const textToSave = isTemplateMode
        ? (templateEditedText || templateText || null)
        : (selectedVersion !== null
          ? editedTexts[selectedVersion]
          : (editedTexts[0] || generatedTexts[0] || null));

      // Sauvegarder d'abord le post
      const { data: postData, error: postError } = await supabase
        .from('posts_history')
        .insert([{
          user_id: user.id,
          business_id: business.id,
          image_url: generatedImage,
          text_content: textToSave,
          description: imageDescription || textDescription,
          platform: selectedPlatform,
          tone: business.tone,
          style: business.preferred_style,
          scheduled_date: scheduledDateTime,
          status: 'scheduled'
        }])
        .select()
        .single();

      if (postError) throw postError;

      // Créer un événement dans le calendrier
      const { error: eventError } = await supabase
        .from('events')
        .insert([{
          user_id: user.id,
          title: `Post planifié: ${(imageDescription || textDescription || 'Post').substring(0, 30)}...`,
          event_date: scheduledDateTime,
          event_type: 'Post planifié',
          description: `Post pour ${selectedPlatform || 'réseaux sociaux'}. ${textToSave ? textToSave.substring(0, 100) + '...' : ''}`,
          post_id: postData?.id
        }]);

      if (eventError) throw eventError;

      setScheduled(true);
      setShowScheduleModal(false);
      setScheduleDate('');
      setScheduleTime('12:00');

      setTimeout(() => setScheduled(false), 3000);
    } catch (error: any) {
      alert('Erreur lors de la planification: ' + error.message);
    } finally {
      setScheduling(false);
    }
  };

  // Affilier le post à un événement existant
  const handleAffiliateToEvent = async () => {
    if (!generatedImage || !user || !business || !eventId || !eventDate) return;

    setAffiliating(true);
    try {
      // Récupérer la légende : en mode template utiliser templateEditedText, sinon version sélectionnée/éditée
      const textToSave = isTemplateMode
        ? (templateEditedText || templateText || null)
        : (selectedVersion !== null
          ? editedTexts[selectedVersion]
          : (editedTexts[0] || generatedTexts[0] || null));

      // Date de l'événement pour la planification
      const scheduledDateTime = `${eventDate}T12:00:00`;

      // 1. Sauvegarder le post avec la date de l'événement
      const { data: postData, error: postError } = await supabase
        .from('posts_history')
        .insert([{
          user_id: user.id,
          business_id: business.id,
          image_url: generatedImage,
          text_content: textToSave,
          description: imageDescription || textDescription,
          platform: selectedPlatform,
          tone: business.tone,
          style: business.preferred_style,
          scheduled_date: scheduledDateTime,
          status: 'scheduled'
        }])
        .select()
        .single();

      if (postError) throw postError;

      // 2. Mettre à jour l'événement avec le post_id
      const { error: eventError } = await supabase
        .from('events')
        .update({ post_id: postData.id })
        .eq('id', eventId);

      if (eventError) throw eventError;

      setAffiliated(true);
      // Ne pas reset affiliated pour garder l'état visible
    } catch (error: any) {
      console.error('Erreur affiliation:', error);
      alert('Erreur lors de l\'affiliation: ' + error.message);
    } finally {
      setAffiliating(false);
    }
  };

  // Sauvegarder comme template
  const handleSaveAsTemplate = async () => {
    if (!user || !business || !templateName.trim()) return;

    setSavingTemplate(true);
    try {
      // Récupérer la légende : en mode template utiliser templateEditedText, sinon version sélectionnée/éditée
      const textToSave = isTemplateMode
        ? (templateEditedText || templateText || null)
        : (selectedVersion !== null
          ? editedTexts[selectedVersion]
          : (editedTexts[0] || generatedTexts[0] || null));

      const { error } = await supabase
        .from('post_templates')
        .insert([{
          user_id: user.id,
          business_id: business.id,
          name: templateName.trim(),
          category: templateCategory,
          image_url: generatedImage,
          text_content: textToSave,
          description: imageDescription || textDescription,
          platform: selectedPlatform,
          tone: business.tone,
          style: business.preferred_style,
          image_style: imageStyle
        }]);

      if (error) throw error;

      setTemplateSaved(true);
      setShowTemplateModal(false);
      setTemplateName('');
      setTimeout(() => setTemplateSaved(false), 3000);
    } catch (error: any) {
      console.error('Erreur sauvegarde template:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setSavingTemplate(false);
    }
  };

  const templateCategories = [
    { value: 'promotion', label: 'Promotion', icon: '🏷️' },
    { value: 'nouveau_produit', label: 'Nouveau produit', icon: '✨' },
    { value: 'evenement', label: 'Événement', icon: '🎉' },
    { value: 'quotidien', label: 'Quotidien', icon: '📅' },
    { value: 'autre', label: 'Autre', icon: '📌' }
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
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
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      overflowX: 'hidden',
      maxWidth: '100vw'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'rgba(255,248,231,0.95)',
        borderBottom: '1px solid #DCE8F5',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
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
              <HomeIcon size={14} color="white" />
              Accueil
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

                    {/* Nouveau Post (page actuelle) */}
                    <div
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        backgroundColor: '#FFF5F2',
                        borderBottom: '1px solid #E5E7EB'
                      }}
                    >
                      <PlusIcon size={18} color="#c84b31" />
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#c84b31', margin: 0 }}>
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
                      <SparklesIcon size={18} color="#2d5a45" />
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

      {/* Main Content */}
      <main className="main-content" style={{
        margin: '0 auto',
        padding: '16px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out'
      }}>

        {/* ========== MODE TEMPLATE - Interface dédiée ========== */}
        {isTemplateMode ? (
          <>
            {/* Header Template */}
            <div style={{
              background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TemplateIcon size={24} color="white" />
                </div>
                <div>
                  <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>
                    Réutiliser un template
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '2px' }}>
                    Adaptez votre template avec les modifications souhaitées
                  </p>
                </div>
              </div>
            </div>

            {/* Aperçu du template original */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #DCE8F5'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A2E', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} color="#8B5CF6" />
                Template original
              </h3>

              <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                {/* Image du template */}
                {templateOriginalImage && (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={templateOriginalImage}
                      alt="Template original"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                      }}
                    />
                  </div>
                )}

                {/* Texte du template */}
                {templateText && (
                  <div style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
                      📝 Légende (sera conservée) :
                    </p>
                    <p style={{ fontSize: '14px', color: '#1A1A2E', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>
                      {templateText}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modifications à appliquer */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '2px solid #A78BFA'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '700',
                color: '#6B21A8',
                fontSize: '16px',
                marginBottom: '12px'
              }}>
                <EditIcon size={18} color="#8B5CF6" />
                Modifications à appliquer
              </label>
              <textarea
                value={templateModifications}
                onChange={(e) => setTemplateModifications(e.target.value)}
                placeholder="Ex: Changer la date affichée pour 'Samedi 20 Décembre', remplacer le nom du plat par 'Osso Bucco', modifier le prix en '18€'..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #E9D5FF',
                  borderRadius: '12px',
                  fontSize: '15px',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  lineHeight: '1.6'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#8B5CF6';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E9D5FF';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                💡 Décrivez les modifications visuelles : textes, dates, noms, prix... L'IA recréera l'image avec ces changements.
              </p>

              {/* Bouton Générer la nouvelle image */}
              <button
                onClick={handleGenerateTemplateImage}
                disabled={generatingTemplateImage || !templateModifications.trim()}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '16px',
                  background: (generatingTemplateImage || !templateModifications.trim()) ? '#E5E7EB' : 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                  border: 'none',
                  borderRadius: '12px',
                  color: (generatingTemplateImage || !templateModifications.trim()) ? '#999' : 'white',
                  fontWeight: '700',
                  cursor: (generatingTemplateImage || !templateModifications.trim()) ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: (generatingTemplateImage || !templateModifications.trim()) ? 'none' : '0 4px 20px rgba(139, 92, 246, 0.4)',
                  opacity: !templateModifications.trim() ? 0.6 : 1
                }}
              >
                {generatingTemplateImage ? (
                  <><LoaderIcon size={18} color="#999" /> Génération de l'image...</>
                ) : (
                  <><SparklesIcon size={18} color="white" /> Générer la nouvelle image</>
                )}
              </button>

              {/* Erreur */}
              {imageError && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#FEE2E2',
                  borderRadius: '8px',
                  color: '#DC2626',
                  fontSize: '13px'
                }}>
                  {imageError}
                </div>
              )}
            </div>

            {/* Résultat - Nouvelle image générée */}
            {templateNewImage && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                border: '2px solid #10B981'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#059669', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <CheckIcon size={18} color="#10B981" />
                    Nouvelle image générée
                  </h3>
                  {/* Bouton Recommencer */}
                  <button
                    onClick={handleResetTemplate}
                    style={{
                      padding: '6px 12px',
                      background: '#FEE2E2',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#DC2626',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RefreshIcon size={12} color="#DC2626" />
                    Recommencer
                  </button>
                </div>

                {/* Image générée */}
                <div style={{
                  backgroundColor: '#F0FDF4',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <img
                      src={templateNewImage}
                      alt="Nouvelle image"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '350px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                      }}
                    />
                  </div>
                </div>

                {/* Système de conversation pour modifier l'image */}
                <div style={{
                  backgroundColor: '#F3E8FF',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#6B21A8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <SparklesIcon size={14} color="#8B5CF6" />
                    Modifier l'image avec l'IA
                  </p>

                  {/* Historique de conversation */}
                  {templateConversation.length > 0 && (
                    <div style={{
                      maxHeight: '120px',
                      overflowY: 'auto',
                      marginBottom: '12px',
                      padding: '8px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #E9D5FF'
                    }}>
                      {templateConversation.filter(msg => msg.role === 'user').map((msg, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '6px 10px',
                            marginBottom: index < templateConversation.filter(m => m.role === 'user').length - 1 ? '6px' : 0,
                            backgroundColor: '#EEF2FF',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#4F46E5'
                          }}
                        >
                          {msg.content}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input de modification */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={templateModificationInput}
                      onChange={(e) => setTemplateModificationInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !generatingTemplateImage && handleModifyTemplateImage()}
                      placeholder="Ex: Plus de lumière, changer les couleurs, ajouter du texte..."
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        border: '2px solid #E9D5FF',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={handleModifyTemplateImage}
                      disabled={generatingTemplateImage || !templateModificationInput.trim()}
                      style={{
                        padding: '12px 16px',
                        background: generatingTemplateImage || !templateModificationInput.trim()
                          ? '#E5E7EB'
                          : 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                        border: 'none',
                        borderRadius: '10px',
                        color: generatingTemplateImage || !templateModificationInput.trim() ? '#999' : 'white',
                        fontWeight: '600',
                        cursor: generatingTemplateImage || !templateModificationInput.trim() ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px'
                      }}
                    >
                      {generatingTemplateImage ? <LoaderIcon size={14} color="#999" /> : <SparklesIcon size={14} color="white" />}
                      Modifier
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: '#888', marginTop: '8px', margin: '8px 0 0' }}>
                    Demandez des modifications et l'IA ajustera l'image
                  </p>
                </div>

                {/* Section Légende éditable */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A2E', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📝 Légende
                    </p>
                    <button
                      onClick={() => setIsEditingTemplateText(!isEditingTemplateText)}
                      style={{
                        padding: '6px 12px',
                        background: isEditingTemplateText ? '#10B981' : '#EEF2FF',
                        border: 'none',
                        borderRadius: '8px',
                        color: isEditingTemplateText ? 'white' : '#4F46E5',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isEditingTemplateText ? (
                        <><CheckIcon size={12} color="white" /> Terminé</>
                      ) : (
                        <><EditIcon size={12} color="#4F46E5" /> Modifier</>
                      )}
                    </button>
                  </div>
                  {isEditingTemplateText ? (
                    <textarea
                      value={templateEditedText}
                      onChange={(e) => setTemplateEditedText(e.target.value)}
                      rows={6}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '2px solid #8B5CF6',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit'
                      }}
                    />
                  ) : (
                    <p style={{ fontSize: '14px', color: '#1A1A2E', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>
                      {templateEditedText || templateText || 'Aucune légende'}
                    </p>
                  )}
                  {/* Bouton copier */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(templateEditedText || templateText || '');
                      alert('✅ Texte copié !');
                    }}
                    style={{
                      marginTop: '12px',
                      padding: '8px 14px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: '#666',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <CopyIcon size={12} color="#666" />
                    Copier la légende
                  </button>
                </div>

                {/* Boutons d'action principaux - Ligne 1 */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {/* Télécharger */}
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `template-${Date.now()}.png`;
                      link.href = templateNewImage;
                      link.click();
                    }}
                    style={{
                      flex: 1,
                      minWidth: '100px',
                      padding: '12px',
                      background: 'white',
                      border: '2px solid #E5E7EB',
                      borderRadius: '10px',
                      color: '#666',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <DownloadIcon size={14} color="#666" />
                    Télécharger
                  </button>

                  {/* Sauvegarder dans Mes Posts */}
                  <button
                    onClick={handleSavePost}
                    disabled={saving || saved}
                    style={{
                      flex: 1,
                      minWidth: '100px',
                      padding: '12px',
                      background: saved ? '#10B981' : 'linear-gradient(135deg, #10B981, #34D399)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: saved ? 'default' : 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: saved ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {saved ? (
                      <><CheckIcon size={14} color="white" /> Sauvegardé !</>
                    ) : saving ? (
                      <><LoaderIcon size={14} color="white" /> ...</>
                    ) : (
                      <><SaveIcon size={14} color="white" /> Mes Posts</>
                    )}
                  </button>
                </div>

                {/* Boutons d'action - Ligne 2 */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {/* Sauvegarder comme nouveau template */}
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    style={{
                      flex: 1,
                      minWidth: '100px',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    <TemplateIcon size={14} color="white" /> Nouveau Template
                  </button>

                  {/* Planifier OU Affilier à l'événement */}
                  {eventId ? (
                    // Si on vient d'un événement : bouton Affilier à l'événement
                    <button
                      onClick={handleAffiliateToEvent}
                      disabled={affiliating || affiliated}
                      style={{
                        flex: 1,
                        minWidth: '100px',
                        padding: '12px',
                        background: affiliated
                          ? 'linear-gradient(135deg, #10B981, #34D399)'
                          : 'linear-gradient(135deg, #c84b31, #e05a40)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        fontWeight: '600',
                        cursor: affiliating || affiliated ? 'default' : 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: affiliated ? '0 4px 15px rgba(16, 185, 129, 0.3)' : '0 4px 15px rgba(200, 75, 49, 0.3)'
                      }}
                    >
                      {affiliating ? (
                        <><LoaderIcon size={14} color="white" /> Affiliation...</>
                      ) : affiliated ? (
                        <><CheckIcon size={14} color="white" /> Affilié !</>
                      ) : (
                        <><CalendarIcon size={14} color="white" /> Affilier</>
                      )}
                    </button>
                  ) : (
                    // Sinon : bouton Planifier classique
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      disabled={scheduled}
                      style={{
                        flex: 1,
                        minWidth: '100px',
                        padding: '12px',
                        background: scheduled ? '#1a3a5c' : 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        fontWeight: '600',
                        cursor: scheduled ? 'default' : 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: scheduled ? 'none' : '0 4px 15px rgba(26, 58, 92, 0.3)'
                      }}
                    >
                      {scheduled ? (
                        <><CheckIcon size={14} color="white" /> Planifié !</>
                      ) : (
                        <><CalendarIcon size={14} color="white" /> Planifier</>
                      )}
                    </button>
                  )}
                </div>

                {/* Info événement affilié */}
                {eventId && (
                  <div style={{
                    padding: '12px 16px',
                    background: affiliated ? 'linear-gradient(135deg, #D1FAE5, #A7F3D0)' : 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                    borderRadius: '12px',
                    marginBottom: '10px',
                    border: affiliated ? '2px solid #10B981' : '2px solid #F59E0B'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px' }}>{affiliated ? '✅' : '📅'}</span>
                      <div>
                        <p style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: affiliated ? '#065F46' : '#92400E',
                          margin: 0
                        }}>
                          {affiliated ? 'Post affilié !' : 'Événement à publier'}
                        </p>
                        <p style={{
                          fontSize: '13px',
                          color: affiliated ? '#047857' : '#B45309',
                          margin: '2px 0 0'
                        }}>
                          {eventTitle} • {eventDate ? new Date(eventDate).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          }) : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bouton retour */}
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                color: '#666',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              ← Retour au dashboard
            </button>
          </>
        ) : (
          <>
        {/* ========== MODE NORMAL - Interface Create Post ========== */}
        {/* Header Banner - Dégradé INVERSÉ (Bleu → Orange) */}
        <div className="banner" style={{
          background: 'linear-gradient(135deg, #1a3a5c, #c84b31)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 10px 40px rgba(26, 58, 92, 0.3)'
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
              flexShrink: 0
            }}>
              <SparklesIcon size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>
                Créer un nouveau post
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '2px' }}>
                Décrivez ce que vous voulez, l'IA s'occupe du reste !
              </p>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '6px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          border: '1px solid #DCE8F5'
        }}>
          <button
            onClick={() => setActiveTab('image')}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'image'
                ? 'linear-gradient(135deg, #c84b31, #e06b4f)'
                : 'transparent',
              color: activeTab === 'image' ? 'white' : '#666',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'image' ? '0 4px 15px rgba(200, 75, 49, 0.3)' : 'none'
            }}
          >
            <PaletteIcon size={16} color={activeTab === 'image' ? 'white' : '#666'} />
            Image / Flyer
          </button>
          <button
            onClick={() => setActiveTab('texte')}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'texte'
                ? 'linear-gradient(135deg, #1a3a5c, #2a5a7c)'
                : 'transparent',
              color: activeTab === 'texte' ? 'white' : '#666',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'texte' ? '0 4px 15px rgba(26, 58, 92, 0.3)' : 'none'
            }}
          >
            <TextIcon size={16} color={activeTab === 'texte' ? 'white' : '#666'} />
            Légende
          </button>
        </div>

        
        {/* Contenu Onglet IMAGE */}
        {activeTab === 'image' && (
          <>
        {/* Bannière événement si applicable */}
        {eventTitle && (
          <div style={{
            background: 'linear-gradient(135deg, #2d5a45, #3d7a5f)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 15px rgba(45, 90, 69, 0.3)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CalendarIcon size={20} color="white" />
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: '700', fontSize: '15px', margin: 0 }}>
                {eventTitle}
              </p>
              {eventDate && (
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: '4px 0 0' }}>
                  {new Date(eventDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Description du visuel */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid #DCE8F5'
        }}>
          <label style={{ display: 'block', fontWeight: '700', color: '#1A1A2E', fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PaletteIcon size={18} color="#c84b31" />
            Décrivez votre visuel
          </label>
          <textarea
            value={imageDescription}
            onChange={(e) => setImageDescription(e.target.value)}
            placeholder="Ex: Une photo appétissante de mon plat du jour, une daube de sanglier avec polenta crémeuse, ambiance chaleureuse de restaurant."
            rows={3}
            style={{
              width: '100%',
              padding: '16px',
              border: '2px solid #E5E7EB',
              borderRadius: '12px',
              fontSize: '15px',
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              lineHeight: '1.6',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#c84b31';
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(200, 75, 49, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />

          {/* Contrôles avancés */}
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontWeight: '600', color: '#1A1A2E', fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SettingsIcon size={16} color="#666" />
              Options avancées
            </p>

            {/* Style d'image */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                Style d'image
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { value: 'photo_realiste', label: 'Photo réaliste' },
                  { value: 'illustration', label: 'Illustration' },
                  { value: 'minimaliste', label: 'Minimaliste' },
                  { value: 'vintage', label: 'Vintage' },
                  { value: 'flat_design', label: 'Flat design' }
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setImageStyle(style.value)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: imageStyle === style.value ? 'none' : '2px solid #E5E7EB',
                      background: imageStyle === style.value ? 'linear-gradient(135deg, #c84b31, #e06b4f)' : 'white',
                      color: imageStyle === style.value ? 'white' : '#666',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ambiance */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                Ambiance (optionnel)
              </label>
              <input
                type="text"
                value={imageAmbiance}
                onChange={(e) => setImageAmbiance(e.target.value)}
                placeholder="Ex: chaleureuse, festive, moderne, épurée..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {/* Couleurs */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                Couleurs dominantes (optionnel)
              </label>
              <input
                type="text"
                value={imageColors}
                onChange={(e) => setImageColors(e.target.value)}
                placeholder="Ex: rouge et doré, tons pastel, noir et blanc..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Configuration Bar - Horizontal avec gros boutons */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid #DCE8F5'
        }}>
          {/* Options : Plateforme et Format */}
          <div className="options-section" style={{ marginBottom: '20px' }}>
            
            {/* Platform Selection */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#1A1A2E', fontSize: '14px', marginBottom: '12px' }}>
                <ImageIcon size={16} color="#1A1A2E" />
                Plateforme
              </span>
              
              {/* Grid 2x2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {/* Instagram */}
                <button
                  onClick={() => setSelectedPlatform('Instagram')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: selectedPlatform === 'Instagram' ? 'none' : '2px solid #E5E7EB',
                    background: selectedPlatform === 'Instagram' 
                      ? 'linear-gradient(135deg, #833AB4, #E4405F, #FFDC80)' 
                      : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedPlatform === 'Instagram' ? '0 4px 15px rgba(228, 64, 95, 0.4)' : 'none'
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={selectedPlatform === 'Instagram' ? 'white' : '#E4405F'}>
                    <rect x="2" y="2" width="20" height="20" rx="5" stroke={selectedPlatform === 'Instagram' ? 'white' : '#E4405F'} strokeWidth="2" fill="none"/>
                    <circle cx="12" cy="12" r="4" stroke={selectedPlatform === 'Instagram' ? 'white' : '#E4405F'} strokeWidth="2" fill="none"/>
                    <circle cx="17.5" cy="6.5" r="1.5" fill={selectedPlatform === 'Instagram' ? 'white' : '#E4405F'}/>
                  </svg>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: selectedPlatform === 'Instagram' ? 'white' : '#1A1A2E' }}>Instagram</span>
                </button>

                {/* Facebook */}
                <button
                  onClick={() => setSelectedPlatform('Facebook')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: selectedPlatform === 'Facebook' ? 'none' : '2px solid #E5E7EB',
                    background: selectedPlatform === 'Facebook' 
                      ? '#1877F2' 
                      : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedPlatform === 'Facebook' ? '0 4px 15px rgba(24, 119, 242, 0.4)' : 'none'
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={selectedPlatform === 'Facebook' ? 'white' : '#1877F2'}>
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: selectedPlatform === 'Facebook' ? 'white' : '#1A1A2E' }}>Facebook</span>
                </button>

                {/* TikTok */}
                <button
                  onClick={() => setSelectedPlatform('TikTok')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: selectedPlatform === 'TikTok' ? 'none' : '2px solid #E5E7EB',
                    background: selectedPlatform === 'TikTok' 
                      ? 'linear-gradient(135deg, #00F2EA, #FF0050)' 
                      : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedPlatform === 'TikTok' ? '0 4px 15px rgba(0, 0, 0, 0.3)' : 'none'
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={selectedPlatform === 'TikTok' ? 'white' : '#000'}>
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: selectedPlatform === 'TikTok' ? 'white' : '#1A1A2E' }}>TikTok</span>
                </button>

                {/* LinkedIn */}
                <button
                  onClick={() => setSelectedPlatform('LinkedIn')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: selectedPlatform === 'LinkedIn' ? 'none' : '2px solid #E5E7EB',
                    background: selectedPlatform === 'LinkedIn' 
                      ? '#0A66C2' 
                      : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedPlatform === 'LinkedIn' ? '0 4px 15px rgba(10, 102, 194, 0.4)' : 'none'
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={selectedPlatform === 'LinkedIn' ? 'white' : '#0A66C2'}>
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: selectedPlatform === 'LinkedIn' ? 'white' : '#1A1A2E' }}>LinkedIn</span>
                </button>
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#1A1A2E', fontSize: '14px', marginBottom: '12px' }}>
                <SquareIcon size={16} color="#1A1A2E" />
                Format
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSelectedFormat('carre')}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: `2px solid ${selectedFormat === 'carre' ? '#1a3a5c' : '#E5E7EB'}`,
                    backgroundColor: selectedFormat === 'carre' ? '#1a3a5c20' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    flex: '1'
                  }}
                >
                  <div style={{ width: '24px', height: '24px', border: `2px solid ${selectedFormat === 'carre' ? '#1a3a5c' : '#888'}`, borderRadius: '4px' }}></div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: '#1A1A2E' }}>Carré</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>1080×1080</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedFormat('story')}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: `2px solid ${selectedFormat === 'story' ? '#1a3a5c' : '#E5E7EB'}`,
                    backgroundColor: selectedFormat === 'story' ? '#1a3a5c20' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    flex: '1'
                  }}
                >
                  <div style={{ width: '16px', height: '24px', border: `2px solid ${selectedFormat === 'story' ? '#1a3a5c' : '#888'}`, borderRadius: '3px' }}></div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: '#1A1A2E' }}>Story</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>1080×1920</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Section Photo Upload */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#1A1A2E', fontSize: '14px', marginBottom: '12px' }}>
              <CameraIcon size={16} color="#1A1A2E" />
              Ajouter une photo (optionnel)
            </span>

            {!uploadedPhoto ? (
              <div
                onClick={() => photoInputRef.current?.click()}
                style={{
                  border: '2px dashed #E5E7EB',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#FAFBFC',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 8px',
                  backgroundColor: '#e8f4fd',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UploadIcon size={24} color="#1a3a5c" />
                </div>
                <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                  Cliquez pour ajouter une photo
                </p>
                <p style={{ color: '#999', fontSize: '11px', marginTop: '4px' }}>
                  L'IA peut l'utiliser directement ou s'en inspirer
                </p>
              </div>
            ) : (
              <div>
                {/* Preview photo */}
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <img
                    src={uploadedPhoto}
                    alt="Upload"
                    style={{
                      width: '100%',
                      maxHeight: '150px',
                      objectFit: 'cover',
                      borderRadius: '12px'
                    }}
                  />
                  <button
                    onClick={removeUploadedPhoto}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      color: 'white',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >×</button>
                </div>

                {/* Mode selection */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPhotoMode('direct')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: `2px solid ${photoMode === 'direct' ? '#10B981' : '#E5E7EB'}`,
                      backgroundColor: photoMode === 'direct' ? '#D1FAE5' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>
                      <ImageIcon size={20} color={photoMode === 'direct' ? '#10B981' : '#666'} />
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#1A1A2E' }}>Utiliser directement</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>Cette photo sera le post</div>
                  </button>
                  <button
                    onClick={() => setPhotoMode('inspiration')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: `2px solid ${photoMode === 'inspiration' ? '#2d5a45' : '#E5E7EB'}`,
                      backgroundColor: photoMode === 'inspiration' ? '#EDE9FE' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>
                      <SparklesIcon size={20} color={photoMode === 'inspiration' ? '#2d5a45' : '#666'} />
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#1A1A2E' }}>Inspiration</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>L'IA s'inspire du style</div>
                  </button>
                </div>

                {photoMode === null && (
                  <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '8px', textAlign: 'center' }}>
                    Veuillez choisir comment utiliser cette photo
                  </p>
                )}
              </div>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* Section Logo */}
          {business?.logo_url && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: '700', color: '#1A1A2E', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TagIcon size={16} color="#1A1A2E" />
                  Ajouter votre logo
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={addLogo}
                    onChange={(e) => {
                      setAddLogo(e.target.checked);
                      if (e.target.checked) setShowLogoOptions(true);
                    }}
                    style={{ width: '18px', height: '18px', accentColor: '#10B981' }}
                  />
                  <span style={{ fontSize: '13px', color: '#666' }}>Activer</span>
                </label>
              </div>

              {addLogo && (
                <div style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #E5E7EB'
                }}>
                  {/* Preview logo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <img
                      src={business.logo_url}
                      alt="Logo"
                      style={{
                        width: '50px',
                        height: '50px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        padding: '4px'
                      }}
                    />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A2E', margin: 0 }}>
                        Logo de {business.business_name}
                      </p>
                      <p style={{ fontSize: '11px', color: '#888', margin: '2px 0 0' }}>
                        Récupéré depuis votre Moodboard
                      </p>
                    </div>
                  </div>

                  {/* Position Grid */}
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                      Position
                    </span>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '4px',
                      width: '120px',
                      margin: '0 auto'
                    }}>
                      {(['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'] as LogoPosition[]).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setLogoPosition(pos)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '6px',
                            border: `2px solid ${logoPosition === pos ? '#10B981' : '#E5E7EB'}`,
                            backgroundColor: logoPosition === pos ? '#D1FAE5' : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px'
                          }}
                        >
                          {logoPosition === pos && <CheckIcon size={12} color="white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size Selection */}
                  <div>
                    <span style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                      Taille
                    </span>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {([
                        { value: 'small', label: 'Petit', size: '24px' },
                        { value: 'medium', label: 'Moyen', size: '32px' },
                        { value: 'large', label: 'Grand', size: '40px' }
                      ] as { value: LogoSize; label: string; size: string }[]).map((s) => (
                        <button
                          key={s.value}
                          onClick={() => setLogoSize(s.value)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: `2px solid ${logoSize === s.value ? '#10B981' : '#E5E7EB'}`,
                            backgroundColor: logoSize === s.value ? '#D1FAE5' : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <div style={{
                            width: s.size,
                            height: s.size,
                            backgroundColor: '#1a3a5c',
                            borderRadius: '4px'
                          }} />
                          <span style={{ fontSize: '11px', color: '#666' }}>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bouton Générer Image */}
          <button
            onClick={handleGenerateImage}
            disabled={generatingImage || !imageDescription.trim() || (uploadedPhoto && photoMode === null)}
            style={{
              width: '100%',
              padding: '14px',
              background: generatingImage ? '#E5E7EB' : 'linear-gradient(135deg, #c84b31, #e06b4f)',
              border: 'none',
              borderRadius: '12px',
              color: generatingImage ? '#999' : 'white',
              fontWeight: '700',
              cursor: generatingImage ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: generatingImage ? 'none' : '0 4px 15px rgba(200, 75, 49, 0.3)'
            }}
          >
            {generatingImage ? (
              <><LoaderIcon size={16} color="#999" /> Génération en cours...</>
            ) : (
              <><SparklesIcon size={16} color="white" /> Générer l'image</>
            )}
          </button>
        </div>
        </>
        )}

        {/* Error Messages */}
        {error && (
          <div style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            padding: '14px 20px',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertIcon size={18} color="#DC2626" />
            {error}
          </div>
        )}

        {/* Section Textes Générés - Onglet TEXTE */}
        {activeTab === 'texte' && (
          <>
          {/* Bannière événement si applicable */}
          {eventTitle && (
            <div style={{
              background: 'linear-gradient(135deg, #2d5a45, #3d7a5f)',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 15px rgba(45, 90, 69, 0.3)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CalendarIcon size={20} color="white" />
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: '700', fontSize: '15px', margin: 0 }}>
                  {eventTitle}
                </p>
                {eventDate && (
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: '4px 0 0' }}>
                    {new Date(eventDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Description de la légende */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid #DCE8F5'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#1A1A2E', fontSize: '16px', marginBottom: '12px' }}>
              <TextIcon size={18} color="#1a3a5c" />
              Décrivez votre légende
            </label>
            <textarea
              value={textDescription}
              onChange={(e) => setTextDescription(e.target.value)}
              placeholder="Ex: Je veux promouvoir mon plat du jour, une daube de sanglier. Mentionner le prix (18€) et que c'est fait maison."
              rows={3}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                fontSize: '15px',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                lineHeight: '1.6',
                transition: 'all 0.3s ease',
                marginBottom: '16px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#1a3a5c';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(26, 58, 92, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={handleGenerateText}
              disabled={generating || !textDescription.trim()}
              style={{
                width: '100%',
                padding: '14px',
                background: generating ? '#E5E7EB' : 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
                border: 'none',
                borderRadius: '12px',
                color: generating ? '#999' : 'white',
                fontWeight: '700',
                cursor: generating ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: generating ? 'none' : '0 4px 15px rgba(26, 58, 92, 0.3)'
              }}
            >
              {generating ? (
                <><LoaderIcon size={16} color="#999" /> Génération en cours...</>
              ) : (
                <><SparklesIcon size={16} color="white" /> Générer les légendes</>
              )}
            </button>
          </div>

        {/* Résultats des légendes */}
        <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid #DCE8F5',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
              <span style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}><TextIcon size={20} color="#1a3a5c" /></span>
              Légendes Générées
            </h3>

            {generatedTexts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 16px',
                color: '#999',
                background: 'linear-gradient(135deg, #e8f4fd, #FFFFFF)',
                borderRadius: '12px',
                border: '2px dashed #DCE8F5'
              }}>
                <div style={{ width: '56px', height: '56px', margin: '0 auto 12px', backgroundColor: '#e8f4fd', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TextIcon size={28} color="#1a3a5c" />
                </div>
                <p style={{ fontSize: '14px', fontWeight: '500' }}>Les textes apparaîtront ici</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {editedTexts.map((text, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedVersion(index)}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      border: `2px solid ${selectedVersion === index ? '#1a3a5c' : '#E5E7EB'}`,
                      backgroundColor: selectedVersion === index ? '#1a3a5c08' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{
                        padding: '3px 10px',
                        backgroundColor: index === 0 ? '#10B98120' : index === 1 ? '#1a3a5c20' : '#2d5a4520',
                        color: index === 0 ? '#10B981' : index === 1 ? '#1a3a5c' : '#2d5a45',
                        borderRadius: '50px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {index === 0 ? 'Courte' : index === 1 ? 'Moyenne' : 'Longue'}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {editedTexts[index] !== generatedTexts[index] && (
                          <span style={{
                            backgroundColor: '#FEF3C7',
                            color: '#D97706',
                            padding: '3px 8px',
                            borderRadius: '50px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            Modifié
                          </span>
                        )}
                        {selectedVersion === index && (
                          <span style={{ backgroundColor: '#1a3a5c', color: 'white', padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '600' }}>
                            Sélectionnée
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Textarea éditable quand sélectionné */}
                    {selectedVersion === index ? (
                      <textarea
                        value={text}
                        onChange={(e) => handleTextEdit(index, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          minHeight: '120px',
                          padding: '12px',
                          border: '2px solid #1a3a5c',
                          borderRadius: '8px',
                          fontSize: '13px',
                          lineHeight: '1.6',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          backgroundColor: 'white',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                    ) : (
                      <p style={{
                        color: '#444',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {text}
                      </p>
                    )}
                  </div>
                ))}

                {/* Boutons d'action */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleCopyText}
                    disabled={selectedVersion === null}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: selectedVersion !== null ? 'linear-gradient(135deg, #10B981, #34D399)' : '#E5E7EB',
                      border: 'none',
                      borderRadius: '10px',
                      color: selectedVersion !== null ? 'white' : '#999',
                      fontWeight: '600',
                      cursor: selectedVersion !== null ? 'pointer' : 'not-allowed',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <CopyIcon size={14} color="#666" /> Copier
                  </button>
                  <button
                    onClick={handleRegenerateText}
                    disabled={generating}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: generating ? '#E5E7EB' : 'linear-gradient(135deg, #2d5a45, #3d7a5f)',
                      border: 'none',
                      borderRadius: '10px',
                      color: generating ? '#999' : 'white',
                      fontWeight: '600',
                      cursor: generating ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    {generating ? <><LoaderIcon size={14} color="#999" /> Génération...</> : <><RefreshIcon size={14} color="#666" /> Régénérer</>}
                  </button>
                </div>

                {/* Astuce édition */}
                <p style={{
                  fontSize: '11px',
                  color: '#888',
                  textAlign: 'center',
                  margin: '4px 0 0'
                }}>
                  Cliquez sur un texte pour le sélectionner et le modifier directement
                </p>
              </div>
            )}
          </div>
          </>
        )}

          {/* Image Générée - Onglet IMAGE */}
          {activeTab === 'image' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid #DCE8F5'
          }}>
            <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
              <span style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}><PaletteIcon size={16} color="white" /></span>
              Image Générée
            </h3>

            {imageError && (
              <div style={{
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                padding: '10px',
                borderRadius: '10px',
                marginBottom: '12px',
                fontSize: '13px'
              }}>
                <AlertIcon size={16} color="#DC2626" /> {imageError}
              </div>
            )}

            {!generatedImage ? (
              <div style={{
                aspectRatio: '1/1',
                maxWidth: '300px',
                width: '100%',
                margin: '0 auto',
                background: 'linear-gradient(135deg, #FFF8E7, #e8f4fd)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                border: '2px dashed #DCE8F5'
              }}>
                <span style={{
                  fontSize: '42px',
                  fontFamily: "'Titan One', cursive",
                  color: '#C84B31',
                  marginBottom: '12px'
                }}>AiNa</span>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A2E' }}>En attente de vos ordres, chef !</p>
              </div>
            ) : (
              <div>
                <div style={{
                  aspectRatio: selectedFormat === 'carre' ? '1/1' : selectedFormat === 'story' ? '9/16' : '16/9',
                  maxHeight: '300px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                  marginBottom: '12px',
                  position: 'relative'
                }}>
                  <img src={generatedImage} alt="Generated" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                  {/* Logo Overlay */}
                  {addLogo && business?.logo_url && (
                    <div style={{
                      position: 'absolute',
                      ...getLogoPositionStyle(logoPosition),
                      zIndex: 10
                    }}>
                      <img
                        src={business.logo_url}
                        alt="Logo"
                        style={{
                          width: `${getLogoSizePixels(logoSize)}px`,
                          height: `${getLogoSizePixels(logoSize)}px`,
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                        }}
                      />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button
                    onClick={() => setShowImageEditor(true)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      boxShadow: '0 4px 15px rgba(200, 75, 49, 0.3)'
                    }}
                  >
                    <EditIcon size={14} color="white" /> Ajouter du texte
                  </button>
                  <button
                    onClick={handleGenerateImage}
                    disabled={generatingImage}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: generatingImage ? '#E5E7EB' : 'linear-gradient(135deg, #2d5a45, #3d7a5f)',
                      border: 'none',
                      borderRadius: '10px',
                      color: generatingImage ? '#999' : 'white',
                      fontWeight: '600',
                      cursor: generatingImage ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      boxShadow: generatingImage ? 'none' : '0 4px 15px rgba(45, 90, 69, 0.3)'
                    }}
                  >
                    {generatingImage ? <><LoaderIcon size={14} color="#999" /> Génération...</> : <><RefreshIcon size={14} color="white" /> Régénérer</>}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleDownloadImage}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'linear-gradient(135deg, #10B981, #34D399)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <DownloadIcon size={14} color="white" /> Télécharger
                  </button>
                  <button
                    onClick={handleSavePost}
                    disabled={saving || saved}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: saved
                        ? 'linear-gradient(135deg, #10B981, #34D399)'
                        : 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      opacity: saving ? 0.7 : 1,
                      boxShadow: saved ? '0 4px 15px rgba(16, 185, 129, 0.3)' : '0 4px 15px rgba(26, 58, 92, 0.3)'
                    }}
                  >
                    {saving ? <><LoaderIcon size={14} color="#999" /> Sauvegarde...</> : saved ? <><CheckIcon size={14} color="white" /> Sauvegardé !</> : <><SaveIcon size={14} color="white" /> Sauvegarder</>}
                  </button>
                </div>

                {/* Zone de conversation pour modifier l'image */}
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <p style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#1A1A2E',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <SparklesIcon size={14} color="#8B5CF6" />
                      Modifier l'image
                    </p>
                    <button
                      onClick={handleResetImage}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#DC2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RefreshIcon size={12} color="#DC2626" />
                      Recommencer
                    </button>
                  </div>

                  {/* Historique de conversation */}
                  {imageConversation.length > 0 && (
                    <div style={{
                      maxHeight: '150px',
                      overflowY: 'auto',
                      marginBottom: '12px',
                      padding: '8px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB'
                    }}>
                      {imageConversation.filter(msg => msg.role === 'user').map((msg, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '6px 10px',
                            marginBottom: index < imageConversation.filter(m => m.role === 'user').length - 1 ? '6px' : 0,
                            backgroundColor: '#EEF2FF',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#4F46E5'
                          }}
                        >
                          {msg.content}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input de modification */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={modificationInput}
                      onChange={(e) => setModificationInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !generatingImage && handleModifyImage()}
                      placeholder="Ex: Ajoute plus de lumière, change les couleurs..."
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        border: '2px solid #E5E7EB',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={handleModifyImage}
                      disabled={generatingImage || !modificationInput.trim()}
                      style={{
                        padding: '12px 16px',
                        background: generatingImage || !modificationInput.trim()
                          ? '#E5E7EB'
                          : 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                        border: 'none',
                        borderRadius: '10px',
                        color: generatingImage || !modificationInput.trim() ? '#999' : 'white',
                        fontWeight: '600',
                        cursor: generatingImage || !modificationInput.trim() ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px'
                      }}
                    >
                      {generatingImage ? <LoaderIcon size={14} color="#999" /> : <SparklesIcon size={14} color="white" />}
                      Modifier
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: '#888', marginTop: '8px', margin: '8px 0 0' }}>
                    Demandez des modifications et l'IA ajustera l'image existante
                  </p>
                </div>

                {/* Bouton Affilier à l'événement OU Planifier */}
                {eventId ? (
                  <button
                    onClick={handleAffiliateToEvent}
                    disabled={affiliating || affiliated}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: affiliated
                        ? 'linear-gradient(135deg, #10B981, #34D399)'
                        : 'linear-gradient(135deg, #1a3a5c, #2d5a7c)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: affiliating || affiliated ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      marginTop: '10px',
                      boxShadow: affiliated ? '0 4px 15px rgba(16, 185, 129, 0.3)' : '0 4px 15px rgba(26, 58, 92, 0.3)'
                    }}
                  >
                    {affiliating ? (
                      <><LoaderIcon size={14} color="white" /> Affiliation...</>
                    ) : affiliated ? (
                      <><CheckIcon size={14} color="white" /> Affilié à l'événement !</>
                    ) : (
                      <><CalendarIcon size={14} color="white" /> Affilier à "{eventTitle}"</>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    disabled={scheduled}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: scheduled
                        ? 'linear-gradient(135deg, #10B981, #34D399)'
                        : 'linear-gradient(135deg, #c84b31, #e06b4f)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      marginTop: '10px',
                      boxShadow: scheduled ? '0 4px 15px rgba(16, 185, 129, 0.3)' : '0 4px 15px rgba(200, 75, 49, 0.3)'
                    }}
                  >
                    {scheduled ? <><CheckIcon size={14} color="white" /> Planifié !</> : <><CalendarIcon size={14} color="white" /> Planifier dans le calendrier</>}
                  </button>
                )}

                {/* Bouton Sauvegarder comme template */}
                <button
                  onClick={() => setShowTemplateModal(true)}
                  disabled={templateSaved}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: templateSaved
                      ? 'linear-gradient(135deg, #10B981, #34D399)'
                      : 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    marginTop: '10px',
                    boxShadow: templateSaved ? '0 4px 15px rgba(16, 185, 129, 0.3)' : '0 4px 15px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  {templateSaved ? <><CheckIcon size={14} color="white" /> Template sauvegardé !</> : <>📋 Sauvegarder comme template</>}
                </button>

                {saved && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#D1FAE5',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#065F46',
                    textAlign: 'center'
                  }}>
                    ✅ Post sauvegardé ! L'IA s'en inspirera pour vos futurs posts.
                  </div>
                )}

                {affiliated && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#DBEAFE',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#1E40AF',
                    textAlign: 'center'
                  }}>
                    ✅ Post affilié à l'événement "{eventTitle}" ! Retrouvez-le dans votre calendrier.
                  </div>
                )}
              </div>
            )}
          </div>
          )}

        {/* Indicateur d'historique */}
        {savedPosts.length > 0 && (
          <div style={{
            backgroundColor: '#e8f4fd',
            borderRadius: '12px',
            padding: '12px 16px',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <SparklesIcon size={18} color="#1a3a5c" />
            <p style={{ fontSize: '12px', color: '#1a3a5c', margin: 0 }}>
              L'IA s'inspire de vos {savedPosts.length} post(s) précédent(s) pour maintenir votre style
            </p>
          </div>
        )}
          </>
        )}
      </main>

      {/* Modal de planification */}
      {showScheduleModal && (
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
            backgroundColor: '#FFF8E7',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '380px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            border: '2px solid #c84b31'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CalendarIcon size={20} color="white" />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>
                Planifier ce post
              </h2>
            </div>

            {/* Aperçu du post */}
            {generatedImage && (
              <div style={{
                marginBottom: '16px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #E5E7EB'
              }}>
                <img
                  src={generatedImage}
                  alt="Aperçu"
                  style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Sélection de la date */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1A1A2E',
                marginBottom: '8px'
              }}>
                Date de publication
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '2px solid #E5E7EB',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              />
            </div>

            {/* Heure de publication */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1A1A2E',
                marginBottom: '8px'
              }}>
                Heure de publication
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '2px solid #E5E7EB',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              />
            </div>

            {/* Plateforme sélectionnée */}
            <div style={{
              padding: '12px',
              backgroundColor: '#e8f4fd',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#1a3a5c'
            }}>
              <strong>Plateforme:</strong> {selectedPlatform || 'Non spécifiée'}
              {selectedVersion !== null && editedTexts[selectedVersion] && (
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#666' }}>
                  {editedTexts[selectedVersion].substring(0, 80)}...
                </p>
              )}
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  color: '#666',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSchedulePost}
                disabled={!scheduleDate || scheduling}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: !scheduleDate ? '#ccc' : 'linear-gradient(135deg, #c84b31, #e06b4f)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: !scheduleDate || scheduling ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {scheduling ? <><LoaderIcon size={14} color="white" /> Planification...</> : 'Planifier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sauvegarder comme template */}
      {showTemplateModal && (
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
            backgroundColor: '#FFF8E7',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '380px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            border: '2px solid #8B5CF6'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '20px' }}>📋</span>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>
                Sauvegarder comme template
              </h2>
            </div>

            {/* Aperçu du post */}
            {generatedImage && (
              <div style={{
                marginBottom: '16px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #E5E7EB'
              }}>
                <img
                  src={generatedImage}
                  alt="Aperçu"
                  style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Nom du template */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1A1A2E',
                marginBottom: '8px'
              }}>
                Nom du template *
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Promo du weekend, Nouveau produit..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '2px solid #E5E7EB',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              />
            </div>

            {/* Catégorie */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1A1A2E',
                marginBottom: '8px'
              }}>
                Catégorie
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {templateCategories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setTemplateCategory(cat.value)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '50px',
                      border: templateCategory === cat.value ? 'none' : '2px solid #E5E7EB',
                      background: templateCategory === cat.value
                        ? 'linear-gradient(135deg, #8B5CF6, #A78BFA)'
                        : 'white',
                      color: templateCategory === cat.value ? 'white' : '#374151',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div style={{
              padding: '12px',
              backgroundColor: '#F3E8FF',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '12px',
              color: '#6B21A8'
            }}>
              💡 Ce template sauvegardera l'image, la légende et les paramètres pour une réutilisation rapide.
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setTemplateName('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  color: '#666',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAsTemplate}
                disabled={!templateName.trim() || savingTemplate}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: !templateName.trim() ? '#ccc' : 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: !templateName.trim() || savingTemplate ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {savingTemplate ? <><LoaderIcon size={14} color="white" /> Sauvegarde...</> : '📋 Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * {
          box-sizing: border-box;
        }

        html, body {
          overflow-x: hidden;
          max-width: 100vw;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        textarea::placeholder {
          color: #999;
        }
        
        /* MOBILE RESPONSIVE */
        @media (max-width: 768px) {
          /* Header - full width */
          header > div {
            padding: 12px 16px !important;
            max-width: 100% !important;
          }
          
          /* Main - full width */
          .main-content {
            padding: 12px !important;
            max-width: 100% !important;
          }
          
          /* Cacher texte logo sur très petit écran */
          .logo-text {
            display: none;
          }
          
          /* Banner */
          .banner {
            padding: 16px !important;
            border-radius: 12px !important;
          }
          
          .banner h1 {
            font-size: 16px !important;
          }
          
          .banner p {
            font-size: 12px !important;
          }
          
          /* Section title */
          h2 {
            font-size: 16px !important;
          }
          
          /* Textarea */
          textarea {
            font-size: 14px !important;
          }
          
          /* Grid plateforme/format -> 1 colonne */
          .options-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          
          /* Boutons plateforme en colonne */
          .platforms-container {
            flex-direction: column !important;
            gap: 12px !important;
          }
          
          .platforms-container > button {
            width: 100% !important;
            justify-content: center !important;
          }
          
          /* Boutons format */
          .formats-grid {
            grid-template-columns: 1fr !important;
          }
          
          /* Boutons action */
          .actions-container {
            flex-direction: column !important;
            gap: 12px !important;
          }
          
          .actions-container > button {
            width: 100% !important;
          }
          
          /* Résultats en 1 colonne */
          .results-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
        
        @media (max-width: 480px) {
          main > div:first-child h1 {
            font-size: 18px !important;
          }
        }
      `}</style>

      {/* Image Editor Modal */}
      {showImageEditor && generatedImage && (
        <ImageEditor
          imageUrl={generatedImage}
          businessName={business?.business_name}
          onSave={(editedImageUrl) => {
            setGeneratedImage(editedImageUrl);
            setShowImageEditor(false);
          }}
          onCancel={() => setShowImageEditor(false)}
        />
      )}
    </div>
  );
}

export default CreatePost;
