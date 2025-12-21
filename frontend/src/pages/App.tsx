import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  const [isVisible] = useState(true);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#FFF8E7',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      overflowX: 'hidden',
      width: '100%',
      maxWidth: '100vw'
    }}>
      
      {/* Navigation */}
      <nav style={{
        padding: '12px 16px',
        backgroundColor: 'rgba(255,248,231,0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{
            fontSize: '28px',
            fontFamily: "'Titan One', cursive",
            color: '#C84B31'
          }}>
            AiNa
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: '2px solid #004E89',
              borderRadius: '10px',
              color: '#004E89',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Connexion
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #FF8A65, #FFB088)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              boxShadow: '0 4px 15px rgba(255, 138, 101, 0.3)'
            }}
          >
            S'inscrire
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '40px 16px',
        background: 'linear-gradient(180deg, #FFF5F2 0%, #FFFFFF 100%)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out'
      }}>
        {/* Badge */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{
            display: 'inline-block',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #FF8A65, #FFB088)',
            borderRadius: '50px',
            color: 'white',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            🚀 Intelligence Artificielle
          </span>
        </div>

        {/* Titre */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: '800',
          textAlign: 'center',
          marginBottom: '16px',
          lineHeight: '1.2'
        }}>
          <span style={{ color: '#1A1A2E' }}>Votre </span>
          <span style={{
            background: 'linear-gradient(135deg, #FF8A65, #004E89)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Community Manager</span>
          <br />
          <span style={{ color: '#1A1A2E' }}>Personnel</span>
        </h1>

        {/* Sous-titre */}
        <p style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '14px',
          lineHeight: '1.6',
          marginBottom: '24px',
          padding: '0 10px'
        }}>
          Créez des posts professionnels pour vos réseaux sociaux en 30 secondes grâce à l'IA.
        </p>

        {/* CTA Button */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '0 20px',
          marginBottom: '32px'
        }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #FF8A65, #FFB088)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontWeight: '700',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(255, 138, 101, 0.4)'
            }}
          >
            ✨ Commencer
          </button>
        </div>

        {/* 3 Étapes */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '32px',
          padding: '0 16px'
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #FF8A65, #FFB088)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '700',
              fontSize: '14px',
              margin: '0 auto 8px'
            }}>1</div>
            <p style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>Décrivez votre post</p>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #004E89, #0077CC)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '700',
              fontSize: '14px',
              margin: '0 auto 8px'
            }}>2</div>
            <p style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>L'IA génère</p>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #10B981, #34D399)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '700',
              fontSize: '14px',
              margin: '0 auto 8px'
            }}>3</div>
            <p style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>Publiez !</p>
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div style={{
          textAlign: 'center',
          padding: '0 20px'
        }}>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>
            Idéal pour vos réseaux
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {/* Instagram */}
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #833AB4, #E4405F, #FFDC80)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(228, 64, 95, 0.3)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="2" fill="none"/>
                <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" fill="none"/>
                <circle cx="17.5" cy="6.5" r="1.5" fill="white"/>
              </svg>
            </div>
            
            {/* Facebook */}
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              backgroundColor: '#1877F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(24, 119, 242, 0.3)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            
            {/* TikTok */}
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              backgroundColor: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
            </div>
            
            {/* LinkedIn */}
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              backgroundColor: '#0A66C2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(10, 102, 194, 0.3)'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '32px 16px',
        backgroundColor: 'white'
      }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: '800',
          textAlign: 'center',
          marginBottom: '8px',
          color: '#1A1A2E'
        }}>
          Pourquoi AiNa ?
        </h2>
        <p style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '14px',
          marginBottom: '24px'
        }}>
          Tout ce dont vous avez besoin
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Feature 1 */}
          <div style={{
            backgroundColor: '#F0F7FF',
            borderRadius: '14px',
            padding: '18px',
            border: '1px solid #DCE8F5'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #004E89, #0077CC)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              fontSize: '18px'
            }}>⚡</div>
            <h3 style={{ fontWeight: '700', fontSize: '15px', color: '#1A1A2E', marginBottom: '4px' }}>
              Génération instantanée
            </h3>
            <p style={{ color: '#666', fontSize: '12px', lineHeight: '1.5' }}>
              Créez des posts en 30 secondes grâce à l'IA.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{
            backgroundColor: '#FFF5F2',
            borderRadius: '14px',
            padding: '18px',
            border: '1px solid #FFE5DC'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #FF8A65, #FFB088)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              fontSize: '18px'
            }}>🎨</div>
            <h3 style={{ fontWeight: '700', fontSize: '15px', color: '#1A1A2E', marginBottom: '4px' }}>
              Design personnalisé
            </h3>
            <p style={{ color: '#666', fontSize: '12px', lineHeight: '1.5' }}>
              Des visuels adaptés à votre identité.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{
            backgroundColor: '#F0FDF4',
            borderRadius: '14px',
            padding: '18px',
            border: '1px solid #BBF7D0'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #10B981, #34D399)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              fontSize: '18px'
            }}>📅</div>
            <h3 style={{ fontWeight: '700', fontSize: '15px', color: '#1A1A2E', marginBottom: '4px' }}>
              Calendrier intelligent
            </h3>
            <p style={{ color: '#666', fontSize: '12px', lineHeight: '1.5' }}>
              Ne ratez aucun événement.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '40px 16px',
        background: 'linear-gradient(135deg, #004E89, #FF8A65)',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: '800',
          color: 'white',
          marginBottom: '12px'
        }}>
          Prêt à booster vos réseaux ?
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: '14px',
          marginBottom: '24px'
        }}>
          Rejoignez des centaines de commerces
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%',
            maxWidth: '280px',
            padding: '16px 32px',
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '12px',
            color: '#004E89',
            fontWeight: '700',
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
          }}
        >
          🚀 Démarrer maintenant
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '24px 16px',
        backgroundColor: '#1A1A2E',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
          <span style={{ color: '#FFF8E7', fontSize: '24px', fontFamily: "'Titan One', cursive" }}>AiNa</span>
        </div>
        <p style={{ color: '#888', fontSize: '12px' }}>
          © 2024 AiNa - Votre Community Manager IA
        </p>
      </footer>
    </div>
  );
}

export default App;
