import React, { useState, useEffect, useRef } from 'react';

const GOOGLE_PLACES_API_KEY = 'AIzaSyCgsJKZROIcOF_Di7As4XX4dRIMWjGFFfE';

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
    initGooglePlaces: () => void;
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
  const [isLoaded, setIsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Charger le script Google Maps
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places&language=fr`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup si nécessaire
    };
  }, []);

  // Initialiser l'autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google) return;

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'fr' },
        fields: ['formatted_address', 'geometry', 'name']
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.formatted_address) {
          setInputValue(place.formatted_address);
          onChange(place.formatted_address);
        }
      });
    } catch (error) {
      console.error('Erreur initialisation Google Places:', error);
    }
  }, [isLoaded, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
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
        📍
      </div>
    </div>
  );
}

export default AddressAutocomplete;
