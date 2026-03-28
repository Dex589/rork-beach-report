import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Beach } from '@/types/beach';
import { POPULAR_BEACHES } from '@/constants/beaches';

const MAX_HOME_BEACHES = 5;
const STORAGE_KEY_FAVORITES = '@beach_report_favorites';
const STORAGE_KEY_HOME_BEACHES = '@beach_report_home_beaches';

export const [BeachProvider, useBeaches] = createContextHook(() => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [homeBeaches, setHomeBeaches] = useState<Beach[]>([]);
  const [selectedBeachId, setSelectedBeachId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.warn('[BeachContext] Loading timeout - forcing completion');
      if (homeBeaches.length === 0) {
        setHomeBeaches([POPULAR_BEACHES[0]]);
      }
      setIsLoading(false);
    }, 5000);

    loadStoredData().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, []);

  const loadStoredData = async () => {
    console.log('[BeachContext] Starting to load stored data...');
    try {
      const [storedFavorites, storedHomeBeaches] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_FAVORITES).catch(err => {
          console.error('[BeachContext] Error loading favorites:', err);
          return null;
        }),
        AsyncStorage.getItem(STORAGE_KEY_HOME_BEACHES).catch(err => {
          console.error('[BeachContext] Error loading home beaches:', err);
          return null;
        }),
      ]);

      console.log('[BeachContext] Loaded from storage:', { 
        hasFavorites: !!storedFavorites, 
        hasHomeBeaches: !!storedHomeBeaches 
      });

      if (storedFavorites) {
        try {
          const parsedFavorites = JSON.parse(storedFavorites);
          if (Array.isArray(parsedFavorites)) {
            setFavorites(parsedFavorites);
            console.log('[BeachContext] Set favorites:', parsedFavorites.length);
          }
        } catch (e) {
          console.error('[BeachContext] Error parsing favorites:', e);
        }
      }

      if (storedHomeBeaches) {
        try {
          const parsedBeaches = JSON.parse(storedHomeBeaches);
          if (Array.isArray(parsedBeaches) && parsedBeaches.length > 0) {
            setHomeBeaches(parsedBeaches);
            console.log('[BeachContext] Set home beaches:', parsedBeaches.length);
          } else {
            console.log('[BeachContext] Invalid stored beaches, using default');
            setHomeBeaches([POPULAR_BEACHES[0]]);
          }
        } catch (e) {
          console.error('[BeachContext] Error parsing home beaches:', e);
          setHomeBeaches([POPULAR_BEACHES[0]]);
        }
      } else {
        console.log('[BeachContext] No stored beaches, using default');
        setHomeBeaches([POPULAR_BEACHES[0]]);
      }
    } catch (error) {
      console.error('[BeachContext] Critical error loading stored data:', error);
      setHomeBeaches([POPULAR_BEACHES[0]]);
    }
    
    console.log('[BeachContext] Finished loading, setting isLoading to false');
    setIsLoading(false);
  };

  const toggleFavorite = async (beachId: string) => {
    const newFavorites = favorites.includes(beachId)
      ? favorites.filter(id => id !== beachId)
      : [...favorites, beachId];
    
    setFavorites(newFavorites);
    await AsyncStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(newFavorites));
  };

  const isFavorite = (beachId: string) => favorites.includes(beachId);

  const addBeachToHome = async (beach: Beach) => {
    const existingIndex = homeBeaches.findIndex(b => b.id === beach.id);
    
    if (existingIndex !== -1) {
      setSelectedBeachId(beach.id);
      return;
    }

    let newHomeBeaches: Beach[];
    if (homeBeaches.length >= MAX_HOME_BEACHES) {
      newHomeBeaches = [beach, ...homeBeaches.slice(0, MAX_HOME_BEACHES - 1)];
    } else {
      newHomeBeaches = [beach, ...homeBeaches];
    }

    setHomeBeaches(newHomeBeaches);
    setSelectedBeachId(beach.id);
    await AsyncStorage.setItem(STORAGE_KEY_HOME_BEACHES, JSON.stringify(newHomeBeaches));
  };

  const removeBeachFromHome = async (beachId: string) => {
    const newHomeBeaches = homeBeaches.filter(b => b.id !== beachId);
    setHomeBeaches(newHomeBeaches);
    await AsyncStorage.setItem(STORAGE_KEY_HOME_BEACHES, JSON.stringify(newHomeBeaches));
  };

  const reorderHomeBeaches = async (beaches: Beach[]) => {
    setHomeBeaches(beaches);
    await AsyncStorage.setItem(STORAGE_KEY_HOME_BEACHES, JSON.stringify(beaches));
  };

  return {
    favorites,
    homeBeaches,
    selectedBeachId,
    isLoading,
    toggleFavorite,
    isFavorite,
    addBeachToHome,
    removeBeachFromHome,
    reorderHomeBeaches,
    clearSelectedBeach: () => setSelectedBeachId(null),
  };
});
