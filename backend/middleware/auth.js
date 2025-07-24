const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

// Verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware for customer authentication
const authenticateCustomer = async (req, res, next) => {
  try {
    await verifyToken(req, res, async () => {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role')
        .eq('id', req.user.id)
        .eq('role', 'customer')
        .single();

      if (error || !user) {
        return res.status(403).json({ error: 'Customer access required' });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Middleware for driver authentication
const authenticateDriver = async (req, res, next) => {
  try {
    await verifyToken(req, res, async () => {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role')
        .eq('id', req.user.id)
        .eq('role', 'driver')
        .single();

      if (error || !user) {
        return res.status(403).json({ error: 'Driver access required' });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Middleware for admin authentication
const authenticateAdmin = async (req, res, next) => {
  try {
    await verifyToken(req, res, async () => {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role')
        .eq('id', req.user.id)
        .eq('role', 'admin')
        .single();

      if (error || !user) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = {
  verifyToken,
  authenticateCustomer,
  authenticateDriver,
  authenticateAdmin
}; 