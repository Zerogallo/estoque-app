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

// Tentar importar o QR Code, se falhar usa fallback
let QRCodeComponent: any = null;
try {
  const QRCode = require('react-native-qrcode-svg');
  QRCodeComponent = QRCode.default;
} catch (error) {
  console.log('QRCode SVG não disponível, usando fallback');
}

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
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Erro', 'Precisamos de permissão para acessar suas fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        setFormData({ ...formData, photo: selectedImage.uri });
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Erro ao selecionar imagem');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Erro', 'Precisamos de permissão para usar a câmera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const photo = result.assets[0];
        setFormData({ ...formData, photo: photo.uri });
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Erro ao tirar foto');
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
    const data = new FormData();
    data.append('name', formData.name);
    data.append('price', formData.price);
    data.append('type', formData.type);
    data.append('color', formData.color);
    data.append('description', formData.description);
    data.append('quantity', formData.quantity);
    data.append('minLimit', formData.minLimit || '0');
    
    if (formData.photo) {
      const uriParts = formData.photo.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      const file = {
        uri: formData.photo,
        name: `photo_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      } as any;
      
      data.append('photo', file);
    }

    try {
      if (selectedProduct) {
        await api.put(`/products/${selectedProduct.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Alert.alert('Sucesso', 'Produto atualizado');
      } else {
        await api.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Alert.alert('Sucesso', 'Produto criado');
      }
      
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      Alert.alert('Erro', 'Erro ao salvar produto');
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
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir produto');
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

  const renderQRCode = (value: string, size: number = 200) => {
    if (QRCodeComponent) {
      return (
        <QRCodeComponent
          value={value}
          size={size}
          color="#000"
          backgroundColor="#fff"
        />
      );
    } else {
      // Fallback quando SVG não está disponível
      return (
        <View style={[styles.fallbackQR, { width: size, height: size }]}>
          <Ionicons name="qr-code-outline" size={size - 60} color="#007AFF" />
          <Text style={styles.fallbackText}>QR Code</Text>
          <Text style={styles.fallbackValue} numberOfLines={2}>
            {value}
          </Text>
        </View>
      );
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      {item.photo ? (
        <Image 
          source={{ uri: `http://192.168.1.70:3000${item.photo}` }} 
          style={styles.productImage} 
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
              photo: item.photo,
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
                  <Text style={styles.imageText}>Adicionar foto</Text>
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
                  <Text style={styles.submitButtonText}>Salvar</Text>
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
            
            {selectedProduct?.qrCode && renderQRCode(selectedProduct.qrCode, 200)}
            
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
    width: '80%',
    position: 'relative',
  },
  qrCloseIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  qrProductName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  fallbackQR: {
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    padding: 20,
  },
  fallbackText: {
    marginTop: 10,
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  fallbackValue: {
    marginTop: 5,
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    maxWidth: 180,
  },
  qrCloseButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  qrCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});