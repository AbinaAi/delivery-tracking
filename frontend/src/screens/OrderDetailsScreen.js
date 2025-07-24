import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import StatusTimeline from '../components/StatusTimeline';
import apiService from '../config/api';

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Mock API call - replace with actual API
      const mockOrder = {
        id: orderId,
        order_number: 'ORD-001',
        status: 'out_for_delivery',
        customer: { 
          name: 'John Customer', 
          phone: '+1234567890',
          email: 'john@example.com'
        },
        driver: {
          id: 'driver-1',
          users: { name: 'Mike Driver', phone: '+1234567891' },
          vehicle_number: 'DL-01-AB-1234',
          vehicle_type: 'Motorcycle'
        },
        restaurant: {
          name: 'Pizza Palace',
          address: '123 Main St, Downtown',
          phone: '+1234567894',
          rating: 4.5
        },
        items: [
          { 
            name: 'Margherita Pizza', 
            quantity: 2, 
            price: 15.99,
            description: 'Fresh mozzarella, tomato sauce, basil',
            image: 'https://via.placeholder.com/60x60'
          },
          { 
            name: 'Coke', 
            quantity: 1, 
            price: 2.99,
            description: '330ml can',
            image: 'https://via.placeholder.com/60x60'
          },
          { 
            name: 'Garlic Bread', 
            quantity: 1, 
            price: 4.99,
            description: 'Fresh baked with garlic butter',
            image: 'https://via.placeholder.com/60x60'
          }
        ],
        subtotal: 39.96,
        delivery_fee: 2.99,
        tax: 3.20,
        total_amount: 46.15,
        delivery_address: '456 Customer St, Delivery Area, City, State 12345',
        delivery_lat: 28.6145,
        delivery_lng: 77.2095,
        pickup_lat: 28.6139,
        pickup_lng: 77.2090,
        created_at: new Date(Date.now() - 60 * 60000).toISOString(), // 1 hour ago
        estimated_delivery_time: new Date(Date.now() + 30 * 60000).toISOString(), // 30 minutes from now
        payment_method: {
          type: 'credit_card',
          last4: '1234',
          brand: 'Visa'
        },
        special_instructions: 'Please ring the doorbell twice',
        order_tracking: [
          { 
            status: 'pending', 
            description: 'Order placed successfully', 
            created_at: new Date(Date.now() - 60 * 60000).toISOString() 
          },
          { 
            status: 'accepted', 
            description: 'Order accepted by restaurant', 
            created_at: new Date(Date.now() - 45 * 60000).toISOString() 
          },
          { 
            status: 'preparing', 
            description: 'Food is being prepared', 
            created_at: new Date(Date.now() - 30 * 60000).toISOString() 
          },
          { 
            status: 'ready_for_pickup', 
            description: 'Order ready for pickup', 
            created_at: new Date(Date.now() - 15 * 60000).toISOString() 
          },
          { 
            status: 'picked_up', 
            description: 'Driver picked up the order', 
            created_at: new Date(Date.now() - 5 * 60000).toISOString() 
          },
          { 
            status: 'out_for_delivery', 
            description: 'Driver is on the way', 
            created_at: new Date().toISOString() 
          }
        ]
      };

      setOrder(mockOrder);
    } catch (error) {
      console.error('Fetch order details error:', error);
      Alert.alert('Error', 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = () => {
    navigation.navigate('DeliveryTracking', { orderId });
  };

  const handleCallDriver = () => {
    if (order?.driver?.users?.phone) {
      Alert.alert('Call Driver', `Call ${order.driver.users.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('Calling driver...') },
      ]);
    }
  };

  const handleCallRestaurant = () => {
    if (order?.restaurant?.phone) {
      Alert.alert('Call Restaurant', `Call ${order.restaurant.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('Calling restaurant...') },
      ]);
    }
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

  const formatPaymentMethod = (payment) => {
    if (!payment) return 'Not specified';
    return `${payment.brand} •••• ${payment.last4}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#482E1D" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Order Header */}
      <LinearGradient
        colors={['#FFF3DC', '#FFE4B5']}
        style={styles.headerGradient}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.status) }
          ]}>
            <Text style={styles.statusText}>
              {order.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.orderDate}>
          {new Date(order.created_at).toLocaleDateString()} at{' '}
          {new Date(order.created_at).toLocaleTimeString()}
        </Text>
      </LinearGradient>

      {/* Restaurant Information */}
      {order.restaurant && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant" size={24} color="#482E1D" />
            <Text style={styles.sectionTitle}>Restaurant</Text>
          </View>
          
          <View style={styles.restaurantCard}>
            <View style={styles.restaurantHeader}>
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{order.restaurant.name}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{order.restaurant.rating}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallRestaurant}
              >
                <Ionicons name="call" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>
            <Text style={styles.restaurantAddress}>{order.restaurant.address}</Text>
          </View>
        </View>
      )}

      {/* Driver Information */}
      {order.driver && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bicycle" size={24} color="#482E1D" />
            <Text style={styles.sectionTitle}>Driver</Text>
          </View>
          
          <View style={styles.driverCard}>
            <View style={styles.driverHeader}>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{order.driver.users.name}</Text>
                <Text style={styles.driverVehicle}>
                  {order.driver.vehicle_type} • {order.driver.vehicle_number}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallDriver}
              >
                <Ionicons name="call" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Order Items */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list" size={24} color="#482E1D" />
          <Text style={styles.sectionTitle}>Order Items</Text>
        </View>
        
        <View style={styles.itemsContainer}>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            </View>
          ))}
          
          {/* Order Summary */}
          <View style={styles.orderSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${order.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>${order.delivery_fee.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>${order.tax.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${order.total_amount.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Payment Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="card" size={24} color="#482E1D" />
          <Text style={styles.sectionTitle}>Payment</Text>
        </View>
        
        <View style={styles.paymentCard}>
          <View style={styles.paymentInfo}>
            <Ionicons name="card" size={20} color="#482E1D" />
            <Text style={styles.paymentMethod}>
              {formatPaymentMethod(order.payment_method)}
            </Text>
          </View>
        </View>
      </View>

      {/* Delivery Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location" size={24} color="#482E1D" />
          <Text style={styles.sectionTitle}>Delivery Information</Text>
        </View>
        
        <View style={styles.deliveryCard}>
          <Text style={styles.deliveryAddress}>{order.delivery_address}</Text>
          
          {order.special_instructions && (
            <View style={styles.instructionsContainer}>
              <Ionicons name="information-circle" size={16} color="#FF9800" />
              <Text style={styles.instructionsText}>
                {order.special_instructions}
              </Text>
            </View>
          )}
          
          {order.estimated_delivery_time && (
            <View style={styles.etaContainer}>
              <Ionicons name="time" size={20} color="#FF9800" />
              <Text style={styles.etaText}>
                Estimated Delivery: {new Date(order.estimated_delivery_time).toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Status Timeline */}
      <StatusTimeline order={order} currentStatus={order.status} />

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={handleTrackOrder}
        >
          <LinearGradient
            colors={['#482E1D', '#8D6E63']}
            style={styles.trackButtonGradient}
          >
            <Ionicons name="map" size={20} color="#FFF" />
            <Text style={styles.trackButtonText}>Track Order</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF3DC',
  },
  errorText: {
    fontSize: 18,
    color: '#FF5722',
  },
  headerGradient: {
    padding: 20,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#482E1D',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#482E1D',
    marginLeft: 8,
  },
  restaurantCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#482E1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#482E1D',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#8D6E63',
    marginLeft: 4,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
  },
  driverCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#482E1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#482E1D',
    marginBottom: 4,
  },
  driverVehicle: {
    fontSize: 14,
    color: '#666',
  },
  callButton: {
    padding: 8,
    backgroundColor: '#F0F8F0',
    borderRadius: 20,
  },
  itemsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#482E1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#482E1D',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#8D6E63',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#482E1D',
  },
  orderSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8D6E63',
  },
  summaryValue: {
    fontSize: 14,
    color: '#482E1D',
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#482E1D',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#482E1D',
  },
  paymentCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#482E1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 16,
    color: '#482E1D',
    marginLeft: 8,
  },
  deliveryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#482E1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryAddress: {
    fontSize: 16,
    color: '#482E1D',
    marginBottom: 12,
    lineHeight: 22,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
    fontStyle: 'italic',
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtons: {
    margin: 16,
    marginBottom: 32,
  },
  trackButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#482E1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  trackButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  trackButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default OrderDetailsScreen; 