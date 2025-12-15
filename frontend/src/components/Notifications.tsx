import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

interface Notification {
  id: string;
  user_id: string;
  event_id: string;
  type: string;
  title: string;
  message: string;
  scheduled_for: string;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
  event_title?: string;
  event_date?: string;
}

interface NotificationsProps {
  userId: string;
  onNotificationCountChange?: (count: number) => void;
}

// Icône cloche
const BellIcon = ({ size = 20, color = 'currentColor', hasNotifications = false }: { size?: number; color?: string; hasNotifications?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    {hasNotifications && <circle cx="18" cy="5" r="4" fill="#EF4444" stroke="none" />}
  </svg>
);

const CloseIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function NotificationBell({ userId, onNotificationCountChange }: NotificationsProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadNotifications();
      // Rafraîchir les notifications toutes les 60 secondes
      const interval = setInterval(loadNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  useEffect(() => {
    if (onNotificationCountChange) {
      onNotificationCountChange(notifications.length);
    }
  }, [notifications.length, onNotificationCountChange]);

  const loadNotifications = async () => {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          events (
            title,
            event_date
          )
        `)
        .eq('user_id', userId)
        .lte('scheduled_for', now)
        .is('read_at', null)
        .order('scheduled_for', { ascending: false });

      if (error) {
        console.error('Erreur chargement notifications:', error);
        return;
      }

      if (data) {
        const formattedNotifications = data.map(n => ({
          ...n,
          event_title: n.events?.title,
          event_date: n.events?.event_date
        }));
        setNotifications(formattedNotifications);
      }
    } catch (err) {
      console.error('Erreur notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Erreur marquage notification:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const notificationIds = notifications.map(n => n.id);

      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', notificationIds);

      setNotifications([]);
    } catch (err) {
      console.error('Erreur marquage toutes notifications:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Navigation selon le type de notification
    if (notification.type === 'tips_renewed') {
      // Naviguer vers l'onglet tips
      navigate('/dashboard?tab=tips');
    } else if (notification.event_id) {
      // Naviguer vers le calendrier avec l'événement sélectionné
      navigate(`/calendar?eventId=${notification.event_id}&date=${notification.event_date}`);
    }
    markAsRead(notification.id);
    setIsOpen(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    return `Il y a ${diffDays} jours`;
  };

  const getNotificationIcon = (type: string) => {
    if (type === 'reminder_7_days') return '📅';
    if (type === 'reminder_2_days') return '⏰';
    if (type === 'tips_renewed') return '💡';
    return '🔔';
  };

  const unreadCount = notifications.length;

  return (
    <div style={{ position: 'relative' }}>
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: isOpen ? '#FFF8E7' : 'transparent',
          border: '2px solid #E5E7EB',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.2s'
        }}
      >
        <BellIcon size={20} color="#1A1A2E" hasNotifications={unreadCount > 0} />

        {/* Badge compteur */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: '#EF4444',
            color: 'white',
            fontSize: '11px',
            fontWeight: '700',
            width: unreadCount > 9 ? '22px' : '18px',
            height: '18px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown notifications */}
      {isOpen && (
        <>
          {/* Overlay pour fermer */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Panel notifications */}
          <div style={{
            position: 'fixed',
            top: '70px',
            right: '16px',
            width: '340px',
            maxWidth: 'calc(100vw - 32px)',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            zIndex: 100,
            border: '1px solid #E5E7EB',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #FFF8E7, #FFFBF0)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🔔</span>
                <span style={{ fontWeight: '700', color: '#1A1A2E', fontSize: '15px' }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span style={{
                    backgroundColor: '#c84b31',
                    color: 'white',
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: '600'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1a3a5c',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <CheckIcon size={14} color="#1a3a5c" />
                  Tout lire
                </button>
              )}
            </div>

            {/* Liste notifications */}
            <div style={{
              maxHeight: '360px',
              overflowY: 'auto'
            }}>
              {loading ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#888'
                }}>
                  Chargement...
                </div>
              ) : notifications.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>✨</div>
                  <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
                    Aucune notification
                  </p>
                  <p style={{ color: '#aaa', fontSize: '12px', marginTop: '4px' }}>
                    Vous êtes à jour !
                  </p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #F3F4F6',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}
                    onClick={() => handleNotificationClick(notification)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Icône */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: notification.type === 'reminder_2_days' ? '#FEE2E2'
                        : notification.type === 'tips_renewed' ? '#D1FAE5'
                        : '#E0F2FE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0
                    }}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Contenu */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#1A1A2E',
                        margin: 0,
                        lineHeight: 1.4
                      }}>
                        {notification.title}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        color: '#666',
                        margin: '4px 0 0',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {notification.message}
                      </p>
                      <p style={{
                        fontSize: '11px',
                        color: '#999',
                        margin: '6px 0 0'
                      }}>
                        {formatTimeAgo(notification.scheduled_for)}
                      </p>
                    </div>

                    {/* Bouton fermer */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <CloseIcon size={16} color="#999" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid #E5E7EB',
                backgroundColor: '#F9FAFB'
              }}>
                <button
                  onClick={() => {
                    navigate('/calendar');
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'linear-gradient(135deg, #1a3a5c, #2a5a7c)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(26, 58, 92, 0.3)'
                  }}
                >
                  📅 Voir le calendrier
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
