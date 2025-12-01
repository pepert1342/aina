import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

interface Business {
  id: string;
  business_name: string;
  business_type: string;
  tone: string;
  address?: string;
  phone?: string;
  logo_url?: string;
  photos?: string[];
}

function Moodboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [tone, setTone] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  
  // Images
  const [logo, setLogo] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Mots-clés
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
    { value: 'Jeune', icon: '🎉', color: '#FF6B35' },
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
      setAddress(data.address || '');
      setPhone(data.phone || '');
      setLogo(data.logo_url || null);
      setPhotos(data.photos || []);
      setKeywords(data.keywords || []);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
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
          address: address,
          phone: phone,
          logo_url: logo,
          photos: photos,
          keywords: keywords
        })
        .eq('id', business.id);

      if (error) throw error;
      
      setSuccessMessage('✅ Modifications enregistrées !');
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
        background: 'linear-gradient(135deg, #FAFBFC, #F0F2F5)',
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
            fontSize: '24px',
            animation: 'pulse 1.5s ease-in-out infinite'
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
      background: 'linear-gradient(135deg, #FAFBFC, #F0F2F5)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
              onClick={() => navigate('/dashboard')}
            >
              <div style={{
                width: '44px',
                height: '44px',
                background: 'linear-gradient(135deg, #FF6B35, #004E89)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '800',
                fontSize: '20px'
              }}>
                A
              </div>
              <span style={{ 
                fontSize: '24px', 
                fontWeight: '800',
                background: 'linear-gradient(135deg, #FF6B35, #004E89)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                AiNa
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                border: '2px solid #E5E7EB',
                borderRadius: '10px',
                color: '#666',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Retour
            </button>
            <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: 'transparent', border: '2px solid #E5E7EB', borderRadius: '10px', color: '#666', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out'
      }}>
        {/* Page Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1A1A2E', marginBottom: '8px' }}>
            🎨 Moodboard
          </h1>
          <p style={{ color: '#666' }}>
            Personnalisez votre identité visuelle pour des posts uniques
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={{
            backgroundColor: '#D1FAE5',
            border: '1px solid #A7F3D0',
            color: '#059669',
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontWeight: '600'
          }}>
            {successMessage}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          
          {/* Left Column - Business Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Logo Section */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🏷️ Logo de votre commerce
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div
                  onClick={() => logoInputRef.current?.click()}
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '20px',
                    border: '3px dashed #E5E7EB',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#FAFBFC',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {logo ? (
                    <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <span style={{ fontSize: '32px', marginBottom: '8px' }}>📷</span>
                      <span style={{ fontSize: '12px', color: '#999' }}>Ajouter</span>
                    </>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                <div>
                  <p style={{ color: '#1A1A2E', fontWeight: '600', marginBottom: '8px' }}>
                    {logo ? 'Logo importé ✓' : 'Aucun logo'}
                  </p>
                  <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
                    Cliquez pour importer votre logo.<br/>
                    Format recommandé : PNG, JPG
                  </p>
                  {logo && (
                    <button
                      onClick={() => setLogo(null)}
                      style={{
                        marginTop: '12px',
                        padding: '8px 16px',
                        backgroundColor: '#FEE2E2',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#DC2626',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🏪 Informations du commerce
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1A1A2E', fontSize: '14px' }}>
                    Nom du commerce
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1A1A2E', fontSize: '14px' }}>
                    Type de commerce
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {businessTypes.map(type => (
                      <button
                        key={type.value}
                        onClick={() => setBusinessType(type.value)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '10px',
                          border: `2px solid ${businessType === type.value ? '#FF6B35' : '#E5E7EB'}`,
                          backgroundColor: businessType === type.value ? 'rgba(255, 107, 53, 0.1)' : 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px'
                        }}
                      >
                        {type.icon} {type.value}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1A1A2E', fontSize: '14px' }}>
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: 12 rue de la Paix, 75002 Paris"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1A1A2E', fontSize: '14px' }}>
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 01 23 45 67 89"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Tone */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🎭 Ton de communication
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {tones.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: `2px solid ${tone === t.value ? t.color : '#E5E7EB'}`,
                      backgroundColor: tone === t.value ? `${t.color}15` : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{t.icon}</span>
                    {t.value}
                  </button>
                ))}
              </div>
            </div>

            {/* Mots-clés */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🏷️ Mots-clés pour l'IA
              </h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                Ces mots guideront l'IA pour générer des images qui correspondent à votre univers
              </p>

              {/* Input pour ajouter */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newKeyword.trim()) {
                      setKeywords([...keywords, newKeyword.trim()]);
                      setNewKeyword('');
                    }
                  }}
                  placeholder="Ex: rustique, chaleureux, terroir..."
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={() => {
                    if (newKeyword.trim()) {
                      setKeywords([...keywords, newKeyword.trim()]);
                      setNewKeyword('');
                    }
                  }}
                  style={{
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #FF6B35, #FF8F5E)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  + Ajouter
                </button>
              </div>

              {/* Tags affichés */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {keywords.length === 0 ? (
                  <p style={{ color: '#999', fontSize: '14px', fontStyle: 'italic' }}>
                    Aucun mot-clé ajouté. Tapez un mot et appuyez sur Entrée.
                  </p>
                ) : (
                  keywords.map((keyword, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        backgroundColor: '#FF6B3515',
                        border: '2px solid #FF6B35',
                        borderRadius: '50px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#FF6B35'
                      }}
                    >
                      {keyword}
                      <button
                        onClick={() => setKeywords(keywords.filter((_, i) => i !== index))}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: '#FF6B35',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Suggestions */}
              {keywords.length < 5 && (
                <div style={{ marginTop: '20px' }}>
                  <p style={{ color: '#666', fontSize: '13px', marginBottom: '10px' }}>💡 Suggestions :</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['chaleureux', 'authentique', 'moderne', 'rustique', 'élégant', 'convivial', 'artisanal', 'cosy', 'lumineux', 'naturel']
                      .filter(s => !keywords.includes(s))
                      .slice(0, 6)
                      .map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setKeywords([...keywords, suggestion])}
                          style={{
                            padding: '8px 14px',
                            backgroundColor: '#F5F5F7',
                            border: '1px dashed #CCC',
                            borderRadius: '50px',
                            fontSize: '13px',
                            color: '#666',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          + {suggestion}
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Photos */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            height: 'fit-content'
          }}>
            <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📸 Photos d'inspiration (Moodboard)
            </h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              Ces photos inspireront l'IA pour créer des visuels cohérents avec votre univers
            </p>

            {/* Photos Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {photos.map((photo, index) => (
                <div key={index} style={{ position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden' }}>
                  <img src={photo} alt={`Moodboard ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => removePhoto(index)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: 'rgba(220, 38, 38, 0.9)',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {/* Add Photo Button */}
              {photos.length < 9 && (
                <div
                  onClick={() => photosInputRef.current?.click()}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '12px',
                    border: '3px dashed #E5E7EB',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#FAFBFC',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span style={{ fontSize: '28px', marginBottom: '8px' }}>+</span>
                  <span style={{ fontSize: '12px', color: '#999' }}>Ajouter</span>
                </div>
              )}
            </div>
            
            <input
              ref={photosInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotosUpload}
              style={{ display: 'none' }}
            />

            <p style={{ color: '#999', fontSize: '13px', textAlign: 'center' }}>
              {photos.length}/9 photos • Ajoutez des photos de votre commerce, produits, ambiance...
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '18px 48px',
              background: saving ? '#ccc' : 'linear-gradient(135deg, #FF6B35, #FF8F5E)',
              border: 'none',
              borderRadius: '16px',
              color: 'white',
              fontWeight: '700',
              fontSize: '18px',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 8px 30px rgba(255, 107, 53, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            {saving ? '⏳ Enregistrement...' : '💾 Enregistrer les modifications'}
          </button>
        </div>
      </main>

      {/* CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        input::placeholder {
          color: #999;
        }
        
        @media (max-width: 768px) {
          .moodboard-header {
            padding: 12px 16px !important;
          }
          
          .moodboard-nav {
            display: none !important;
          }
          
          .moodboard-main {
            padding: 16px !important;
          }
          
          .moodboard-title {
            font-size: 24px !important;
          }
          
          .moodboard-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          
          .moodboard-card {
            padding: 20px !important;
          }
          
          .moodboard-photos-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          .moodboard-keywords {
            flex-wrap: wrap !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Moodboard;
