import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import DropIn from 'braintree-web-drop-in-react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
} from '@material-ui/core';

const API = process.env.REACT_APP_API_URL || '';

const GroupOrderPay = () => {
  const { token } = useParams();
  const dropinInstance = useRef(null);

  const [groupOrder, setGroupOrder] = useState(null);
  const [clientToken, setClientToken] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [orderRes, tokenRes] = await Promise.all([
          fetch(`${API}/api/group-order/${token}`),
          fetch(`${API}/api/group-order/${token}/client-token`),
        ]);

        const orderData = await orderRes.json();
        const tokenData = await tokenRes.json();

        if (!orderRes.ok) {
          setError(orderData.error || 'Group order not found');
        } else {
          setGroupOrder(orderData);
          setClientToken(tokenData.clientToken);
        }
      } catch (err) {
        setError('Could not reach the server');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const handlePay = async () => {
    if (!email.trim()) {
      setError('Enter the email you were invited with');
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

      const response = await fetch(`${API}/api/group-order/${token}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), paymentMethodNonce: nonce }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Payment failed');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Payment could not be completed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !groupOrder) {
    return (
      <Box mt={6} textAlign="center">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const myShare = groupOrder.participants.find((p) => p.email === email);
  const isExpired = groupOrder.status === 'expired';
  const isCompleted = groupOrder.status === 'completed';

  return (
    <Box maxWidth={480} mx="auto" mt={4}>
      <Paper style={{ padding: 24 }}>
        <Typography variant="h6" gutterBottom>
          Group order
        </Typography>

        <List dense>
          {groupOrder.products.map((item, i) => (
            <ListItem key={i} disableGutters>
              <ListItemText
                primary={item.name}
                secondary={`${item.count} x $${item.price}`}
              />
            </ListItem>
          ))}
        </List>

        <Typography variant="subtitle2" gutterBottom>
          Total: ${groupOrder.totalAmount.toFixed(2)}
        </Typography>

        <Box mt={2} mb={2}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Participants
          </Typography>
          <Box display="flex" flexWrap="wrap" style={{ gap: 8 }}>
            {groupOrder.participants.map((p) => (
              <Chip
                key={p.email}
                label={`${p.email} — $${p.shareAmount.toFixed(2)}`}
                color={p.paid ? 'primary' : 'default'}
                size="small"
              />
            ))}
          </Box>
        </Box>

        {success || isCompleted ? (
          <Typography color="primary">
            {isCompleted
              ? 'Everyone has paid — this order is confirmed!'
              : "Payment received! Waiting on the rest of the group."}
          </Typography>
        ) : isExpired ? (
          <Typography color="error">This group order has expired.</Typography>
        ) : (
          <>
            <TextField
              label="Your email (the one you were invited with)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              size="small"
              variant="outlined"
              margin="normal"
              disabled={myShare && myShare.paid}
            />

            {myShare && myShare.paid ? (
              <Typography color="primary">
                You've already paid your share of ${myShare.shareAmount.toFixed(2)}.
              </Typography>
            ) : (
              <>
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
                  onClick={handlePay}
                  disabled={paying}
                  fullWidth
                >
                  {paying ? 'Processing...' : 'Pay my share'}
                </Button>
              </>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default GroupOrderPay;
