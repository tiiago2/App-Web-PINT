import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});
{/* 'https://pint-he77.onrender.com/api' */ }

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token_softinsa');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Obter a role selecionada da localStorage e enviar no cabeçalho x-user-role
    const roleGuardada = localStorage.getItem('role_softinsa');
    if (roleGuardada) {
      try {
        const roleParseada = JSON.parse(roleGuardada);
        const cargo = typeof roleParseada === "string" ? roleParseada : roleParseada.nome;
        if (cargo) {
          config.headers['x-user-role'] = cargo;
        }
      } catch (e) {
        // Fallback se não for JSON válido
        config.headers['x-user-role'] = roleGuardada;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
