import React, { useState, useEffect } from 'react';
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
} from '@material-ui/core';
import { getUserId, getToken } from '../helpers/authHelpers';

const API = process.env.REACT_APP_API_URL || '';

const AddProduct = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    quantity: '',
    shipping: false,
  });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API}/api/products/categories`);
        const data = await response.json();
        if (response.ok) setCategories(data);
      } catch (err) {
        // non-fatal — the dropdown will just be empty
      }
    };
    fetchCategories();
  }, []);

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

    const { name, description, price, category, quantity } = form;
    if (!name || !description || !price || !category || !quantity) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('description', form.description);
    formData.append('price', form.price);
    formData.append('category', form.category);
    formData.append('quantity', form.quantity);
    formData.append('shipping', form.shipping);
    if (photo) formData.append('photo', photo);

    try {
      const response = await fetch(
        `${API}/api/product/create/${getUserId()}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
          body: formData,
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not create product');
      } else {
        setSuccess(true);
        setForm({
          name: '',
          description: '',
          price: '',
          category: '',
          quantity: '',
          shipping: false,
        });
        setPhoto(null);
      }
    } catch (err) {
      setError('Could not reach the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <Paper style={{ padding: 24 }}>
        <Typography variant="h6" gutterBottom>
          Add a product
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
              {photo ? photo.name : 'Choose photo'}
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
              Product created.
            </Typography>
          )}

          <Box mt={2}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create product'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default AddProduct;
