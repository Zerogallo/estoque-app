import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ImageBackground,
  Image,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
      <ImageBackground 
      source={require('../../assets/app5.webp')} 
      resizeMode="cover" 
      style={styles.image}
    >

    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      >
      <View style={styles.innerContainer}>
        <View style={styles.logoContainer}>
          <Image 
                  source={require('../../assets/logo.png')} 
                  style={styles.logo} 
                />
          
          <Text style={styles.subtitle}>Gerencie seu estoque de forma inteligente</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            />

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.linkButton}
            >
            <Text style={styles.linkText}>
              Não tem uma conta? <Text style={styles.linkHighlight}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
            </ImageBackground>
  );
}

const styles = StyleSheet.create({
  image: {
    flex: 1,
    justifyContent: 'center',
    
  },
  logo: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 5,
    borderRadius: 200,
    marginBottom: 5,

  },
  container: {
    flex: 1,
    
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007AFF',
  },
  subtitle: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 15,
    padding: 20,
    fontSize: 16,
    textAlign: 'center',
    color: '#000',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  input: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  linkHighlight: {
    color: '#007AFF',
    fontWeight: '600',
  },
});