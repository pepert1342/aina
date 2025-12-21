import { useState, useEffect } from 'react';
import { ZapIcon, PaletteIcon, CalendarIcon, SparklesIcon, ArrowRightIcon, DownloadIcon } from './components/Icons';
import { useNavigate } from 'react-router-dom';

// Interface pour l'événement d'installation PWA
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function App() {
  const navigate = useNavigate();
  const [isVisible] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [showSafariInstructions, setShowSafariInstructions] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Détecter Safari (iOS et macOS)
    const ua = navigator.userAgent;
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(ua) ||
      (/iPad|iPhone|iPod/.test(ua) && !('MSStream' in window));
    setIsSafari(isSafariBrowser);

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Écouter quand l'app est installée
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isSafari) {
      setShowSafariInstructions(true);
      return;
    }

    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  // Détecter si on est sur iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);

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
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: '2px solid #1a3a5c',
              borderRadius: '10px',
              color: '#1a3a5c',
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
              background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              boxShadow: '0 4px 15px rgba(200, 75, 49, 0.3)'
            }}
          >
            S'inscrire
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '40px 16px 24px',
        background: 'linear-gradient(180deg, #FFF8E7 0%, #FFFFFF 100%)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out'
      }}>
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
            background: 'linear-gradient(135deg, #c84b31, #1a3a5c)',
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
          Une IA qui apprend votre style, crée des posts uniques inspirés de votre commerce, et vous aide à ne rien oublier grâce au calendrier intelligent.
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
              background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontWeight: '700',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(200, 75, 49, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <SparklesIcon size={18} color="white" />
              Commencer
            </button>

          {/* Bouton Installer l'application */}
          {(installPrompt || isSafari) && !isInstalled && (
            <button
              onClick={handleInstallClick}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '700',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(26, 58, 92, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <DownloadIcon size={18} color="white" />
                Installer l'application
            </button>
          )}
        </div>

        {/* 3 Étapes */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '0',
          padding: '0 16px'
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '700',
              fontSize: '14px',
              margin: '0 auto 8px'
            }}>1</div>
            <p style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>Parlez-nous de votre business</p>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '700',
              fontSize: '14px',
              margin: '0 auto 8px'
            }}>2</div>
            <p style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>Décrivez vos besoins</p>
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
            <p style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>L'IA génère, vous publiez !</p>
          </div>
        </div>

        </section>

      {/* Features Section */}
      <section style={{
        padding: '24px 16px',
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
            backgroundColor: '#e8f4fd',
            borderRadius: '14px',
            padding: '18px',
            border: '1px solid #DCE8F5'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              }}><ZapIcon size={20} color='white' /></div>
            <h3 style={{ fontWeight: '700', fontSize: '15px', color: '#1A1A2E', marginBottom: '4px' }}>
              Génération instantanée
            </h3>
            <p style={{ color: '#666', fontSize: '12px', lineHeight: '1.5' }}>
              Créez des posts en 30 secondes grâce à l'IA.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{
            backgroundColor: '#FFF8E7',
            borderRadius: '14px',
            padding: '18px',
            border: '1px solid #f5e6dc'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              }}><PaletteIcon size={20} color='white' /></div>
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
              }}><CalendarIcon size={20} color='white' /></div>
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
        background: 'linear-gradient(135deg, #1a3a5c, #c84b31)',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              width: '100%',
              maxWidth: '280px',
              padding: '16px 32px',
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '12px',
              color: '#1a3a5c',
              fontWeight: '700',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              Démarrer maintenant
              <ArrowRightIcon size={18} color="#1a3a5c" />
          </button>

          {/* Bouton Installer l'application */}
          {(installPrompt || isSafari) && !isInstalled && (
            <button
              onClick={handleInstallClick}
              style={{
                width: '100%',
                maxWidth: '280px',
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '700',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <DownloadIcon size={18} color="white" />
                Installer l'application
            </button>
          )}
        </div>
      </section>

      {/* Réseaux sociaux */}
      <section style={{
        padding: '32px 16px',
        backgroundColor: '#FFF8E7',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px', fontWeight: '600' }}>
          Idéal pour vos réseaux
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px'
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

      {/* Modal Instructions Safari */}
      {showSafariInstructions && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setShowSafariInstructions(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '340px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <DownloadIcon size={28} color="white" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A2E', marginBottom: '8px' }}>
                Installer AiNa
              </h3>
              <p style={{ fontSize: '14px', color: '#666' }}>
                {isIOS ? 'Sur iPhone/iPad' : 'Sur Safari'}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              {isIOS ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: '#007AFF',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2L12 14M12 2L7 7M12 2L17 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        <path d="M4 14V20H20V14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A2E' }}>1. Appuyez sur Partager</p>
                      <p style={{ fontSize: '12px', color: '#888' }}>L'icône en bas de Safari</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: '#1a3a5c',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <rect x="3" y="3" width="18" height="18" rx="3" stroke="white" strokeWidth="2" fill="none"/>
                        <path d="M12 8V16M8 12H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A2E' }}>2. "Sur l'écran d'accueil"</p>
                      <p style={{ fontSize: '12px', color: '#888' }}>Faites défiler et appuyez</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: '#10B981',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M5 12L10 17L19 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A2E' }}>3. Appuyez sur "Ajouter"</p>
                      <p style={{ fontSize: '12px', color: '#888' }}>L'app sera sur votre écran</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: '#007AFF',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2L12 14M12 2L7 7M12 2L17 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        <path d="M4 14V20H20V14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A2E' }}>1. Menu Fichier ou Partager</p>
                      <p style={{ fontSize: '12px', color: '#888' }}>En haut de Safari</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: '#1a3a5c',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <rect x="3" y="3" width="18" height="18" rx="3" stroke="white" strokeWidth="2" fill="none"/>
                        <path d="M12 8V16M8 12H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A2E' }}>2. "Ajouter au Dock"</p>
                      <p style={{ fontSize: '12px', color: '#888' }}>L'app sera dans votre Dock</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowSafariInstructions(false)}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '600',
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
