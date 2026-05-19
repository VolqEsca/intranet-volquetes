import { useState, useEffect } from 'react';

// ✅ Actualizado a versión Command Center v14.3.1
const STORAGE_KEY = 'verso_favorites_v14_3_1';
const EVENT_NAME = 'verso-favorites-updated';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Cargar inicial + Listener bidireccional (Dashboard ↔ Sidebar)
  useEffect(() => {
    // 1. Cargar estado inicial desde localStorage
    const loadFavorites = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setFavorites(Array.isArray(parsed) ? parsed : []);
        } catch (error) {
          console.error('Error parsing favorites from localStorage:', error);
          setFavorites([]);
        }
      }
    };

    loadFavorites();

    // 2. ✅ CRÍTICO: Escuchar cambios de otras instancias
    const handleFavoritesUpdate = (event: CustomEvent<{ favorites: string[] }>) => {
      if (event.detail && Array.isArray(event.detail.favorites)) {
        setFavorites(event.detail.favorites);
      }
    };

    // Añadir listener para sincronización en tiempo real
    window.addEventListener(EVENT_NAME as any, handleFavoritesUpdate);

    // ✅ Cleanup obligatorio para evitar memory leaks
    return () => {
      window.removeEventListener(EVENT_NAME as any, handleFavoritesUpdate);
    };
  }, []);

  // Toggle favorito con sincronización automática
  const toggleFavorite = (path: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(path)
        ? prev.filter(p => p !== path)  // Quitar si existe
        : [...prev, path];              // Añadir si no existe
      
      // Persistir en localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
      
      // ✅ Emitir evento para notificar a Sidebar instantáneamente
      window.dispatchEvent(new CustomEvent(EVENT_NAME, {
        detail: { favorites: newFavorites }
      }));
      
      return newFavorites;
    });
  };

  const isFavorite = (path: string) => favorites.includes(path);

  return { 
    favorites, 
    toggleFavorite, 
    isFavorite,
    count: favorites.length 
  };
};
