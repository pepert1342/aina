import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { generateImage } from '../gemini';
import logoAina from '/logo-aina.png';
import AddressAutocomplete from '../components/AddressAutocomplete';

function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');

  // Étape 1: Infos de base
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [address, setAddress] = useState('');

  // Étape 2: Identité visuelle
  const [logo, setLogo] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  // Étape 3: Ton & Plateformes
  const [tone, setTone] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);

  // Étape 4: Calibrage IA (images)
  const [postDescription, setPostDescription] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState(0);
  const [calibrationRound, setCalibrationRound] = useState(1);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [showDescriptionInput, setShowDescriptionInput] = useState(true);

  // Étape 5: Confirmation
  const [preferredStyle, setPreferredStyle] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  const businessTypes = [
    { value: 'Restaurant', icon: '🍽️' },
    { value: 'Bar', icon: '🍸' },
    { value: 'Boulangerie', icon: '🥐' },
    { value: 'Coiffeur', icon: '💇' },
    { value: 'Esthétique', icon: '💅' },
    { value: 'Boutique', icon: '🛍️' },
    { value: 'Autre', icon: '🏪' }
  ];

  const tones = [
    { value: 'Professionnel', icon: '👔', desc: 'Sérieux et élégant' },
    { value: 'Familial', icon: '👨‍👩‍👧‍👦', desc: 'Chaleureux et accueillant' },
    { value: 'Jeune', icon: '🎉', desc: 'Fun et dynamique' },
    { value: 'Luxe', icon: '✨', desc: 'Raffiné et exclusif' },
    { value: 'Humour', icon: '😄', desc: 'Drôle et décalé' }
  ];

  const platformsList = [
    { value: 'Instagram', icon: '📷', color: '#E4405F', desc: 'Posts & Stories' },
    { value: 'Facebook', icon: '👍', color: '#1877F2', desc: 'Communauté locale' },
    { value: 'TikTok', icon: '🎵', color: '#000000', desc: 'Vidéos courtes' },
    { value: 'LinkedIn', icon: '💼', color: '#0A66C2', desc: 'Réseau pro' }
  ];

  const togglePlatform = (platform: string) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  // Upload handlers pour Supabase Storage
  const uploadToStorage = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${path}/${Date.now()}.${fileExt}`;

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
        setLoading(true);
        const url = await uploadToStorage(file, 'logos');
        setLogo(url);
      } catch (err: any) {
        // Fallback to base64 if storage fails
        const reader = new FileReader();
        reader.onloadend = () => setLogo(reader.result as string);
        reader.readAsDataURL(file);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim()) && keywords.length < 10) {
      setKeywords(prev => [...prev, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(prev => prev.filter((_, i) => i !== index));
  };

  // Suggestions d'événements selon le type de commerce
  const getEventSuggestions = () => {
    const commonEvents = [
      { icon: '🆕', text: 'Nouveau produit / Nouvelle carte' },
      { icon: '🎉', text: 'Soirée spéciale / Événement' },
      { icon: '💰', text: 'Promotion / Offre du moment' }
    ];

    const businessSpecificEvents: Record<string, Array<{icon: string, text: string}>> = {
      'Restaurant': [
        { icon: '🍽️', text: 'Plat du jour' },
        { icon: '🥘', text: 'Menu de saison' },
        { icon: '👨‍🍳', text: 'Spécialité du chef' }
      ],
      'Bar': [
        { icon: '🍹', text: 'Nouveau cocktail' },
        { icon: '🎵', text: 'Soirée DJ / Concert' },
        { icon: '🍺', text: 'Happy Hour' }
      ],
      'Boulangerie': [
        { icon: '🥐', text: 'Viennoiserie du jour' },
        { icon: '🎂', text: 'Gâteau de saison' },
        { icon: '🥖', text: 'Pain spécial' }
      ],
      'Coiffeur': [
        { icon: '💇', text: 'Nouvelle coupe tendance' },
        { icon: '💅', text: 'Offre coloration' },
        { icon: '✨', text: 'Soin capillaire' }
      ],
      'Esthétique': [
        { icon: '💆', text: 'Nouveau soin' },
        { icon: '🧴', text: 'Produit du mois' },
        { icon: '💅', text: 'Offre manucure' }
      ],
      'Boutique': [
        { icon: '👗', text: 'Nouvelle collection' },
        { icon: '🏷️', text: 'Soldes / Déstockage' },
        { icon: '🎁', text: 'Idée cadeau' }
      ]
    };

    return [...(businessSpecificEvents[businessType] || []), ...commonEvents];
  };

  // Styles visuels TRÈS DIFFÉRENTS pour la génération
  const imageStyles = [
    {
      name: 'Produit seul',
      desc: 'Focus sur le produit/plat',
      style: 'Close-up product photography, centered subject on clean background, studio lighting, focus on details and textures, no people, professional food/product photography style'
    },
    {
      name: 'Ambiance lieu',
      desc: 'L\'atmosphère de votre commerce',
      style: 'Wide shot of the venue interior, showing the atmosphere and decoration, warm ambient lighting, cozy setting, lifestyle photography, people enjoying the space in background blur'
    },
    {
      name: 'Action/Préparation',
      desc: 'En pleine action',
      style: 'Dynamic action shot, hands preparing/serving, motion and energy, behind the scenes, artisan craftsmanship, authentic moment captured, storytelling photography'
    },
    {
      name: 'Mise en scène',
      desc: 'Composition artistique',
      style: 'Artistic flat lay or styled composition, props and decorations around the main subject, Instagram-worthy aesthetic, creative arrangement, overhead or 45-degree angle shot'
    }
  ];

  // Génération d'images pour le calibrage
  const generateCalibrationImages = async () => {
    if (!postDescription.trim()) {
      setError('Veuillez décrire votre post');
      return;
    }

    setGenerating(true);
    setShowDescriptionInput(false);
    setError('');
    setSelectedImageIndex(null);
    setGeneratedImages([]);
    setGeneratingIndex(0);
    setIsCalibrated(false);

    // Construire le contexte avec logo et photos
    const hasLogo = logo ? 'Intégrer subtilement le logo du commerce dans l\'image.' : '';
    const hasPhotos = photos.length > 0
      ? `S'inspirer de l'ambiance des ${photos.length} photo(s) d'inspiration fournies pour le style visuel.`
      : '';
    const keywordsContext = keywords.length > 0
      ? `Mots-clés de l'univers: ${keywords.join(', ')}.`
      : '';

    const moodboard = {
      keywords: keywords,
      logo_url: logo || undefined,
      photos: photos,
      address: address || undefined
    };

    const images: string[] = [];

    // Générer 4 images avec des COMPOSITIONS TRÈS DIFFÉRENTES
    for (let i = 0; i < 4; i++) {
      setGeneratingIndex(i + 1);
      try {
        const currentStyle = imageStyles[i];
        const fullDescription = `
          SUJET: ${postDescription}
          COMMERCE: ${businessName} (${businessType})

          STYLE DE PHOTO OBLIGATOIRE - ${currentStyle.name.toUpperCase()}:
          ${currentStyle.style}

          CONTRAINTES VISUELLES:
          - Cette image doit être TRÈS DIFFÉRENTE des autres styles
          - ${i === 0 ? 'Gros plan sur le produit/plat, fond épuré, pas de personnes' : ''}
          - ${i === 1 ? 'Plan large montrant le lieu, ambiance chaleureuse, décor visible' : ''}
          - ${i === 2 ? 'Mains en action, mouvement, préparation en cours, authenticité' : ''}
          - ${i === 3 ? 'Vue du dessus ou composition artistique avec accessoires décoratifs' : ''}

          ${hasLogo}
          ${hasPhotos}
          ${keywordsContext}

          Image professionnelle pour Instagram/Facebook. Format carré. Sans texte ni logo visible.
        `.trim();

        const image = await generateImage(
          businessName,
          businessType,
          `${currentStyle.name}: ${postDescription}`,
          fullDescription,
          tone,
          moodboard
        );
        images.push(image);
        setGeneratedImages([...images]);
      } catch (err: any) {
        console.error(`Erreur image ${i + 1}:`, err);
      }
    }

    if (images.length === 0) {
      setError('Erreur lors de la génération. Veuillez réessayer.');
      setShowDescriptionInput(true);
    }

    setGenerating(false);
  };

  const handleSelectImage = (index: number) => {
    setSelectedImageIndex(index);
    setPreferredStyle(imageStyles[index]?.name || 'Moderne');
  };

  const handleValidateCalibration = () => {
    if (selectedImageIndex !== null) {
      setIsCalibrated(true);
    }
  };

  const handleRegenerateCalibration = () => {
    setCalibrationRound(prev => prev + 1);
    setShowDescriptionInput(true);
    setGeneratedImages([]);
    setSelectedImageIndex(null);
    setIsCalibrated(false);
  };

  const handleSelectSuggestion = (text: string) => {
    setPostDescription(text);
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      if (currentStep === 3) {
        setCurrentStep(4);
        // Ne pas lancer la génération automatiquement, attendre la description
        setShowDescriptionInput(true);
      } else {
        setCurrentStep(currentStep + 1);
      }
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
          logo_url: logo || null,
          photos: photos.length > 0 ? photos : null,
          keywords: keywords.length > 0 ? keywords : null,
          preferred_style: preferredStyle || null
        }]);

      if (error) throw error;
      navigate('/pricing');
    } catch (error: any) {
      setError('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1: return businessName.trim() !== '' && businessType !== '';
      case 2: return true;
      case 3: return tone !== '' && platforms.length > 0;
      case 4: return isCalibrated && selectedImageIndex !== null;
      case 5: return true;
      default: return true;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return { icon: '🏪', title: 'Votre commerce', subtitle: 'Présentez-vous en quelques mots' };
      case 2: return { icon: '🎨', title: 'Identité visuelle', subtitle: 'Montrez votre univers à l\'IA' };
      case 3: return { icon: '🎯', title: 'Ton & Réseaux', subtitle: 'Comment voulez-vous communiquer ?' };
      case 4: return { icon: '🤖', title: 'Calibrage IA', subtitle: 'L\'IA apprend vos préférences' };
      case 5: return { icon: '🚀', title: 'Confirmation', subtitle: 'Votre IA est prête !' };
      default: return { icon: '✨', title: '', subtitle: '' };
    }
  };

  const stepInfo = getStepTitle();

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

        {/* Step indicators */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
          {[1, 2, 3, 4, 5].map(step => (
            <div key={step} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: step <= currentStep ? 1 : 0.4
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: step < currentStep ? '#10B981' : step === currentStep ? '#FF8A65' : '#E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: step <= currentStep ? 'white' : '#888',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {step < currentStep ? '✓' : step}
              </div>
            </div>
          ))}
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
          {/* Step Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>{stepInfo.icon}</div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A2E', marginBottom: '4px' }}>
              {stepInfo.title}
            </h2>
            <p style={{ fontSize: '14px', color: '#666' }}>{stepInfo.subtitle}</p>
          </div>

          {/* Étape 1: Infos de base */}
          {currentStep === 1 && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#1A1A2E', marginBottom: '8px' }}>
                  Nom du commerce *
                </label>
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
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#1A1A2E', marginBottom: '8px' }}>
                  Type de commerce *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {businessTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setBusinessType(type.value)}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        border: `2px solid ${businessType === type.value ? '#FF8A65' : '#E5E7EB'}`,
                        backgroundColor: businessType === type.value ? '#FFF5F2' : 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{type.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A2E' }}>{type.value}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#1A1A2E', marginBottom: '8px' }}>
                  Adresse (optionnel)
                </label>
                <AddressAutocomplete
                  value={address}
                  onChange={setAddress}
                  placeholder="Ex: 12 Rue Bonaparte, Ajaccio"
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '16px'
                  }}
                />
                <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                  Sera utilisé pour suggérer des événements locaux
                </p>
              </div>
            </div>
          )}

          {/* Étape 2: Identité visuelle */}
          {currentStep === 2 && (
            <div>
              {/* Logo */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#1A1A2E', marginBottom: '8px' }}>
                  Logo
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    style={{
                      width: '80px',
                      height: '80px',
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
                      <>
                        <span style={{ fontSize: '24px' }}>📷</span>
                        <span style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>Ajouter</span>
                      </>
                    )}
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                  <div>
                    <p style={{ fontWeight: '500', fontSize: '14px', color: '#1A1A2E' }}>
                      {logo ? '✓ Logo ajouté' : 'Ajouter votre logo'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#888' }}>PNG, JPG (optionnel)</p>
                  </div>
                </div>
              </div>

              {/* Photos d'inspiration */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#1A1A2E', marginBottom: '8px' }}>
                  Photos d'inspiration ({photos.length}/9)
                </label>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                  Ajoutez des photos qui représentent l'ambiance de votre commerce
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
                          width: '22px',
                          height: '22px',
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
              <div>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#1A1A2E', marginBottom: '8px' }}>
                  Mots-clés de votre univers
                </label>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                  Décrivez l'ambiance, les valeurs, les spécialités...
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    placeholder="Ex: artisanal, chaleureux..."
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={addKeyword}
                    disabled={!newKeyword.trim()}
                    style={{
                      padding: '12px 18px',
                      background: newKeyword.trim() ? 'linear-gradient(135deg, #10B981, #34D399)' : '#E5E7EB',
                      border: 'none',
                      borderRadius: '10px',
                      color: newKeyword.trim() ? 'white' : '#999',
                      fontWeight: '600',
                      cursor: newKeyword.trim() ? 'pointer' : 'not-allowed'
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
                          fontSize: '14px',
                          lineHeight: 1
                        }}
                      >×</button>
                    </span>
                  ))}
                  {keywords.length === 0 && (
                    <span style={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
                      Exemples: traditionnel, moderne, bio, fait maison, convivial...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Ton & Plateformes */}
          {currentStep === 3 && (
            <div>
              {/* Ton */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#1A1A2E', marginBottom: '12px' }}>
                  Quel ton pour vos posts ? *
                </label>
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
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '28px' }}>{t.icon}</span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A2E' }}>{t.value}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{t.desc}</div>
                      </div>
                      {tone === t.value && (
                        <span style={{ marginLeft: 'auto', color: '#FF8A65', fontWeight: '600' }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plateformes */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#1A1A2E', marginBottom: '12px' }}>
                  Vos réseaux sociaux ? *
                </label>
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
                        textAlign: 'center',
                        transition: 'all 0.2s'
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
            </div>
          )}

          {/* Étape 4: Calibrage IA - Images */}
          {currentStep === 4 && (
            <div>
              {/* Formulaire de description */}
              {showDescriptionInput && !generating && (
                <div>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px', textAlign: 'center' }}>
                    Décrivez le post que vous souhaitez créer
                  </p>

                  {/* Suggestions d'événements */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: '600', fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                      Suggestions pour {businessType}
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {getEventSuggestions().map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectSuggestion(suggestion.text)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '20px',
                            border: postDescription === suggestion.text ? '2px solid #FF8A65' : '1px solid #E5E7EB',
                            backgroundColor: postDescription === suggestion.text ? '#FFF5F2' : 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s'
                          }}
                        >
                          <span>{suggestion.icon}</span>
                          <span style={{ color: '#444' }}>{suggestion.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Champ de description */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#1A1A2E', marginBottom: '8px' }}>
                      Votre description
                    </label>
                    <textarea
                      value={postDescription}
                      onChange={(e) => setPostDescription(e.target.value)}
                      placeholder="Ex: Nouveau cocktail signature à base de rhum et fruits de la passion, parfait pour l'été !"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '14px',
                        border: '2px solid #E5E7EB',
                        borderRadius: '12px',
                        fontSize: '14px',
                        resize: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                        lineHeight: '1.5'
                      }}
                    />
                    <p style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                      Plus votre description est précise, meilleur sera le résultat !
                    </p>
                  </div>

                  {/* Info sur les assets utilisés */}
                  {(logo || photos.length > 0 || keywords.length > 0) && (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#F0F7FF',
                      borderRadius: '10px',
                      marginBottom: '16px'
                    }}>
                      <p style={{ fontSize: '12px', color: '#004E89', fontWeight: '600', marginBottom: '6px' }}>
                        L'IA utilisera vos éléments :
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {logo && (
                          <span style={{ fontSize: '11px', color: '#666', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px' }}>
                            ✓ Logo
                          </span>
                        )}
                        {photos.length > 0 && (
                          <span style={{ fontSize: '11px', color: '#666', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px' }}>
                            ✓ {photos.length} photo(s)
                          </span>
                        )}
                        {keywords.length > 0 && (
                          <span style={{ fontSize: '11px', color: '#666', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px' }}>
                            ✓ {keywords.length} mot(s)-clé(s)
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bouton Générer */}
                  <button
                    onClick={generateCalibrationImages}
                    disabled={!postDescription.trim()}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: postDescription.trim() ? 'linear-gradient(135deg, #FF8A65, #FFB088)' : '#E5E7EB',
                      border: 'none',
                      borderRadius: '12px',
                      color: postDescription.trim() ? 'white' : '#999',
                      fontWeight: '700',
                      cursor: postDescription.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: postDescription.trim() ? '0 4px 15px rgba(255, 138, 101, 0.3)' : 'none'
                    }}
                  >
                    🎨 Générer 4 visuels
                  </button>
                </div>
              )}

              {/* Loading state */}
              {generating && (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>🎨</div>
                  <p style={{ color: '#666', fontWeight: '500' }}>L'IA crée vos visuels...</p>
                  <p style={{ color: '#888', fontSize: '13px', marginTop: '8px' }}>
                    Image {generatingIndex}/4 • Round {calibrationRound}
                  </p>

                  {/* Description en cours */}
                  <div style={{
                    marginTop: '12px',
                    padding: '10px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#666',
                    fontStyle: 'italic'
                  }}>
                    "{postDescription.substring(0, 60)}{postDescription.length > 60 ? '...' : ''}"
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    width: '80%',
                    height: '6px',
                    backgroundColor: '#E5E7EB',
                    borderRadius: '3px',
                    margin: '16px auto 0',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(generatingIndex / 4) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(135deg, #FF8A65, #004E89)',
                      borderRadius: '3px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>

                  {/* Images déjà générées */}
                  {generatedImages.length > 0 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px',
                      marginTop: '20px'
                    }}>
                      {generatedImages.map((img, idx) => (
                        <div key={idx} style={{
                          aspectRatio: '1',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          opacity: 0.7
                        }}>
                          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Résultats */}
              {!generating && !showDescriptionInput && generatedImages.length > 0 && (
                <div>
                  {/* Description utilisée */}
                  <div style={{
                    padding: '10px 12px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <p style={{ fontSize: '12px', color: '#666', flex: 1, margin: 0 }}>
                      "{postDescription.substring(0, 50)}{postDescription.length > 50 ? '...' : ''}"
                    </p>
                    <button
                      onClick={handleRegenerateCalibration}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        color: '#666',
                        fontSize: '11px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      ✏️ Modifier
                    </button>
                  </div>

                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px', textAlign: 'center' }}>
                    Quel style préférez-vous ?
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {generatedImages.map((image, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectImage(index)}
                        style={{
                          borderRadius: '12px',
                          border: `3px solid ${selectedImageIndex === index ? '#10B981' : '#E5E7EB'}`,
                          backgroundColor: selectedImageIndex === index ? '#F0FDF4' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          overflow: 'hidden',
                          position: 'relative'
                        }}
                      >
                        {/* Image */}
                        <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
                          <img
                            src={image}
                            alt={imageStyles[index]?.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>

                        {/* Label */}
                        <div style={{ padding: '8px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            backgroundColor: index === 0 ? '#FEF3C7' : index === 1 ? '#DBEAFE' : index === 2 ? '#FCE7F3' : '#E0E7FF',
                            color: index === 0 ? '#92400E' : index === 1 ? '#1E40AF' : index === 2 ? '#9D174D' : '#3730A3',
                            borderRadius: '50px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {imageStyles[index]?.name}
                          </span>
                        </div>

                        {/* Selection overlay */}
                        {selectedImageIndex === index && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#10B981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '14px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                          }}>
                            ✓
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      onClick={handleRegenerateCalibration}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: 'white',
                        border: '2px solid #E5E7EB',
                        borderRadius: '10px',
                        color: '#666',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      🔄 Régénérer
                    </button>
                    <button
                      onClick={handleValidateCalibration}
                      disabled={selectedImageIndex === null}
                      style={{
                        flex: 2,
                        padding: '12px',
                        background: selectedImageIndex !== null ? 'linear-gradient(135deg, #10B981, #34D399)' : '#E5E7EB',
                        border: 'none',
                        borderRadius: '10px',
                        color: selectedImageIndex !== null ? 'white' : '#999',
                        fontWeight: '600',
                        cursor: selectedImageIndex !== null ? 'pointer' : 'not-allowed',
                        fontSize: '13px'
                      }}
                    >
                      ✓ Valider ce style
                    </button>
                  </div>

                  {isCalibrated && (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      backgroundColor: '#D1FAE5',
                      borderRadius: '10px',
                      textAlign: 'center'
                    }}>
                      <span style={{ color: '#065F46', fontWeight: '600', fontSize: '14px' }}>
                        ✅ Style "{preferredStyle}" enregistré !
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Étape 5: Confirmation */}
          {currentStep === 5 && (
            <div>
              <div style={{
                background: 'linear-gradient(135deg, #10B981, #34D399)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                  Votre IA est prête !
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
                  AiNa connaît maintenant votre univers
                </p>
              </div>

              {/* Récap */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  padding: '14px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>🏪</span>
                  <div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Commerce</div>
                    <div style={{ fontWeight: '600', color: '#1A1A2E' }}>{businessName}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{businessType}</div>
                  </div>
                </div>

                <div style={{
                  padding: '14px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>🎨</span>
                  <div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Identité</div>
                    <div style={{ fontWeight: '600', color: '#1A1A2E' }}>
                      {logo ? '✓ Logo' : '○ Logo'} • {photos.length} photo(s) • {keywords.length} mot(s)-clé(s)
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '14px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>🎯</span>
                  <div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Communication</div>
                    <div style={{ fontWeight: '600', color: '#1A1A2E' }}>
                      Ton {tone} • {platforms.join(', ')}
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '14px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>🤖</span>
                  <div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Style IA préféré</div>
                    <div style={{ fontWeight: '600', color: '#1A1A2E', textTransform: 'capitalize' }}>
                      {preferredStyle || 'Standard'}
                    </div>
                  </div>
                </div>
              </div>

              <p style={{
                fontSize: '13px',
                color: '#888',
                textAlign: 'center',
                marginTop: '20px'
              }}>
                Vous pourrez modifier ces informations dans le Moodboard
              </p>
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
          {loading ? '⏳ Création...' : currentStep === totalSteps ? '🚀 Commencer !' : 'Continuer →'}
        </button>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

export default Onboarding;
