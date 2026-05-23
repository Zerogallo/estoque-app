import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

interface Product {
  id: string;
  name: string;
  price: number;
  type: string;
  color: string;
  description: string;
  quantity: number;
  minLimit: number;
  photo: string;
  qrCode: string;
}

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    type: '',
    color: '',
    description: '',
    quantity: '',
    minLimit: '',
    photo: null as string | null,
  });

  const API_BASE_URL = api.defaults.baseURL?.replace('/api', '') || 'http://192.168.1.100:3000';

  const loadProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Erro ao carregar produtos');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Erro', 'Precisamos de permissão para acessar suas fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, photo: result.assets[0].uri });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Erro', 'Precisamos de permissão para usar a câmera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, photo: result.assets[0].uri });
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Adicionar foto',
      'Escolha uma opção',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tirar foto', onPress: takePhoto },
        { text: 'Escolher da galeria', onPress: pickImage },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.quantity) {
      Alert.alert('Erro', 'Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);
    
    try {
      if (selectedProduct) {
        // EDITAR PRODUTO - Enviar como JSON em vez de FormData
        const updateData = {
          name: formData.name,
          price: parseFloat(formData.price),
          type: formData.type,
          color: formData.color,
          description: formData.description,
          quantity: parseInt(formData.quantity),
          minLimit: parseInt(formData.minLimit) || 0,
        };
        
        console.log('Enviando atualização:', updateData);
        
        const response = await api.put(`/products/${selectedProduct.id}`, updateData);
        
        if (response.status === 200) {
          Alert.alert('Sucesso', 'Produto atualizado com sucesso!');
          resetForm();
          loadProducts();
        }
      } else {
        // CRIAR NOVO PRODUTO - Usar FormData para imagem
        const data = new FormData();
        data.append('name', formData.name);
        data.append('price', formData.price);
        data.append('type', formData.type || '');
        data.append('color', formData.color || '');
        data.append('description', formData.description || '');
        data.append('quantity', formData.quantity);
        data.append('minLimit', formData.minLimit || '0');
        
        if (formData.photo) {
          const uriParts = formData.photo.split('.');
          const fileType = uriParts[uriParts.length - 1];
          data.append('photo', {
            uri: formData.photo,
            name: `photo.${Date.now()}.${fileType}`,
            type: `image/${fileType}`,
          } as any);
        }

        const response = await api.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        if (response.status === 200 || response.status === 201) {
          Alert.alert('Sucesso', 'Produto criado com sucesso!');
          resetForm();
          loadProducts();
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      
      if (error.response) {
        // O servidor respondeu com um status de erro
        console.error('Dados do erro:', error.response.data);
        Alert.alert('Erro', `Erro ${error.response.status}: ${error.response.data?.error || 'Erro ao salvar produto'}`);
      } else if (error.request) {
        // A requisição foi feita mas não houve resposta
        console.error('Sem resposta do servidor');
        Alert.alert('Erro', 'Servidor não está respondendo. Verifique sua conexão.');
      } else {
        // Algo aconteceu na configuração da requisição
        Alert.alert('Erro', error.message || 'Erro ao salvar produto');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir ${product.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/products/${product.id}`);
              loadProducts();
              Alert.alert('Sucesso', 'Produto excluído');
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.error || 'Erro ao excluir produto');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      type: '',
      color: '',
      description: '',
      quantity: '',
      minLimit: '',
      photo: null,
    });
    setSelectedProduct(null);
    setModalVisible(false);
  };

  const showQRCode = (product: Product) => {
    setSelectedProduct(product);
    setQrModalVisible(true);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      {item.photo ? (
        <Image 
          source={{ uri: `${API_BASE_URL}${item.photo}` }}
          style={styles.productImage}
          onError={(e) => console.log('Erro ao carregar imagem:', e.nativeEvent.error)}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={30} color="#ccc" />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>R$ {item.price.toFixed(2)}</Text>
        <Text style={[
          styles.productStock,
          item.quantity <= item.minLimit && styles.lowStock
        ]}>
          Estoque: {item.quantity} | Mínimo: {item.minLimit}
        </Text>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity 
          onPress={() => {
            setSelectedProduct(item);
            setFormData({
              name: item.name,
              price: item.price.toString(),
              type: item.type || '',
              color: item.color || '',
              description: item.description || '',
              quantity: item.quantity.toString(),
              minLimit: item.minLimit.toString(),
              photo: null, // Não carregar a foto antiga para edição
            });
            setModalVisible(true);
          }}
          style={styles.actionButton}
        >
          <Ionicons name="pencil" size={22} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleDelete(item)}
          style={styles.actionButton}
        >
          <Ionicons name="trash" size={22} color="#FF3B30" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => showQRCode(item)}
          style={styles.actionButton}
        >
          <Ionicons name="qr-code" size={22} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum produto cadastrado</Text>
            <Text style={styles.emptySubtext}>Toque no botão + para adicionar</Text>
          </View>
        }
      />
      
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modal de formulário */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => resetForm()}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedProduct ? 'Editar Produto' : 'Novo Produto'}
            </Text>
            
            <TouchableOpacity onPress={showImageOptions} style={styles.imagePicker}>
              {formData.photo ? (
                <Image source={{ uri: formData.photo }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholderLarge}>
                  <Ionicons name="camera" size={40} color="#999" />
                  <Text style={styles.imageText}>
                    {selectedProduct ? 'Foto atual não será alterada' : 'Adicionar foto'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Nome do produto *"
              placeholderTextColor="#999"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Preço *"
              placeholderTextColor="#999"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Tipo"
              placeholderTextColor="#999"
              value={formData.type}
              onChangeText={(text) => setFormData({ ...formData, type: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Cor"
              placeholderTextColor="#999"
              value={formData.color}
              onChangeText={(text) => setFormData({ ...formData, color: text })}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrição"
              placeholderTextColor="#999"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Quantidade em estoque *"
              placeholderTextColor="#999"
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Limite mínimo de estoque"
              placeholderTextColor="#999"
              value={formData.minLimit}
              onChangeText={(text) => setFormData({ ...formData, minLimit: text })}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {selectedProduct ? 'Atualizar' : 'Salvar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal do QR Code */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={qrModalVisible}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.qrModalContainer}>
          <View style={styles.qrModalContent}>
            <TouchableOpacity
              style={styles.qrCloseIcon}
              onPress={() => setQrModalVisible(false)}
            >
              <Ionicons name="close-circle" size={30} color="#999" />
            </TouchableOpacity>
            
            <Text style={styles.qrTitle}>QR Code do Produto</Text>
            <Text style={styles.qrProductName}>{selectedProduct?.name}</Text>
            
            {selectedProduct?.qrCode ? (
              <Image 
                source={{ uri: selectedProduct.qrCode }} 
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.qrLoading}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.qrLoadingText}>Carregando QR Code...</Text>
              </View>
            )}
            
            <Text style={styles.qrInfoText}>
              Escaneie para adicionar ao carrinho
            </Text>
            
            <TouchableOpacity
              style={styles.qrCloseButton}
              onPress={() => setQrModalVisible(false)}
            >
              <Text style={styles.qrCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 15,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  productStock: {
    fontSize: 12,
    color: '#666',
  },
  lowStock: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  imagePlaceholderLarge: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imageText: {
    marginTop: 8,
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
  qrModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '85%',
    position: 'relative',
  },
  qrCloseIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  qrTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  qrProductName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  qrImage: {
    width: 250,
    height: 250,
    marginVertical: 10,
    borderRadius: 10,
  },
  qrLoading: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginVertical: 10,
  },
  qrLoadingText: {
    marginTop: 10,
    color: '#666',
  },
  qrInfoText: {
    fontSize: 12,
    color: '#999',
    marginTop: 15,
    textAlign: 'center',
  },
  qrCloseButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  qrCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});