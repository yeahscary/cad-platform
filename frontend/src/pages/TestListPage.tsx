import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Chip, AppBar, Toolbar } from '@mui/material';
import { logout } from '../store/authSlice';

const mockTests = [
  { id: 1, title: 'Основы AutoCAD', questions: 10, time: 30 },
  { id: 2, title: 'Работа с слоями', questions: 8, time: 20 },
  { id: 3, title: 'Создание чертежей', questions: 12, time: 45 },
];

export default function TestListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { firstName, role } = useSelector((s: any) => s.auth);

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
          <Button color="inherit" onClick={handleLogout}>Выйти</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          {role === 'Teacher' ? 'Управление тестами' : 'Доступные тесты'}
        </Typography>

        {mockTests.map(test => (
          <Paper key={test.id} elevation={1} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">{test.title}</Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Chip label={`${test.questions} вопросов`} size="small" />
                  <Chip label={`${test.time} минут`} size="small" color="primary" variant="outlined" />
                </Box>
              </Box>
              <Button variant="contained" sx={{ borderRadius: 2 }}>
                {role === 'Teacher' ? 'Редактировать' : 'Начать тест'}
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}