import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function TransactionDetailScreen({ route, navigation }: any) {
  const { transaction } = route.params;

  const generateReceipt = async () => {
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
              ${transaction.products.map((product: any) => `
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Icon name="receipt-outline" size={40} color="#007AFF" />
          <Text style={styles.headerTitle}>Detalhes da Saída</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Nº da transação:</Text>
            <Text style={styles.value}>{transaction.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Data:</Text>
            <Text style={styles.value}>
              {new Date(transaction.date).toLocaleString('pt-BR')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>{transaction.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Funcionário:</Text>
            <Text style={styles.value}>{transaction.employeeName}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens</Text>
          {transaction.products.map((product: any, index: number) => (
            <View key={index} style={styles.productItem}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>
                  R$ {product.price.toFixed(2)} x {product.quantity}
                </Text>
              </View>
              <Text style={styles.productSubtotal}>
                R$ {(product.price * product.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
        
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ {transaction.totalValue.toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity style={styles.printButton} onPress={generateReceipt}>
          <Icon name="print-outline" size={24} color="#fff" />
          <Text style={styles.printButtonText}>Imprimir Comprovante</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  productSubtotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  printButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});