import React, { useState, useEffect } from 'react';

const PICKUP_COORDS = { lat: 38.6186, lng: -9.0976 };

function calcStraightLine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface AddressState {
  address: string;
  apartment: string;
  city: string;
  postal_code: string;
  reference: string;
  lat: number | null;
  lng: number | null;
}

export interface GuestCustomerState {
  name: string;
  phone: string;
}

const EMPTY_ADDRESS: AddressState = {
  address: '',
  apartment: '',
  city: '',
  postal_code: '',
  reference: '',
  lat: null,
  lng: null,
};

export function useCheckout(isGoogleLoaded: boolean) {
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mbway' | 'wise' | null>(null);
  const [guestCustomer, setGuestCustomer] = useState<GuestCustomerState>({ name: '', phone: '' });
  const [needsChange, setNeedsChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState('');
  const [address, setAddress] = useState<AddressState>(EMPTY_ADDRESS);
  const [isLocating, setIsLocating] = useState(false);
  const [isAddressEditing, setIsAddressEditing] = useState(true);
  const [drivingDistance, setDrivingDistance] = useState<number | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [showAddressError, setShowAddressError] = useState(false);
  const [saveAddressAsDefault, setSaveAddressAsDefault] = useState(false);

  useEffect(() => {
    if (!address.lat || !address.lng || deliveryMethod !== 'delivery') {
      setDrivingDistance(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCalculatingRoute(true);

      try {
        if (isGoogleLoaded && (window as any).google?.maps?.DistanceMatrixService) {
          const service = new (window as any).google.maps.DistanceMatrixService();
          service.getDistanceMatrix({
            origins: [new (window as any).google.maps.LatLng(PICKUP_COORDS.lat, PICKUP_COORDS.lng)],
            destinations: [new (window as any).google.maps.LatLng(address.lat, address.lng)],
            travelMode: (window as any).google.maps.TravelMode.DRIVING,
          }, (res: any, status: string) => {
            setIsCalculatingRoute(false);
            if (status === 'OK' && res?.rows[0]?.elements[0]?.status === 'OK') {
              setDrivingDistance(res.rows[0].elements[0].distance.value / 1000);
            } else {
              fetchOSRM();
            }
          });
        } else {
          await fetchOSRM();
        }
      } catch {
        await fetchOSRM();
      }
    }, 1000);

    async function fetchOSRM() {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${PICKUP_COORDS.lng},${PICKUP_COORDS.lat};${address.lng},${address.lat}?overview=false`
        );
        const data = await response.json();
        const distance = data.routes?.[0]?.distance;
        setDrivingDistance(distance != null ? distance / 1000 : calcStraightLine(PICKUP_COORDS.lat, PICKUP_COORDS.lng, address.lat!, address.lng!));
      } catch {
        setDrivingDistance(calcStraightLine(PICKUP_COORDS.lat, PICKUP_COORDS.lng, address.lat!, address.lng!));
      } finally {
        setIsCalculatingRoute(false);
      }
    }

    return () => clearTimeout(timer);
  }, [address.lat, address.lng, deliveryMethod, isGoogleLoaded]);

  const handleLocate = () => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`
          );
          const data = await response.json();

          if (data.address) {
            const raw = data.address.postcode?.replace(/\D/g, '') ?? '';
            setAddress({
              address: `${data.address.road || data.address.street || ''}${data.address.house_number ? `, ${data.address.house_number}` : ''}`,
              apartment: '',
              city: data.address.city || data.address.town || data.address.village || '',
              postal_code: raw.length === 7 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw,
              reference: '',
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
            setIsAddressEditing(false);
            setShowAddressError(false);
          }
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const deliveryDistance = deliveryMethod === 'delivery' ? (drivingDistance ?? 0) : 0;
  const currentDeliveryFee = deliveryMethod === 'delivery' && deliveryDistance > 0 ? Math.ceil(deliveryDistance) : 0;

  return {
    deliveryMethod, setDeliveryMethod,
    paymentMethod, setPaymentMethod,
    guestCustomer, setGuestCustomer,
    needsChange, setNeedsChange,
    changeAmount, setChangeAmount,
    address, setAddress,
    isLocating, isAddressEditing, setIsAddressEditing,
    drivingDistance, isCalculatingRoute,
    showAddressError, setShowAddressError,
    saveAddressAsDefault, setSaveAddressAsDefault,
    currentDeliveryFee, handleLocate,
  };
}
