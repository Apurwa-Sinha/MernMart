import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import Header from './components/Header';
import StylistChat from './components/StylistChat';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import CreateGroupOrder from './pages/CreateGroupOrder';
import GroupOrderPay from './pages/GroupOrderPay';
import AdminDashboard from './pages/AdminDashboard';
import AddCategory from './pages/AddCategory';
import AddProduct from './pages/AddProduct';
import ManageProducts from './pages/ManageProducts';
import UpdateProduct from './pages/UpdateProduct';
import AdminOrders from './pages/AdminOrders';
import ManageCategories from './pages/ManageCategories';
import OrderHistory from './pages/OrderHistory';
import LegalPage from './pages/LegalPage';

function App() {
  return (
    <Router>
      <Header />

      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/product/:productId" component={ProductDetail} />
        <Route exact path="/cart" component={Cart} />
        <Route exact path="/signin" component={Signin} />
        <Route exact path="/signup" component={Signup} />

        {/* invited participants may not have accounts, so this stays public */}
        <Route exact path="/group-order/:token" component={GroupOrderPay} />

        {/* legal pages — public */}
        <Route exact path="/legal/:page" component={LegalPage} />

        {/* these require a signed-in user */}
        <PrivateRoute exact path="/checkout" component={Checkout} />
        <PrivateRoute exact path="/split-checkout" component={CreateGroupOrder} />
        <PrivateRoute exact path="/orders" component={OrderHistory} />

        {/* admin-only routes */}
        <AdminRoute exact path="/admin/dashboard" component={AdminDashboard} />
        <AdminRoute exact path="/admin/create/category" component={AddCategory} />
        <AdminRoute exact path="/admin/categories" component={ManageCategories} />
        <AdminRoute exact path="/admin/create/product" component={AddProduct} />
        <AdminRoute exact path="/admin/products" component={ManageProducts} />
        <AdminRoute exact path="/admin/product/update/:productId" component={UpdateProduct} />
        <AdminRoute exact path="/admin/orders" component={AdminOrders} />

        <Route
          render={() => (
            <div style={{ textAlign: 'center', paddingTop: 64 }}>
              <h2>404 — Page not found</h2>
            </div>
          )}
        />
      </Switch>

      {/* floating chat widget, available on every page */}
      <StylistChat />
    </Router>
  );
}

export default App;


