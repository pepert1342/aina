import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo AiNa */}
            <div className="flex items-center">
              <svg width="120" height="40" viewBox="0 0 120 40" className="h-10">
                <defs>
                  <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#FF6B35', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#004E89', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <text x="60" y="28" fontFamily="Montserrat, sans-serif" fontSize="32" fontWeight="800" fill="url(#logo-gradient)" textAnchor="middle">
                  AiNa
                </text>
              </svg>
            </div>
            
            <button className="bg-gradient-to-r from-coral to-ocean text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all">
              Commencer
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-text-dark mb-6">
            Gérez vos réseaux sociaux
            <br />
            <span className="bg-gradient-to-r from-coral to-ocean bg-clip-text text-transparent">
              en 30 secondes
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            AiNa génère automatiquement vos posts Instagram, Facebook et TikTok.
            Personnalisés, professionnels, prêts à publier.
          </p>

          <div className="flex gap-4 justify-center">
            <button className="bg-gradient-to-r from-coral to-ocean text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl transition-all">
              Essayer gratuitement
            </button>
            <button className="bg-white text-text-dark border-2 border-gray-200 px-8 py-4 rounded-full font-bold text-lg hover:border-coral transition-all">
              Voir la démo
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-coral mb-2">30s</div>
              <div className="text-gray-600">pour générer un post</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-ocean mb-2">49€</div>
              <div className="text-gray-600">par mois, tout inclus</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gold mb-2">∞</div>
              <div className="text-gray-600">posts illimités</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text-dark text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2024 AiNa. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
