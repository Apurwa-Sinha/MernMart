import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Grid, Paper, Typography, Box } from '@material-ui/core';
import { getUser } from '../helpers/authHelpers';

const links = [
  { to: '/admin/create/category', label: 'Add a category', description: 'Create a new product category' },
  { to: '/admin/create/product', label: 'Add a product', description: 'List a new product for sale' },
  { to: '/admin/products', label: 'Manage products', description: 'Edit or remove existing products' },
  { to: '/admin/orders', label: 'Manage orders', description: 'View orders and update their status' },
];

const AdminDashboard = () => {
  const user = getUser();

  return (
    <Container maxWidth="md" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <Typography variant="h5" gutterBottom>
        Admin dashboard
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Signed in as {user && user.name} ({user && user.email})
      </Typography>

      <Box mt={3}>
        <Grid container spacing={2}>
          {links.map((link) => (
            <Grid item xs={12} sm={6} key={link.to}>
              <Paper
                component={Link}
                to={link.to}
                style={{
                  display: 'block',
                  padding: 20,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
                elevation={2}
              >
                <Typography variant="subtitle1">{link.label}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {link.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default AdminDashboard;
