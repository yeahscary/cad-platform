import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Chip,
  AppBar, Toolbar, CircularProgress
} from '@mui/material';
import { logout } from '../store/authSlice';
import { apiClient } from '../api/client';

export default function TestListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { firstName, role } = useSelector((s: any) => s.auth);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/tests')
      .then(res => setTests(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Платформа САПР
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {firstName} · {role === 'Teacher' ? 'Преподаватель' : 'Студент'}
          </Typography>
          {role === 'Teacher' ? (
            <Button color="inherit" onClick={() => navigate('/teacher')} sx={{ mr: 1 }}>
              Результаты студентов
            </Button>
          ) : (
            <Button color="inherit" onClick={() => navigate('/results')} sx={{ mr: 1 }}>
              Мои результаты
            </Button>
          )}
          <Button color="inherit" onClick={handleLogout}>Выйти</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          {role === 'Teacher' ? 'Управление тестами' : 'Доступные тесты'}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <CircularProgress />
          </Box>
        ) : tests.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography color="text.secondary">Тестов пока нет</Typography>
          </Paper>
        ) : (
          tests.map(test => (
            <Paper key={test.id} elevation={1} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">{test.title}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {test.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={`${test.questionCount} вопросов`} size="small" />
                    {test.timeLimitMinutes && (
                      <Chip
                        label={`${test.timeLimitMinutes} мин`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  sx={{ borderRadius: 2 }}
                  onClick={() => navigate(
                    role === 'Teacher' ? `/teacher/test/${test.id}` : `/test/${test.id}`
                  )}
                >
                  {role === 'Teacher' ? 'Посмотреть' : 'Начать тест'}
                </Button>
              </Box>
            </Paper>
          ))
        )}
      </Box>
    </Box>
  );
}