const express = require('express');
const Joi = require('joi');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateCustomer, authenticateDriver, authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createOrderSchema = Joi.object({
  restaurant_id: Joi.string().uuid().required(),
  items: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
    price: Joi.number().positive().required()
  })).min(1).required(),
  total_amount: Joi.number().positive().required(),
  delivery_address: Joi.string().required(),
  delivery_lat: Joi.number().min(-90).max(90).required(),
  delivery_lng: Joi.number().min(-180).max(180).required(),
  pickup_lat: Joi.number().min(-90).max(90).required(),
  pickup_lng: Joi.number().min(-180).max(180).required()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled').required(),
  description: Joi.string().optional(),
  location_lat: Joi.number().min(-90).max(90).optional(),
  location_lng: Joi.number().min(-180).max(180).optional()
});

// Create new order
router.post('/', authenticateCustomer, async (req, res) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const orderData = {
      ...value,
      customer_id: req.user.id,
      order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending'
    };

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Add initial tracking entry
    await supabaseAdmin
      .from('order_tracking')
      .insert({
        order_id: order.id,
        status: 'pending',
        description: 'Order placed successfully'
      });

    res.status(201).json({ order });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer orders
router.get('/customer', authenticateCustomer, async (req, res) => {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(name, address, phone),
        driver:drivers(
          id,
          vehicle_number,
          vehicle_type,
          users(name, phone)
        ),
        order_tracking(
          status,
          description,
          created_at
        )
      `)
      .eq('customer_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    res.json({ orders });

  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get driver orders
router.get('/driver', authenticateDriver, async (req, res) => {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        customer:users(name, phone),
        restaurant:restaurants(name, address, phone),
        order_tracking(
          status,
          description,
          created_at
        )
      `)
      .eq('driver_id', req.user.id)
      .in('status', ['assigned', 'picked_up', 'out_for_delivery'])
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    res.json({ orders });

  } catch (error) {
    console.error('Get driver orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        customer:users(name, phone),
        driver:drivers(
          id,
          vehicle_number,
          vehicle_type,
          users(name, phone)
        ),
        restaurant:restaurants(name, address, phone),
        order_tracking(
          status,
          description,
          location_lat,
          location_lng,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status (driver only)
router.patch('/:id/status', authenticateDriver, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateStatusSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if order is assigned to this driver
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, driver_id, status')
      .eq('id', id)
      .eq('driver_id', req.user.id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found or not assigned to you' });
    }

    // Update order status using the database function
    const { error: updateError } = await supabaseAdmin.rpc('update_order_status', {
      order_uuid: id,
      new_status: value.status,
      description: value.description,
      location_lat: value.location_lat,
      location_lng: value.location_lng
    });

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update order status' });
    }

    // Get updated order details
    const { data: updatedOrder } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        customer:users(name, phone),
        restaurant:restaurants(name, address, phone),
        order_tracking(
          status,
          description,
          location_lat,
          location_lng,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    res.json({ order: updatedOrder });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign nearest driver to order
router.post('/:id/assign-driver', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.driver_id) {
      return res.status(400).json({ error: 'Order already has a driver assigned' });
    }

    // Find nearest available driver
    const { data: nearestDriver, error: driverError } = await supabaseAdmin.rpc('find_nearest_driver', {
      pickup_lat: order.pickup_lat,
      pickup_lng: order.pickup_lng,
      max_distance: 50
    });

    if (driverError || !nearestDriver || nearestDriver.length === 0) {
      return res.status(404).json({ error: 'No available drivers found nearby' });
    }

    const driver = nearestDriver[0];

    // Assign driver to order
    const { error: assignError } = await supabaseAdmin
      .from('orders')
      .update({
        driver_id: driver.driver_id,
        status: 'assigned'
      })
      .eq('id', id);

    if (assignError) {
      return res.status(500).json({ error: 'Failed to assign driver' });
    }

    // Update driver status to busy
    await supabaseAdmin
      .from('drivers')
      .update({ current_status: 'busy' })
      .eq('id', driver.driver_id);

    // Add tracking entry
    await supabaseAdmin
      .from('order_tracking')
      .insert({
        order_id: id,
        status: 'assigned',
        description: `Assigned to ${driver.driver_name} (${driver.vehicle_number})`
      });

    res.json({
      message: 'Driver assigned successfully',
      driver: {
        id: driver.driver_id,
        name: driver.driver_name,
        vehicle_number: driver.vehicle_number,
        distance: driver.distance
      }
    });

  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all orders (admin only)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        customer:users(name, phone),
        driver:drivers(
          id,
          vehicle_number,
          vehicle_type,
          users(name, phone)
        ),
        restaurant:restaurants(name, address, phone)
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 