import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { isAuthenticated, isAdmin } from '../helpers/authHelpers';

const AdminRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={(props) =>
      isAuthenticated() && isAdmin() ? (
        <Component {...props} />
      ) : (
        <Redirect to="/signin" />
      )
    }
  />
);

export default AdminRoute;
