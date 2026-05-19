import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://intranet.volquetesescalante.com/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Error en la llamada a la API:", error.response || error);

    const status = error.response?.status;
    const isLoginEndpoint = error.config?.url?.includes('/login');
    const isOnLoginPage = window.location.pathname.includes('/login');

    if ((status === 401 || status === 403) && !isLoginEndpoint && !isOnLoginPage) {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export { apiClient };
