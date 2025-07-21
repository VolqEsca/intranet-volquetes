import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://intranet.volquetesescalante.com/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// TEMPORAL: Comentamos la redirección automática para debuggear
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Error en la llamada a la API:", error.response || error);

    // COMENTADO TEMPORALMENTE
    // if (error.response?.status === 401 || error.response?.status === 403) {
    //   if (!window.location.pathname.includes('/login')) {
    //     window.location.href = '/login';
    //   }
    // }

    return Promise.reject(error);
  }
);

export { apiClient };
