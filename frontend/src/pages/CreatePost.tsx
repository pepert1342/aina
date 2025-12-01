import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { generatePostText, generateImage } from '../gemini';

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

            <nav style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', backgroundColor: 'transparent', border: 'none', borderRadius: '10px', color: '#666', fontWeight: '500', cursor: 'pointer', fontSize: '14px' }}>
                Dashboard
              </button>
              <button onClick={() => navigate('/calendar')} style={{ padding: '10px 20px', backgroundColor: 'transparent', border: 'none', borderRadius: '10px', color: '#666', fontWeight: '500', cursor: 'pointer', fontSize: '14px' }}>
                Calendrier
              </button>
              <button style={{ padding: '10px 20px', backgroundColor: '#004E8915', border: 'none', borderRadius: '10px', color: '#004E89', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
                Créer un post
              </button>
            </nav>
          </div>

          <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: 'transparent', border: '2px solid #E5E7EB', borderRadius: '10px', color: '#666', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '32px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out'
      }}>
        
        {/* Header Banner - Dégradé INVERSÉ (Bleu → Orange) */}
        <div style={{
          background: 'linear-gradient(135deg, #004E89, #FF6B35)',
          borderRadius: '20px',
          padding: '24px 32px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 40px rgba(0, 78, 137, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px'
            }}>
              ✨
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '4px' }}>
                Création libre
              </p>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'white', margin: 0 }}>
                Créer un nouveau post
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
                Décrivez ce que vous voulez, l'IA s'occupe du reste !
              </p>
            </div>
          </div>
          
          <div style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '50px',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            {business?.business_name}
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
          {/* Première ligne : Plateforme et Format */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '24px' }}>
            
            {/* Platform Selection - CENTRÉ */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontWeight: '700', color: '#1A1A2E', fontSize: '16px', marginBottom: '16px' }}>
                📱 Plateforme
              </span>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {/* Instagram */}
                <button
                  onClick={() => setSelectedPlatform('Instagram')}
                  style={{
                    padding: '16px 24px',
                    borderRadius: '14px',
                    border: `3px solid ${selectedPlatform === 'Instagram' ? '#E4405F' : '#E5E7EB'}`,
                    backgroundColor: selectedPlatform === 'Instagram' ? '#E4405F10' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FFDC80" />
                      <stop offset="25%" stopColor="#F77737" />
                      <stop offset="50%" stopColor="#E1306C" />
                      <stop offset="75%" stopColor="#C13584" />
                      <stop offset="100%" stopColor="#833AB4" />
                    </linearGradient>
                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#instagram-gradient)" strokeWidth="2" fill="none"/>
                    <circle cx="12" cy="12" r="4" stroke="url(#instagram-gradient)" strokeWidth="2" fill="none"/>
                    <circle cx="17.5" cy="6.5" r="1.5" fill="url(#instagram-gradient)"/>
                  </svg>
                  <span style={{ fontWeight: '600', fontSize: '16px', color: '#1A1A2E' }}>Instagram</span>
                </button>

                {/* Facebook */}
                <button
                  onClick={() => setSelectedPlatform('Facebook')}
                  style={{
                    padding: '16px 24px',
                    borderRadius: '14px',
                    border: `3px solid ${selectedPlatform === 'Facebook' ? '#1877F2' : '#E5E7EB'}`,
                    backgroundColor: selectedPlatform === 'Facebook' ? '#1877F210' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span style={{ fontWeight: '600', fontSize: '16px', color: '#1A1A2E' }}>Facebook</span>
                </button>

                {/* TikTok */}
                <button
                  onClick={() => setSelectedPlatform('TikTok')}
                  style={{
                    padding: '16px 24px',
                    borderRadius: '14px',
                    border: `3px solid ${selectedPlatform === 'TikTok' ? '#000000' : '#E5E7EB'}`,
                    backgroundColor: selectedPlatform === 'TikTok' ? '#00000010' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" fill="#000"/>
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" fill="#25F4EE" style={{transform: 'translate(-1px, -1px)'}}/>
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" fill="#FE2C55" style={{transform: 'translate(1px, 1px)'}}/>
                  </svg>
                  <span style={{ fontWeight: '600', fontSize: '16px', color: '#1A1A2E' }}>TikTok</span>
                </button>
              </div>
            </div>

            {/* Separator vertical */}
            <div style={{ 
              borderLeft: '2px solid #E5E7EB',
              paddingLeft: '32px',
              textAlign: 'center'
            }}>
              {/* Format Selection - CENTRÉ et PLEINE LARGEUR */}
              <span style={{ display: 'block', fontWeight: '700', color: '#1A1A2E', fontSize: '16px', marginBottom: '16px' }}>
                📐 Format du post
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => setSelectedFormat('carre')}
                  style={{
                    padding: '20px',
                    borderRadius: '14px',
                    border: `3px solid ${selectedFormat === 'carre' ? '#004E89' : '#E5E7EB'}`,
                    backgroundColor: selectedFormat === 'carre' ? '#004E8915' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', border: '3px solid #1A1A2E', borderRadius: '8px' }} />
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '16px', color: '#1A1A2E', display: 'block' }}>Carré</span>
                    <span style={{ fontSize: '13px', color: '#666' }}>1080 × 1080</span>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedFormat('story')}
                  style={{
                    padding: '20px',
                    borderRadius: '14px',
                    border: `3px solid ${selectedFormat === 'story' ? '#004E89' : '#E5E7EB'}`,
                    backgroundColor: selectedFormat === 'story' ? '#004E8915' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ width: '24px', height: '40px', border: '3px solid #1A1A2E', borderRadius: '8px' }} />
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '16px', color: '#1A1A2E', display: 'block' }}>Story</span>
                    <span style={{ fontSize: '13px', color: '#666' }}>1080 × 1920</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Deuxième ligne : Boutons d'action GROS et alignés - Dégradé INVERSÉ */}
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            paddingTop: '24px',
            borderTop: '2px solid #F5F5F7'
          }}>
            <button
              onClick={handleGenerateText}
              disabled={!postDescription.trim() || generating}
              style={{
                flex: 1,
                padding: '20px 32px',
                background: postDescription.trim() && !generating ? 'linear-gradient(135deg, #004E89, #0077CC)' : '#E5E7EB',
                border: 'none',
                borderRadius: '16px',
                color: postDescription.trim() && !generating ? 'white' : '#999',
                fontWeight: '700',
                cursor: postDescription.trim() && !generating ? 'pointer' : 'not-allowed',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: postDescription.trim() && !generating ? '0 6px 20px rgba(0, 78, 137, 0.3)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              {generating ? '⏳ Génération...' : '✨ Générer le Texte'}
            </button>
            <button
              onClick={handleGenerateImage}
              disabled={!postDescription.trim() || generatingImage}
              style={{
                flex: 1,
                padding: '20px 32px',
                background: postDescription.trim() && !generatingImage ? 'linear-gradient(135deg, #004E89, #0077CC)' : '#E5E7EB',
                border: 'none',
                borderRadius: '16px',
                color: postDescription.trim() && !generatingImage ? 'white' : '#999',
                fontWeight: '700',
                cursor: postDescription.trim() && !generatingImage ? 'pointer' : 'not-allowed',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: postDescription.trim() && !generatingImage ? '0 6px 20px rgba(0, 78, 137, 0.3)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              {generatingImage ? '⏳ Génération...' : '🎨 Générer l\'Image'}
            </button>
            <button
              onClick={handleGenerateAll}
              disabled={!postDescription.trim() || generating || generatingImage}
              style={{
                flex: 1,
                padding: '20px 32px',
                background: postDescription.trim() && !generating && !generatingImage
                  ? 'linear-gradient(135deg, #004E89, #FF6B35)'
                  : '#E5E7EB',
                border: 'none',
                borderRadius: '16px',
                color: postDescription.trim() && !generating && !generatingImage ? 'white' : '#999',
                fontWeight: '700',
                cursor: postDescription.trim() && !generating && !generatingImage ? 'pointer' : 'not-allowed',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: postDescription.trim() && !generating && !generatingImage 
                  ? '0 8px 30px rgba(0, 78, 137, 0.4)' 
                  : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              {generating || generatingImage ? '⏳ Génération...' : '🚀 Tout Générer'}
            </button>
          </div>
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

        {/* Results Section - Two Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* Left Column - Generated Texts */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid #DCE8F5',
            minHeight: '500px'
          }}>
            <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #004E89, #0077CC)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>✨</span>
              Textes Générés
            </h3>

            {generatedTexts.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px 20px', 
                color: '#999',
                background: 'linear-gradient(135deg, #F0F7FF, #FFFFFF)',
                borderRadius: '16px',
                border: '2px dashed #DCE8F5'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
                <p style={{ fontSize: '16px', fontWeight: '500' }}>Les textes apparaîtront ici</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>Décrivez votre post et cliquez sur Générer</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {generatedTexts.map((text, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedVersion(index)}
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      border: `2px solid ${selectedVersion === index ? '#004E89' : '#E5E7EB'}`,
                      backgroundColor: selectedVersion === index ? '#004E8908' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: index === 0 ? '#10B98120' : index === 1 ? '#004E8920' : '#8B5CF620',
                        color: index === 0 ? '#10B981' : index === 1 ? '#004E89' : '#8B5CF6',
                        borderRadius: '50px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {index === 0 ? '📝 Courte' : index === 1 ? '📄 Moyenne' : '📚 Longue'}
                      </span>
                      {selectedVersion === index && (
                        <span style={{ backgroundColor: '#004E89', color: 'white', padding: '4px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: '600' }}>
                          ✓ Sélectionnée
                        </span>
                      )}
                    </div>
                    <p style={{ color: '#444', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{text}</p>
                  </div>
                ))}
                <button
                  onClick={handleCopyText}
                  disabled={selectedVersion === null}
                  style={{
                    padding: '16px',
                    background: selectedVersion !== null ? 'linear-gradient(135deg, #10B981, #34D399)' : '#E5E7EB',
                    border: 'none',
                    borderRadius: '12px',
                    color: selectedVersion !== null ? 'white' : '#999',
                    fontWeight: '600',
                    cursor: selectedVersion !== null ? 'pointer' : 'not-allowed'
                  }}
                >
                  📋 Copier le texte sélectionné
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Generated Image */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid #DCE8F5',
            minHeight: '500px'
          }}>
            <h3 style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #FF6B35, #FF8F5E)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>🎨</span>
              Image Générée
            </h3>

            {imageError && (
              <div style={{
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                padding: '12px',
                borderRadius: '12px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                ⚠️ {imageError}
              </div>
            )}

            {!generatedImage ? (
              <div style={{
                aspectRatio: selectedFormat === 'carre' ? '1/1' : '9/16',
                maxHeight: '400px',
                background: 'linear-gradient(135deg, #FFF5F2, #F0F7FF)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                border: '2px dashed #DCE8F5'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🖼️</div>
                <p style={{ fontSize: '16px', fontWeight: '500' }}>L'image apparaîtra ici</p>
                <p style={{ 
                  fontSize: '13px', 
                  marginTop: '8px', 
                  padding: '6px 14px', 
                  backgroundColor: 'white', 
                  borderRadius: '50px',
                  border: '1px solid #DCE8F5'
                }}>
                  Format : {selectedFormat === 'carre' ? 'Carré (1:1)' : 'Story (9:16)'}
                </p>
              </div>
            ) : (
              <div>
                <div style={{
                  aspectRatio: selectedFormat === 'carre' ? '1/1' : '9/16',
                  maxHeight: '400px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  marginBottom: '16px'
                }}>
                  <img src={generatedImage} alt="Generated" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <button
                  onClick={handleDownloadImage}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #10B981, #34D399)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
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
      `}</style>
    </div>
  );
}

export default CreatePost;
