import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#FAFBFC',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      overflowX: 'hidden'
    }}>
      
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '16px 32px',
        backgroundColor: scrollY > 50 ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        boxShadow: scrollY > 50 ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.3s ease',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #FF6B35, #004E89)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '800',
            fontSize: '18px'
          }}>
            A
          </div>
          <span style={{ 
            fontSize: '24px', 
            fontWeight: '800',
            background: 'linear-gradient(135deg, #FF6B35, #004E89)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AiNa
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              border: '2px solid #2C3E50',
              borderRadius: '12px',
              color: '#2C3E50',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2C3E50';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#2C3E50';
            }}
          >
            Connexion
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #FF6B35, #FF8F5E)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 107, 53, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.4)';
            }}
          >
            S'inscrire
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 32px 80px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Gradient Orbs */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(0,78,137,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 10s ease-in-out infinite reverse'
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '80px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Left Content */}
          <div style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease-out'
          }}>
            <div style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 107, 53, 0.1)',
              borderRadius: '50px',
              marginBottom: '24px'
            }}>
              <span style={{ color: '#FF6B35', fontWeight: '600', fontSize: '14px' }}>
                ✨ Propulsé par l'Intelligence Artificielle
              </span>
            </div>
            
            <h1 style={{
              fontSize: '56px',
              fontWeight: '800',
              color: '#1A1A2E',
              lineHeight: '1.1',
              marginBottom: '24px'
            }}>
              Votre Community Manager{' '}
              <span style={{
                background: 'linear-gradient(135deg, #FF6B35, #004E89)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                IA Personnel
              </span>
            </h1>
            
            <p style={{
              fontSize: '20px',
              color: '#666',
              lineHeight: '1.6',
              marginBottom: '40px'
            }}>
              Créez des posts professionnels pour vos réseaux sociaux en 30 secondes. 
              Textes percutants, images magnifiques, tout est automatisé.
            </p>
            
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '18px 36px',
                  background: 'linear-gradient(135deg, #FF6B35, #FF8F5E)',
                  border: 'none',
                  borderRadius: '16px',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '18px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 30px rgba(255, 107, 53, 0.4)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 107, 53, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(255, 107, 53, 0.4)';
                }}
              >
                S'inscrire maintenant
                <span style={{ fontSize: '20px' }}>→</span>
              </button>
              
              <button
                style={{
                  padding: '18px 36px',
                  backgroundColor: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '16px',
                  color: '#2C3E50',
                  fontWeight: '600',
                  fontSize: '18px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FF6B35';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 107, 53, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <span style={{ fontSize: '20px' }}>▶</span>
                Voir la démo
              </button>
            </div>
            
            {/* Trust Badges */}
            <div style={{ marginTop: '48px', display: 'flex', alignItems: 'center', gap: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>⭐</span>
                <span style={{ color: '#666', fontSize: '14px' }}><strong style={{ color: '#1A1A2E' }}>4.9/5</strong> sur 200+ avis</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🚀</span>
                <span style={{ color: '#666', fontSize: '14px' }}><strong style={{ color: '#1A1A2E' }}>500+</strong> commerces</span>
              </div>
            </div>
          </div>
          
          {/* Right - Mockup */}
          <div style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateX(0)' : 'translateX(30px)',
            transition: 'all 0.8s ease-out 0.2s',
            position: 'relative'
          }}>
            {/* Phone Mockup */}
            <div style={{
              width: '300px',
              height: '600px',
              backgroundColor: '#1A1A2E',
              borderRadius: '40px',
              padding: '12px',
              margin: '0 auto',
              boxShadow: '0 50px 100px rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              {/* Notch */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '120px',
                height: '30px',
                backgroundColor: '#1A1A2E',
                borderRadius: '0 0 20px 20px',
                zIndex: 10
              }} />
              
              {/* Screen */}
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'white',
                borderRadius: '32px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* App Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #FF6B35, #004E89)',
                  padding: '50px 20px 20px',
                  color: 'white'
                }}>
                  <div style={{ fontWeight: '700', fontSize: '18px' }}>AiNa</div>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Créer un post</div>
                </div>
                
                {/* Content */}
                <div style={{ padding: '16px' }}>
                  <div style={{
                    backgroundColor: '#F8F9FA',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>📝 Description</div>
                    <div style={{ fontSize: '13px', color: '#1A1A2E' }}>Plat du jour : Daube de sanglier...</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ flex: 1, backgroundColor: '#FF6B35', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '11px', textAlign: 'center', fontWeight: '600' }}>Instagram</div>
                    <div style={{ flex: 1, backgroundColor: '#F8F9FA', padding: '10px', borderRadius: '8px', fontSize: '11px', textAlign: 'center' }}>Facebook</div>
                  </div>
                  
                  <div style={{
                    background: 'linear-gradient(135deg, #FF6B35, #004E89)',
                    color: 'white',
                    padding: '14px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '13px'
                  }}>
                    ✨ Générer le post
                  </div>
                  
                  {/* Generated Post Preview */}
                  <div style={{
                    marginTop: '16px',
                    backgroundColor: '#F8F9FA',
                    borderRadius: '12px',
                    padding: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B35, #004E89)' }} />
                      <div style={{ fontSize: '11px', fontWeight: '600' }}>Pe Piace</div>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '120px', 
                      background: 'linear-gradient(135deg, #FFE5D9, #E8F4FD)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px'
                    }}>
                      🍽️
                    </div>
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '8px', lineHeight: '1.4' }}>
                      🍴 Notre chef vous régale aujourd'hui avec une délicieuse daube de sanglier... 
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '-20px',
              backgroundColor: 'white',
              padding: '16px 20px',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              animation: 'float 4s ease-in-out infinite'
            }}>
              <span style={{ fontSize: '24px', marginRight: '8px' }}>✨</span>
              <span style={{ fontWeight: '600', color: '#1A1A2E' }}>3 versions générées</span>
            </div>
            
            <div style={{
              position: 'absolute',
              bottom: '25%',
              right: '-30px',
              backgroundColor: 'white',
              padding: '16px 20px',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              animation: 'float 5s ease-in-out infinite reverse'
            }}>
              <span style={{ fontSize: '24px', marginRight: '8px' }}>🎨</span>
              <span style={{ fontWeight: '600', color: '#1A1A2E' }}>Image IA créée</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '100px 32px',
        backgroundColor: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: 'rgba(0, 78, 137, 0.1)',
              borderRadius: '50px',
              marginBottom: '16px',
              color: '#004E89',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              Fonctionnalités
            </span>
            <h2 style={{
              fontSize: '42px',
              fontWeight: '800',
              color: '#1A1A2E',
              marginBottom: '16px'
            }}>
              Tout ce dont vous avez besoin
            </h2>
            <p style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
              Une solution complète pour gérer votre présence sur les réseaux sociaux
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '32px'
          }}>
            {[
              {
                icon: '✨',
                title: 'Génération IA',
                description: 'Des textes percutants générés en 30 secondes grâce à l\'intelligence artificielle',
                color: '#FF6B35'
              },
              {
                icon: '🎨',
                title: 'Images Automatiques',
                description: 'Des visuels professionnels créés automatiquement pour vos posts',
                color: '#004E89'
              },
              {
                icon: '📅',
                title: 'Calendrier Intelligent',
                description: 'Planifiez vos posts et ne ratez plus aucun événement important',
                color: '#F5A623'
              },
              {
                icon: '📱',
                title: 'Multi-Plateformes',
                description: 'Instagram, Facebook, TikTok... Un seul outil pour tous vos réseaux',
                color: '#10B981'
              },
              {
                icon: '🎯',
                title: 'Personnalisé',
                description: 'L\'IA s\'adapte à votre ton, votre style et votre identité de marque',
                color: '#8B5CF6'
              },
              {
                icon: '⚡',
                title: 'Ultra Rapide',
                description: 'De l\'idée au post publié en moins d\'une minute',
                color: '#EC4899'
              }
            ].map((feature, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#FAFBFC',
                  padding: '32px',
                  borderRadius: '24px',
                  transition: 'all 0.3s ease',
                  cursor: 'default',
                  border: '2px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = feature.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: `${feature.color}15`,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  marginBottom: '20px'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1A1A2E',
                  marginBottom: '12px'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: '#666',
                  lineHeight: '1.6'
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{
        padding: '100px 32px',
        background: 'linear-gradient(180deg, #FAFBFC 0%, white 100%)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 107, 53, 0.1)',
              borderRadius: '50px',
              marginBottom: '16px',
              color: '#FF6B35',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              Comment ça marche
            </span>
            <h2 style={{
              fontSize: '42px',
              fontWeight: '800',
              color: '#1A1A2E',
              marginBottom: '16px'
            }}>
              3 étapes simples
            </h2>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '48px'
          }}>
            {[
              {
                step: '1',
                title: 'Décrivez',
                description: 'Expliquez en quelques mots ce que vous voulez promouvoir'
              },
              {
                step: '2',
                title: 'Générez',
                description: 'L\'IA crée instantanément 3 versions de texte + une image'
              },
              {
                step: '3',
                title: 'Publiez',
                description: 'Choisissez votre version préférée et partagez-la !'
              }
            ].map((item, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #FF6B35, #004E89)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: 'white',
                  fontSize: '32px',
                  fontWeight: '800',
                  boxShadow: '0 10px 30px rgba(255, 107, 53, 0.3)'
                }}>
                  {item.step}
                </div>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#1A1A2E',
                  marginBottom: '12px'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  color: '#666',
                  lineHeight: '1.6'
                }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '100px 32px',
        background: 'linear-gradient(135deg, #1A1A2E 0%, #2C3E50 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,107,53,0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 50%, rgba(0,78,137,0.1) 0%, transparent 50%)`,
          pointerEvents: 'none'
        }} />
        
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: '42px',
            fontWeight: '800',
            color: 'white',
            marginBottom: '24px'
          }}>
            Prêt à révolutionner votre communication ?
          </h2>
          <p style={{
            fontSize: '20px',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '40px'
          }}>
            Rejoignez plus de 500 commerces qui utilisent déjà AiNa pour créer du contenu incroyable.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '20px 48px',
              background: 'linear-gradient(135deg, #FF6B35, #FF8F5E)',
              border: 'none',
              borderRadius: '16px',
              color: 'white',
              fontWeight: '700',
              fontSize: '20px',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(255, 107, 53, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 107, 53, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(255, 107, 53, 0.4)';
            }}
          >
            S'inscrire 🚀
          </button>
          <p style={{
            marginTop: '16px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '14px'
          }}>
            Configuration en 2 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '64px 32px 32px',
        backgroundColor: '#1A1A2E'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '48px',
            marginBottom: '48px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #FF6B35, #004E89)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '800',
                  fontSize: '18px'
                }}>
                  A
                </div>
                <span style={{ fontSize: '24px', fontWeight: '800', color: 'white' }}>AiNa</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', maxWidth: '280px' }}>
                L'assistant IA qui révolutionne la communication des petits commerces.
              </p>
            </div>
            
            <div>
              <h4 style={{ color: 'white', fontWeight: '600', marginBottom: '16px' }}>Produit</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Fonctionnalités</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Tarifs</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>FAQ</a>
              </div>
            </div>
            
            <div>
              <h4 style={{ color: 'white', fontWeight: '600', marginBottom: '16px' }}>Entreprise</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>À propos</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Blog</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Contact</a>
              </div>
            </div>
            
            <div>
              <h4 style={{ color: 'white', fontWeight: '600', marginBottom: '16px' }}>Légal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>CGU</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Confidentialité</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Cookies</a>
              </div>
            </div>
          </div>
          
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
              © 2025 AiNa. Tous droits réservés.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ fontSize: '20px', cursor: 'pointer' }}>📘</span>
              <span style={{ fontSize: '20px', cursor: 'pointer' }}>📸</span>
              <span style={{ fontSize: '20px', cursor: 'pointer' }}>🐦</span>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      `}</style>
    </div>
  );
}

export default App;
