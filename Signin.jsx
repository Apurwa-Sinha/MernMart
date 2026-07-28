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

const Signin = () => {
  const history = useHistory();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Sign in failed');
      } else {
        // stored exactly as { token, user } — every other component in
        // this app reads localStorage.getItem('jwt') in this shape
        localStorage.setItem('jwt', JSON.stringify(data));
        history.push('/');
        window.location.reload(); // ensures nav/header picks up the new auth state
      }
    } catch (err) {
      setError('Could not reach the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" style={{ paddingTop: 64 }}>
      <Paper style={{ padding: 24 }}>
        <Typography variant="h5" gutterBottom>
          Sign in
        </Typography>

        <form onSubmit={handleSubmit}>
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
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Box>
        </form>

        <Box mt={2} textAlign="center">
          <Typography variant="body2">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Signin;
