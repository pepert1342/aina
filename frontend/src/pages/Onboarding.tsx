import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');

  // États pour stocker les données
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [address, setAddress] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [tone, setTone] = useState('');
  const [frequency, setFrequency] = useState('');

  // Récupérer l'utilisateur connecté
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
      // Fin de l'onboarding - Sauvegarder dans Supabase
      await saveBusiness();
    }
  };

  const saveBusiness = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert([
          {
            user_id: userId,
            business_name: businessName,
            business_type: businessType,
            address: address || null,
            platforms: platforms.length > 0 ? platforms : null,
            tone: tone || null,
            frequency: frequency || null,
          }
        ])
        .select();

      if (error) throw error;

      console.log('Commerce créé :', data);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erreur:', error);
      setError('Erreur lors de la sauvegarde : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const togglePlatform = (platform: string) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <svg width="120" height="40" viewBox="0 0 120 40" className="h-10">
            <defs>
              <linearGradient id="onboard-logo" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#FF6B35', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#004E89', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <text x="60" y="28" fontFamily="Montserrat, sans-serif" fontSize="32" fontWeight="800" fill="url(#onboard-logo)" textAnchor="middle">
              AiNa
            </text>
          </svg>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-text-dark">
              Étape {currentStep} sur {totalSteps}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((currentStep / totalSteps) * 100)}% complété
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-coral to-ocean h-3 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Contenu des étapes */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* ÉTAPE 1 : Infos de base */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-3xl font-bold text-text-dark mb-2">
                Parlez-nous de votre commerce 🏪
              </h2>
              <p className="text-gray-600 mb-8">
                Ces informations nous aideront à personnaliser vos posts
              </p>

              <div className="space-y-6">
                {/* Nom du commerce */}
                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2">
                    Nom de votre commerce *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ex: Restaurant Le Méditerranée"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-coral focus:outline-none transition-colors"
                  />
                </div>

                {/* Type de commerce */}
                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2">
                    Type de commerce *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['Restaurant', 'Bar', 'Café', 'Coiffeur', 'Salon esthétique', 'Commerce'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setBusinessType(type)}
                        style={{
                          borderColor: businessType === type ? '#FF6B35' : '#e5e7eb',
                          backgroundColor: businessType === type ? 'rgba(255, 107, 53, 0.1)' : 'white',
                          color: businessType === type ? '#FF6B35' : '#2C3E50'
                        }}
                        className="p-4 rounded-lg border-2 font-semibold transition-all hover:border-coral"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Adresse */}
                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: 12 Rue Bonaparte, 20000 Ajaccio"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-coral focus:outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Pour détecter les événements locaux près de chez vous
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : Plateformes */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-3xl font-bold text-text-dark mb-2">
                Où voulez-vous publier ? 📱
              </h2>
              <p className="text-gray-600 mb-8">
                Sélectionnez une ou plusieurs plateformes
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Instagram */}
                <button
                  onClick={() => togglePlatform('Instagram')}
                  style={{
                    borderColor: platforms.includes('Instagram') ? '#FF6B35' : '#e5e7eb',
                    backgroundColor: platforms.includes('Instagram') ? 'rgba(255, 107, 53, 0.1)' : 'white'
                  }}
                  className="p-6 rounded-xl border-2 transition-all hover:border-coral"
                >
                  <div className="text-5xl mb-4">📷</div>
                  <h3 className="text-xl font-bold text-text-dark mb-2">Instagram</h3>
                  <p className="text-gray-600 text-sm">
                    Posts & Stories visuels
                  </p>
                </button>

                {/* Facebook */}
                <button
                  onClick={() => togglePlatform('Facebook')}
                  style={{
                    borderColor: platforms.includes('Facebook') ? '#FF6B35' : '#e5e7eb',
                    backgroundColor: platforms.includes('Facebook') ? 'rgba(255, 107, 53, 0.1)' : 'white'
                  }}
                  className="p-6 rounded-xl border-2 transition-all hover:border-coral"
                >
                  <div className="text-5xl mb-4">👍</div>
                  <h3 className="text-xl font-bold text-text-dark mb-2">Facebook</h3>
                  <p className="text-gray-600 text-sm">
                    Communauté locale
                  </p>
                </button>

                {/* TikTok */}
                <button
                  onClick={() => togglePlatform('TikTok')}
                  style={{
                    borderColor: platforms.includes('TikTok') ? '#FF6B35' : '#e5e7eb',
                    backgroundColor: platforms.includes('TikTok') ? 'rgba(255, 107, 53, 0.1)' : 'white'
                  }}
                  className="p-6 rounded-xl border-2 transition-all hover:border-coral"
                >
                  <div className="text-5xl mb-4">🎵</div>
                  <h3 className="text-xl font-bold text-text-dark mb-2">TikTok</h3>
                  <p className="text-gray-600 text-sm">
                    Vidéos courtes
                  </p>
                </button>
              </div>

              <p className="text-sm text-gray-500 mt-6 text-center">
                {platforms.length} plateforme(s) sélectionnée(s)
              </p>
            </div>
          )}

          {/* ÉTAPE 3 : Upload (simplifié pour l'instant) */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-3xl font-bold text-text-dark mb-2">
                Votre identité visuelle 🎨
              </h2>
              <p className="text-gray-600 mb-8">
                Logo et photos de votre commerce (on configurera ça plus tard)
              </p>

              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">📸</div>
                <p className="text-gray-600">
                  Fonctionnalité d'upload à venir prochainement
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Pour l'instant, passez à l'étape suivante
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : Couleurs (simplifié) */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-3xl font-bold text-text-dark mb-2">
                Couleurs de marque 🎨
              </h2>
              <p className="text-gray-600 mb-8">
                Fonctionnalité à venir prochainement
              </p>

              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <p className="text-gray-600">
                  Color picker à implémenter dans les prochaines sessions
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 5 : Ton */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-3xl font-bold text-text-dark mb-2">
                Quel est votre style ? 💬
              </h2>
              <p className="text-gray-600 mb-8">
                Comment voulez-vous communiquer avec vos clients ?
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: 'Familial', emoji: '🏠', desc: 'Chaleureux et convivial' },
                  { value: 'Professionnel', emoji: '💼', desc: 'Sérieux et expert' },
                  { value: 'Jeune', emoji: '✨', desc: 'Dynamique et tendance' },
                  { value: 'Élégant', emoji: '🎩', desc: 'Raffiné et premium' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTone(option.value)}
                    style={{
                      borderColor: tone === option.value ? '#FF6B35' : '#e5e7eb',
                      backgroundColor: tone === option.value ? 'rgba(255, 107, 53, 0.1)' : 'white'
                    }}
                    className="p-6 rounded-xl border-2 text-left transition-all hover:border-coral"
                  >
                    <div className="text-4xl mb-2">{option.emoji}</div>
                    <h3 className="text-xl font-bold text-text-dark mb-1">{option.value}</h3>
                    <p className="text-gray-600 text-sm">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 6 : Fréquence */}
          {currentStep === 6 && (
            <div>
              <h2 className="text-3xl font-bold text-text-dark mb-2">
                À quelle fréquence publier ? 📅
              </h2>
              <p className="text-gray-600 mb-8">
                Nous vous proposerons des posts selon ce rythme
              </p>

              <div className="space-y-4">
                {[
                  { value: '2/semaine', label: '2 posts par semaine', desc: 'Idéal pour commencer' },
                  { value: '3/semaine', label: '3 posts par semaine', desc: 'Bon équilibre' },
                  { value: '5/semaine', label: '5 posts par semaine', desc: 'Présence active' },
                  { value: 'quotidien', label: 'Tous les jours', desc: 'Visibilité maximale' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFrequency(option.value)}
                    style={{
                      borderColor: frequency === option.value ? '#FF6B35' : '#e5e7eb',
                      backgroundColor: frequency === option.value ? 'rgba(255, 107, 53, 0.1)' : 'white'
                    }}
                    className="w-full p-6 rounded-xl border-2 text-left transition-all hover:border-coral"
                  >
                    <h3 className="text-xl font-bold text-text-dark mb-1">{option.label}</h3>
                    <p className="text-gray-600 text-sm">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Boutons Navigation */}
          <div className="flex justify-between mt-12 pt-8 border-t">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1 || loading}
              className="px-6 py-3 border-2 border-gray-200 rounded-lg font-semibold text-text-dark hover:border-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Précédent
            </button>

            <button
              onClick={handleNext}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-coral to-ocean text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sauvegarde...' : (currentStep === totalSteps ? 'Terminer 🎉' : 'Suivant →')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;