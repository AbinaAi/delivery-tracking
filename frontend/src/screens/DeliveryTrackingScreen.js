import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const DeliveryTrackingScreen = () => {
  // Mock logged-in user (delivery_agent_id = 123)
  const mockUserId = 123;
  
  const [driverLocation, setDriverLocation] = useState({
    latitude: 28.6142,
    longitude: 77.2093,
  });
  const [eta, setEta] = useState(22);
  const [currentStep, setCurrentStep] = useState(2); // Out for Delivery
  const [orderStatus, setOrderStatus] = useState('out_for_delivery');
  
  const mapRef = useRef(null);

  // Mock order data
  const mockOrder = {
    id: 'ORD-001',
    order_number: 'ORD-001',
    status: 'out_for_delivery',
    customer: { name: 'John Customer', phone: '+1234567890' },
    driver: {
      id: 'driver-1',
      name: 'Mike Driver',
      phone: '+1234567891',
      vehicle_number: 'DL-01-AB-1234',
      vehicle_type: 'Motorcycle'
    },
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
    created_at: new Date().toISOString(),
    estimated_delivery_time: new Date(Date.now() + 22 * 60000).toISOString(),
  };

  // Status steps for the timeline
  const statusSteps = [
    { id: 1, title: 'Order Placed', description: 'Order placed successfully', status: 'completed' },
    { id: 2, title: 'Preparing', description: 'Food is being prepared', status: 'completed' },
    { id: 3, title: 'Out for Delivery', description: 'Driver is on the way', status: 'current' },
    { id: 4, title: 'Delivered', description: 'Order delivered successfully', status: 'pending' },
  ];

  // Route coordinates for the polyline
  const routeCoordinates = [
    { latitude: mockOrder.pickup_lat, longitude: mockOrder.pickup_lng },
    { latitude: mockOrder.delivery_lat, longitude: mockOrder.delivery_lng },
  ];

  useEffect(() => {
    // Simulate driver movement every 3 seconds
    const interval = setInterval(() => {
      setDriverLocation(prevLocation => ({
        latitude: prevLocation.latitude + (Math.random() - 0.5) * 0.001,
        longitude: prevLocation.longitude + (Math.random() - 0.5) * 0.001,
      }));
      
      // Update ETA (decrease by 1 minute every 3 seconds)
      setEta(prevEta => Math.max(0, prevEta - 1));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getMapRegion = () => ({
    latitude: (mockOrder.pickup_lat + mockOrder.delivery_lat) / 2,
    longitude: (mockOrder.pickup_lng + mockOrder.delivery_lng) / 2,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const handleCallDriver = () => {
    Alert.alert('Call Driver', `Call ${mockOrder.driver.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => console.log('Calling driver...') },
    ]);
  };

  const handleCallRestaurant = () => {
    Alert.alert('Call Restaurant', `Call ${mockOrder.restaurant.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => console.log('Calling restaurant...') },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={getMapRegion()}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
        >
          {/* Pickup Location Marker */}
          <Marker
            coordinate={{
              latitude: mockOrder.pickup_lat,
              longitude: mockOrder.pickup_lng,
            }}
            title="Pickup Location"
            description={mockOrder.restaurant.name}
            pinColor="#4CAF50"
          />

          {/* Delivery Location Marker */}
          <Marker
            coordinate={{
              latitude: mockOrder.delivery_lat,
              longitude: mockOrder.delivery_lng,
            }}
            title="Delivery Location"
            description={mockOrder.delivery_address}
            pinColor="#FF5722"
          />

          {/* Driver Location Marker */}
          <Marker
            coordinate={driverLocation}
            title="Driver"
            description={mockOrder.driver.name}
            pinColor="#2196F3"
          >
            <View style={styles.driverMarker}>
              <Ionicons name="bicycle" size={24} color="#2196F3" />
            </View>
          </Marker>

          {/* Route Polyline */}
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#482E1D"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        </MapView>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => mapRef.current?.fitToCoordinates(routeCoordinates, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            })}
          >
            <Ionicons name="locate" size={24} color="#482E1D" />
          </TouchableOpacity>
        </View>

        {/* Tracking Status Overlay */}
        <View style={styles.trackingOverlay}>
          <LinearGradient
            colors={['rgba(255, 243, 220, 0.95)', 'rgba(255, 228, 181, 0.95)']}
            style={styles.trackingGradient}
          >
            <View style={styles.trackingHeader}>
              <View style={styles.trackingInfo}>
                <Text style={styles.trackingTitle}>Live Tracking</Text>
                <Text style={styles.trackingStatus}>
                  {orderStatus.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <View style={styles.trackingIndicator}>
                <View style={[styles.indicatorDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.indicatorText}>LIVE</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>

      {/* Order Information */}
      <ScrollView style={styles.infoContainer} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#FFF3DC', '#FFE4B5']}
          style={styles.infoGradient}
        >
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>Order #{mockOrder.order_number}</Text>
            <Text style={styles.orderStatus}>{orderStatus.replace('_', ' ').toUpperCase()}</Text>
          </View>

          {/* ETA Section */}
          <View style={styles.etaSection}>
            <Ionicons name="time" size={24} color="#FF9800" />
            <View style={styles.etaInfo}>
              <Text style={styles.etaLabel}>Estimated Arrival</Text>
              <Text style={styles.etaTime}>{eta} mins</Text>
            </View>
          </View>

          {/* Driver Info */}
          <View style={styles.driverInfo}>
            <View style={styles.driverHeader}>
              <Ionicons name="person" size={20} color="#482E1D" />
              <Text style={styles.driverName}>{mockOrder.driver.name}</Text>
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallDriver}
              >
                <Ionicons name="call" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>
            <Text style={styles.driverVehicle}>
              {mockOrder.driver.vehicle_type} • {mockOrder.driver.vehicle_number}
            </Text>
          </View>

          {/* Restaurant Info */}
          <View style={styles.restaurantInfo}>
            <Ionicons name="restaurant" size={20} color="#482E1D" />
            <Text style={styles.restaurantName}>{mockOrder.restaurant.name}</Text>
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCallRestaurant}
            >
              <Ionicons name="call" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Status Timeline */}
        <View style={styles.timelineContainer}>
          <Text style={styles.timelineTitle}>Order Status</Text>
          {statusSteps.map((step, index) => (
            <View key={step.id} style={styles.timelineStep}>
              <View style={styles.timelineDot}>
                <View style={[
                  styles.dot,
                  step.status === 'completed' && styles.dotCompleted,
                  step.status === 'current' && styles.dotCurrent,
                  step.status === 'pending' && styles.dotPending,
                ]} />
                {index < statusSteps.length - 1 && (
                  <View style={[
                    styles.timelineLine,
                    step.status === 'completed' && styles.lineCompleted,
                    step.status === 'current' && styles.lineCurrent,
                    step.status === 'pending' && styles.linePending,
                  ]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[
                  styles.stepTitle,
                  step.status === 'completed' && styles.stepTitleCompleted,
                  step.status === 'current' && styles.stepTitleCurrent,
                  step.status === 'pending' && styles.stepTitlePending,
                ]}>
                  {step.title}
                </Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Order Details */}
        <View style={styles.orderDetailsContainer}>
          <Text style={styles.orderDetailsTitle}>Order Details</Text>
          {mockOrder.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>${item.price}</Text>
            </View>
          ))}
          <View style={styles.orderTotal}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>${mockOrder.total_amount}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3DC',
  },
  mapContainer: {
    height: height * 0.5,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 50,
    right: 16,
  },
  mapButton: {
    backgroundColor: '#FFF3DC',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#482E1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  driverMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  trackingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  trackingGradient: {
    padding: 16,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingInfo: {
    flex: 1,
  },
  trackingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#482E1D',
  },
  trackingStatus: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  indicatorText: {
    fontSize: 12,
    color: '#482E1D',
    fontWeight: '600',
  },
  infoContainer: {
    flex: 1,
  },
  infoGradient: {
    padding: 20,
    margin: 16,
    borderRadius: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#482E1D',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
    backgroundColor: '#FFF3DC',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  etaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  etaInfo: {
    marginLeft: 12,
    flex: 1,
  },
  etaLabel: {
    fontSize: 14,
    color: '#8D6E63',
  },
  etaTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#482E1D',
  },
  driverInfo: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#482E1D',
    marginLeft: 8,
    flex: 1,
  },
  callButton: {
    padding: 4,
  },
  driverVehicle: {
    fontSize: 14,
    color: '#8D6E63',
    marginLeft: 28,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#482E1D',
    marginLeft: 8,
    flex: 1,
  },
  timelineContainer: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#482E1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#482E1D',
    marginBottom: 16,
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineDot: {
    alignItems: 'center',
    marginRight: 16,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  dotCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  dotCurrent: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  dotPending: {
    backgroundColor: '#FFF',
    borderColor: '#E0E0E0',
  },
  timelineLine: {
    width: 2,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
  },
  lineCompleted: {
    backgroundColor: '#4CAF50',
  },
  lineCurrent: {
    backgroundColor: '#FF9800',
  },
  linePending: {
    backgroundColor: '#E0E0E0',
  },
  timelineContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8D6E63',
  },
  stepTitleCompleted: {
    color: '#4CAF50',
  },
  stepTitleCurrent: {
    color: '#FF9800',
  },
  stepTitlePending: {
    color: '#8D6E63',
  },
  stepDescription: {
    fontSize: 14,
    color: '#8D6E63',
    marginTop: 4,
  },
  orderDetailsContainer: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#482E1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#482E1D',
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemName: {
    fontSize: 16,
    color: '#482E1D',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#8D6E63',
    marginHorizontal: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#482E1D',
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#482E1D',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#482E1D',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9800',
  },
});

export default DeliveryTrackingScreen; 