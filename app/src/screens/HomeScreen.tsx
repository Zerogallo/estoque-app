import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  quantity: number;
  minLimit: number;
  price: number;
}

interface Transaction {
  id: string;
  date: string;
  products: any[];
  customerName: string;
  totalValue: number;
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [productsRes, lowStockRes, transactionsRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/low-stock'),
        api.get('/transactions'),
      ]);

      const products = productsRes.data;
      setRecentProducts(products.slice(-5).reverse());
      setLowStockProducts(lowStockRes.data);
      setRecentTransactions(transactionsRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Bem-vindo,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="exit-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Cards de resumo */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="cube-outline" size={32} color="#007AFF" />
          <Text style={styles.statNumber}>{recentProducts.length}</Text>
          <Text style={styles.statLabel}>Novos produtos</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="warning-outline" size={32} color="#FF3B30" />
          <Text style={[styles.statNumber, { color: '#FF3B30' }]}>
            {lowStockProducts.length}
          </Text>
          <Text style={styles.statLabel}>Em falta</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="cart-outline" size={32} color="#34C759" />
          <Text style={[styles.statNumber, { color: '#34C759' }]}>
            {recentTransactions.length}
          </Text>
          <Text style={styles.statLabel}>Saídas</Text>
        </View>
      </View>

      {/* Produtos com Estoque Baixo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚠️ Produtos em Falta</Text>
        {lowStockProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="checkmark-circle-outline" size={48} color="#34C759" />
            <Text style={styles.emptyText}>Nenhum produto com estoque baixo</Text>
          </View>
        ) : (
          lowStockProducts.map(product => (
            <TouchableOpacity
              key={product.id}
              style={styles.lowStockCard}
              onPress={() => navigation.navigate('Estoque')}
            >
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.stockText}>
                Estoque: {product.quantity} / Mínimo: {product.minLimit}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Últimos Produtos Cadastrados */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Últimos Produtos</Text>
        {recentProducts.map(product => (
          <View key={product.id} style={styles.productCard}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDetails}>
              R$ {product.price.toFixed(2)} | Estoque: {product.quantity}
            </Text>
          </View>
        ))}
      </View>

      {/* Últimas Saídas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Últimas Saídas</Text>
        {recentTransactions.map(transaction => (
          <TouchableOpacity
            key={transaction.id}
            style={styles.transactionCard}
            onPress={() => navigation.navigate('TransactionDetail', { transaction })}
          >
            <Text style={styles.customerName}>Cliente: {transaction.customerName}</Text>
            <Text style={styles.transactionDetails}>
              Total: R$ {transaction.totalValue.toFixed(2)} |{' '}
              {new Date(transaction.date).toLocaleDateString('pt-BR')}
            </Text>
            <Text style={styles.itemsCount}>
              Itens: {transaction.products.length}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

    
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: -20,
    marginHorizontal: 15,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    margin: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  lowStockCard: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  productCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  stockText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  itemsCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 10,
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
});