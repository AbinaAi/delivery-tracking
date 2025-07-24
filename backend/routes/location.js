const express = require('express');
const Joi = require('joi');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateDriver } = require('../middleware/auth');

const router = express.Router();

// Validation schema for location update
const locationUpdateSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  accuracy: Joi.number().positive().optional(),
  speed: Joi.number().min(0).optional(),
  heading: Joi.number().min(0).max(360).optional()
});

// Update driver location
router.post('/update', authenticateDriver, async (req, res) => {
  try {
    const { error, value } = locationUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const locationData = {
      driver_id: req.user.id,
      ...value,
      timestamp: new Date().toISOString()
    };

    const { data: location, error: locationError } = await supabaseAdmin
      .from('driver_locations')
      .insert(locationData)
      .select()
      .single();

    if (locationError) {
      return res.status(500).json({ error: 'Failed to update location' });
    }

    res.json({ location });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get driver's current location
router.get('/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;

    const { data: location, error } = await supabaseAdmin
      .from('driver_locations')
      .select('*')
      .eq('driver_id', driverId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error || !location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({ location });

  } catch (error) {
    console.error('Get driver location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get driver's location history
router.get('/driver/:driverId/history', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { hours = 24 } = req.query;

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - parseInt(hours));

    const { data: locations, error } = await supabaseAdmin
      .from('driver_locations')
      .select('*')
      .eq('driver_id', driverId)
      .gte('timestamp', cutoffTime.toISOString())
      .order('timestamp', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch location history' });
    }

    res.json({ locations });

  } catch (error) {
    console.error('Get location history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all active driver locations
router.get('/active-drivers', async (req, res) => {
  try {
    const { data: locations, error } = await supabaseAdmin
      .from('driver_locations')
      .select(`
        *,
        driver:drivers(
          id,
          vehicle_number,
          vehicle_type,
          current_status,
          users(name, phone)
        )
      `)
      .eq('drivers.current_status', 'available')
      .order('timestamp', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch active driver locations' });
    }

    // Group by driver and get latest location for each
    const driverLocations = locations.reduce((acc, location) => {
      const driverId = location.driver_id;
      if (!acc[driverId] || new Date(location.timestamp) > new Date(acc[driverId].timestamp)) {
        acc[driverId] = location;
      }
      return acc;
    }, {});

    res.json({ locations: Object.values(driverLocations) });

  } catch (error) {
    console.error('Get active driver locations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 