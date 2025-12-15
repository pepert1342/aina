import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import AddressAutocomplete from '../components/AddressAutocomplete';
import {
  HomeIcon, SparklesIcon, CheckIcon, LoaderIcon, UploadIcon, SaveIcon,
  TagIcon, ImageIcon, CameraIcon, PlusIcon, LockIcon, MailIcon, StoreIcon, MapPinIcon,
  DiamondIcon, LogoutIcon, CalendarIcon, PaletteIcon, LightbulbIcon, TrendingUpIcon
} from '../components/Icons';
import { NotificationBell } from '../components/Notifications';

interface Business {
  id: string;
  business_name: string;
  business_type: string;
  tone: string;
  address?: string;
  platforms?: string[];
  logo_url?: string;
  photos?: string[];
  keywords?: string[];
  preferred_style?: string;
}

// Composants SVG pour les réseaux sociaux
const InstagramIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TikTokIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

const LinkedInIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

function Moodboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [tone, setTone] = useState('');
  const [address, setAddress] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [preferredStyle, setPreferredStyle] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [uploading, setUploading] = useState(false);

  // Phase 2: Sécurité - champs verrouillés après onboarding
  const [isLocked, setIsLocked] = useState(false);
  const [showUnlockRequest, setShowUnlockRequest] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  // Champ pour type personnalisé (quand "Autre" est sélectionné)
  const [customBusinessType, setCustomBusinessType] = useState('');

  // On garde les emojis pour Type et Ton comme demandé
  const businessTypes = [
    { value: 'Restaurant', icon: '🍽️' },
    { value: 'Bar', icon: '🍸' },
    { value: 'Boulangerie', icon: '🥐' },
    { value: 'Coiffeur', icon: '💇' },
    { value: 'Esthétique', icon: '💅' },
    { value: 'Boutique', icon: '🛍️' },
    { value: 'Agence immobilière', icon: '🏠' },
    { value: 'Autre', icon: '🏪' }
  ];

  const tones = [
    { value: 'Professionnel', icon: '👔', color: '#1a3a5c' },
    { value: 'Familial', icon: '👨‍👩‍👧‍👦', color: '#10B981' },
    { value: 'Jeune', icon: '🎉', color: '#c84b31' },
    { value: 'Luxe', icon: '✨', color: '#2d5a45' },
    { value: 'Humour', icon: '😄', color: '#F59E0B' }
  ];

  // Plateformes avec vrais logos SVG
  const platformsList = [
    { value: 'Instagram', Icon: InstagramIcon, color: '#E4405F', gradient: 'linear-gradient(135deg, #833AB4, #E4405F, #FFDC80)' },
    { value: 'Facebook', Icon: FacebookIcon, color: '#1877F2', gradient: '#1877F2' },
    { value: 'TikTok', Icon: TikTokIcon, color: '#000000', gradient: 'linear-gradient(135deg, #00F2EA, #FF0050)' },
    { value: 'LinkedIn', Icon: LinkedInIcon, color: '#0A66C2', gradient: '#0A66C2' }
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
    await loadBusiness(session.user.id);

    // Charger l'abonnement
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .maybeSingle();
    setSubscription(subData);

    setLoading(false);
    setTimeout(() => setIsVisible(true), 100);
  };

  const loadBusiness = async (userId: string) => {
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setBusiness(data);
      setBusinessName(data.business_name || '');

      // Vérifier si le type est dans la liste prédéfinie
      const predefinedTypes = ['Restaurant', 'Bar', 'Boulangerie', 'Coiffeur', 'Esthétique', 'Boutique', 'Agence immobilière', 'Autre'];
      if (data.business_type && !predefinedTypes.includes(data.business_type)) {
        // C'est un type personnalisé
        setBusinessType('Autre');
        setCustomBusinessType(data.business_type);
      } else {
        setBusinessType(data.business_type || '');
      }

      setTone(data.tone || '');
      setAddress(data.address || '');
      setPlatforms(data.platforms || []);
      setPreferredStyle(data.preferred_style || '');
      setLogo(data.logo_url || null);
      setPhotos(data.photos || []);
      setKeywords(data.keywords || []);
      // Verrouiller si le profil est complet (onboarding terminé)
      const isComplete = data.business_name && data.business_type && data.tone;
      setIsLocked(isComplete);
    }
  };

  const togglePlatform = (platform: string) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  // Upload vers Supabase Storage
  const uploadToStorage = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${path}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('business-assets')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('business-assets')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setUploading(true);
        const url = await uploadToStorage(file, 'logos');
        setLogo(url);
      } catch (err: any) {
        // Fallback to base64 if storage fails
        const reader = new FileReader();
        reader.onloadend = () => setLogo(reader.result as string);
        reader.readAsDataURL(file);
      } finally {
        setUploading(false);
      }
    }
  };

  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploading(true);
      const newPhotos: string[] = [];

      for (const file of Array.from(files)) {
        try {
          const url = await uploadToStorage(file, 'photos');
          newPhotos.push(url);
        } catch (err) {
          // Fallback to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            setPhotos(prev => [...prev, reader.result as string].slice(0, 9));
          };
          reader.readAsDataURL(file);
        }
      }

      if (newPhotos.length > 0) {
        setPhotos(prev => [...prev, ...newPhotos].slice(0, 9));
      }
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords(prev => [...prev, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(prev => prev.filter((_, i) => i !== index));
  };

  // Obtenir le type de commerce final (personnalisé si "Autre")
  const getFinalBusinessType = () => {
    if (businessType === 'Autre' && customBusinessType.trim()) {
      return customBusinessType.trim();
    }
    return businessType;
  };

  const handleSave = async () => {
    if (!user || !business) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          business_name: businessName,
          business_type: getFinalBusinessType(),
          tone: tone,
          address: address || null,
          platforms: platforms.length > 0 ? platforms : null,
          logo_url: logo,
          photos: photos,
          keywords: keywords
        })
        .eq('id', business.id);

      if (error) throw error;
      setSuccessMessage('Modifications enregistrées !');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

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
        backdropFilter: 'blur(10px)',
        width: '100%'
      }}>
        <div style={{
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            <span style={{
              fontSize: '28px',
              fontFamily: "'Titan One', cursive",
              color: '#C84B31'
            }}>AiNa</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {user && <NotificationBell userId={user.id} />}
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: '0 4px 15px rgba(26, 58, 92, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            ><HomeIcon size={14} color="white" /> Accueil</button>

            {/* Menu Profil */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
                  border: 'none',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(200, 75, 49, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                P
              </button>

              {showUserMenu && (
                <>
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 99
                    }}
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '48px',
                    right: 0,
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    padding: '8px',
                    minWidth: '220px',
                    zIndex: 100,
                    border: '1px solid #E5E7EB'
                  }}>
                    <div style={{
                      padding: '12px',
                      borderBottom: '1px solid #E5E7EB',
                      marginBottom: '8px'
                    }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A2E', margin: 0 }}>
                        {user?.email}
                      </p>
                      <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0' }}>
                        {subscription ? `Abonnement ${subscription.plan === 'yearly' ? 'Annuel' : 'Mensuel'}` : 'Aucun abonnement'}
                      </p>
                    </div>

                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/subscription'); }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <DiamondIcon size={18} color="#2d5a45" />
                      Mon abonnement
                    </button>

                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/create'); }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <PlusIcon size={18} color="#c84b31" />
                      Nouveau Post
                    </button>

                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/calendar'); }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <CalendarIcon size={18} color="#1a3a5c" />
                      Calendrier
                    </button>

                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/moodboard'); }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#e8f5e9',
                        border: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#2d5a45',
                        fontWeight: '600'
                      }}
                    >
                      <PaletteIcon size={18} color="#2d5a45" />
                      Moodboard
                    </button>

                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/dashboard?tab=posts'); }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <ImageIcon size={18} color="#8B5CF6" />
                      Mes Posts
                    </button>

                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/dashboard?tab=tips'); }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <LightbulbIcon size={18} color="#2d5a45" />
                      Tips & Conseils
                    </button>

                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/dashboard?tab=stats'); }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <TrendingUpIcon size={18} color="#8B5CF6" />
                      Statistiques
                    </button>

                    <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '8px 0' }} />

                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#DC2626',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <LogoutIcon size={18} color="#DC2626" />
                      Déconnexion
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{
        padding: '16px',
        maxWidth: '600px',
        margin: '0 auto',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out'
      }}>
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #2d5a45, #3d7a5f)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 10px 40px rgba(45, 90, 69, 0.3)'
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
              <PaletteIcon size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>
                Moodboard
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', marginTop: '2px' }}>
                Personnalisez l'identité visuelle de {business?.business_name}
              </p>
            </div>
          </div>
        </div>

        {/* Success */}
        {successMessage && (
          <div style={{
            backgroundColor: '#D1FAE5',
            border: '1px solid #A7F3D0',
            color: '#059669',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}><CheckIcon size={16} color="#059669" /> {successMessage}</div>
        )}

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Logo */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '16px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TagIcon size={18} color="#c84b31" /> Logo de l'entreprise
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                onClick={() => logoInputRef.current?.click()}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '16px',
                  border: logo ? 'none' : '2px dashed #D1D5DB',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: logo ? 'transparent' : '#F9FAFB',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  boxShadow: logo ? '0 4px 15px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {logo ? (
                  <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <CameraIcon size={28} color="#9CA3AF" />
                )}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '600', fontSize: '14px', color: '#1A1A2E', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {uploading ? (
                    <><LoaderIcon size={14} color="#c84b31" /> Upload en cours...</>
                  ) : logo ? (
                    <><CheckIcon size={14} color="#10B981" /> Logo importé</>
                  ) : (
                    <><UploadIcon size={14} color="#1a3a5c" /> Ajouter un logo</>
                  )}
                </p>
                <p style={{ fontSize: '12px', color: '#6B7280' }}>PNG, JPG (max 2MB)</p>
              </div>
            </div>
          </div>

          {/* Style IA (lecture seule) */}
          {preferredStyle && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              border: '1px solid #E5E7EB'
            }}>
              <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SparklesIcon size={18} color="#2d5a45" /> Style IA préféré
              </h3>
              <div style={{
                padding: '14px 16px',
                background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid #DDD6FE'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: 'linear-gradient(135deg, #2d5a45, #A78BFA)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <SparklesIcon size={18} color="white" />
                </div>
                <div>
                  <p style={{ fontWeight: '600', fontSize: '14px', color: '#5B21B6', margin: 0 }}>
                    {preferredStyle}
                  </p>
                  <p style={{ fontSize: '11px', color: '#7C3AED', margin: '2px 0 0' }}>
                    Défini lors du calibrage initial
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Infos */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: '700', color: '#1A1A2E', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <StoreIcon size={18} color="#1a3a5c" /> Informations
              </h3>
              {isLocked && (
                <span style={{
                  padding: '5px 12px',
                  background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                  color: '#B45309',
                  borderRadius: '50px',
                  fontSize: '11px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: '1px solid #FCD34D'
                }}>
                  <LockIcon size={12} color="#B45309" /> Verrouillé
                </span>
              )}
            </div>

            {/* Alerte si verrouillé */}
            {isLocked && (
              <div style={{
                background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                border: '1px solid #FCD34D',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#F59E0B',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <LockIcon size={18} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', color: '#92400E', margin: 0, fontWeight: '600' }}>
                    Profil verrouillé
                  </p>
                  <p style={{ fontSize: '12px', color: '#A16207', margin: '4px 0 10px' }}>
                    Le nom de l'établissement est protégé après l'onboarding.
                  </p>
                  <button
                    onClick={() => setShowUnlockRequest(true)}
                    style={{
                      padding: '8px 14px',
                      background: 'linear-gradient(135deg, #D97706, #F59E0B)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)'
                    }}
                  >
                    Demander une modification
                  </button>
                </div>
              </div>
            )}

            {/* Modal demande de modification */}
            {showUnlockRequest && (
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
                zIndex: 1000,
                padding: '20px'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  padding: '28px',
                  maxWidth: '400px',
                  width: '100%',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A2E', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MailIcon size={20} color="#1a3a5c" /> Demande de modification
                  </h3>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                    Pour modifier le nom de votre établissement, veuillez contacter le support :
                  </p>
                  <div style={{
                    background: 'linear-gradient(135deg, #e8f4fd, #E0EFFF)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '20px',
                    border: '1px solid #BFDBFE'
                  }}>
                    <p style={{ fontSize: '14px', color: '#1a3a5c', margin: 0, fontWeight: '600' }}>
                      support@aina-app.com
                    </p>
                    <p style={{ fontSize: '12px', color: '#3B82F6', margin: '4px 0 0' }}>
                      Indiquez votre commerce et les modifications souhaitées
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUnlockRequest(false)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'linear-gradient(135deg, #1A1A2E, #374151)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#374151' }}>
                Nom du commerce
                {isLocked && <LockIcon size={12} color="#D97706" />}
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => !isLocked && setBusinessName(e.target.value)}
                disabled={isLocked}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: `2px solid ${isLocked ? '#FCD34D' : '#E5E7EB'}`,
                  borderRadius: '12px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: isLocked ? '#FFFBEB' : 'white',
                  color: isLocked ? '#92400E' : '#1A1A2E',
                  cursor: isLocked ? 'not-allowed' : 'text',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontWeight: '700', fontSize: '13px', color: '#1A1A2E', letterSpacing: '-0.01em' }}>
                Type d'établissement
                {isLocked && <LockIcon size={12} color="#D97706" />}
              </label>

              {/* Si verrouillé, afficher juste le type sélectionné */}
              {isLocked ? (
                <div style={{
                  padding: '14px 16px',
                  border: '2px solid #FCD34D',
                  borderRadius: '12px',
                  backgroundColor: '#FFFBEB',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '24px' }}>
                    {businessTypes.find(t => t.value === businessType)?.icon ||
                     (customBusinessType ? '🏪' : '🏪')}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#92400E'
                  }}>
                    {customBusinessType || businessType}
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {businessTypes.map(type => {
                      const isSelected = businessType === type.value;
                      return (
                        <button
                          key={type.value}
                          onClick={() => {
                            setBusinessType(type.value);
                            if (type.value !== 'Autre') {
                              setCustomBusinessType('');
                            }
                          }}
                          style={{
                            padding: '14px 12px',
                            borderRadius: '14px',
                            border: isSelected ? 'none' : '2px solid #E5E7EB',
                            background: isSelected
                              ? 'linear-gradient(135deg, #c84b31, #FF7043)'
                              : 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '700',
                            fontFamily: "'Poppins', sans-serif",
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.25s ease',
                            boxShadow: isSelected
                              ? '0 6px 20px rgba(255, 112, 67, 0.35)'
                              : '0 2px 8px rgba(0,0,0,0.04)',
                            color: isSelected ? 'white' : '#374151',
                            transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                          }}
                        >
                          <span style={{ fontSize: '24px' }}>{type.icon}</span>
                          <span>{type.value}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Champ personnalisé pour "Autre" */}
                  {businessType === 'Autre' && (
                    <div style={{ marginTop: '12px' }}>
                      <input
                        type="text"
                        value={customBusinessType}
                        onChange={(e) => setCustomBusinessType(e.target.value)}
                        placeholder="Précisez votre type de commerce..."
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '2px solid #c84b31',
                          borderRadius: '12px',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          backgroundColor: '#FFF8E7'
                        }}
                      />
                      <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                        Ex: Fleuriste, Garage auto, Cabinet médical...
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#374151' }}>
                <MapPinIcon size={14} color="#10B981" /> Adresse
              </label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                placeholder="Ex: 12 Rue Bonaparte, Ajaccio"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '13px', color: '#1A1A2E', letterSpacing: '-0.01em' }}>
                Ton de communication
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {tones.map(t => {
                  const isSelected = tone === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      style={{
                        padding: '12px 18px',
                        borderRadius: '50px',
                        border: isSelected ? 'none' : '2px solid #E5E7EB',
                        background: isSelected
                          ? `linear-gradient(135deg, ${t.color}, ${t.color}CC)`
                          : 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '700',
                        fontFamily: "'Poppins', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.25s ease',
                        boxShadow: isSelected
                          ? `0 6px 20px ${t.color}40`
                          : '0 2px 8px rgba(0,0,0,0.04)',
                        color: isSelected ? 'white' : '#374151',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{t.icon}</span>
                      <span>{t.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#374151' }}>
                Plateformes
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {platformsList.map(p => {
                  const isSelected = platforms.includes(p.value);
                  return (
                    <button
                      key={p.value}
                      onClick={() => togglePlatform(p.value)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: isSelected ? 'none' : '2px solid #E5E7EB',
                        background: isSelected ? p.gradient : 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? `0 4px 15px ${p.color}40` : 'none',
                        color: isSelected ? 'white' : '#374151'
                      }}
                    >
                      <p.Icon size={20} color={isSelected ? 'white' : p.color} />
                      {p.value}
                    </button>
                  );
                })}
              </div>
              {platforms.length > 0 && (
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckIcon size={14} color="#10B981" /> {platforms.length} plateforme{platforms.length > 1 ? 's' : ''} sélectionnée{platforms.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Photos */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '8px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={18} color="#10B981" /> Photos d'inspiration
            </h3>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '14px' }}>
              Ces photos inspireront l'IA pour vos créations ({photos.length}/9)
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {photos.map((photo, index) => (
                <div key={index} style={{ position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => removePhoto(index)}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      color: 'white',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >×</button>
                </div>
              ))}
              {photos.length < 9 && (
                <div
                  onClick={() => photosInputRef.current?.click()}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '12px',
                    border: '2px dashed #D1D5DB',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#F9FAFB',
                    transition: 'all 0.2s'
                  }}
                >
                  <PlusIcon size={28} color="#9CA3AF" />
                </div>
              )}
            </div>
            <input ref={photosInputRef} type="file" accept="image/*" multiple onChange={handlePhotosUpload} style={{ display: 'none' }} />
          </div>

          {/* Mots-clés */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '8px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TagIcon size={18} color="#F59E0B" /> Mots-clés
            </h3>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '14px' }}>
              Guideront l'IA pour générer vos posts
            </p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                placeholder="Ajouter un mot-clé..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              />
              <button
                onClick={addKeyword}
                style={{
                  padding: '12px 18px',
                  background: 'linear-gradient(135deg, #10B981, #34D399)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              ><PlusIcon size={18} color="white" /></button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {keywords.map((keyword, index) => (
                <span
                  key={index}
                  style={{
                    padding: '8px 14px',
                    background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
                    border: '1px solid #BBF7D0',
                    borderRadius: '50px',
                    fontSize: '13px',
                    color: '#166534',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#DC2626',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '16px',
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >×</button>
                </span>
              ))}
              {keywords.length === 0 && (
                <span style={{ color: '#9CA3AF', fontSize: '13px' }}>Aucun mot-clé ajouté</span>
              )}
            </div>
          </div>

          {/* Bouton Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '16px',
              background: saving ? '#E5E7EB' : 'linear-gradient(135deg, #c84b31, #FF7043)',
              border: 'none',
              borderRadius: '14px',
              color: saving ? '#9CA3AF' : 'white',
              fontWeight: '700',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              boxShadow: saving ? 'none' : '0 6px 20px rgba(200, 75, 49, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s'
            }}
          >
            {saving ? (
              <><LoaderIcon size={18} color="#9CA3AF" /> Sauvegarde en cours...</>
            ) : (
              <><SaveIcon size={18} color="white" /> Sauvegarder les modifications</>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

export default Moodboard;
