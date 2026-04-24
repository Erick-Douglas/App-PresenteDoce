import React, { useEffect } from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

interface AddressAutocompleteProps {
  onSelect: (data: { address: string; city: string; postal_code: string; lat: number | null; lng: number | null }) => void;
  initialValue?: string;
  isLoaded: boolean;
}

function formatPostalCode(code: string) {
  const d = code.replace(/\D/g, '');
  if (d.length >= 7) return `${d.slice(0, 4)}-${d.slice(4, 7)}`;
  if (d.length > 4) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return d;
}

export function AddressAutocomplete({ onSelect, initialValue, isLoaded }: AddressAutocompleteProps) {
  const { ready, value, suggestions: { status, data }, setValue, clearSuggestions, init } = usePlacesAutocomplete({
    requestOptions: { componentRestrictions: { country: 'pt' } },
    debounce: 300,
    defaultValue: initialValue,
    initOnMount: false,
  });

  useEffect(() => { if (isLoaded) init(); }, [isLoaded, init]);

  const handleSelect = async (suggestion: any) => {
    setValue(suggestion.description, false);
    clearSuggestions();
    try {
      const results = await getGeocode({ address: suggestion.description });
      const { lat, lng } = await getLatLng(results[0]);
      const comps = results[0].address_components;
      let city = '', postal_code = '', street_name = '', street_number = '';
      comps.forEach((c: any) => {
        if (c.types.includes('locality') || c.types.includes('administrative_area_level_2')) city = c.long_name;
        if (c.types.includes('postal_code')) postal_code = formatPostalCode(c.long_name);
        if (c.types.includes('route')) street_name = c.long_name;
        if (c.types.includes('street_number')) street_number = c.long_name;
      });
      const address = street_number ? `${street_name}, ${street_number}` : (street_name || suggestion.description);
      setValue(address, false);
      onSelect({ address, city, postal_code, lat, lng });
    } catch (e) { console.error('Geocoding error:', e); }
  };

  return (
    <div className="relative w-full">
      <input
        value={value || ''}
        onChange={(e) => {
          setValue(e.target.value);
          onSelect({ address: e.target.value, city: '', postal_code: '', lat: null, lng: null });
        }}
        disabled={!ready && isLoaded}
        className="w-full bg-transparent border border-primary/10 rounded-xl px-4 py-2 text-xs font-medium outline-none focus:ring-1 focus:ring-primary/20 transition-all"
        placeholder="Procure a sua morada..."
      />
      {status === 'OK' && ready && (
        <ul className="absolute z-50 w-full bg-white border border-primary/10 rounded-xl mt-1 shadow-lg max-h-40 overflow-y-auto">
          {data.map((s) => (
            <li
              key={s.place_id}
              onClick={() => handleSelect(s)}
              className="px-4 py-2 text-[10px] hover:bg-primary/5 cursor-pointer border-b border-primary/5 last:border-0"
            >
              <strong>{s.structured_formatting.main_text}</strong>{' '}
              <small className="opacity-60">{s.structured_formatting.secondary_text}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
