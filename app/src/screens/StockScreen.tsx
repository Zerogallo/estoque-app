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
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
  description: string;
  photo: string;
  qrCode: string;
}

export default function StockScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [identificationModalVisible, setIdentificationModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newQuantity, setNewQuantity] = useState('');

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

  const updateStock = async (productId: string, newQuantity: number) => {
    try {
      const product = products.find(p => p.id === productId);
      if (product) {
        await api.put(`/products/${productId}`, {
          name: product.name,
          price: product.price,
          type: product.type,
          color: product.color,
          description: product.description,
          quantity: newQuantity,
          minLimit: product.minLimit,
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

  // Função para gerar etiqueta de identificação do produto
  const generateIdentificationLabel = async (product: Product) => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Etiqueta - ${product.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .label {
              width: 300px;
              height: 400px;
              border: 2px solid #333;
              border-radius: 10px;
              padding: 20px;
              margin: 0 auto;
              page-break-after: avoid;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #007AFF;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              color: #007AFF;
            }
            .product-name {
              font-size: 16px;
              font-weight: bold;
              margin: 10px 0;
              text-align: center;
            }
            .info-row {
              margin: 8px 0;
              padding: 5px;
              border-bottom: 1px solid #eee;
            }
            .label-info {
              font-weight: bold;
              color: #666;
            }
            .label-value {
              margin-left: 10px;
              color: #333;
            }
            .qr-code {
              text-align: center;
              margin: 20px 0;
              padding: 10px;
            }
            .qr-image {
              width: 150px;
              height: 150px;
              margin: 0 auto;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              color: #999;
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #eee;
            }
            .price {
              font-size: 20px;
              font-weight: bold;
              color: #007AFF;
              text-align: center;
              margin: 10px 0;
            }
            .stock {
              text-align: center;
              margin: 10px 0;
              padding: 5px;
              border-radius: 5px;
            }
            .stock-normal {
              background-color: #d4edda;
              color: #155724;
            }
            .stock-low {
              background-color: #fff3cd;
              color: #856404;
            }
            .stock-out {
              background-color: #f8d7da;
              color: #721c24;
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="header">
              <div class="title">ETIQUETA DE IDENTIFICAÇÃO</div>
            </div>
            
            <div class="product-name">${product.name}</div>
            
            <div class="info-row">
              <span class="label-info">ID:</span>
              <span class="label-value">${product.id}</span>
            </div>
            
            <div class="info-row">
              <span class="label-info">Tipo:</span>
              <span class="label-value">${product.type || 'N/A'}</span>
            </div>
            
            <div class="info-row">
              <span class="label-info">Cor:</span>
              <span class="label-value">${product.color || 'N/A'}</span>
            </div>
            
            <div class="info-row">
              <span class="label-info">Descrição:</span>
              <span class="label-value">${product.description || 'N/A'}</span>
            </div>
            
            <div class="price">
              R$ ${product.price.toFixed(2)}
            </div>
            
            <div class="stock ${product.quantity === 0 ? 'stock-out' : product.quantity <= product.minLimit ? 'stock-low' : 'stock-normal'}">
              📦 Estoque: ${product.quantity} unidades
              ${product.quantity <= product.minLimit ? '⚠️ Estoque Baixo!' : ''}
            </div>
            
            ${product.qrCode ? `
              <div class="qr-code">
                <img src="${product.qrCode}" class="qr-image" />
                <div>Escaneie o QR Code</div>
              </div>
            ` : ''}
            
            <div class="footer">
              Gerado por Estoque App - ${new Date().toLocaleString('pt-BR')}
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo');
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Etiqueta - ${product.name}`,
      });
    } catch (error) {
      console.error('Erro ao gerar etiqueta:', error);
      Alert.alert('Erro', 'Erro ao gerar a etiqueta. Tente novamente.');
    }
  };

  // Função para visualizar identificação do produto
  const viewIdentification = (product: Product) => {
    setSelectedProduct(product);
    setIdentificationModalVisible(true);
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
      <View style={[styles.productCard, { borderLeftColor: statusColor, borderLeftWidth: 4 }]}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(status)}
            </Text>
          </View>
        </View>
        
        {item.photo && (
          <Image 
            source={{ uri: `${API_BASE_URL}${item.photo}` }} 
            style={styles.productImage}
          />
        )}
        
        <Text style={styles.productDetails}>
          Tipo: {item.type || 'N/A'} | Cor: {item.color || 'N/A'}
        </Text>
        
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description || 'Sem descrição'}
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
        
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Preço:</Text>
          <Text style={styles.priceValue}>R$ {item.price.toFixed(2)}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => handleAdjustStock(item)}
          >
            <Ionicons name="create-outline" size={20} color="#007AFF" />
            <Text style={styles.adjustButtonText}>Ajustar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => viewIdentification(item)}
          >
            <Ionicons name="eye-outline" size={20} color="#5856D6" />
            <Text style={styles.viewButtonText}>Ver ID</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.printButton}
            onPress={() => generateIdentificationLabel(item)}
          >
            <Ionicons name="print-outline" size={20} color="#34C759" />
            <Text style={styles.printButtonText}>Imprimir</Text>
          </TouchableOpacity>
        </View>
      </View>
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
            <Ionicons name="stats-chart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum produto cadastrado</Text>
          </View>
        }
      />

      {/* Modal para ajustar estoque */}
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

      {/* Modal para visualizar identificação do produto */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={identificationModalVisible}
        onRequestClose={() => setIdentificationModalVisible(false)}
      >
        <View style={styles.identificationModalContainer}>
          <View style={styles.identificationModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.closeIcon}
                onPress={() => setIdentificationModalVisible(false)}
              >
                <Ionicons name="close-circle" size={30} color="#999" />
              </TouchableOpacity>
              
              <Text style={styles.identificationTitle}>Identificação do Produto</Text>
              
              {selectedProduct?.photo && (
                <Image 
                  source={{ uri: `${API_BASE_URL}${selectedProduct.photo}` }} 
                  style={styles.identificationImage}
                />
              )}
              
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Nome:</Text>
                <Text style={styles.infoValue}>{selectedProduct?.name}</Text>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>ID:</Text>
                <Text style={styles.infoValue}>{selectedProduct?.id}</Text>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Tipo:</Text>
                <Text style={styles.infoValue}>{selectedProduct?.type || 'N/A'}</Text>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Cor:</Text>
                <Text style={styles.infoValue}>{selectedProduct?.color || 'N/A'}</Text>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Preço:</Text>
                <Text style={styles.infoValue}>R$ {selectedProduct?.price.toFixed(2)}</Text>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Estoque:</Text>
                <Text style={[
                  styles.infoValue,
                  selectedProduct?.quantity === 0 ? styles.outStock : 
                  selectedProduct?.quantity <= (selectedProduct?.minLimit || 0) ? styles.lowStock : styles.normalStock
                ]}>
                  {selectedProduct?.quantity} unidades
                  {selectedProduct?.quantity <= (selectedProduct?.minLimit || 0) && ' ⚠️'}
                </Text>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Limite Mínimo:</Text>
                <Text style={styles.infoValue}>{selectedProduct?.minLimit} unidades</Text>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Descrição:</Text>
                <Text style={styles.infoValue}>{selectedProduct?.description || 'Sem descrição'}</Text>
              </View>
              
              {selectedProduct?.qrCode && (
                <View style={styles.qrCodeSection}>
                  <Text style={styles.qrCodeLabel}>QR Code:</Text>
                  <Image 
                    source={{ uri: selectedProduct.qrCode }} 
                    style={styles.identificationQRCode}
                    resizeMode="contain"
                  />
                </View>
              )}
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.printIdentificationButton}
                  onPress={() => {
                    if (selectedProduct) {
                      generateIdentificationLabel(selectedProduct);
                      setIdentificationModalVisible(false);
                    }
                  }}
                >
                  <Ionicons name="print-outline" size={24} color="#fff" />
                  <Text style={styles.printIdentificationButtonText}>Imprimir Etiqueta</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    marginBottom: 10,
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
  productImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  productDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
    fontStyle: 'italic',
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
    marginBottom: 8,
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
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
 adjustButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    gap: 5,
  },
  adjustButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f0f0ff',
    borderRadius: 8,
    gap: 5,
  },
  viewButtonText: {
    color: '#5856D6',
    fontSize: 14,
    fontWeight: '600',
  },
  printButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    gap: 5,
  },
  printButtonText: {
    color: '#34C759',
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
  identificationModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  identificationModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxHeight: '85%',
    position: 'relative',
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  identificationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  identificationImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoSection: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  outStock: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  lowStock: {
    color: '#FF9500',
    fontWeight: 'bold',
  },
  normalStock: {
    color: '#34C759',
    fontWeight: 'bold',
  },
  qrCodeSection: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  qrCodeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  identificationQRCode: {
    width: 150,
    height: 150,
    borderRadius: 10,
  },
  buttonContainer: {
    marginTop: 10,
  },
  printIdentificationButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  printIdentificationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});