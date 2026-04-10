import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, Button, TextField, Typography, Alert, Paper, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { register } from '../api/auth';
import { setAuth } from '../store/authSlice';

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [role, setRole] = useState('Student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await register({ ...form, role });
      dispatch(setAuth(data));
      navigate('/tests');
    } catch {
      setError('Ошибка регистрации. Возможно, email уже занят.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 420, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={1} textAlign="center">
          Регистрация
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="body2" mb={1}>Я являюсь:</Typography>
        <ToggleButtonGroup
          value={role} exclusive
          onChange={(_, v) => v && setRole(v)}
          fullWidth sx={{ mb: 2 }}
        >
          <ToggleButton value="Student">Студент</ToggleButton>
          <ToggleButton value="Teacher">Преподаватель</ToggleButton>
        </ToggleButtonGroup>

        <TextField fullWidth label="Имя" value={form.firstName}
          onChange={e => setForm({ ...form, firstName: e.target.value })} sx={{ mb: 2 }} />
        <TextField fullWidth label="Фамилия" value={form.lastName}
          onChange={e => setForm({ ...form, lastName: e.target.value })} sx={{ mb: 2 }} />
        <TextField fullWidth label="Email" type="email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} sx={{ mb: 2 }} />
        <TextField fullWidth label="Пароль" type="password" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })} sx={{ mb: 3 }} />

        <Button fullWidth variant="contained" size="large"
          onClick={handleRegister} disabled={loading} sx={{ mb: 2, borderRadius: 2 }}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </Button>
        <Typography textAlign="center" variant="body2">
          Уже есть аккаунт?{' '}
          <Link to="/login" style={{ color: '#1976d2' }}>Войти</Link>
        </Typography>
      </Paper>
    </Box>
  );
}