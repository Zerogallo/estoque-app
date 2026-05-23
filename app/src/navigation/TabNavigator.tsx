import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import StockScreen from '../screens/StockScreen';
import CartScreen from '../screens/CartScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Início') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Produtos') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Estoque') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Carrinho') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Histórico') {
            iconName = focused ? 'time' : 'time-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Início" 
        component={HomeScreen} 
        options={{ headerShown: true }}
      />
      <Tab.Screen 
        name="Produtos" 
        component={ProductsScreen}
      />
      <Tab.Screen 
        name="Estoque" 
        component={StockScreen}
      />
      <Tab.Screen 
        name="Carrinho" 
        component={CartScreen}
      />
      <Tab.Screen 
        name="Histórico" 
        component={HistoryScreen}
      />
    </Tab.Navigator>
  );
}