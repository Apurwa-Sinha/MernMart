import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Divider,
  Chip,
} from '@material-ui/core';
import { getUserId, getToken } from '../helpers/authHelpers';

const API = process.env.REACT_APP_API_URL || '';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [statusValues, setStatusValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, statusRes] = await Promise.all([
          fetch(`${API}/api/order/list/${getUserId()}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
          fetch(`${API}/api/order/status-values/${getUserId()}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
        ]);
        const ordersData = await ordersRes.json();
        const statusData = await statusRes.json();

        if (!ordersRes.ok) {
          setError(ordersData.error || 'Could not load orders');
        } else {
          setOrders(ordersData);
        }
        if (statusRes.ok) setStatusValues(statusData);
      } catch (err) {
        setError('Could not reach the server');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(
        `${API}/api/order/${orderId}/status/${getUserId()}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ orderId, status: newStatus }),
        }
      );
      const data = await response.json();

      if (response.ok) {
        setOrders(
          orders.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        setError(data.error || 'Could not update order status');
      }
    } catch (err) {
      setError('Could not reach the server');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <Typography variant="h6" gutterBottom>
        Manage orders
      </Typography>

      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}

      {orders.length === 0 && !error && (
        <Typography color="textSecondary">No orders yet.</Typography>
      )}

      <List>
        {orders.map((order) => (
          <React.Fragment key={order._id}>
            <ListItem alignItems="flex-start">
              <ListItemText
                primary={
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <span>
                      Order #{order._id.slice(-6)} —{' '}
                      {order.user ? order.user.name : 'Unknown user'}
                    </span>
                    <Chip label={`$${order.amount}`} size="small" />
                  </Box>
                }
                secondary={
                  <>
                    {order.products.map((p, i) => (
                      <div key={i}>
                        {p.name} x {p.count}
                      </div>
                    ))}
                    <Box mt={1}>
                      <Select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        size="small"
                      >
                        {statusValues.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </Select>
                    </Box>
                  </>
                }
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>
    </Container>
  );
};

export default AdminOrders;
