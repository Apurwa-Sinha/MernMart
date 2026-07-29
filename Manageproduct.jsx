import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  CircularProgress,
  Box,
} from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import { getUserId, getToken } from '../helpers/authHelpers';

const API = process.env.REACT_APP_API_URL || '';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API}/api/products?limit=100`);
      const data = await response.json();
      if (response.ok) setProducts(data);
      else setError(data.error || 'Could not load products');
    } catch (err) {
      setError('Could not reach the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      const response = await fetch(
        `${API}/api/product/${productId}/${getUserId()}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (response.ok) {
        setProducts(products.filter((p) => p._id !== productId));
      } else {
        const data = await response.json();
        setError(data.error || 'Could not delete product');
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
    <Container maxWidth="sm" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <Typography variant="h6" gutterBottom>
        Manage products
      </Typography>

      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}

      <List>
        {products.map((product) => (
          <ListItem key={product._id} divider>
            <ListItemAvatar>
              <Avatar
                variant="square"
                src={`${API}/api/product/photo/${product._id}`}
              />
            </ListItemAvatar>
            <ListItemText
              primary={product.name}
              secondary={`$${product.price} — ${product.quantity} in stock`}
            />
            <IconButton
              component={Link}
              to={`/admin/product/update/${product._id}`}
            >
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => handleDelete(product._id)}>
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default ManageProducts;
