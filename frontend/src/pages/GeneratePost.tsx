import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { generatePostText } from '../gemini';

interface Business {
  id: string;
  business_name: string;
  business_type: string;
  tone: string;
  platforms: string[];
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
}

function GeneratePost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event');

  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedTexts, setGeneratedTexts] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram');
  const [error, setError] = useState('');

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
    await loadBusinessAndEvent(session.user.id);
  };

  const loadBusinessAndEvent = async (userId: string) => {
    try {
      // Charger le commerce
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (businessError) throw businessError;
      setBusiness(businessData);

      // Charger l'événement si un ID est fourni
      if (eventId) {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;
        setEvent(eventData);
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      setError('Erreur de chargement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!business || !event) {
      setError('Informations manquantes');
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
        event.title,
        event.description || '',
        business.tone || 'Familial',
        selectedPlatform
      );

      setGeneratedTexts(texts);
    } catch (error: any) {
      console.error('Erreur génération:', error);
      setError('Erreur lors de la génération: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePost = async () => {
    if (selectedVersion === null || !generatedTexts[selectedVersion]) {
      alert('Sélectionnez une version');
      return;
    }

    // Pour l'instant, on copie juste le texte
    navigator.clipboard.writeText(generatedTexts[selectedVersion]);
    alert('✅ Texte copié dans le presse-papier !');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-light to-white flex items-center justify-center">
        <div className="text-2xl font-bold text-coral">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <svg width="120" height="40" viewBox="0 0 120 40" className="h-10 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <defs>
                <linearGradient id="gen-logo" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#FF6B35', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#004E89', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <text x="60" y="28" fontFamily="Montserrat, sans-serif" fontSize="32" fontWeight="800" fill="url(#gen-logo)" textAnchor="middle">
                AiNa
              </text>
            </svg>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/calendar')}
                className="text-gray-600 hover:text-coral transition-colors font-semibold"
              >
                ← Calendrier
              </button>
              <span className="text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-text-dark px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-text-dark mb-2">🤖 Générer un Post</h1>
        <p className="text-gray-600 mb-8">L'IA va créer 3 versions de texte pour votre événement</p>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne gauche : Infos événement */}
          <div className="space-y-6">
            {/* Info Commerce */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-text-dark mb-4">🏪 Votre Commerce</h2>
              {business ? (
                <div className="space-y-2">
                  <p><span className="font-semibold">Nom :</span> {business.business_name}</p>
                  <p><span className="font-semibold">Type :</span> {business.business_type}</p>
                  <p><span className="font-semibold">Ton :</span> {business.tone || 'Non défini'}</p>
                </div>
              ) : (
                <p className="text-gray-500">Commerce non trouvé</p>
              )}
            </div>

            {/* Info Événement */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-text-dark mb-4">📅 Événement</h2>
              {event ? (
                <div className="space-y-2">
                  <p><span className="font-semibold">Titre :</span> {event.title}</p>
                  <p><span className="font-semibold">Date :</span> {new Date(event.event_date).toLocaleDateString('fr-FR')}</p>
                  <p><span className="font-semibold">Description :</span> {event.description || 'Aucune'}</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-4">Aucun événement sélectionné</p>
                  <button
                    onClick={() => navigate('/calendar')}
                    className="text-coral font-semibold hover:text-ocean"
                  >
                    → Sélectionner un événement
                  </button>
                </div>
              )}
            </div>

            {/* Sélection plateforme */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-text-dark mb-4">📱 Plateforme</h2>
              <div className="flex gap-4">
                {['Instagram', 'Facebook', 'TikTok'].map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatform(platform)}
                    style={{
                      borderColor: selectedPlatform === platform ? '#FF6B35' : '#e5e7eb',
                      backgroundColor: selectedPlatform === platform ? 'rgba(255, 107, 53, 0.1)' : 'white'
                    }}
                    className="flex-1 py-3 rounded-lg border-2 font-semibold transition-all"
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            {/* Bouton Générer */}
            <button
              onClick={handleGenerate}
              disabled={!event || generating}
              className="w-full bg-gradient-to-r from-coral to-ocean text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {generating ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Génération en cours...
                </>
              ) : (
                <>
                  🚀 Générer les textes
                </>
              )}
            </button>
          </div>

          {/* Colonne droite : Résultats */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-text-dark mb-4">✨ Textes Générés</h2>
              
              {generatedTexts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🤖</div>
                  <p>Cliquez sur "Générer les textes" pour créer vos posts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generatedTexts.map((text, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedVersion(index)}
                      style={{
                        borderColor: selectedVersion === index ? '#FF6B35' : '#e5e7eb',
                        backgroundColor: selectedVersion === index ? 'rgba(255, 107, 53, 0.05)' : 'white'
                      }}
                      className="p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-text-dark">
                          Version {index + 1}
                          {index === 0 && ' (Courte)'}
                          {index === 1 && ' (Moyenne)'}
                          {index === 2 && ' (Longue)'}
                        </span>
                        {selectedVersion === index && (
                          <span className="bg-coral text-white px-3 py-1 rounded-full text-sm font-semibold">
                            ✓ Sélectionnée
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bouton Copier */}
            {generatedTexts.length > 0 && (
              <button
                onClick={handleSavePost}
                disabled={selectedVersion === null}
                className="w-full bg-ocean text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📋 Copier le texte sélectionné
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default GeneratePost;