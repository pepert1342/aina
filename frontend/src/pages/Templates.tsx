import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import {
  HomeIcon, PlusIcon, LoaderIcon,
  DiamondIcon, LogoutIcon, PaletteIcon, CalendarIcon,
  CopyIcon, ImageIcon, LightbulbIcon, TrendingUpIcon
} from '../components/Icons';

interface Template {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  text_content: string | null;
  description: string | null;
  platform: string | null;
  tone: string | null;
  style: string | null;
  use_count: number;
  is_favorite: boolean;
  created_at: string;
}

// Icône Trash si elle n'existe pas
const TrashIconComponent = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const StarIconComponent = ({ size = 20, color = 'currentColor', filled = false }: { size?: number; color?: string; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

interface UserType {
  id: string;
  email?: string;
}

interface SubscriptionType {
  id: string;
  status: string;
  plan?: string;
}

function Templates() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [, setSubscription] = useState<SubscriptionType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const categories = [
    { value: 'all', label: 'Tous', icon: '📋' },
    { value: 'promotion', label: 'Promotions', icon: '🏷️' },
    { value: 'nouveau_produit', label: 'Nouveautés', icon: '✨' },
    { value: 'evenement', label: 'Événements', icon: '🎉' },
    { value: 'quotidien', label: 'Quotidien', icon: '📅' },
    { value: 'autre', label: 'Autres', icon: '📌' }
  ];

  const loadTemplates = async (userId: string) => {
    const { data, error } = await supabase
      .from('post_templates')
      .select('*')
      .eq('user_id', userId)
      .order('is_favorite', { ascending: false })
      .order('use_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) {
      setTemplates(data);
    }
    if (error) {
      console.error('Erreur chargement templates:', error);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      await loadTemplates(session.user.id);

      // Charger l'abonnement
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subData) setSubscription(subData);

      setLoading(false);
      setTimeout(() => setIsVisible(true), 100);
    };

    checkUser();
  }, [navigate]);

  const handleUseTemplate = async (template: Template) => {
    // Incrémenter le compteur d'utilisation
    await supabase
      .from('post_templates')
      .update({ use_count: template.use_count + 1 })
      .eq('id', template.id);

    // Naviguer vers CreatePost avec les données du template
    const params = new URLSearchParams();
    if (template.description) params.set('description', template.description);
    if (template.platform) params.set('platform', template.platform);
    if (template.text_content) params.set('text', template.text_content);
    params.set('templateId', template.id);

    navigate(`/create?${params.toString()}`);
  };

  const handleToggleFavorite = async (template: Template) => {
    const newStatus = !template.is_favorite;

    await supabase
      .from('post_templates')
      .update({ is_favorite: newStatus })
      .eq('id', template.id);

    setTemplates(prev => prev.map(t =>
      t.id === template.id ? { ...t, is_favorite: newStatus } : t
    ).sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) return b.is_favorite ? 1 : -1;
      return b.use_count - a.use_count;
    }));
  };

  const handleDelete = async (templateId: string) => {
    await supabase
      .from('post_templates')
      .delete()
      .eq('id', templateId);

    setTemplates(prev => prev.filter(t => t.id !== templateId));
    setDeleteConfirm(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || '📌';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFF8E7',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <LoaderIcon size={48} color="#C84B31" />
          <p style={{ color: '#666', marginTop: '16px' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFF8E7',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflowX: 'hidden',
      width: '100%',
      maxWidth: '100vw'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'rgba(255,248,231,0.95)',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%'
      }}>
        <div style={{
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            <span style={{
              fontSize: '28px',
              fontFamily: "'Titan One', cursive",
              color: '#C84B31'
            }}>AiNa</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: '0 4px 15px rgba(26, 58, 92, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <HomeIcon size={14} color="white" /> Accueil
            </button>

            {/* Menu Profil */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
                  border: 'none',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(200, 75, 49, 0.3)'
                }}
              >
                {user?.email?.charAt(0).toUpperCase()}
              </button>

              {showUserMenu && (
                <>
                  <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '48px',
                    right: 0,
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    padding: '8px',
                    minWidth: '200px',
                    zIndex: 100,
                    border: '1px solid #E5E7EB'
                  }}>
                    <div style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', marginBottom: '8px' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A2E', margin: 0 }}>
                        {user?.email}
                      </p>
                    </div>

                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/subscription'); }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <DiamondIcon size={18} color="#2d5a45" />
                      Mon abonnement
                    </button>

                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/create'); }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <PlusIcon size={18} color="#c84b31" />
                      Nouveau Post
                    </button>

                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/calendar'); }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <CalendarIcon size={18} color="#1a3a5c" />
                      Calendrier
                    </button>

                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/moodboard'); }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <PaletteIcon size={18} color="#2d5a45" />
                      Moodboard
                    </button>

                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/dashboard?tab=posts'); }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <ImageIcon size={18} color="#8B5CF6" />
                      Mes Posts
                    </button>

                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/dashboard?tab=tips'); }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <LightbulbIcon size={18} color="#2d5a45" />
                      Tips & Conseils
                    </button>

                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/dashboard?tab=stats'); }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <TrendingUpIcon size={18} color="#8B5CF6" />
                      Statistiques
                    </button>

                    <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '8px 0' }} />

                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#DC2626',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <LogoutIcon size={18} color="#DC2626" />
                      Déconnexion
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{
        padding: '16px',
        maxWidth: '800px',
        margin: '0 auto',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out'
      }}>
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 10px 40px rgba(200, 75, 49, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              📋
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>
                Mes Templates
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', marginTop: '2px' }}>
                {templates.length} template{templates.length > 1 ? 's' : ''} sauvegardé{templates.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Filtres par catégorie */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px'
        }}>
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '50px',
                border: selectedCategory === cat.value ? 'none' : '2px solid #E5E7EB',
                background: selectedCategory === cat.value
                  ? 'linear-gradient(135deg, #1a3a5c, #2a5a7c)'
                  : 'white',
                color: selectedCategory === cat.value ? 'white' : '#374151',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                boxShadow: selectedCategory === cat.value ? '0 4px 15px rgba(26, 58, 92, 0.3)' : 'none'
              }}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Liste des templates */}
        {filteredTemplates.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '40px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A2E', marginBottom: '8px' }}>
              {selectedCategory === 'all' ? 'Aucun template' : 'Aucun template dans cette catégorie'}
            </h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              Créez votre premier template en sauvegardant un post que vous aimez !
            </p>
            <button
              onClick={() => navigate('/create')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #c84b31, #e06b4f)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 4px 15px rgba(200, 75, 49, 0.3)'
              }}
            >
              ✨ Créer un post
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  border: template.is_favorite ? '2px solid #F59E0B' : '1px solid #E5E7EB'
                }}
              >
                <div style={{ display: 'flex' }}>
                  {/* Image */}
                  <div style={{
                    width: '120px',
                    height: '120px',
                    flexShrink: 0,
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {template.image_url ? (
                      <img
                        src={template.image_url}
                        alt={template.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <ImageIcon size={32} color="#9CA3AF" />
                    )}
                  </div>

                  {/* Contenu */}
                  <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '16px' }}>{getCategoryIcon(template.category)}</span>
                          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A2E', margin: 0 }}>
                            {template.name}
                          </h3>
                        </div>
                        <p style={{
                          fontSize: '12px',
                          color: '#666',
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {template.text_content || template.description || 'Aucune description'}
                        </p>
                      </div>

                      {/* Bouton favori */}
                      <button
                        onClick={() => handleToggleFavorite(template)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <StarIconComponent
                          size={20}
                          color={template.is_favorite ? '#F59E0B' : '#D1D5DB'}
                          filled={template.is_favorite}
                        />
                      </button>
                    </div>

                    {/* Stats et actions */}
                    <div style={{
                      marginTop: 'auto',
                      paddingTop: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <span style={{ fontSize: '11px', color: '#888' }}>
                          📊 Utilisé {template.use_count}x
                        </span>
                        {template.platform && (
                          <span style={{ fontSize: '11px', color: '#888' }}>
                            📱 {template.platform}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {deleteConfirm === template.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(template.id)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#DC2626',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Confirmer
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#E5E7EB',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#374151',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setDeleteConfirm(template.id)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#FEE2E2',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#DC2626',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <TrashIconComponent size={14} color="#DC2626" />
                            </button>
                            <button
                              onClick={() => handleUseTemplate(template)}
                              style={{
                                padding: '6px 14px',
                                background: 'linear-gradient(135deg, #10B981, #34D399)',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                              }}
                            >
                              <CopyIcon size={12} color="white" />
                              Utiliser
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Templates;
