import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const StatusTimeline = ({ order, currentStatus }) => {
  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: '📋' },
    { key: 'accepted', label: 'Order Accepted', icon: '✅' },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
    { key: 'ready_for_pickup', label: 'Ready for Pickup', icon: '📦' },
    { key: 'picked_up', label: 'Picked Up', icon: '🛵' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '🎉' },
  ];

  const getStatusIndex = (status) => {
    return statusSteps.findIndex(step => step.key === status);
  };

  const currentIndex = getStatusIndex(currentStatus || order?.status);

  const isCompleted = (index) => {
    return index <= currentIndex;
  };

  const isCurrent = (index) => {
    return index === currentIndex;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Status</Text>
      
      {statusSteps.map((step, index) => (
        <View key={step.key} style={styles.stepContainer}>
          {/* Timeline line */}
          {index < statusSteps.length - 1 && (
            <View style={[
              styles.line,
              isCompleted(index) ? styles.completedLine : styles.pendingLine
            ]} />
          )}
          
          {/* Status circle */}
          <View style={[
            styles.circle,
            isCompleted(index) ? styles.completedCircle : styles.pendingCircle,
            isCurrent(index) && styles.currentCircle
          ]}>
            <Text style={styles.icon}>{step.icon}</Text>
          </View>
          
          {/* Status content */}
          <View style={styles.content}>
            <Text style={[
              styles.stepLabel,
              isCompleted(index) ? styles.completedText : styles.pendingText,
              isCurrent(index) && styles.currentText
            ]}>
              {step.label}
            </Text>
            
            {isCurrent(index) && order?.order_tracking && (
              <Text style={styles.statusDescription}>
                {order.order_tracking.find(t => t.status === step.key)?.description || 
                 `Order is ${step.label.toLowerCase()}`}
              </Text>
            )}
            
            {isCompleted(index) && order?.order_tracking && (
              <Text style={styles.timestamp}>
                {new Date(
                  order.order_tracking.find(t => t.status === step.key)?.created_at || 
                  order.created_at
                ).toLocaleTimeString()}
              </Text>
            )}
          </View>
        </View>
      ))}
      
      {/* ETA Display */}
      {order?.estimated_delivery_time && (
        <View style={styles.etaContainer}>
          <LinearGradient
            colors={['#FFF3DC', '#FFE4B5']}
            style={styles.etaGradient}
          >
            <Text style={styles.etaLabel}>Estimated Delivery</Text>
            <Text style={styles.etaTime}>
              {new Date(order.estimated_delivery_time).toLocaleTimeString()}
            </Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3DC',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#482E1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#482E1D',
    marginBottom: 20,
    textAlign: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  line: {
    position: 'absolute',
    left: 15,
    top: 30,
    width: 2,
    height: 40,
  },
  completedLine: {
    backgroundColor: '#4CAF50',
  },
  pendingLine: {
    backgroundColor: '#E0E0E0',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    zIndex: 1,
  },
  completedCircle: {
    backgroundColor: '#4CAF50',
  },
  pendingCircle: {
    backgroundColor: '#E0E0E0',
  },
  currentCircle: {
    backgroundColor: '#FF9800',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingTop: 4,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  completedText: {
    color: '#4CAF50',
  },
  pendingText: {
    color: '#9E9E9E',
  },
  currentText: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  etaContainer: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  etaGradient: {
    padding: 16,
    alignItems: 'center',
  },
  etaLabel: {
    fontSize: 14,
    color: '#482E1D',
    fontWeight: '600',
    marginBottom: 4,
  },
  etaTime: {
    fontSize: 18,
    color: '#482E1D',
    fontWeight: 'bold',
  },
});

export default StatusTimeline; 