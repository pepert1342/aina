import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import logoAina from '/logo-aina.png';

function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [address, setAddress] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [tone, setTone] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      await saveBusiness();
    }
  };

  const saveBusiness = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('businesses')
        .insert([{
          user_id: userId,
          business_name: businessName,
          business_type: businessType,
          address: address || null,
          platforms: platforms.length > 0 ? platforms : null,
          tone: tone || null,
        }]);

      if (error) throw error;
      navigate('/dashboard');
    } catch (error: any) {
      setError('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platform: string) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1: return businessName.trim() !== '';
      case 2: return businessType !== '';
      case 3: return true;
      case 4: return platforms.length > 0;
      case 5: return tone !== '';
      default: return true;
    }
  };

  const businessTypes = [
    { value: 'Restaurant', icon: '🍽️' },
    { value: 'Bar', icon: '🍸' },
    { value: 'Boulangerie', icon: '🥐' },
    { value: 'Coiffeur', icon: '💇' },
    { value: 'Boutique', icon: '🛍️' },
    { value: 'Autre', icon: '🏪' }
  ];

  const tones = [
    { value: 'Professionnel', icon: '👔', desc: 'Sérieux et élégant' },
    { value: 'Familial', icon: '👨‍👩‍👧‍👦', desc: 'Chaleureux et accueillant' },
    { value: 'Jeune', icon: '🎉', desc: 'Fun et dynamique' },
    { value: 'Luxe', icon: '✨', desc: 'Raffiné et exclusif' }
  ];

  const platformsList = [
    { value: 'Instagram', icon: '📷', color: '#E4405F', desc: 'Posts & Stories' },
    { value: 'Facebook', icon: '👍', color: '#1877F2', desc: 'Communauté locale' },
    { value: 'TikTok', icon: '🎵', color: '#000000', desc: 'Vidéos courtes' },
    { value: 'LinkedIn', icon: '💼', color: '#0A66C2', desc: 'Réseau pro' }
  ];

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
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box'
      }}>
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
          }}>AiNa</span>
        </div>
        <span style={{ fontSize: '13px', color: '#888' }}>Configuration</span>
      </header>

      {/* Progress */}
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A2E' }}>
            Étape {currentStep} sur {totalSteps}
          </span>
          <span style={{ fontSize: '13px', color: '#888' }}>
            {Math.round((currentStep / totalSteps) * 100)}%
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: '#E5E7EB',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(currentStep / totalSteps) * 100}%`,
            height: '100%',
            background: 'linear-gradient(135deg, #FF8A65, #004E89)',
            borderRadius: '3px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Content */}
      <main style={{ padding: '0 16px 100px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          
          {/* Étape 1: Nom */}
          {currentStep === 1 && (
            <div>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏪</div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A2E', marginBottom: '8px' }}>
                Comment s'appelle votre commerce ?
              </h2>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                Ce nom apparaîtra sur vos publications
              </p>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ex: Le Petit Bistrot"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {/* Étape 2: Type */}
          {currentStep === 2 && (
            <div>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏷️</div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A2E', marginBottom: '8px' }}>
                Quel type de commerce ?
              </h2>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                Pour personnaliser vos contenus
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {businessTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setBusinessType(type.value)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: `2px solid ${businessType === type.value ? '#FF8A65' : '#E5E7EB'}`,
                      backgroundColor: businessType === type.value ? '#FFF5F2' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>{type.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A2E' }}>{type.value}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape 3: Adresse */}
          {currentStep === 3 && (
            <div>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📍</div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A2E', marginBottom: '8px' }}>
                Où êtes-vous situé ?
              </h2>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                Pour les événements locaux (optionnel)
              </p>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: 12 Rue Bonaparte, Ajaccio"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {/* Étape 4: Plateformes */}
          {currentStep === 4 && (
            <div>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📱</div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A2E', marginBottom: '8px' }}>
                Vos réseaux sociaux ?
              </h2>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                Sélectionnez une ou plusieurs plateformes
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {platformsList.map(p => (
                  <button
                    key={p.value}
                    onClick={() => togglePlatform(p.value)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: `2px solid ${platforms.includes(p.value) ? p.color : '#E5E7EB'}`,
                      backgroundColor: platforms.includes(p.value) ? `${p.color}15` : 'white',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>{p.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A2E' }}>{p.value}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{p.desc}</div>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', marginTop: '12px' }}>
                {platforms.length} sélectionnée(s)
              </p>
            </div>
          )}

          {/* Étape 5: Ton */}
          {currentStep === 5 && (
            <div>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎨</div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A2E', marginBottom: '8px' }}>
                Quel ton pour vos posts ?
              </h2>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                L'IA adaptera son style d'écriture
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tones.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: `2px solid ${tone === t.value ? '#FF8A65' : '#E5E7EB'}`,
                      backgroundColor: tone === t.value ? '#FFF5F2' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A2E' }}>{t.value}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#FEE2E2',
              borderRadius: '8px',
              color: '#DC2626',
              fontSize: '13px'
            }}>{error}</div>
          )}
        </div>
      </main>

      {/* Footer Buttons */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px',
        backgroundColor: 'white',
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        gap: '12px'
      }}>
        {currentStep > 1 && (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: 'white',
              border: '2px solid #E5E7EB',
              borderRadius: '12px',
              color: '#666',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >← Retour</button>
        )}
        <button
          onClick={handleNext}
          disabled={!canContinue() || loading}
          style={{
            flex: currentStep > 1 ? 2 : 1,
            padding: '14px',
            background: canContinue() && !loading ? 'linear-gradient(135deg, #FF8A65, #FFB088)' : '#E5E7EB',
            border: 'none',
            borderRadius: '12px',
            color: canContinue() && !loading ? 'white' : '#999',
            fontWeight: '700',
            cursor: canContinue() && !loading ? 'pointer' : 'not-allowed',
            fontSize: '15px',
            boxShadow: canContinue() && !loading ? '0 4px 15px rgba(255, 138, 101, 0.3)' : 'none'
          }}
        >
          {loading ? '⏳ Création...' : currentStep === totalSteps ? '🚀 Terminer' : 'Continuer →'}
        </button>
      </div>
    </div>
  );
}

export default Onboarding;
