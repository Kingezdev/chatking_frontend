// Utility function to validate JWT tokens
export const isTokenValid = (token) => {
  if (!token) return false;

  try {
    // Decode the JWT payload (second part of the token).
    // JWTs use "base64url" encoding which replaces +/ with -_ and strips padding.
    // atob expects standard Base64, so we need to convert it back.
    let base64Url = token.split('.')[1] || '';
    // add padding if missing
    base64Url = base64Url.padEnd(base64Url.length + (4 - (base64Url.length % 4)) % 4, '=');
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));

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