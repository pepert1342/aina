import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
            {/* Logo */}
            <svg width="120" height="40" viewBox="0 0 120 40" className="h-10">
              <defs>
                <linearGradient id="dash-logo" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#FF6B35', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#004E89', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <text x="60" y="28" fontFamily="Montserrat, sans-serif" fontSize="32" fontWeight="800" fill="url(#dash-logo)" textAnchor="middle">
                AiNa
              </text>
            </svg>

            {/* User menu */}
            <div className="flex items-center gap-4">
              <span className="text-gray-600">👋 {user?.email}</span>
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
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-coral to-ocean rounded-2xl p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Bienvenue sur AiNa ! 🎉</h1>
          <p className="text-xl opacity-90">
            Votre community manager IA est prêt à travailler pour vous.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button 
            onClick={() => navigate('/calendar')}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all text-left"
          >
            <div className="w-12 h-12 bg-coral/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text-dark mb-2">Nouveau Post</h3>
            <p className="text-gray-600 mb-4">Créez un post en 30 secondes</p>
            <span className="text-coral font-semibold hover:text-ocean transition-colors">
              Créer →
            </span>
          </button>

          <button 
            onClick={() => navigate('/calendar')}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all text-left"
          >
            <div className="w-12 h-12 bg-ocean/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-ocean" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text-dark mb-2">Calendrier</h3>
            <p className="text-gray-600 mb-4">Voir vos posts programmés</p>
            <span className="text-coral font-semibold hover:text-ocean transition-colors">
              Ouvrir →
            </span>
          </button>

          <button 
            onClick={() => navigate('/onboarding')}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all text-left"
          >
            <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text-dark mb-2">Mon Profil</h3>
            <p className="text-gray-600 mb-4">Configurer votre commerce</p>
            <span className="text-coral font-semibold hover:text-ocean transition-colors">
              Modifier →
            </span>
          </button>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl p-8 shadow-md">
          <h2 className="text-2xl font-bold text-text-dark mb-6">🚀 Prochaines étapes</h2>
          
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/onboarding')}
              className="w-full flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-coral text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-text-dark mb-1">Configurez votre profil</h3>
                <p className="text-gray-600">Ajoutez les infos de votre commerce, logo et moodboard</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/calendar')}
              className="w-full flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-ocean text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-text-dark mb-1">Gérez vos événements</h3>
                <p className="text-gray-600">Ajoutez des événements et laissez l'IA créer vos posts</p>
              </div>
            </button>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg opacity-50">
              <div className="w-8 h-8 bg-gold text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-text-dark mb-1">Créez votre premier post</h3>
                <p className="text-gray-600">L'IA va générer 3 versions, choisissez votre préférée !</p>
                <p className="text-xs text-gray-500 mt-1">🔜 Bientôt disponible</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;