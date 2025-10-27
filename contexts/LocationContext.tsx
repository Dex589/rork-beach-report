import createContextHook from '@nkzw/create-context-hook';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export const [LocationProvider, useLocation] = createContextHook(() => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      console.log('[LocationContext] Requesting location permission, platform:', Platform.OS);
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('[LocationContext] Web location obtained');
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
              setHasPermission(true);
              setIsLoading(false);
            },
            (error) => {
              console.log('[LocationContext] Web geolocation error:', error);
              setHasPermission(false);
              setIsLoading(false);
            }
          );
        } else {
          console.log('[LocationContext] Geolocation not available on web');
          setHasPermission(false);
          setIsLoading(false);
        }
      } else {
        console.log('[LocationContext] Requesting native location permission');
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('[LocationContext] Permission status:', status);
        setHasPermission(status === 'granted');

        if (status === 'granted') {
          console.log('[LocationContext] Getting current position...');
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          console.log('[LocationContext] Location obtained:', currentLocation.coords);
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
        } else {
          console.log('[LocationContext] Permission denied');
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[LocationContext] Error requesting location permission:', error);
      setHasPermission(false);
      setIsLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return {
    location,
    hasPermission,
    isLoading,
    calculateDistance,
    requestLocationPermission,
  };
});
