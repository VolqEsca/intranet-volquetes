// src/config/theme.ts
export const theme = {
    colors: {
      primary: '#1162a6',      // Azul corporativo principal
      secondary: '#5487c0',    // Azul corporativo secundario
      accent: '#a2bade',       // Azul corporativo claro
      
      // Estados - todos basados en azules corporativos
      success: '#1162a6',      // Usamos el primary para éxito
      error: '#5487c0',        // Usamos el secondary para errores
      warning: '#5487c0',      // Usamos el secondary para advertencias
      info: '#a2bade',         // Usamos el accent para información
      
      // Neutros
      white: '#ffffff',
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      }
    },
    
    // Clases de utilidad para componentes
    styles: {
      button: {
        base: 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants: {
          primary: 'bg-primary-dark text-white shadow-sm hover:bg-secondary hover:shadow-md focus:ring-primary-dark',
          secondary: 'bg-secondary text-white shadow-sm hover:bg-light-accent hover:text-primary-dark hover:shadow-md focus:ring-secondary',
          outline: 'bg-white text-primary-dark border-2 border-primary-dark hover:bg-light-accent/20 hover:border-secondary hover:shadow-md focus:ring-primary-dark',
          ghost: 'bg-transparent text-gray-600 hover:bg-light-accent/20 hover:text-primary-dark focus:ring-gray-500',
        }
      }
    }
  };
  