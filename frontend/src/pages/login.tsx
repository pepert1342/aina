import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!isLogin && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccess('Compte créé ! Vérifiez votre email pour confirmer.');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="login-container"
      style={{
        minHeight: '100vh',
        display: 'flex',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        background: 'linear-gradient(180deg, #FFF5F0 0%, #FFFFFF 30%, #FFFFFF 100%)'
      }}
    >
      {/* Left Side - Form */}
      <div 
        className="login-left"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px 24px',
          backgroundColor: 'transparent',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Cercles décoratifs oranges et bleus */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(255,138,101,0.3) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '-30px',
          width: '100px',
          height: '100px',
          background: 'radial-gradient(circle, rgba(0,78,137,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '-20px',
          width: '80px',
          height: '80px',
          background: 'radial-gradient(circle, rgba(0,78,137,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Logo */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '48px',
              cursor: 'pointer',
              justifyContent: 'center'
            }}
            onClick={() => navigate('/')}
          >
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #FF8A65, #004E89)',
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
              background: 'linear-gradient(135deg, #FF8A65, #004E89)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              AiNa
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#004E89',
            marginBottom: '8px',
            textAlign: 'center',
            textTransform: 'uppercase'
          }}>
            {isLogin ? 'Bon retour' : 'Bienvenue'}
          </h1>
          <p style={{
            color: '#666',
            marginBottom: '32px',
            fontSize: '16px',
            textAlign: 'center'
          }}>
            {isLogin 
              ? 'Connectez-vous pour accéder à votre espace' 
              : 'Rejoignez AiNa et boostez votre communication'}
          </p>

          {/* Toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: '#F0F7FF',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '32px',
            border: '2px solid #004E89'
          }}>
            <button
              onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: isLogin ? '#004E89' : 'transparent',
                color: isLogin ? 'white' : '#004E89',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: isLogin ? '0 4px 12px rgba(0,78,137,0.3)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              Connexion
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: !isLogin ? '#004E89' : 'transparent',
                color: !isLogin ? 'white' : '#004E89',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: !isLogin ? '0 4px 12px rgba(0,78,137,0.3)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              Inscription
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              padding: '14px 16px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              backgroundColor: '#D1FAE5',
              border: '1px solid #A7F3D0',
              color: '#059669',
              padding: '14px 16px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>✅</span>
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#1A1A2E',
                fontSize: '14px'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#FF8A65';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(255, 107, 53, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#1A1A2E',
                fontSize: '14px'
              }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#FF8A65';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(255, 107, 53, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {!isLogin && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#1A1A2E',
                  fontSize: '14px'
                }}>
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#FF8A65';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(255, 107, 53, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            )}

            {isLogin && (
              <div style={{
                textAlign: 'right',
                marginBottom: '24px'
              }}>
                <a href="#" style={{
                  color: '#FF8A65',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Mot de passe oublié ?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px',
                background: loading 
                  ? '#ccc' 
                  : 'linear-gradient(135deg, #FF8A65, #FF8F5E)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '700',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(255, 107, 53, 0.4)',
                transition: 'all 0.3s ease',
                marginTop: !isLogin ? '24px' : '0'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 15px rgba(255, 107, 53, 0.4)';
              }}
            >
              {loading 
                ? '⏳ Chargement...' 
                : isLogin 
                  ? 'Se connecter →' 
                  : 'Créer mon compte →'}
            </button>
          </form>

          {/* Footer */}
          <p style={{
            textAlign: 'center',
            marginTop: '32px',
            color: '#666',
            fontSize: '14px'
          }}>
            {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
            <span
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
              style={{
                color: '#FF8A65',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </span>
          </p>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div 
        className="login-right"
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #1A1A2E 0%, #2C3E50 100%)',
          display: 'flex',
          flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Orbs */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,107,53,0.2) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '10%',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(0,78,137,0.2) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />

        {/* Content */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          {/* Illustration */}
          <div style={{
            width: '180px',
            height: '180px',
            margin: '0 auto 32px',
            background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(0,78,137,0.2))',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '72px'
          }}>
            🤖
          </div>

          <h2 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: 'white',
            marginBottom: '16px',
            lineHeight: '1.3'
          }}>
            Votre Community Manager IA est prêt ! ✨
          </h2>
          
          <p style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.8)',
            lineHeight: '1.6',
            marginBottom: '40px'
          }}>
            Décrivez simplement ce que vous voulez, et laissez l'IA créer vos posts en quelques secondes.
          </p>

          {/* Features List */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            textAlign: 'left'
          }}>
            {[
              { icon: '✨', text: 'Génération de textes percutants' },
              { icon: '🎨', text: 'Création d\'images uniques' },
              { icon: '📅', text: 'Planification de vos événements' },
              { icon: '⚡', text: 'Résultats en 30 secondes' }
            ].map((feature, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '16px 20px',
                borderRadius: '14px',
                backdropFilter: 'blur(10px)'
              }}>
                <span style={{ fontSize: '22px' }}>{feature.icon}</span>
                <span style={{ color: 'white', fontWeight: '500', fontSize: '15px' }}>{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Tagline */}
          <p style={{
            marginTop: '40px',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '14px'
          }}>
            Rejoignez 500+ commerces qui utilisent AiNa
          </p>
        </div>
      </div>

      {/* CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        input::placeholder {
          color: #999;
        }
        
        @media (max-width: 900px) {
          .login-right {
            display: none !important;
          }
        }
        
        @media (max-width: 480px) {
          .login-left {
            padding: 24px 16px !important;
          }
          
          .login-left h1 {
            font-size: 26px !important;
          }
          
          .login-left input,
          .login-left button {
            padding: 14px !important;
            font-size: 15px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;
