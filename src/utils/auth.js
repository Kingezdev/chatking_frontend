// Utility function to validate JWT tokens
export const isTokenValid = (token) => {
  if (!token) return false;

  try {
    // Decode the JWT payload (second part of the token)
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Check if token is expired
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    // If token can't be decoded, consider it invalid
    console.error('Token validation error:', error);
    return false;
  }
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('access_token');
  return isTokenValid(token);
};