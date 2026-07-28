
import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardMedia,
  Grid,
  IconButton,
  Button,
  Divider,
  TextField,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  getCartItems,
  updateItemCount,
  removeItemFromCart,
} from '../helpers/cartHelpers';

const API = process.env.REACT_APP_API_URL || '';

const Cart = () => {
  const [items, setItems] = useState([]);
  const history = useHistory();

  useEffect(() => {
    setItems(getCartItems());
  }, []);

  const handleQuantityChange = (productId, delta) => {
    const item = items.find((i) => i._id === productId);
    if (!item) return;
    const updated = updateItemCount(productId, item.count + delta);
    setItems(updated);
  };

  const handleRemove = (productId) => {
    const updated = removeItemFromCart(productId);
    setItems(updated);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.count, 0);

  if (items.length === 0) {
    return (
      <Container maxWidth="sm" style={{ paddingTop: 48, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Your cart is empty
        </Typography>
        <Button component={Link} to="/" variant="contained" color="primary">
          Continue shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <Typography variant="h5" gutterBottom>
        Your cart
      </Typography>

      {items.map((item) => (
        <Card key={item._id} style={{ marginBottom: 16, padding: 16 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={3} sm={2}>
              <CardMedia
                component="img"
                image={`${API}/api/product/photo/${item._id}`}
                alt={item.name}
                style={{ height: 64, width: 64, objectFit: 'cover', borderRadius: 4 }}
              />
            </Grid>
            <Grid item xs={9} sm={4}>
              <Typography variant="subtitle1">{item.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                ${item.price} each
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box display="flex" alignItems="center">
                <IconButton
                  size="small"
                  onClick={() => handleQuantityChange(item._id, -1)}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <TextField
                  value={item.count}
                  size="small"
                  style={{ width: 40 }}
                  inputProps={{ style: { textAlign: 'center' }, readOnly: true }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleQuantityChange(item._id, 1)}
                  disabled={item.quantity && item.count >= item.quantity}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </Grid>
            <Grid item xs={4} sm={2}>
              <Typography variant="subtitle1">
                ${(item.price * item.count).toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={2} sm={1}>
              <IconButton size="small" onClick={() => handleRemove(item._id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Grid>
          </Grid>
        </Card>
      ))}

      <Divider style={{ margin: '16px 0' }} />

      <Box display="flex" justifyContent="flex-end" mb={3}>
        <Typography variant="h6">Total: ${total.toFixed(2)}</Typography>
      </Box>

      <Box display="flex" justifyContent="flex-end" style={{ gap: 12 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => history.push('/split-checkout')}
        >
          Split the bill with friends
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => history.push('/checkout')}
        >
          Checkout
        </Button>
      </Box>
    </Container>
  );
};

export default Cart;

