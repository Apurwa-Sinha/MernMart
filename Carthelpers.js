/**
 * Cart is stored in localStorage as a flat array of:
 *   { _id, name, price, count, quantity }
 * (quantity = how many are in stock, for capping the count in the UI)
 */

const CART_KEY = 'cart';

export const getCartItems = () => {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(cart) ? cart : [];
  } catch (e) {
    return [];
  }
};

const saveCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

/**
 * Adds a product to the cart, or increments its count if already present.
 * Caps the count at the product's available quantity (if provided) so
 * users can't add more than what's in stock.
 */
export const addItemToCart = (product, countToAdd = 1) => {
  const cart = getCartItems();
  const existing = cart.find((item) => item._id === product._id);

  if (existing) {
    const maxAllowed = product.quantity || existing.quantity || Infinity;
    existing.count = Math.min(existing.count + countToAdd, maxAllowed);
  } else {
    const maxAllowed = product.quantity || Infinity;
    cart.push({
      _id: product._id,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      count: Math.min(countToAdd, maxAllowed),
    });
  }

  saveCart(cart);
  return cart;
};

export const updateItemCount = (productId, newCount) => {
  const cart = getCartItems();
  const item = cart.find((i) => i._id === productId);
  if (!item) return cart;

  if (newCount <= 0) {
    return removeItemFromCart(productId);
  }

  const maxAllowed = item.quantity || Infinity;
  item.count = Math.min(newCount, maxAllowed);
  saveCart(cart);
  return cart;
};

export const removeItemFromCart = (productId) => {
  const cart = getCartItems().filter((item) => item._id !== productId);
  saveCart(cart);
  return cart;
};

export const emptyCart = () => {
  localStorage.removeItem(CART_KEY);
};

export const getCartTotal = () => {
  return getCartItems().reduce((sum, item) => sum + item.price * item.count, 0);
};

export const getCartItemCount = () => {
  return getCartItems().reduce((sum, item) => sum + item.count, 0);
};
