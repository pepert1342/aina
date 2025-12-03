import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import logoAina from '/logo-aina.png';
import AddressAutocomplete from '../components/AddressAutocomplete';

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

  const logoInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  const businessTypes = [
    { value: 'Restaurant', icon: '🍽️' },
    { value: 'Bar', icon: '🍸' },
    { value: 'Boulangerie', icon: '🥐' },
    { value: 'Coiffeur', icon: '💇' },
    { value: 'Boutique', icon: '🛍️' },
    { value: 'Autre', icon: '🏪' }
  ];

  const tones = [
    { value: 'Professionnel', icon: '👔', color: '#004E89' },
    { value: 'Familial', icon: '👨‍👩‍👧‍👦', color: '#10B981' },
    { value: 'Jeune', icon: '🎉', color: '#FF8A65' },
    { value: 'Luxe', icon: '✨', color: '#8B5CF6' },
    { value: 'Humour', icon: '😄', color: '#F59E0B' }
  ];

  const platformsList = [
    { value: 'Instagram', icon: '📷', color: '#E4405F' },
    { value: 'Facebook', icon: '👍', color: '#1877F2' },
    { value: 'TikTok', icon: '🎵', color: '#000000' },
    { value: 'LinkedIn', icon: '💼', color: '#0A66C2' }
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
      setBusinessType(data.business_type || '');
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

  const handleSave = async () => {
    if (!user || !business) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          business_name: businessName,
          business_type: businessType,
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
        background: 'linear-gradient(135deg, #F0F7FF, #FFFFFF)',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'linear-gradient(135deg, #FF8A65, #004E89)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '800',
            fontSize: '20px',
            margin: '0 auto 16px'
          }}>A</div>
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
            }}>AiNa</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '10px 14px',
                backgroundColor: 'transparent',
                border: '2px solid #E5E7EB',
                borderRadius: '10px',
                color: '#666',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >← Retour</button>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 14px',
                backgroundColor: 'transparent',
                border: '2px solid #E5E7EB',
                borderRadius: '10px',
                color: '#666',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '13px'
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
        transition: 'all 0.6s ease-out'
      }}>
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #10B981, #34D399)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}>🎨</div>
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
            fontSize: '14px'
          }}>✅ {successMessage}</div>
        )}

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Logo */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏷️ Logo
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                onClick={() => logoInputRef.current?.click()}
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '12px',
                  border: '2px dashed #E5E7EB',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#FAFBFC',
                  overflow: 'hidden'
                }}
              >
                {logo ? (
                  <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '24px' }}>📷</span>
                )}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
              <div>
                <p style={{ fontWeight: '600', fontSize: '14px', color: '#1A1A2E' }}>
                  {uploading ? '⏳ Upload...' : logo ? '✓ Logo importé' : 'Ajouter un logo'}
                </p>
                <p style={{ fontSize: '12px', color: '#888' }}>PNG, JPG</p>
              </div>
            </div>
          </div>

          {/* Style IA (lecture seule) */}
          {preferredStyle && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              border: '1px solid #E5E7EB'
            }}>
              <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🤖 Style IA préféré
              </h3>
              <div style={{
                padding: '12px',
                backgroundColor: '#F0FDF4',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '20px' }}>✨</span>
                <div>
                  <p style={{ fontWeight: '600', fontSize: '14px', color: '#166534', margin: 0 }}>
                    {preferredStyle}
                  </p>
                  <p style={{ fontSize: '11px', color: '#888', margin: '4px 0 0' }}>
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
            padding: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontWeight: '700', color: '#1A1A2E', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                🏪 Informations
              </h3>
              {isLocked && (
                <span style={{
                  padding: '4px 10px',
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  borderRadius: '50px',
                  fontSize: '11px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🔒 Verrouillé
                </span>
              )}
            </div>

            {/* Alerte si verrouillé */}
            {isLocked && (
              <div style={{
                backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <span style={{ fontSize: '18px' }}>🔐</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', color: '#92400E', margin: 0, fontWeight: '600' }}>
                    Profil verrouillé
                  </p>
                  <p style={{ fontSize: '12px', color: '#A16207', margin: '4px 0 8px' }}>
                    Le nom de l'établissement est protégé après l'onboarding.
                  </p>
                  <button
                    onClick={() => setShowUnlockRequest(true)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#D97706',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
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
                  borderRadius: '16px',
                  padding: '24px',
                  maxWidth: '400px',
                  width: '100%',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A2E', marginBottom: '12px' }}>
                    📝 Demande de modification
                  </h3>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                    Pour modifier le nom de votre établissement, veuillez contacter le support :
                  </p>
                  <div style={{
                    backgroundColor: '#F0F7FF',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '16px'
                  }}>
                    <p style={{ fontSize: '14px', color: '#004E89', margin: 0, fontWeight: '600' }}>
                      📧 support@aina-app.com
                    </p>
                    <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0' }}>
                      Indiquez votre commerce et les modifications souhaitées
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUnlockRequest(false)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#1A1A2E',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#1A1A2E' }}>
                Nom du commerce
                {isLocked && <span style={{ fontSize: '12px' }}>🔒</span>}
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => !isLocked && setBusinessName(e.target.value)}
                disabled={isLocked}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${isLocked ? '#FCD34D' : '#E5E7EB'}`,
                  borderRadius: '10px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: isLocked ? '#FFFBEB' : 'white',
                  color: isLocked ? '#92400E' : '#1A1A2E',
                  cursor: isLocked ? 'not-allowed' : 'text'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#1A1A2E' }}>
                Type
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {businessTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setBusinessType(type.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `2px solid ${businessType === type.value ? '#FF8A65' : '#E5E7EB'}`,
                      backgroundColor: businessType === type.value ? '#FFF5F2' : 'white',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >{type.icon} {type.value}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#1A1A2E' }}>
                Adresse 📍
              </label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                placeholder="Ex: 12 Rue Bonaparte, Ajaccio"
              />
              <p style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                Commencez à taper pour voir les suggestions
              </p>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#1A1A2E' }}>
                Ton
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {tones.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `2px solid ${tone === t.value ? t.color : '#E5E7EB'}`,
                      backgroundColor: tone === t.value ? `${t.color}15` : 'white',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >{t.icon} {t.value}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#1A1A2E' }}>
                Plateformes
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {platformsList.map(p => (
                  <button
                    key={p.value}
                    onClick={() => togglePlatform(p.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `2px solid ${platforms.includes(p.value) ? p.color : '#E5E7EB'}`,
                      backgroundColor: platforms.includes(p.value) ? `${p.color}15` : 'white',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >{p.icon} {p.value}</button>
                ))}
              </div>
              {platforms.length > 0 && (
                <p style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                  {platforms.length} sélectionnée(s)
                </p>
              )}
            </div>
          </div>

          {/* Photos */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '8px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📸 Photos d'inspiration
            </h3>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
              Ces photos inspireront l'IA ({photos.length}/9)
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {photos.map((photo, index) => (
                <div key={index} style={{ position: 'relative', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden' }}>
                  <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => removePhoto(index)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >×</button>
                </div>
              ))}
              {photos.length < 9 && (
                <div
                  onClick={() => photosInputRef.current?.click()}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '10px',
                    border: '2px dashed #E5E7EB',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#FAFBFC'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>+</span>
                </div>
              )}
            </div>
            <input ref={photosInputRef} type="file" accept="image/*" multiple onChange={handlePhotosUpload} style={{ display: 'none' }} />
          </div>

          {/* Mots-clés */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '8px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏷️ Mots-clés
            </h3>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
              Guideront l'IA pour vos posts
            </p>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                placeholder="Ajouter..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={addKeyword}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #10B981, #34D399)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >+</button>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {keywords.map((keyword, index) => (
                <span
                  key={index}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '50px',
                    fontSize: '12px',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
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
                      fontSize: '14px'
                    }}
                  >×</button>
                </span>
              ))}
              {keywords.length === 0 && (
                <span style={{ color: '#999', fontSize: '12px' }}>Aucun mot-clé</span>
              )}
            </div>
          </div>

          {/* Bouton Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '14px',
              background: saving ? '#E5E7EB' : 'linear-gradient(135deg, #FF8A65, #FFB088)',
              border: 'none',
              borderRadius: '12px',
              color: saving ? '#999' : 'white',
              fontWeight: '700',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              boxShadow: saving ? 'none' : '0 4px 15px rgba(255, 138, 101, 0.3)'
            }}
          >
            {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default Moodboard;
