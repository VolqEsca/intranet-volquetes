import { useState, useEffect } from 'react';

// Un "Custom Hook" es una función reutilizable que usa la lógica de React.
export function useDarkMode() {
  // 1. Inicializamos el estado leyendo la preferencia guardada del navegador.
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Nos aseguramos de que el código solo se ejecute en el navegador.
    if (typeof window !== 'undefined') {
      const storedPreference = window.localStorage.getItem('theme');
      return storedPreference === 'dark';
    }
    return false; // Por defecto, el tema es claro.
  });

  // 2. Usamos useEffect para reaccionar a los cambios en isDarkMode.
  useEffect(() => {
    const root = window.document.documentElement; // La etiqueta <html>

    if (isDarkMode) {
      root.classList.add('dark'); // Añade la clase 'dark' al <html>
      window.localStorage.setItem('theme', 'dark'); // Guarda la preferencia
    } else {
      root.classList.remove('dark'); // Quita la clase 'dark' del <html>
      window.localStorage.setItem('theme', 'light'); // Guarda la preferencia
    }
  }, [isDarkMode]); // Este efecto se ejecuta cada vez que 'isDarkMode' cambia.

  // 3. Creamos una función simple para cambiar el estado.
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // 4. Devolvemos el estado actual y la función para cambiarlo.
  return [isDarkMode, toggleDarkMode] as const;
}