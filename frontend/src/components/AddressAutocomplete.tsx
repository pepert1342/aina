import React, { useState, useEffect, useRef } from 'react';

// Clé API Google Places - à configurer via variable d'environnement
const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    google: any;
  }
}

function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Entrez une adresse...",
  disabled = false,
  style = {}
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Charger le script Google Maps
  useEffect(() => {
    // Ne pas charger si pas de clé API configurée
    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('[AddressAutocomplete] Clé API Google Places non configurée (VITE_GOOGLE_PLACES_API_KEY)');
      return;
    }

    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places&language=fr`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsLoaded(true);
    };
    script.onerror = (e) => console.error('[AddressAutocomplete] Erreur chargement:', e);
    document.head.appendChild(script);
  }, []);

  // Initialiser les services Google Places
  useEffect(() => {
    console.log('[AddressAutocomplete] Init services - isLoaded:', isLoaded);
    if (!isLoaded || !window.google || !window.google.maps || !window.google.maps.places) {
      console.log('[AddressAutocomplete] Pas encore prêt');
      return;
    }

    try {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      console.log('[AddressAutocomplete] AutocompleteService créé:', autocompleteServiceRef.current);
    } catch (error) {
      console.error('[AddressAutocomplete] Erreur initialisation services:', error);
    }
  }, [isLoaded]);

  // Rechercher des suggestions
  const searchPlaces = (query: string) => {
    console.log('[AddressAutocomplete] searchPlaces appelé avec:', query);
    console.log('[AddressAutocomplete] autocompleteServiceRef:', autocompleteServiceRef.current);

    if (!autocompleteServiceRef.current || query.length < 3) {
      console.log('[AddressAutocomplete] Abandon - service:', !!autocompleteServiceRef.current, 'query.length:', query.length);
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    console.log('[AddressAutocomplete] Appel getPlacePredictions...');

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'fr' },
        types: ['address']
      },
      (predictions: any[], status: string) => {
        console.log('[AddressAutocomplete] Réponse - status:', status, 'predictions:', predictions);
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          console.log('[AddressAutocomplete] Pas de résultats ou erreur');
          setSuggestions([]);
        }
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    // Debounce la recherche
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: any) => {
    const address = suggestion.description;
    setInputValue(address);
    onChange(address);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    // Délai pour permettre le clic sur une suggestion
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '12px',
          paddingRight: '36px',
          border: '2px solid #E5E7EB',
          borderRadius: '10px',
          fontSize: '14px',
          boxSizing: 'border-box',
          ...style
        }}
      />

      {/* Icône de localisation */}
      <div style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '16px',
        pointerEvents: 'none',
        color: isLoaded ? '#10B981' : '#888'
      }}>
        {isLoading ? '⏳' : '📍'}
      </div>

      {/* Liste des suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '10px',
          marginTop: '4px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{
                padding: '12px 14px',
                cursor: 'pointer',
                borderBottom: index < suggestions.length - 1 ? '1px solid #F3F4F6' : 'none',
                fontSize: '13px',
                color: '#1A1A2E',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F7FF'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <span style={{ color: '#10B981' }}>📍</span>
              <span>{suggestion.description}</span>
            </div>
          ))}
          <div style={{
            padding: '8px 14px',
            fontSize: '10px',
            color: '#888',
            textAlign: 'center',
            borderTop: '1px solid #F3F4F6'
          }}>
            Powered by Google
          </div>
        </div>
      )}
    </div>
  );
}

export default AddressAutocomplete;
