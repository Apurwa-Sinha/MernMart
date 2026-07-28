import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  Chip,
} from '@material-ui/core';
import ReturnRiskBadge from '../components/ReturnRiskBadge';
import { useTrackProductView } from '../hooks/useTrackProductView';

const API = process.env.REACT_APP_API_URL || '';

const addToCart = (product, quantity) => {
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
  } catch (e) {
    cart = [];
  }

  const existing = cart.find((item) => item._id === product._id);
  if (existing) {
    existing.count += quantity;
  } else {
    cart.push({
      _id: product._id,
      name: product.name,
      price: product.price,
      count: quantity,
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
};

const ProductDetail = () => {
  const { productId } = useParams();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  // fold this product's embedding into the signed-in user's Style DNA
  // profile once the product is loaded (no-ops for logged-out users)
  useTrackProductView(product ? product._id : null);

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API}/api/product/${productId}`);
        const data = await response.json();

        if (!response.ok) {
          if (!cancelled) setError(data.error || 'Product not found');
        } else {
          if (!cancelled) setProduct(data);

          const relatedRes = await fetch(
            `${API}/api/products/related/${productId}`
          );
          const relatedData = await relatedRes.json();
          if (!cancelled && relatedRes.ok) setRelated(relatedData);
        }
      } catch (err) {
        if (!cancelled) setError('Could not reach the server');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleAddToCart = () => {
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box mt={6} textAlign="center">
        <Typography color="error">{error || 'Product not found'}</Typography>
      </Box>
    );
  }

  const outOfStock = product.quantity === 0;

  return (
    <Container maxWidth="lg" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <img
            src={`${API}/api/product/photo/${product._id}`}
            alt={product.name}
            style={{ width: '100%', borderRadius: 8, objectFit: 'cover' }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h4" gutterBottom>
            {product.name}
          </Typography>

          {product.category && (
            <Chip label={product.category.name} size="small" style={{ marginBottom: 12 }} />
          )}

          <Typography variant="h5" color="primary" gutterBottom>
            ${product.price}
          </Typography>

          <Typography variant="body1" paragraph>
            {product.description}
          </Typography>

          {outOfStock ? (
            <Typography color="error" gutterBottom>
              Out of stock
            </Typography>
          ) : (
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {product.quantity} in stock
            </Typography>
          )}

          <ReturnRiskBadge productId={product._id} />

          <Box mt={3}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              disabled={outOfStock}
              onClick={handleAddToCart}
            >
              {outOfStock ? 'Out of stock' : added ? 'Added!' : 'Add to cart'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {related.length > 0 && (
        <Box mt={6}>
          <Typography variant="h6" gutterBottom>
            You might also like
          </Typography>
          <Grid container spacing={2}>
            {related.map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item._id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="140"
                    image={`${API}/api/product/photo/${item._id}`}
                    alt={item.name}
                  />
                  <CardContent>
                    <Typography variant="subtitle2" noWrap>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ${item.price}
                    </Typography>
                    <Button
                      component={Link}
                      to={`/product/${item._id}`}
                      size="small"
                      color="primary"
                    >
                      View
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default ProductDetail;
