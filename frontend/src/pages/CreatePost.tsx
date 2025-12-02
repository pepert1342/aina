import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { generatePostText, generateImage } from '../gemini';
import logoAina from '/logo-aina.png';

interface Business {
  id: string;
  business_name: string;
  business_type: string;
  tone: string;
  keywords?: string[];
  logo_url?: string;
  photos?: string[];
  address?: string;
}

function CreatePost() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Form
  const [postDescription, setPostDescription] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram');
  const [selectedFormat, setSelectedFormat] = useState('carre');

  // Generation
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedTexts, setGeneratedTexts] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');

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
      .single();

    if (businessData) setBusiness(businessData);
    setLoading(false);
    setTimeout(() => setIsVisible(true), 100);
  };

  const handleGenerateText = async () => {
    if (!business || !postDescription.trim()) {
      setError('Veuillez décrire votre post');
      return;
    }

    setGenerating(true);
    setError('');
    setGeneratedTexts([]);
    setSelectedVersion(null);

    try {
      const moodboard = {
        keywords: business.keywords,
        logo_url: business.logo_url,
        photos: business.photos,
        address: business.address
      };

      const texts = await generatePostText(
        business.business_name,
        business.business_type,
        postDescription,
        '',
        business.tone || 'Familial',
        selectedPlatform,
        moodboard
      );
      setGeneratedTexts(texts);
    } catch (error: any) {
      setError('Erreur: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!business || !postDescription.trim()) {
      setImageError('Veuillez décrire votre post');
      return;
    }

    setGeneratingImage(true);
    setImageError('');
    setGeneratedImage(null);

    try {
      const moodboard = {
        keywords: business.keywords,
        logo_url: business.logo_url,
        photos: business.photos,
        address: business.address
      };

      const imageData = await generateImage(
        business.business_name,
        business.business_type,
        postDescription,
        `Format: ${selectedFormat === 'carre' ? 'carré 1:1' : 'story vertical 9:16'}`,
        business.tone || 'Familial',
        moodboard
      );
      setGeneratedImage(imageData);
    } catch (error: any) {
      setImageError('Erreur: ' + error.message);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleGenerateAll = async () => {
    await Promise.all([handleGenerateText(), handleGenerateImage()]);
  };

  const handleCopyText = () => {
    if (selectedVersion === null) return;
    navigator.clipboard.writeText(generatedTexts[selectedVersion]);
    alert('✅ Texte copié !');
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `post-${Date.now()}.png`;
    link.click();
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
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #004E89, #FF6B35)',
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
      background: 'linear-gradient(135deg, #F0F7FF 0%, #FFFFFF 50%, #F5F0FF 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'rgba(255,255,255,0.95)',
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
            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            <img 
              src={logoAina} 
              alt="AiNa" 
              style={{
                width: '52px',
                height: '52px',
                objectFit: 'contain'
              }}
            />
            <span style={{ 
              fontSize: '24px', 
              fontWeight: '800',
              fontFamily: "'Poppins', sans-serif",
              background: 'linear-gradient(135deg, #FF8A65, #004E89)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginLeft: '-4px'
            }}>
              AiNa
            </span>
          </div>

          {/* Boutons à droite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => navigate('/create')}
              className="btn-create"
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #FF8A65, #FFB088)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: '0 4px 15px rgba(255, 138, 101, 0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              ✨ Créer
            </button>
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
                fontSize: '13px',
                whiteSpace: 'nowrap'
              }}
            >
              Déconnexion
            </button>
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
        
        {/* Header Banner - Dégradé INVERSÉ (Bleu → Orange) */}
        <div className="banner" style={{
          background: 'linear-gradient(135deg, #004E89, #FF8A65)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 10px 40px rgba(0, 78, 137, 0.3)'
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
              fontSize: '22px',
              flexShrink: 0
            }}>
              ✨
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

        {/* Description Input */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid #DCE8F5'
        }}>
          <label style={{ display: 'block', fontWeight: '700', color: '#1A1A2E', fontSize: '16px', marginBottom: '12px' }}>
            📝 Décrivez votre post
          </label>
          <textarea
            value={postDescription}
            onChange={(e) => setPostDescription(e.target.value)}
            placeholder="Ex: Je veux promouvoir mon plat du jour, une daube de sanglier avec polenta crémeuse. Ambiance chaleureuse et gourmande."
            rows={4}
            style={{
              width: '100%',
              padding: '16px',
              border: '2px solid #E5E7EB',
              borderRadius: '12px',
              fontSize: '16px',
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              lineHeight: '1.6',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#004E89';
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 78, 137, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
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
              <span style={{ display: 'block', fontWeight: '700', color: '#1A1A2E', fontSize: '14px', marginBottom: '12px' }}>
                📱 Plateforme
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
              <span style={{ display: 'block', fontWeight: '700', color: '#1A1A2E', fontSize: '14px', marginBottom: '12px' }}>
                📐 Format
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSelectedFormat('carre')}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: `2px solid ${selectedFormat === 'carre' ? '#004E89' : '#E5E7EB'}`,
                    backgroundColor: selectedFormat === 'carre' ? '#004E8920' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    flex: '1'
                  }}
                >
                  <div style={{ width: '24px', height: '24px', border: `2px solid ${selectedFormat === 'carre' ? '#004E89' : '#888'}`, borderRadius: '4px' }}></div>
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
                    border: `2px solid ${selectedFormat === 'story' ? '#004E89' : '#E5E7EB'}`,
                    backgroundColor: selectedFormat === 'story' ? '#004E8920' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    flex: '1'
                  }}
                >
                  <div style={{ width: '16px', height: '24px', border: `2px solid ${selectedFormat === 'story' ? '#004E89' : '#888'}`, borderRadius: '3px' }}></div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: '#1A1A2E' }}>Story</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>1080×1920</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Bouton Générer */}
          <button
            onClick={handleGenerateAll}
            disabled={generating || generatingImage || !postDescription.trim()}
            style={{
              width: '100%',
              padding: '14px',
              background: generating || generatingImage ? '#E5E7EB' : 'linear-gradient(135deg, #FF8A65, #FFB088)',
              border: 'none',
              borderRadius: '12px',
              color: generating || generatingImage ? '#999' : 'white',
              fontWeight: '700',
              cursor: generating || generatingImage ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: generating || generatingImage ? 'none' : '0 4px 15px rgba(255, 138, 101, 0.3)'
            }}
          >
            {generating || generatingImage ? (
              <>⏳ Génération en cours...</>
            ) : (
              <>🚀 Tout Générer</>
            )}
          </button>
        </div>

        {/* Error Messages */}
        {error && (
          <div style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            padding: '14px 20px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Results Section - En colonne sur mobile */}
        <div className="results-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Textes Générés */}
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
                background: 'linear-gradient(135deg, #004E89, #0077CC)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}>✨</span>
              Textes Générés
            </h3>

            {generatedTexts.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 16px', 
                color: '#999',
                background: 'linear-gradient(135deg, #F0F7FF, #FFFFFF)',
                borderRadius: '12px',
                border: '2px dashed #DCE8F5'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
                <p style={{ fontSize: '14px', fontWeight: '500' }}>Les textes apparaîtront ici</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {generatedTexts.map((text, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedVersion(index)}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      border: `2px solid ${selectedVersion === index ? '#004E89' : '#E5E7EB'}`,
                      backgroundColor: selectedVersion === index ? '#004E8908' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{
                        padding: '3px 10px',
                        backgroundColor: index === 0 ? '#10B98120' : index === 1 ? '#004E8920' : '#8B5CF620',
                        color: index === 0 ? '#10B981' : index === 1 ? '#004E89' : '#8B5CF6',
                        borderRadius: '50px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {index === 0 ? '📝 Courte' : index === 1 ? '📄 Moyenne' : '📚 Longue'}
                      </span>
                      {selectedVersion === index && (
                        <span style={{ backgroundColor: '#004E89', color: 'white', padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '600' }}>
                          ✓ Sélectionnée
                        </span>
                      )}
                    </div>
                    <p style={{ color: '#444', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{text}</p>
                  </div>
                ))}
                <button
                  onClick={handleCopyText}
                  disabled={selectedVersion === null}
                  style={{
                    padding: '12px',
                    background: selectedVersion !== null ? 'linear-gradient(135deg, #10B981, #34D399)' : '#E5E7EB',
                    border: 'none',
                    borderRadius: '10px',
                    color: selectedVersion !== null ? 'white' : '#999',
                    fontWeight: '600',
                    cursor: selectedVersion !== null ? 'pointer' : 'not-allowed',
                    fontSize: '14px'
                  }}
                >
                  📋 Copier le texte sélectionné
                </button>
              </div>
            )}
          </div>

          {/* Image Générée */}
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
                background: 'linear-gradient(135deg, #FF8A65, #FFB088)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}>🎨</span>
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
                ⚠️ {imageError}
              </div>
            )}

            {!generatedImage ? (
              <div style={{
                aspectRatio: '1/1',
                maxHeight: '250px',
                background: 'linear-gradient(135deg, #FFF5F2, #F0F7FF)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                border: '2px dashed #DCE8F5'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🖼️</div>
                <p style={{ fontSize: '14px', fontWeight: '500' }}>L'image apparaîtra ici</p>
              </div>
            ) : (
              <div>
                <div style={{
                  aspectRatio: selectedFormat === 'carre' ? '1/1' : selectedFormat === 'story' ? '9/16' : '16/9',
                  maxHeight: '300px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                  marginBottom: '12px'
                }}>
                  <img src={generatedImage} alt="Generated" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <button
                  onClick={handleDownloadImage}
                  style={{
                    width: '100%',
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
                    fontSize: '14px'
                  }}
                >
                  💾 Télécharger l'image
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
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
    </div>
  );
}

export default CreatePost;
