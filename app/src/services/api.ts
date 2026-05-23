import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configuração base da API
// Substitua pelo IP do seu computador na rede local
const API_URL = 'http://192.168.1.70:3000/api';

// Para iOS no emulador
// const API_URL = 'http://localhost:3000/api';

// Para Android emulador
// const API_URL = 'http://10.0.2.2:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@estoque_app:token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Erro no interceptor de request:', error);
      return config;
    }
  },
  (error) => {
    console.error('Erro no request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('Erro na resposta:', error?.response?.status, error?.message);
    
    if (error?.response?.status === 401) {
      // Token expirado ou inválido
      await AsyncStorage.removeItem('@estoque_app:token');
      await AsyncStorage.removeItem('@estoque_app:user');
      // Redirecionar para login (você pode usar um evento global)
    }
    
    return Promise.reject(error);
  }
);

export default api;