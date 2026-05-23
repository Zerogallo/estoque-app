import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

interface Product {
  id: string;
  name: string;
  quantity: number;
  minLimit: number;
  price: number;
  type: string;
  color: string;
}

export default function StockScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newQuantity, setNewQuantity] = useState('');

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

  const updateStock = async (productId: string, newQuantity: number) => {
    try {
      const product = products.find(p => p.id === productId);
      if (product) {
        await api.put(`/products/${productId}`, {
          ...product,
          quantity: newQuantity,
        });
        await loadProducts();
        Alert.alert('Sucesso', 'Estoque atualizado');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao atualizar estoque');
    }
  };

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setNewQuantity(product.quantity.toString());
    setModalVisible(true);
  };

  const handleSaveStock = async () => {
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 0) {
      Alert.alert('Erro', 'Quantidade inválida');
      return;
    }

    await updateStock(selectedProduct!.id, quantity);
    setModalVisible(false);
    setSelectedProduct(null);
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return 'out';
    if (product.quantity <= product.minLimit) return 'low';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out':
        return '#FF3B30';
      case 'low':
        return '#FF9500';
      default:
        return '#34C759';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'out':
        return 'ESGOTADO';
      case 'low':
        return 'ESTOQUE BAIXO';
      default:
        return 'NORMAL';
    }
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const status = getStockStatus(item);
    const statusColor = getStatusColor(status);
    
    return (
      <TouchableOpacity
        style={[styles.productCard, { borderLeftColor: statusColor, borderLeftWidth: 4 }]}
        onPress={() => handleAdjustStock(item)}
      >
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(status)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.productDetails}>
          Tipo: {item.type || 'N/A'} | Cor: {item.color || 'N/A'}
        </Text>
        
        <View style={styles.stockContainer}>
          <Text style={styles.stockLabel}>Quantidade atual:</Text>
          <Text style={[styles.stockValue, { color: statusColor }]}>
            {item.quantity} unidades
          </Text>
        </View>
        
        <View style={styles.limitContainer}>
          <Text style={styles.limitLabel}>Limite mínimo:</Text>
          <Text style={styles.limitValue}>{item.minLimit} unidades</Text>
        </View>
        
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => handleAdjustStock(item)}
        >
          <Icon name="create-outline" size={20} color="#007AFF" />
          <Text style={styles.adjustButtonText}>Ajustar estoque</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

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
            <Icon name="stats-chart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum produto cadastrado</Text>
          </View>
        }
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajustar Estoque</Text>
            <Text style={styles.productNameModal}>{selectedProduct?.name}</Text>
            
            <Text style={styles.label}>Nova quantidade:</Text>
            <TextInput
              style={styles.input}
              value={newQuantity}
              onChangeText={setNewQuantity}
              keyboardType="numeric"
              placeholder="Digite a quantidade"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveStock}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  stockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockLabel: {
    fontSize: 14,
    color: '#666',
  },
  stockValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  limitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  limitLabel: {
    fontSize: 14,
    color: '#666',
  },
  limitValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  adjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    gap: 8,
  },
  adjustButtonText: {
    color: '#007AFF',
    fontSize: 14,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  productNameModal: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
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
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});