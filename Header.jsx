import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
} from '@material-ui/core';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';
import { isAuthenticated, getUser, isAdmin, signout } from '../helpers/authHelpers';
import { getCartItemCount } from '../helpers/cartHelpers';

const Header = () => {
  const history = useHistory();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartItemCount());
    // keep the badge in sync if the cart changes in another tab/component
    const interval = setInterval(() => setCartCount(getCartItemCount()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignout = () => {
    signout();
    history.push('/signin');
    window.location.reload();
  };

  const authed = isAuthenticated();
  const user = getUser();

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          style={{ textDecoration: 'none', color: 'inherit', flexGrow: 1 }}
        >
          SmartCart
        </Typography>

        <Button component={Link} to="/" color="inherit">
          Home
        </Button>

        {authed && isAdmin() && (
          <Button component={Link} to="/admin/dashboard" color="inherit">
            Admin
          </Button>
        )}

        <IconButton component={Link} to="/cart" color="inherit">
          <Badge badgeContent={cartCount} color="secondary">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>

        {authed ? (
          <Box display="flex" alignItems="center">
            <Typography variant="body2" style={{ marginRight: 12 }}>
              Hi, {user && user.name}
            </Typography>
            <Button color="inherit" onClick={handleSignout}>
              Sign out
            </Button>
          </Box>
        ) : (
          <>
            <Button component={Link} to="/signin" color="inherit">
              Sign in
            </Button>
            <Button component={Link} to="/signup" color="inherit">
              Sign up
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
