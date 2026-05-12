import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  role: string | null;
  firstName: string | null;
  userId: string | null;
  isAuth: boolean;
}

const initialState: AuthState = {
  token:     localStorage.getItem('token'),
  role:      localStorage.getItem('role'),
  firstName: localStorage.getItem('firstName'),
  userId:    localStorage.getItem('userId'),
  isAuth:    !!localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action) {
      const payload = action.payload;
      state.token     = payload.accessToken;
      state.role      = payload.role;
      state.firstName = payload.firstName;
      // Поддерживаем оба варианта написания: userId и UserId
      state.userId    = payload.userId ?? payload.UserId ?? null;
      state.isAuth    = true;

      localStorage.setItem('token',     payload.accessToken);
      localStorage.setItem('role',      payload.role);
      localStorage.setItem('firstName', payload.firstName);
      localStorage.setItem('userId',    payload.userId ?? payload.UserId ?? '');
    },
    logout(state) {
      state.token     = null;
      state.role      = null;
      state.firstName = null;
      state.userId    = null;
      state.isAuth    = false;
      localStorage.clear();
    }
  }
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;