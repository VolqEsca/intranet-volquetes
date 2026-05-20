import { isAxiosError } from 'axios';

// Extrae el mensaje de error de una respuesta Axios o de un Error estándar.
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    return (
      (error.response?.data as Record<string, string> | undefined)?.message ??
      (error.response?.data as Record<string, string> | undefined)?.error ??
      error.message ??
      fallback
    );
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

// Devuelve el status HTTP de un error Axios, o undefined si no aplica.
export function apiErrorStatus(error: unknown): number | undefined {
  if (isAxiosError(error)) return error.response?.status;
  return undefined;
}

// Devuelve data.errors[] de una respuesta Axios, o [].
export function apiErrorList(error: unknown): string[] {
  if (isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (Array.isArray(data?.errors)) return data.errors as string[];
  }
  return [];
}
