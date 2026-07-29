import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Box } from '@material-ui/core';
import { getUserId, getToken } from '../helpers/authHelpers';

const API = process.env.REACT_APP_API_URL || '';

const AddCategory = () => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API}/api/category/create/${getUserId()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ name }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not create category');
      } else {
        setSuccess(true);
        setName('');
      }
    } catch (err) {
      setError('Could not reach the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" style={{ paddingTop: 48 }}>
      <Paper style={{ padding: 24 }}>
        <Typography variant="h6" gutterBottom>
          Add a category
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            variant="outlined"
            margin="normal"
          />

          {error && (
            <Typography variant="body2" color="error" gutterBottom>
              {error}
            </Typography>
          )}
          {success && (
            <Typography variant="body2" color="primary" gutterBottom>
              Category created.
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
              {loading ? 'Creating...' : 'Create category'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default AddCategory;
