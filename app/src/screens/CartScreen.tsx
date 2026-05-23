import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  photo: string;
}

interface Cart {
  userId: string;
  items: CartItem[];
  completed: boolean;
}

export default function CartScreen() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation();

  const loadCart = async () => {
    try {
      const response = await api.get('/cart');
      setCart(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [])
  );

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeItem(productId);
      return;
    }

    try {
      // Primeiro remove o item atual
      await api.delete(`/cart/remove/${productId}`);
      // Depois adiciona com a nova quantidade
      for (let i = 0; i < newQuantity; i++) {
        await api.post('/cart/add', { productId });
      }
      await loadCart();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao atualizar quantidade');
    }
  };

  const removeItem = async (productId: string) => {
    try {
      await api.delete(`/cart/remove/${productId}`);
      await loadCart();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao remover item');
    }
  };

  const clearCart = async () => {
    Alert.alert(
      'Limpar carrinho',
      'Tem certeza que deseja limpar o carrinho?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/cart/clear');
              await loadCart();
            } catch (error) {
              Alert.alert('Erro', 'Erro ao limpar carrinho');
            }
          },
        },
      ]
    );
  };

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      Alert.alert('Erro', 'Digite o nome do cliente');
      return;
    }

    if (!cart?.items.length) {
      Alert.alert('Erro', 'Carrinho vazio');
      return;
    }

    setLoading(true);
    try {
      const totalValue = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      await api.post('/transactions', {
        products: cart.items,
        customerName,
        totalValue,
        employeeName: user?.name,
      });

      await api.delete('/cart/clear');
      Alert.alert('Sucesso', 'Venda finalizada com sucesso!');
      setCustomerName('');
      setModalVisible(false);
      await loadCart();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao finalizar venda');
    } finally {
      setLoading(false);
    }
  };

  const getTotalValue = () => {
    if (!cart?.items.length) return 0;
    return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    if (!cart?.items.length) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      {item.photo ? (
        <Image
          source={{ uri: `http://192.168.1.70:3000${item.photo}` }}
          style={styles.productImage}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Icon name="image-outline" size={30} color="#ccc" />
        </View>
      )}
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>R$ {item.price.toFixed(2)}</Text>
      </View>
      
      <View style={styles.quantityControls}>
        <TouchableOpacity
          onPress={() => updateQuantity(item.productId, item.quantity - 1)}
          style={styles.quantityButton}
        >
          <Icon name="remove" size={20} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity
          onPress={() => updateQuantity(item.productId, item.quantity + 1)}
          style={styles.quantityButton}
        >
          <Icon name="add" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        onPress={() => removeItem(item.productId)}
        style={styles.removeButton}
      >
        <Icon name="trash-outline" size={22} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {!cart?.items.length ? (
        <View style={styles.emptyState}>
          <Icon name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Carrinho vazio</Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate('QRScanner')}
          >
            <Icon name="qr-code" size={24} color="#fff" />
            <Text style={styles.scanButtonText}>Ler QR Code</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart.items}
            keyExtractor={(item) => item.productId}
            renderItem={renderCartItem}
            contentContainerStyle={styles.list}
          />
          
          <View style={styles.footer}>
            <View style={styles.summary}>
              <Text style={styles.summaryText}>Total de itens:</Text>
              <Text style={styles.summaryValue}>{getTotalItems()}</Text>
            </View>
            <View style={styles.summary}>
              <Text style={styles.summaryText}>Valor total:</Text>
              <Text style={styles.totalValue}>R$ {getTotalValue().toFixed(2)}</Text>
            </View>
            
            <View style={styles.footerButtons}>
              <TouchableOpacity style={styles.clearButton} onPress={clearCart}>
                <Text style={styles.clearButtonText}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.checkoutButtonText}>Finalizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Finalizar Venda</Text>
            
            <Text style={styles.label}>Nome do cliente:</Text>
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Digite o nome do cliente"
            />
            
            <View style={styles.modalSummary}>
              <Text style={styles.modalSummaryText}>
                Total de itens: {getTotalItems()}
              </Text>
              <Text style={styles.modalTotal}>
                Total: R$ {getTotalValue().toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleCheckout}
                disabled={loading}
              >
                <Text style={styles.modalConfirmText}>
                  {loading ? 'Processando...' : 'Confirmar'}
                </Text>
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
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemPrice: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  checkoutButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#34C759',
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 20,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    gap: 10,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    width: '85%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
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
  modalSummary: {
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingTop: 15,
    marginBottom: 20,
  },
  modalSummaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  modalTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#34C759',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});