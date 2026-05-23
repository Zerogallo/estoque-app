import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../services/api';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

interface Transaction {
  id: string;
  date: string;
  products: any[];
  customerName: string;
  totalValue: number;
  employeeName: string;
}

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const loadTransactions = async () => {
    try {
      const response = await api.get('/transactions/all');
      setTransactions(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Erro ao carregar histórico');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const generateReceipt = async (transaction: Transaction) => {
    const html = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #007AFF;
            }
            .subtitle {
              font-size: 14px;
              color: #666;
            }
            .divider {
              border-top: 1px solid #ddd;
              margin: 20px 0;
            }
            .info-row {
              margin-bottom: 10px;
            }
            .label {
              font-weight: bold;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            .total {
              font-size: 18px;
              font-weight: bold;
              text-align: right;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">COMPROVANTE DE SAÍDA</div>
            <div class="subtitle">Estoque App</div>
          </div>
          
          <div class="info-row">
            <span class="label">Nº da transação:</span> ${transaction.id}
          </div>
          <div class="info-row">
            <span class="label">Data:</span> ${new Date(transaction.date).toLocaleString('pt-BR')}
          </div>
          <div class="info-row">
            <span class="label">Cliente:</span> ${transaction.customerName}
          </div>
          <div class="info-row">
            <span class="label">Funcionário:</span> ${transaction.employeeName}
          </div>
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Preço unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${transaction.products.map(product => `
                <tr>
                  <td>${product.name}</td>
                  <td>${product.quantity}</td>
                  <td>R$ ${product.price.toFixed(2)}</td>
                  <td>R$ ${(product.price * product.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            TOTAL: R$ ${transaction.totalValue.toFixed(2)}
          </div>
          
          <div class="footer">
            Obrigado pela preferência!
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao gerar comprovante');
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.transactionId}>#{item.id.slice(-6)}</Text>
        <Text style={styles.transactionDate}>
          {new Date(item.date).toLocaleDateString('pt-BR')}
        </Text>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Icon name="person-outline" size={18} color="#666" />
          <Text style={styles.infoText}>Cliente: {item.customerName}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Icon name="business-outline" size={18} color="#666" />
          <Text style={styles.infoText}>Funcionário: {item.employeeName}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Icon name="cube-outline" size={18} color="#666" />
          <Text style={styles.infoText}>Itens: {item.products.length}</Text>
        </View>
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>R$ {item.totalValue.toFixed(2)}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
        >
          <Icon name="eye-outline" size={20} color="#007AFF" />
          <Text style={styles.viewButtonText}>Ver detalhes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.printButton}
          onPress={() => generateReceipt(item)}
        >
          <Icon name="print-outline" size={20} color="#34C759" />
          <Text style={styles.printButtonText}>Imprimir</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="time-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma saída registrada</Text>
            <Text style={styles.emptySubtext}>As vendas aparecerão aqui</Text>
          </View>
        }
      />
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
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  cardBody: {
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cardFooter: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 10,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  viewButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  printButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34C759',
    gap: 8,
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
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
});