import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { generatePostText, generateImage } from '../gemini';

interface Business {
  id: string;
  business_name: string;
  business_type: string;
  tone: string;
  platforms: string[];
}

function CreatePost() {
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Formulaire
  const [postDescription, setPostDescription] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram');
  const [selectedFormat, setSelectedFormat] = useState('carre');
  
  // Génération
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedTexts, setGeneratedTexts] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/login');
      return;
    }

    setUser(session.user);
    
    // Charger le commerce
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (!businessError && businessData) {
      setBusiness(businessData);
    }
    
    setLoading(false);
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
      const texts = await generatePostText(
        business.business_name,
        business.business_type,
        postDescription,
        '',
        business.tone || 'Familial',
        selectedPlatform
      );

      setGeneratedTexts(texts);
    } catch (error: any) {
      console.error('Erreur génération:', error);
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
      const imageData = await generateImage(
        business.business_name,
        business.business_type,
        postDescription,
        `Format: ${selectedFormat === 'carre' ? 'carré 1:1' : 'story vertical 9:16'}`,
        business.tone || 'Familial'
      );

      setGeneratedImage(imageData);
    } catch (error: any) {
      console.error('Erreur génération image:', error);
      setImageError('Erreur: ' + error.message);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleGenerateAll = async () => {
    await handleGenerateText();
    await handleGenerateImage();
  };

  const handleCopyText = () => {
    if (selectedVersion === null || !generatedTexts[selectedVersion]) {
      alert('Sélectionnez une version');
      return;
    }

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #F8F9FA, white)' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF6B35' }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #F8F9FA, white)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <svg width="120" height="40" viewBox="0 0 120 40" style={{ height: '40px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <defs>
              <linearGradient id="create-logo" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#FF6B35', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#004E89', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <text x="60" y="28" fontFamily="Montserrat, sans-serif" fontSize="32" fontWeight="800" fill="url(#create-logo)" textAnchor="middle">
              AiNa
            </text>
          </svg>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate('/dashboard')} style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
              ← Dashboard
            </button>
            <span style={{ color: '#666' }}>{user?.email}</span>
            <button onClick={handleLogout} style={{ backgroundColor: '#f3f4f6', color: '#2C3E50', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 16px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#2C3E50', marginBottom: '8px' }}>✨ Créer un Post</h1>
        <p style={{ color: '#666', marginBottom: '32px' }}>Décrivez ce que vous voulez, l'IA s'occupe du reste !</p>

        {error && (
          <div style={{ backgroundColor: '#FEE2E2', border: '2px solid #FECACA', color: '#DC2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
          
          {/* Colonne 1 : Configuration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Commerce */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2C3E50', marginBottom: '16px' }}>🏪 Votre Commerce</h2>
              {business ? (
                <div>
                  <p style={{ marginBottom: '8px' }}><strong>Nom :</strong> {business.business_name}</p>
                  <p style={{ marginBottom: '8px' }}><strong>Type :</strong> {business.business_type}</p>
                  <p><strong>Ton :</strong> {business.tone || 'Non défini'}</p>
                </div>
              ) : (
                <p style={{ color: '#999' }}>Commerce non trouvé</p>
              )}
            </div>

            {/* Description du post */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2C3E50', marginBottom: '16px' }}>📝 Décrivez votre post</h2>
              <textarea
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
                placeholder="Ex: Je veux promouvoir mon plat du jour : une daube de sanglier corse avec polenta crémeuse. Ambiance chaleureuse et gourmande."
                rows={5}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '15px',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Plateforme */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2C3E50', marginBottom: '16px' }}>📱 Plateforme</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['Instagram', 'Facebook', 'TikTok'].map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatform(platform)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: `2px solid ${selectedPlatform === platform ? '#FF6B35' : '#e5e7eb'}`,
                      backgroundColor: selectedPlatform === platform ? 'rgba(255, 107, 53, 0.1)' : 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2C3E50', marginBottom: '16px' }}>📐 Format</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setSelectedFormat('carre')}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '8px',
                    border: `2px solid ${selectedFormat === 'carre' ? '#FF6B35' : '#e5e7eb'}`,
                    backgroundColor: selectedFormat === 'carre' ? 'rgba(255, 107, 53, 0.1)' : 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', border: '2px solid currentColor', borderRadius: '4px' }}></div>
                  <span>Carré</span>
                  <span style={{ fontSize: '12px', color: '#999' }}>1080 x 1080</span>
                </button>
                <button
                  onClick={() => setSelectedFormat('story')}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '8px',
                    border: `2px solid ${selectedFormat === 'story' ? '#FF6B35' : '#e5e7eb'}`,
                    backgroundColor: selectedFormat === 'story' ? 'rgba(255, 107, 53, 0.1)' : 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{ width: '24px', height: '40px', border: '2px solid currentColor', borderRadius: '4px' }}></div>
                  <span>Story</span>
                  <span style={{ fontSize: '12px', color: '#999' }}>1080 x 1920</span>
                </button>
              </div>
            </div>

            {/* Boutons Générer */}
            <button
              onClick={handleGenerateAll}
              disabled={!postDescription.trim() || generating || generatingImage}
              style={{
                width: '100%',
                background: 'linear-gradient(to right, #FF6B35, #004E89)',
                color: 'white',
                padding: '20px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '18px',
                cursor: !postDescription.trim() || generating || generatingImage ? 'not-allowed' : 'pointer',
                opacity: !postDescription.trim() || generating || generatingImage ? 0.5 : 1
              }}
            >
              {generating || generatingImage ? '⏳ Génération en cours...' : '🚀 Générer Texte + Image'}
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleGenerateText}
                disabled={!postDescription.trim() || generating}
                style={{
                  flex: 1,
                  background: '#FF6B35',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: !postDescription.trim() || generating ? 'not-allowed' : 'pointer',
                  opacity: !postDescription.trim() || generating ? 0.5 : 1
                }}
              >
                {generating ? '⏳...' : '✨ Texte seul'}
              </button>
              <button
                onClick={handleGenerateImage}
                disabled={!postDescription.trim() || generatingImage}
                style={{
                  flex: 1,
                  background: '#004E89',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: !postDescription.trim() || generatingImage ? 'not-allowed' : 'pointer',
                  opacity: !postDescription.trim() || generatingImage ? 0.5 : 1
                }}
              >
                {generatingImage ? '⏳...' : '🎨 Image seule'}
              </button>
            </div>
          </div>

          {/* Colonne 2 : Textes générés */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '24px', maxHeight: '800px', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2C3E50', marginBottom: '16px' }}>✨ Textes Générés</h2>
            
            {generatedTexts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#999' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
                <p>Décrivez votre post et cliquez sur Générer</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {generatedTexts.map((text, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedVersion(index)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: `2px solid ${selectedVersion === index ? '#FF6B35' : '#e5e7eb'}`,
                      backgroundColor: selectedVersion === index ? 'rgba(255, 107, 53, 0.05)' : 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#2C3E50' }}>
                        Version {index + 1} {index === 0 && '(Courte)'} {index === 1 && '(Moyenne)'} {index === 2 && '(Longue)'}
                      </span>
                      {selectedVersion === index && (
                        <span style={{ backgroundColor: '#FF6B35', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                          ✓
                        </span>
                      )}
                    </div>
                    <p style={{ color: '#666', fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{text}</p>
                  </div>
                ))}

                <button
                  onClick={handleCopyText}
                  disabled={selectedVersion === null}
                  style={{
                    width: '100%',
                    backgroundColor: '#10B981',
                    color: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: selectedVersion === null ? 'not-allowed' : 'pointer',
                    opacity: selectedVersion === null ? 0.5 : 1
                  }}
                >
                  📋 Copier le texte
                </button>
              </div>
            )}
          </div>

          {/* Colonne 3 : Image générée */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2C3E50', marginBottom: '16px' }}>🎨 Image Générée</h2>
            
            {imageError && (
              <div style={{ backgroundColor: '#FEE2E2', border: '2px solid #FECACA', color: '#DC2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {imageError}
              </div>
            )}

            {!generatedImage ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#999' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</div>
                <p>L'image apparaîtra ici</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>Format: {selectedFormat === 'carre' ? 'Carré (1:1)' : 'Story (9:16)'}</p>
              </div>
            ) : (
              <div>
                <div style={{ 
                  aspectRatio: selectedFormat === 'carre' ? '1/1' : '9/16',
                  maxHeight: '500px',
                  overflow: 'hidden',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <img 
                    src={generatedImage} 
                    alt="Image générée" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
                <button
                  onClick={handleDownloadImage}
                  style={{
                    width: '100%',
                    backgroundColor: '#10B981',
                    color: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  💾 Télécharger l'image
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default CreatePost;
