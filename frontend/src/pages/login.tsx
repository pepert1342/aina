import React, { useState } from 'react';
import { supabase } from '../supabase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        // Inscription
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('✅ Compte créé ! Vérifiez votre email pour confirmer.');
      } else {
        // Connexion
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage('✅ Connexion réussie !');
      }
    } catch (error: any) {
      setMessage('❌ Erreur : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <svg width="120" height="40" viewBox="0 0 120 40" className="h-12 mx-auto mb-4">
            <defs>
              <linearGradient id="login-logo" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#FF6B35', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#004E89', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <text x="60" y="28" fontFamily="Montserrat, sans-serif" fontSize="32" fontWeight="800" fill="url(#login-logo)" textAnchor="middle">
              AiNa
            </text>
          </svg>
          <h1 className="text-3xl font-bold text-text-dark">
            {isSignUp ? 'Créer un compte' : 'Connexion'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isSignUp ? 'Commencez gratuitement' : 'Bon retour parmi nous !'}
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleAuth} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-text-dark mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-coral focus:outline-none transition-colors"
                placeholder="votre@email.com"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-text-dark mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-coral focus:outline-none transition-colors"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message}
              </div>
            )}

            {/* Bouton Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-coral to-ocean text-white py-3 rounded-lg font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Chargement...' : (isSignUp ? 'Créer mon compte' : 'Se connecter')}
            </button>
          </form>

          {/* Toggle Sign up / Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage('');
              }}
              className="text-coral hover:text-ocean font-semibold transition-colors"
            >
              {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
            </button>
          </div>
        </div>

        {/* Retour accueil */}
        <div className="text-center mt-6">
          <a href="/" className="text-gray-600 hover:text-coral transition-colors">
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;