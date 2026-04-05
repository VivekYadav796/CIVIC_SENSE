export const getToken   = () => typeof window !== 'undefined' ? localStorage.getItem('token')  : null;
export const getRole    = () => typeof window !== 'undefined' ? localStorage.getItem('role')   : null;
export const getName    = () => typeof window !== 'undefined' ? localStorage.getItem('name')   : null;
export const getEmail   = () => typeof window !== 'undefined' ? localStorage.getItem('email')  : null;
export const isLoggedIn = () => !!getToken();

export const saveAuth = (token: string, role: string, name: string, email: string) => {
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  localStorage.setItem('name', name);
  localStorage.setItem('email', email);
};

export const logout = () => {
  localStorage.clear();
  window.location.href = '/login';
};