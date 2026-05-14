import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box, Button, TextField, Typography, Alert, Paper,
  ToggleButton, ToggleButtonGroup, FormControlLabel, Checkbox
} from '@mui/material';
import { register } from '../api/auth';
import { setAuth } from '../store/authSlice';

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: ''
  });
  const [role, setRole]       = useState('Student');
  const [consent, setConsent] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!consent) {
      setError('Необходимо согласиться на обработку персональных данных');
      return;
    }
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

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
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#f5f5f5'
    }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 420, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={1} textAlign="center">
          Регистрация
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
          Платформа оценки навыков САПР
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
          onChange={e => setForm({ ...form, firstName: e.target.value })}
          sx={{ mb: 2 }} />

        <TextField fullWidth label="Фамилия" value={form.lastName}
          onChange={e => setForm({ ...form, lastName: e.target.value })}
          sx={{ mb: 2 }} />

        <TextField fullWidth label="Email" type="email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          sx={{ mb: 2 }} />

        <TextField fullWidth label="Пароль" type="password" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          sx={{ mb: 2 }} />

        {/* Согласие на обработку данных */}
        <Box sx={{
          bgcolor: '#f9f9f9',
          border: '1px solid',
          borderColor: consent ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 1.5,
          mb: 3
        }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                color="primary"
                size="small"
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                Я даю согласие на обработку своих{' '}
                <Typography
                  component="span"
                  variant="body2"
                  color="primary"
                  sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={e => {
                    e.preventDefault();
                    alert(
                      'Политика обработки персональных данных\n\n' +
                      'Платформа оценки навыков САПР собирает и обрабатывает следующие данные:\n' +
                      '• Имя и фамилия\n' +
                      '• Адрес электронной почты\n' +
                      '• Результаты прохождения тестов\n' +
                      '• Загруженные файлы чертежей\n\n' +
                      'Данные используются исключительно в образовательных целях ' +
                      'и не передаются третьим лицам.\n\n' +
                      'БФУ им. И. Канта, 2025 г.'
                    );
                  }}
                >
                  персональных данных
                </Typography>{' '}
                в соответствии с Федеральным законом № 152-ФЗ «О персональных данных»
              </Typography>
            }
            sx={{ alignItems: 'flex-start', m: 0 }}
          />
        </Box>

        <Button
          fullWidth variant="contained" size="large"
          onClick={handleRegister}
          disabled={loading || !consent}
          sx={{ mb: 2, borderRadius: 2 }}
        >
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