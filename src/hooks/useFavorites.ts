import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api';

const EVENT_NAME = 'verso-favorites-updated';
const LEGACY_STORAGE_KEY = 'verso_favorites_v14_3_1';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiClient.get<{ success: boolean; data: string[] }>('/users/favorites.php');
        if (response.data.success && Array.isArray(response.data.data)) {
          setFavorites(response.data.data);
        }
      } catch {
        setFavorites([]);
      }
    };

    load();

    const handleFavoritesUpdate = (event: CustomEvent<{ favorites: string[] }>) => {
      if (event.detail && Array.isArray(event.detail.favorites)) {
        setFavorites(event.detail.favorites);
      }
    };

    window.addEventListener(EVENT_NAME as any, handleFavoritesUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME as any, handleFavoritesUpdate);
    };
  }, []);

  const toggleFavorite = useCallback(async (path: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path];

      apiClient.post('/users/favorites.php', { favorites: newFavorites }).catch(() => {});

      window.dispatchEvent(new CustomEvent(EVENT_NAME, {
        detail: { favorites: newFavorites }
      }));

      return newFavorites;
    });
  }, []);

  const isFavorite = (path: string) => favorites.includes(path);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    count: favorites.length,
  };
};
