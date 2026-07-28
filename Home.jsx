
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  CircularProgress,
} from '@material-ui/core';
import StyleDNARecommendations from '../components/StyleDNARecommendations';
import VisualSearch from '../components/VisualSearch';
import { addItemToCart } from '../helpers/cartHelpers';

const API = process.env.REACT_APP_API_URL || '';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedId, setAddedId] = useState(null);

  const handleAddToCart = (product) => {
    addItemToCart(product, 1);
    setAddedId(product._id);
    setTimeout(() => setAddedId(null), 1500);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          `${API}/api/products?sortBy=createdAt&order=desc&limit=12`
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Could not load products');
        } else {
          setProducts(data);
        }
      } catch (err) {
        setError('Could not reach the server');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <Container maxWidth="lg" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <VisualSearch />

      <StyleDNARecommendations />

      <Box mb={2}>
        <Typography variant="h6">All products</Typography>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Typography color="error">{error}</Typography>
      )}

      {!loading && !error && products.length === 0 && (
        <Typography color="textSecondary">No products found.</Typography>
      )}

      {!loading && !error && products.length > 0 && (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
              <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={`${API}/api/product/photo/${product._id}`}
                  alt={product.name}
                  style={{ objectFit: 'cover' }}
                />
                <CardContent style={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" noWrap>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" noWrap>
                    {product.category && product.category.name}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ${product.price}
                  </Typography>
                  {product.quantity === 0 && (
                    <Typography variant="caption" color="error">
                      Out of stock
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    component={Link}
                    to={`/product/${product._id}`}
                    size="small"
                    color="primary"
                  >
                    View details
                  </Button>
                  <Button
                    size="small"
                    color="primary"
                    disabled={product.quantity === 0}
                    onClick={() => handleAddToCart(product)}
                  >
                    {addedId === product._id ? 'Added!' : 'Add to cart'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Home;



