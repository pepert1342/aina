import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Form data
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [customBusinessType, setCustomBusinessType] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [tone, setTone] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  const totalSteps = 7;

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
  };

  const businessTypes = [
    { value: 'Restaurant', icon: '🍽️', desc: 'Restaurant, brasserie, café' },
    { value: 'Bar', icon: '🍸', desc: 'Bar, pub, lounge' },
    { value: 'Boulangerie', icon: '🥐', desc: 'Boulangerie, pâtisserie' },
    { value: 'Coiffeur', icon: '💇', desc: 'Salon de coiffure, barbier' },
    { value: 'Esthétique', icon: '💅', desc: 'Institut de beauté, spa, ongles' },
    { value: 'Boutique', icon: '🛍️', desc: 'Boutique, commerce de détail' },
    { value: 'Autre', icon: '✏️', desc: 'Autre type de commerce' }
  ];

  const tones = [
    { value: 'Professionnel', icon: '👔', desc: 'Sérieux et corporate', color: '#004E89' },
    { value: 'Familial', icon: '👨‍👩‍👧‍👦', desc: 'Chaleureux et accueillant', color: '#10B981' },
    { value: 'Jeune', icon: '🎉', desc: 'Fun et dynamique', color: '#FF6B35' },
    { value: 'Luxe', icon: '✨', desc: 'Élégant et raffiné', color: '#8B5CF6' },
    { value: 'Humour', icon: '😄', desc: 'Drôle et décalé', color: '#F59E0B' }
  ];

  const platformOptions = [
    { value: 'Instagram', icon: '📸', color: '#E4405F' },
    { value: 'Facebook', icon: '📘', color: '#1877F2' },
    { value: 'TikTok', icon: '🎵', color: '#000000' }
  ];

  const keywordSuggestions = [
    'chaleureux', 'authentique', 'moderne', 'rustique', 'élégant', 
    'convivial', 'artisanal', 'cosy', 'lumineux', 'naturel',
    'tendance', 'vintage', 'minimaliste', 'coloré', 'zen'
  ];

  const togglePlatform = (platform: string) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('Erreur: utilisateur non connecté');
      return;
    }

    setLoading(true);
    try {
      // Déterminer le type de commerce final
      const finalBusinessType = businessType === 'Autre' ? customBusinessType : businessType;

      // Vérifier si un business existe déjà
      const { data: existingBusiness } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingBusiness) {
        // Update
        const { error } = await supabase
          .from('businesses')
          .update({
            business_name: businessName,
            business_type: finalBusinessType,
            address: address,
            phone: phone,
            tone: tone,
            platforms: platforms,
            keywords: keywords
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('businesses')
          .insert({
            user_id: user.id,
            business_name: businessName,
            business_type: finalBusinessType,
            address: address,
            phone: phone,
            tone: tone,
            platforms: platforms,
            keywords: keywords
          });

        if (error) throw error;
      }

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return businessName.trim().length > 0;
      case 2: return businessType !== '' && (businessType !== 'Autre' || customBusinessType.trim().length > 0);
      case 3: return true; // Optionnel
      case 4: return true; // Optionnel
      case 5: return tone !== '';
      case 6: return platforms.length > 0;
      case 7: return true; // Mots-clés optionnels
      default: return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A2E', marginBottom: '12px' }}>
              Comment s'appelle votre commerce ? 🏪
            </h2>
            <p style={{ color: '#666', marginBottom: '32px' }}>
              Ce nom apparaîtra sur vos publications
            </p>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ex: Le Petit Bistrot"
              style={{
                width: '100%',
                padding: '20px',
                border: '2px solid #E5E7EB',
                borderRadius: '16px',
                fontSize: '18px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FF6B35';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(255, 107, 53, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        );

      case 2:
        return (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A2E', marginBottom: '12px' }}>
              Quel type de commerce ? 🎯
            </h2>
            <p style={{ color: '#666', marginBottom: '32px' }}>
              Cela nous aide à personnaliser vos contenus
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {businessTypes.map((type) => (
                <div
                  key={type.value}
                  onClick={() => setBusinessType(type.value)}
                  style={{
                    padding: '18px',
                    borderRadius: '16px',
                    border: `2px solid ${businessType === type.value ? '#FF6B35' : '#E5E7EB'}`,
                    backgroundColor: businessType === type.value ? 'rgba(255, 107, 53, 0.05)' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '10px' }}>{type.icon}</div>
                  <div style={{ fontWeight: '600', color: '#1A1A2E', marginBottom: '4px' }}>{type.value}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{type.desc}</div>
                </div>
              ))}
            </div>

            {/* Champ personnalisé si "Autre" est sélectionné */}
            {businessType === 'Autre' && (
              <div style={{ marginTop: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1A1A2E' }}>
                  Précisez votre métier :
                </label>
                <input
                  type="text"
                  value={customBusinessType}
                  onChange={(e) => setCustomBusinessType(e.target.value)}
                  placeholder="Ex: Fleuriste, Garage auto, Photographe..."
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #FF6B35',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(255, 107, 53, 0.05)'
                  }}
                />
                <p style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                  💡 L'IA utilisera cette information pour créer du contenu adapté à votre métier
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A2E', marginBottom: '12px' }}>
              Où êtes-vous situé ? 📍
            </h2>
            <p style={{ color: '#666', marginBottom: '32px' }}>
              Cela aide l'IA à adapter le contenu à votre région et aux événements locaux
            </p>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Ajaccio, Corse"
              style={{
                width: '100%',
                padding: '20px',
                border: '2px solid #E5E7EB',
                borderRadius: '16px',
                fontSize: '18px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FF6B35';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(255, 107, 53, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#F0F9FF',
              borderRadius: '12px',
              border: '1px solid #BAE6FD'
            }}>
              <p style={{ fontSize: '14px', color: '#0369A1', margin: 0 }}>
                🌍 <strong>Pourquoi c'est important ?</strong><br/>
                L'IA pourra suggérer des posts liés aux fêtes locales, à la météo, et créer des images qui reflètent l'ambiance de votre région.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A2E', marginBottom: '12px' }}>
              Votre numéro de téléphone ? 📞
            </h2>
            <p style={{ color: '#666', marginBottom: '32px' }}>
              Optionnel - Pour les appels à l'action dans vos posts
            </p>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 04 95 12 34 56"
              style={{
                width: '100%',
                padding: '20px',
                border: '2px solid #E5E7EB',
                borderRadius: '16px',
                fontSize: '18px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FF6B35';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(255, 107, 53, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        );

      case 5:
        return (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A2E', marginBottom: '12px' }}>
              Quel ton pour vos posts ? 🎭
            </h2>
            <p style={{ color: '#666', marginBottom: '32px' }}>
              L'IA adaptera son style d'écriture à votre personnalité
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {tones.map((t) => (
                <div
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: `2px solid ${tone === t.value ? t.color : '#E5E7EB'}`,
                    backgroundColor: tone === t.value ? `${t.color}10` : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>{t.icon}</div>
                  <div style={{ fontWeight: '700', color: '#1A1A2E', marginBottom: '4px', fontSize: '16px' }}>{t.value}</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A2E', marginBottom: '12px' }}>
              Sur quels réseaux publiez-vous ? 📱
            </h2>
            <p style={{ color: '#666', marginBottom: '32px' }}>
              Sélectionnez un ou plusieurs réseaux
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              {platformOptions.map((platform) => (
                <div
                  key={platform.value}
                  onClick={() => togglePlatform(platform.value)}
                  style={{
                    padding: '32px 40px',
                    borderRadius: '20px',
                    border: `3px solid ${platforms.includes(platform.value) ? platform.color : '#E5E7EB'}`,
                    backgroundColor: platforms.includes(platform.value) ? `${platform.color}15` : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  {platforms.includes(platform.value) && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      width: '28px',
                      height: '28px',
                      backgroundColor: platform.color,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px'
                    }}>
                      ✓
                    </div>
                  )}
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>{platform.icon}</div>
                  <div style={{ fontWeight: '700', color: '#1A1A2E', fontSize: '16px' }}>{platform.value}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A2E', marginBottom: '12px' }}>
              Mots-clés pour l'IA 🏷️
            </h2>
            <p style={{ color: '#666', marginBottom: '32px' }}>
              Ces mots guideront l'IA pour créer des images et textes qui vous ressemblent
            </p>

            {/* Input pour ajouter */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="Tapez un mot-clé et appuyez sur Entrée"
                style={{
                  flex: 1,
                  padding: '16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#FF6B35';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              />
              <button
                onClick={addKeyword}
                style={{
                  padding: '16px 24px',
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px', minHeight: '50px' }}>
              {keywords.length === 0 ? (
                <p style={{ color: '#999', fontSize: '14px', fontStyle: 'italic' }}>
                  Aucun mot-clé ajouté pour l'instant
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
                      onClick={() => removeKeyword(index)}
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
            <div style={{
              padding: '20px',
              backgroundColor: '#F8F9FA',
              borderRadius: '16px'
            }}>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px', fontWeight: '600' }}>
                💡 Suggestions (cliquez pour ajouter) :
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {keywordSuggestions
                  .filter(s => !keywords.includes(s))
                  .map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setKeywords([...keywords, suggestion])}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: 'white',
                        border: '1px dashed #CCC',
                        borderRadius: '50px',
                        fontSize: '13px',
                        color: '#666',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#FF6B35';
                        e.currentTarget.style.color = '#FF6B35';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#CCC';
                        e.currentTarget.style.color = '#666';
                      }}
                    >
                      + {suggestion}
                    </button>
                  ))
                }
              </div>
            </div>

            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#FEF3C7',
              borderRadius: '12px',
              border: '1px solid #FCD34D'
            }}>
              <p style={{ fontSize: '14px', color: '#92400E', margin: 0 }}>
                ⭐ <strong>Conseil :</strong> Ajoutez 5 à 10 mots-clés qui décrivent l'ambiance de votre commerce. Vous pourrez les modifier plus tard dans le Moodboard.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Left Side - Progress - NOUVEAU DESIGN CLAIR */}
      <div style={{
        width: '320px',
        background: 'linear-gradient(135deg, #FFF5F2 0%, #FEE2E2 100%)',
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorations */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '-20%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(255,107,53,0.2) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '-10%',
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(0,78,137,0.15) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #FF6B35, #004E89)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '800',
            fontSize: '22px',
            boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)'
          }}>
            A
          </div>
          <span style={{ 
            fontSize: '28px', 
            fontWeight: '800',
            background: 'linear-gradient(135deg, #FF6B35, #004E89)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AiNa
          </span>
        </div>

        {/* Progress Steps */}
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          {[
            { num: 1, title: 'Nom du commerce' },
            { num: 2, title: 'Type de commerce' },
            { num: 3, title: 'Localisation' },
            { num: 4, title: 'Téléphone' },
            { num: 5, title: 'Ton de communication' },
            { num: 6, title: 'Réseaux sociaux' },
            { num: 7, title: 'Mots-clés IA' }
          ].map((s, index) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: step >= s.num ? '#FF6B35' : 'white',
                border: step >= s.num ? 'none' : '2px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: step >= s.num ? 'white' : '#999',
                fontWeight: '700',
                marginRight: '14px',
                transition: 'all 0.3s ease',
                fontSize: '14px',
                boxShadow: step >= s.num ? '0 4px 10px rgba(255, 107, 53, 0.3)' : 'none'
              }}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span style={{
                color: step >= s.num ? '#1A1A2E' : '#999',
                fontWeight: step === s.num ? '600' : '400',
                transition: 'all 0.3s ease',
                fontSize: '14px'
              }}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            height: '8px',
            backgroundColor: 'rgba(255,255,255,0.8)',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              height: '100%',
              width: `${(step / totalSteps) * 100}%`,
              background: 'linear-gradient(90deg, #FF6B35, #FF8F5E)',
              borderRadius: '4px',
              transition: 'width 0.5s ease'
            }} />
          </div>
          <p style={{ color: '#666', marginTop: '12px', fontSize: '14px' }}>
            Étape {step} sur {totalSteps}
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div style={{
        flex: 1,
        backgroundColor: 'white',
        padding: '48px 64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          {/* Step Content */}
          <div style={{
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '48px'
          }}>
            {step > 1 ? (
              <button
                onClick={handleBack}
                style={{
                  padding: '16px 32px',
                  backgroundColor: 'transparent',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  color: '#666',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1A1A2E';
                  e.currentTarget.style.color = '#1A1A2E';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.color = '#666';
                }}
              >
                ← Retour
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                style={{
                  padding: '16px 32px',
                  background: isStepValid() 
                    ? 'linear-gradient(135deg, #FF6B35, #FF8F5E)' 
                    : '#E5E7EB',
                  border: 'none',
                  borderRadius: '12px',
                  color: isStepValid() ? 'white' : '#999',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: isStepValid() ? 'pointer' : 'not-allowed',
                  boxShadow: isStepValid() ? '0 4px 15px rgba(255, 107, 53, 0.4)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                Continuer →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStepValid() || loading}
                style={{
                  padding: '16px 40px',
                  background: isStepValid() && !loading
                    ? 'linear-gradient(135deg, #10B981, #34D399)' 
                    : '#E5E7EB',
                  border: 'none',
                  borderRadius: '12px',
                  color: isStepValid() && !loading ? 'white' : '#999',
                  fontWeight: '700',
                  fontSize: '16px',
                  cursor: isStepValid() && !loading ? 'pointer' : 'not-allowed',
                  boxShadow: isStepValid() && !loading ? '0 4px 15px rgba(16, 185, 129, 0.4)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? '⏳ Enregistrement...' : '✓ Terminer la configuration'}
              </button>
            )}
          </div>

          {/* Skip Button for Optional Steps */}
          {(step === 3 || step === 4 || step === 7) && (
            <button
              onClick={step === 7 ? handleSubmit : handleNext}
              style={{
                display: 'block',
                margin: '16px auto 0',
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#999',
                fontWeight: '500',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {step === 7 ? 'Passer et terminer →' : 'Passer cette étape →'}
            </button>
          )}
        </div>
      </div>

      {/* CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        input::placeholder {
          color: #999;
        }
        
        @media (max-width: 768px) {
          .onboarding-container {
            padding: 16px !important;
          }
          
          .onboarding-card {
            padding: 24px 20px !important;
            margin: 0 !important;
          }
          
          .onboarding-title {
            font-size: 24px !important;
          }
          
          .onboarding-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          
          .onboarding-grid-2 {
            grid-template-columns: 1fr 1fr !important;
          }
          
          .onboarding-buttons {
            flex-direction: column !important;
            gap: 12px !important;
          }
          
          .onboarding-buttons button {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Onboarding;
