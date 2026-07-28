export const isAuthenticated = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('jwt'));
    return !!stored;
  } catch (e) {
    return false;
  }
};

export const getUser = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('jwt'));
    return stored ? stored.user : null;
  } catch (e) {
    return null;
  }
};

export const getUserId = () => {
  const user = getUser();
  return user ? user._id : null;
};

export const getToken = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('jwt'));
    return stored ? stored.token : null;
  } catch (e) {
    return null;
  }
};

export const isAdmin = () => {
  const user = getUser();
  return !!user && user.role === 1;
};

export const signout = () => {
  localStorage.removeItem('jwt');
};
