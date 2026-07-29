import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@material-ui/core';
import { getUserId, getToken } from '../helpers/authHelpers';

const API = process.env.REACT_APP_API_URL || '';

const UpdateProduct = () => {
  const { productId } = useParams();
  const history = useHistory();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`${API}/api/product/${productId}`),
          fetch(`${API}/api/products/categories`),
        ]);
        const productData = await productRes.json();
        const categoriesData = await categoriesRes.json();

        if (!productRes.ok) {
          setError(productData.error || 'Could not load product');
        } else {
          setForm({
            name: productData.name,
            description: productData.description,
            price: productData.price,
            category: productData.category ? productData.category._id : '',
            quantity: productData.quantity,
            shipping: !!productData.shipping,
          });
        }
        if (categoriesRes.ok) setCategories(categoriesData);
      } catch (err) {
        setError('Could not reach the server');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [productId]);

  const handleChange = (field) => (e) => {
    const value = field === 'shipping' ? e.target.checked : e.target.value;
    setForm({ ...form, [field]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 1000000) {
      setError('Image should be less than 1mb in size');
      return;
    }
    setError('');
    setPhoto(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    const formData = new FormData();
    Object.keys(form).forEach((key) => formData.append(key, form[key]));
    if (photo) formData.append('photo', photo);

    try {
      const response = await fetch(
        `${API}/api/product/${productId}/${getUserId()}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${getToken()}` },
          body: formData,
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not update product');
      } else {
        setSuccess(true);
        setTimeout(() => history.push('/admin/products'), 1000);
      }
    } catch (err) {
      setError('Could not reach the server');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (!form) {
    return (
      <Box mt={6} textAlign="center">
        <Typography color="error">{error || 'Product not found'}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <Paper style={{ padding: 24 }}>
        <Typography variant="h6" gutterBottom>
          Update product
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Name"
            value={form.name}
            onChange={handleChange('name')}
            fullWidth
            variant="outlined"
            margin="normal"
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={handleChange('description')}
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            margin="normal"
          />
          <TextField
            label="Price"
            type="number"
            value={form.price}
            onChange={handleChange('price')}
            fullWidth
            variant="outlined"
            margin="normal"
          />
          <TextField
            select
            label="Category"
            value={form.category}
            onChange={handleChange('category')}
            fullWidth
            variant="outlined"
            margin="normal"
          >
            {categories.map((cat) => (
              <MenuItem key={cat._id} value={cat._id}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange('quantity')}
            fullWidth
            variant="outlined"
            margin="normal"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.shipping}
                onChange={handleChange('shipping')}
              />
            }
            label="Requires shipping"
          />

          <Box mt={1} mb={1}>
            <Button variant="outlined" component="label">
              {photo ? photo.name : 'Replace photo (optional)'}
              <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
            </Button>
          </Box>

          {error && (
            <Typography variant="body2" color="error" gutterBottom>
              {error}
            </Typography>
          )}
          {success && (
            <Typography variant="body2" color="primary" gutterBottom>
              Product updated.
            </Typography>
          )}

          <Box mt={2}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default UpdateProduct;
