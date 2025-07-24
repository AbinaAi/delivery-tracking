import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import apiService from '../config/api';
import { useAuth } from '../contexts/AuthContext';

const DriverDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [locationWatcher, setLocationWatcher] = useState(null);

  useEffect(() => {
    fetchOrders();
    startLocationUpdates();
    return () => {
      if (locationWatcher) {
        locationWatcher.remove();
      }
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Mock API call - replace with actual API
      const mockOrders = [
        {
          id: 'order-1',
          order_number: 'ORD-001',
          status: 'assigned',
          customer: { name: 'John Customer', phone: '+1234567890' },
          restaurant: {
            name: 'Pizza Palace',
            address: '123 Main St, Downtown',
            phone: '+1234567894'
          },
          items: [
            { name: 'Margherita Pizza', quantity: 2, price: 15.99 },
            { name: 'Coke', quantity: 1, price: 2.99 }
          ],
          total_amount: 34.97,
          delivery_address: '456 Customer St, Delivery Area',
          delivery_lat: 28.6145,
          delivery_lng: 77.2095,
          pickup_lat: 28.6139,
          pickup_lng: 77.2090,
          created_at: new Date(Date.now() - 30 * 60000).toISOString(),
          estimated_delivery_time: new Date(Date.now() + 25 * 60000).toISOString(),
          order_tracking: [
            { status: 'assigned', description: 'Order assigned to you', created_at: new Date(Date.now() - 5 * 60000).toISOString() }
          ]
        },
        {
          id: 'order-2',
          order_number: 'ORD-002',
          status: 'picked_up',
          customer: { name: 'Sarah Smith', phone: '+1234567891' },
          restaurant: {
            name: 'Burger House',
            address: '456 Oak Ave, Midtown',
            phone: '+1234567895'
          },
          items: [
            { name: 'Classic Burger', quantity: 1, price: 12.99 },
            { name: 'French Fries', quantity: 1, price: 4.99 }
          ],
          total_amount: 17.98,
          delivery_address: '789 Pine Rd, Uptown',
          delivery_lat: 28.6141,
          delivery_lng: 77.2092,
          pickup_lat: 28.6140,
          pickup_lng: 77.2091,
          created_at: new Date(Date.now() - 60 * 60000).toISOString(),
          estimated_delivery_time: new Date(Date.now() + 10 * 60000).toISOString(),
          order_tracking: [
            { status: 'assigned', description: 'Order assigned to you', created_at: new Date(Date.now() - 45 * 60000).toISOString() },
            { status: 'picked_up', description: 'Order picked up from restaurant', created_at: new Date(Date.now() - 15 * 60000).toISOString() }
          ]
        }
      ];

      setOrders(mockOrders);
    } catch (error) {
      console.error('Fetch orders error:', error);
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const startLocationUpdates = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for tracking');
        return;
      }

      // Start location updates
      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          updateLocation(location.coords);
        }
      );

      setLocationWatcher(watcher);
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const updateLocation = async (coords) => {
    if (!isOnline) return;
    
    try {
      setLocationUpdating(true);
      
      // Mock API call - replace with actual API
      console.log('Updating location:', {
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
        speed: coords.speed,
        heading: coords.heading,
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Update location error:', error);
    } finally {
      setLocationUpdating(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, description) => {
    try {
      // Mock API call - replace with actual API
      console.log('Updating order status:', { orderId, newStatus, description });
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? {
                ...order,
                status: newStatus,
                order_tracking: [
                  ...order.order_tracking,
                  {
                    status: newStatus,
                    description,
                    created_at: new Date().toISOString()
                  }
                ]
              }
            : order
        )
      );

      // Show success message
      Alert.alert('Success', `Order status updated to ${newStatus.replace('_', ' ')}`);
      
    } catch (error) {
      console.error('Update status error:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const handleStatusUpdate = (order, newStatus) => {
    const statusMessages = {
      'picked_up': 'Order picked up from restaurant',
      'out_for_delivery': 'Heading to delivery location',
      'delivered': 'Order delivered successfully',
    };

    Alert.alert(
      'Update Status',
      `Mark order as ${newStatus.replace('_', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => updateOrderStatus(order.id, newStatus, statusMessages[newStatus]),
        },
      ]
    );
  };

  const toggleOnlineStatus = (value) => {
    setIsOnline(value);
    if (value) {
      Alert.alert('Online', 'You are now available for new orders');
    } else {
      Alert.alert('Offline', 'You are now offline and unavailable for new orders');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned':
        return '#2196F3';
      case 'picked_up':
        return '#FF9800';
      case 'out_for_delivery':
        return '#9C27B0';
      case 'delivered':
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'assigned':
        return 'picked_up';
      case 'picked_up':
        return 'out_for_delivery';
      case 'out_for_delivery':
        return 'delivered';
      default:
        return null;
    }
  };

  const renderOrderItem = ({ item }) => {
    const nextStatus = getNextStatus(item.status);
    const isActive = ['assigned', 'picked_up', 'out_for_delivery'].includes(item.status);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>#{item.order_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="restaurant" size={16} color="#482E1D" />
            <Text style={styles.infoText}>{item.restaurant?.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="person" size={16} color="#482E1D" />
            <Text style={styles.infoText}>{item.customer?.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color="#482E1D" />
            <Text style={styles.infoText} numberOfLines={2}>
              {item.delivery_address}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="cash" size={16} color="#482E1D" />
            <Text style={styles.infoText}>${item.total_amount.toFixed(2)}</Text>
          </View>
        </View>

        {isActive && nextStatus && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => handleStatusUpdate(item, nextStatus)}
          >
            <LinearGradient
              colors={['#482E1D', '#8D6E63']}
              style={styles.updateButtonGradient}
            >
              <Text style={styles.updateButtonText}>
                Mark as {nextStatus.replace('_', ' ')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#482E1D" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bicycle" size={80} color="#8D6E63" />
      <Text style={styles.emptyStateTitle}>No Active Orders</Text>
      <Text style={styles.emptyStateText}>
        You don't have any assigned orders at the moment.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#482E1D" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FFF3DC', '#FFE4B5']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.driverName}>{user?.name}</Text>
          </View>
          
          <View style={styles.headerActions}>
            {locationUpdating && (
              <View style={styles.locationIndicator}>
                <ActivityIndicator size="small" color="#482E1D" />
                <Text style={styles.locationText}>Updating location...</Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                Alert.alert('Logout', 'Are you sure you want to logout?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', onPress: logout, style: 'destructive' },
                ]);
              }}
            >
              <Ionicons name="log-out" size={24} color="#482E1D" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Online Status Toggle */}
        <View style={styles.onlineStatusContainer}>
          <View style={styles.onlineStatusInfo}>
            <Ionicons 
              name={isOnline ? "radio-button-on" : "radio-button-off"} 
              size={20} 
              color={isOnline ? "#4CAF50" : "#9E9E9E"} 
            />
            <Text style={styles.onlineStatusText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
            thumbColor={isOnline ? '#FFF' : '#FFF'}
          />
        </View>
      </LinearGradient>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#482E1D']}
            tintColor="#482E1D"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3DC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF3DC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#482E1D',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: '#8D6E63',
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#482E1D',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  locationText: {
    fontSize: 12,
    color: '#482E1D',
    marginLeft: 4,
  },
  logoutButton: {
    padding: 8,
  },
  onlineStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#482E1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  onlineStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#482E1D',
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
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
    marginBottom: 16,
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
  orderInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#482E1D',
    marginLeft: 8,
    flex: 1,
  },
  updateButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#482E1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  updateButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  viewButtonText: {
    fontSize: 16,
    color: '#482E1D',
    fontWeight: '600',
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
});

export default DriverDashboardScreen; 