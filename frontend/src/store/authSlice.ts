import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  role: string | null;
  firstName: string | null;
  isAuth: boolean;
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  role: localStorage.getItem('role'),
  firstName: localStorage.getItem('firstName'),
  isAuth: !!localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action) {
      state.token = action.payload.accessToken;
      state.role = action.payload.role;
      state.firstName = action.payload.firstName;
      state.isAuth = true;
      localStorage.setItem('token', action.payload.accessToken);
      localStorage.setItem('role', action.payload.role);
      localStorage.setItem('firstName', action.payload.firstName);
    },
    logout(state) {
      state.token = null;
      state.role = null;
      state.firstName = null;
      state.isAuth = false;
      localStorage.clear();
    }
  }
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;