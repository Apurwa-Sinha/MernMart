import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { isAuthenticated } from '../helpers/authHelpers';

/**
 * Wraps a route so it only renders for signed-in users; otherwise
 * redirects to /signin, remembering where they were headed via
 * location state so a future "redirect back after login" flow could
 * use it (not implemented here, but the hook is there).
 */
const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={(props) =>
      isAuthenticated() ? (
        <Component {...props} />
      ) : (
        <Redirect
          to={{ pathname: '/signin', state: { from: props.location } }}
        />
      )
    }
  />
);

export default PrivateRoute;
