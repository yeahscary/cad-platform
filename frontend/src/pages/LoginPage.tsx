import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, Button, TextField, Typography, Alert, Paper } from '@mui/material';
import { login } from '../api/auth';
import { setAuth } from '../store/authSlice';

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await login({ email, password });
      dispatch(setAuth(data));
      navigate('/tests');
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={1} textAlign="center">
          Платформа САПР
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
          Войдите в свой аккаунт
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          fullWidth label="Email" type="email"
          value={email} onChange={e => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth label="Пароль" type="password"
          value={password} onChange={e => setPassword(e.target.value)}
          sx={{ mb: 3 }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <Button
          fullWidth variant="contained" size="large"
          onClick={handleLogin} disabled={loading}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {loading ? 'Вход...' : 'Войти'}
        </Button>
        <Typography textAlign="center" variant="body2">
          Нет аккаунта?{' '}
          <Link to="/register" style={{ color: '#1976d2' }}>Зарегистрироваться</Link>
        </Typography>
      </Paper>
    </Box>
  );
}