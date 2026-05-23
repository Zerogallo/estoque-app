import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FallbackQRCodeProps {
  value: string;
  size?: number;
}

export default function FallbackQRCode({ value, size = 200 }: FallbackQRCodeProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Ionicons name="qr-code-outline" size={size - 60} color="#000" />
      <Text style={styles.codeText}>QR Code</Text>
      <Text style={styles.codeValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    padding: 20,
  },
  codeText: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  codeValue: {
    marginTop: 5,
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
});