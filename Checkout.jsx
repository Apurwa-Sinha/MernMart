import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import DropIn from 'braintree-web-drop-in-react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from '@material-ui/core';
import { getCartItems, getCartTotal, emptyCart } from '../helpers/cartHelpers';

const API = process.env.REACT_APP_API_URL || '';

const getUserId = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('jwt'));
    return stored && stored.user ? stored.user._id : null;
  } catch (e) {
    return null;
  }
};

const getToken = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('jwt'));
    return stored ? stored.token : null;
  } catch (e) {
    return null;
  }
};

const Checkout = () => {
  const history = useHistory();
  const dropinInstance = useRef(null);

  const [cartItems] = useState(getCartItems());
  const [address, setAddress] = useState('');
  const [clientToken, setClientToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const userId = getUserId();
  const authToken = getToken();
  const total = getCartTotal();

  useEffect(() => {
    if (!userId || !authToken) {
      setLoading(false);
      return;
    }

    const fetchClientToken = async () => {
      try {
        const response = await fetch(`${API}/api/braintree/getToken/${userId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Could not initialize payment');
        } else {
          setClientToken(data.clientToken);
        }
      } catch (err) {
        setError('Could not reach the server');
      } finally {
        setLoading(false);
      }
    };

    fetchClientToken();
  }, [userId, authToken]);

  const handlePay = async () => {
    if (!address.trim()) {
      setError('Please enter a shipping address');
      return;
    }
    if (!dropinInstance.current) {
      setError('Payment form is not ready yet');
      return;
    }

    setPaying(true);
    setError('');

    try {
      const { nonce } = await dropinInstance.current.requestPaymentMethod();

      // 1. charge the card — amount is computed server-side from real
      // product prices, never trusted from the client
      const paymentRes = await fetch(`${API}/api/braintree/payment/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          paymentMethodNonce: nonce,
          products: cartItems.map((item) => ({ _id: item._id, count: item.count })),
        }),
      });

      const paymentData = await paymentRes.json();

      if (!paymentRes.ok) {
        setError(paymentData.error || 'Payment failed');
        setPaying(false);
        return;
      }

      // 2. payment succeeded — now persist the actual order record,
      // decrement stock, and add to purchase history, using the
      // server-verified amount rather than recomputing on the client
      const orderRes = await fetch(`${API}/api/order/create/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          order: {
            products: cartItems,
            transaction_id: paymentData.transaction.id,
            amount: paymentData.verifiedAmount,
            address,
          },
        }),
      });

      if (!orderRes.ok) {
        const orderData = await orderRes.json();
        // the charge succeeded but recording the order failed — this
        // needs the user to know their card WAS charged, not a generic
        // failure message
        setError(
          `Your payment succeeded, but we had trouble recording your order (${
            orderData.error || 'unknown error'
          }). Please contact support with this reference: ${paymentData.transaction.id}`
        );
        setPaying(false);
        return;
      }

      emptyCart();
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Checkout could not be completed');
    } finally {
      setPaying(false);
    }
  };

  if (!userId || !authToken) {
    return (
      <Container maxWidth="sm" style={{ paddingTop: 48, textAlign: 'center' }}>
        <Typography>Please sign in to check out.</Typography>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" style={{ paddingTop: 48, textAlign: 'center' }}>
        <Typography variant="h5" color="primary" gutterBottom>
          Order placed!
        </Typography>
        <Button variant="contained" color="primary" onClick={() => history.push('/')}>
          Continue shopping
        </Button>
      </Container>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="sm" style={{ paddingTop: 48, textAlign: 'center' }}>
        <Typography>Your cart is empty.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <Paper style={{ padding: 24 }}>
        <Typography variant="h6" gutterBottom>
          Checkout
        </Typography>

        <List dense>
          {cartItems.map((item) => (
            <ListItem key={item._id} disableGutters>
              <ListItemText
                primary={item.name}
                secondary={`${item.count} x $${item.price}`}
              />
            </ListItem>
          ))}
        </List>

        <Divider style={{ margin: '12px 0' }} />

        <Typography variant="subtitle1" gutterBottom>
          Total: ${total.toFixed(2)}
        </Typography>

        <TextField
          label="Shipping address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          fullWidth
          multiline
          rows={2}
          variant="outlined"
          margin="normal"
        />

        {clientToken && (
          <DropIn
            options={{ authorization: clientToken }}
            onInstance={(instance) => (dropinInstance.current = instance)}
          />
        )}

        {error && (
          <Typography variant="body2" color="error" gutterBottom>
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handlePay}
          disabled={paying || !clientToken}
        >
          {paying ? 'Processing...' : `Pay $${total.toFixed(2)}`}
        </Button>
      </Paper>
    </Container>
  );
};

export default Checkout;
