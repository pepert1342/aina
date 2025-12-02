import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import logoAina from '/logo-aina.png';

interface Business {
  id: string;
  business_name: string;
  business_type: string;
  tone: string;
  address?: string;
  phone?: string;
  logo_url?: string;
  photos?: string[];
  keywords?: string[];
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
  const [logo, setLogo] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  
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
    { value: 'Luxe', icon: '✨', color: '#8B5CF6' }
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
      setLogo(data.logo_url || null);
      setPhotos(data.photos || []);
      setKeywords(data.keywords || []);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos(prev => [...prev, reader.result as string].slice(0, 9));
        };
        reader.readAsDataURL(file);
      });
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
                  {logo ? '✓ Logo importé' : 'Ajouter un logo'}
                </p>
                <p style={{ fontSize: '12px', color: '#888' }}>PNG, JPG</p>
              </div>
            </div>
          </div>

          {/* Infos */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏪 Informations
            </h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#1A1A2E' }}>
                Nom du commerce
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
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

            <div>
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
