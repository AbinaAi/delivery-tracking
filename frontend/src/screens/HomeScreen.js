import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import apiService from '../config/api';
import { useAuth } from '../contexts/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCustomerOrders();
      setRecentOrders(response.orders?.slice(0, 3) || []); // Show only 3 recent orders
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'accepted':
        return '#2196F3';
      case 'preparing':
        return '#9C27B0';
      case 'ready_for_pickup':
        return '#FF5722';
      case 'picked_up':
        return '#FF9800';
      case 'out_for_delivery':
        return '#2196F3';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const renderOrderCard = (order) => (
    <TouchableOpacity
      key={order.id}
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>#{order.order_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>
            {order.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.restaurantName}>{order.restaurant?.name}</Text>
      <Text style={styles.orderAmount}>${order.total_amount.toFixed(2)}</Text>
      
      <TouchableOpacity
        style={styles.trackButton}
        onPress={() => navigation.navigate('DeliveryTracking', { orderId: order.id })}
      >
        <Text style={styles.trackButtonText}>Track Order</Text>
        <Ionicons name="chevron-forward" size={16} color="#482E1D" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#482E1D']}
          tintColor="#482E1D"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={['#FFF3DC', '#FFE4B5']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.customerName}>{user?.name}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              logout();
            }}
          >
            <Ionicons name="log-out" size={24} color="#482E1D" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Orders')}
          >
            <LinearGradient
              colors={['#482E1D', '#8D6E63']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="list" size={32} color="#FFF" />
              <Text style={styles.actionButtonText}>View All Orders</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Navigate to order creation or restaurant selection
              Alert.alert('Coming Soon', 'Order creation feature will be available soon!');
            }}
          >
            <LinearGradient
              colors={['#FF9800', '#FF5722']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="add-circle" size={32} color="#FFF" />
              <Text style={styles.actionButtonText}>New Order</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.recentOrders}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#482E1D" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : recentOrders.length > 0 ? (
          recentOrders.map(renderOrderCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant" size={80} color="#8D6E63" />
            <Text style={styles.emptyStateTitle}>No Orders Yet</Text>
            <Text style={styles.emptyStateText}>
              Start by placing your first order!
            </Text>
          </View>
        )}
      </View>

      {/* Features */}
      <View style={styles.features}>
        <Text style={styles.sectionTitle}>Features</Text>
        
        <View style={styles.featureGrid}>
          <View style={styles.featureItem}>
            <Ionicons name="location" size={32} color="#482E1D" />
            <Text style={styles.featureTitle}>Real-time Tracking</Text>
            <Text style={styles.featureDescription}>
              Track your delivery in real-time with live location updates
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="notifications" size={32} color="#482E1D" />
            <Text style={styles.featureTitle}>Status Updates</Text>
            <Text style={styles.featureDescription}>
              Get instant notifications about your order status
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="time" size={32} color="#482E1D" />
            <Text style={styles.featureTitle}>ETA Updates</Text>
            <Text style={styles.featureDescription}>
              Know exactly when your food will arrive
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="call" size={32} color="#482E1D" />
            <Text style={styles.featureTitle}>Direct Contact</Text>
            <Text style={styles.featureDescription}>
              Call your driver or restaurant directly from the app
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3DC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#8D6E63',
  },
  customerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#482E1D',
  },
  logoutButton: {
    padding: 8,
  },
  quickActions: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#482E1D',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 16,
    color: '#482E1D',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#482E1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonGradient: {
    padding: 20,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  recentOrders: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#482E1D',
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#482E1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#482E1D',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#482E1D',
    marginBottom: 8,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#482E1D',
    marginBottom: 16,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  trackButtonText: {
    fontSize: 16,
    color: '#482E1D',
    fontWeight: '600',
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#482E1D',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8D6E63',
    textAlign: 'center',
  },
  features: {
    padding: 20,
    paddingBottom: 40,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureItem: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#482E1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#482E1D',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#8D6E63',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default HomeScreen; 