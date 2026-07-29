import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Box,
  Chip,
} from '@material-ui/core';
import { getUserId, getToken } from '../helpers/authHelpers';

const API = process.env.REACT_APP_API_URL || '';

const STATUS_COLORS = {
  'Not processed': 'default',
  Processing: 'default',
  Shipped: 'primary',
  Delivered: 'primary',
  Cancelled: 'secondary',
  Returned: 'secondary',
};

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(
          `${API}/api/orders/by/user/${getUserId()}`,
          {
            headers: { Authorization: `Bearer ${getToken()}` },
          }
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Could not load your orders');
        } else {
          setOrders(data);
        }
      } catch (err) {
        setError('Could not reach the server');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <Typography variant="h6" gutterBottom>
        Your orders
      </Typography>

      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}

      {!error && orders.length === 0 && (
        <Typography color="textSecondary">
          You haven't placed any orders yet.
        </Typography>
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
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <Chip
                      label={order.status}
                      size="small"
                      color={STATUS_COLORS[order.status] || 'default'}
                    />
                  </Box>
                }
                secondary={
                  <>
                    {order.products.map((p, i) => (
                      <div key={i}>
                        {p.name} x {p.count} — ${p.price}
                      </div>
                    ))}
                    <Box mt={0.5}>
                      <Typography variant="body2" color="textSecondary">
                        Total: ${order.amount}
                      </Typography>
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

export default OrderHistory;
