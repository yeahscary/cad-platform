import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, AppBar, Toolbar,
  Button, Chip, CircularProgress, LinearProgress
} from '@mui/material';
import { apiClient } from '../api/client';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { userId, firstName, role } = useSelector((s: any) => s.auth);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/attempts/my/${userId}`)
      .then(res => setResults(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Платформа САПР</Typography>
          <Button color="inherit" onClick={() => navigate('/tests')}>Тесты</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          Мои результаты
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <CircularProgress />
          </Box>
        ) : results.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography color="text.secondary" mb={2}>
              Вы ещё не прошли ни одного теста
            </Typography>
            <Button variant="contained" onClick={() => navigate('/tests')}>
              Перейти к тестам
            </Button>
          </Paper>
        ) : (
          results.map((r, i) => {
            const percent = r.maxScore > 0
              ? Math.round((r.score / r.maxScore) * 100)
              : 0;
            const passed = percent >= 60;
            const date = new Date(r.startedAt).toLocaleDateString('ru-RU');

            return (
              <Paper key={i} elevation={1} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{r.testTitle}</Typography>
                    <Typography variant="body2" color="text.secondary">{date}</Typography>
                  </Box>
                  <Chip
                    label={passed ? 'Зачёт' : 'Не зачёт'}
                    color={passed ? 'success' : 'error'}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={percent}
                    color={passed ? 'success' : 'error'}
                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography fontWeight="bold" minWidth={50}>
                    {percent}%
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" mt={1}>
                  Баллы: {r.score} из {r.maxScore}
                </Typography>
              </Paper>
            );
          })
        )}
      </Box>
    </Box>
  );
}