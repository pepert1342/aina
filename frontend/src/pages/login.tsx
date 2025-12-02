import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import logoAina from '/logo-aina.png';

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Vérifier si l'utilisateur a un commerce
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', data.user.id)
          .single();

        if (business) {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Vérifiez votre email pour confirmer votre inscription !');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #004E89 0%, #0077CC 50%, #FF8A65 100%)',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
      width: '100%',
      maxWidth: '100vw'
    }}>
      {/* Header */}
      <header style={{
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <img 
          src={logoAina} 
          alt="AiNa" 
          style={{ width: '44px', height: '44px', objectFit: 'contain' }}
        />
        <span style={{ 
          fontSize: '22px', 
          fontWeight: '800',
          fontFamily: "'Poppins', sans-serif",
          color: 'white'
        }}>
          AiNa
        </span>
      </header>

      {/* Main */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '32px 24px',
          width: '100%',
          maxWidth: '380px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          {/* Logo centré */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img 
              src={logoAina} 
              alt="AiNa" 
              style={{ width: '70px', height: '70px', objectFit: 'contain', marginBottom: '8px' }}
            />
            <h1 style={{
              fontSize: '26px',
              fontWeight: '800',
              fontFamily: "'Poppins', sans-serif",
              background: 'linear-gradient(135deg, #FF8A65, #004E89)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>AiNa</h1>
            <p style={{ color: '#888', fontSize: '13px' }}>
              Votre Community Manager IA
            </p>
          </div>

          {/* Toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: '#F5F5F5',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '24px'
          }}>
            <button
              onClick={() => setIsLogin(true)}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: isLogin ? 'white' : 'transparent',
                color: isLogin ? '#004E89' : '#888',
                boxShadow: isLogin ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >Connexion</button>
            <button
              onClick={() => setIsLogin(false)}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: !isLogin ? 'white' : 'transparent',
                color: !isLogin ? '#004E89' : '#888',
                boxShadow: !isLogin ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >Inscription</button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#333' }}>
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
                  padding: '14px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#333' }}>
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
                  padding: '14px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>

            {error && (
              <div style={{
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px'
              }}>{error}</div>
            )}

            {message && (
              <div style={{
                backgroundColor: '#D1FAE5',
                color: '#059669',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px'
              }}>{message}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#E5E7EB' : 'linear-gradient(135deg, #FF8A65, #FFB088)',
                border: 'none',
                borderRadius: '10px',
                color: loading ? '#999' : 'white',
                fontWeight: '700',
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(255, 138, 101, 0.4)'
              }}
            >
              {loading ? '⏳ Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Login;
