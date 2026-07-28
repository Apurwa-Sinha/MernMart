import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
} from '@material-ui/core';

const API = process.env.REACT_APP_API_URL || '';

const Signup = () => {
  const history = useHistory();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Sign up failed');
      } else {
        setSuccess(true);
        setTimeout(() => history.push('/signin'), 1500);
      }
    } catch (err) {
      setError('Could not reach the server');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="xs" style={{ paddingTop: 64, textAlign: 'center' }}>
        <Typography variant="h6" color="primary">
          Account created! Redirecting to sign in...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" style={{ paddingTop: 64 }}>
      <Paper style={{ padding: 24 }}>
        <Typography variant="h5" gutterBottom>
          Sign up
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Name"
            value={form.name}
            onChange={handleChange('name')}
            fullWidth
            margin="normal"
            variant="outlined"
            required
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            fullWidth
            margin="normal"
            variant="outlined"
            required
          />
          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            fullWidth
            margin="normal"
            variant="outlined"
            required
            helperText="At least 6 characters, must include a number"
          />

          {error && (
            <Typography variant="body2" color="error" gutterBottom>
              {error}
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
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
          </Box>
        </form>

        <Box mt={2} textAlign="center">
          <Typography variant="body2">
            Already have an account? <Link to="/signin">Sign in</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Signup;
