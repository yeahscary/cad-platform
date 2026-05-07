import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box, Typography, Paper, AppBar, Toolbar, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Tabs, Tab
} from '@mui/material';
import { apiClient } from '../api/client';

export default function TeacherPage() {
  const navigate = useNavigate();
  const { role } = useSelector((s: any) => s.auth);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (role !== 'Teacher') { navigate('/tests'); return; }
    apiClient.get('/attempts/all')
      .then(res => setResults(res.data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const passed = results.filter(r => {
    const pct = r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0;
    return pct >= 60;
  });
  const failed = results.filter(r => {
    const pct = r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0;
    return pct < 60;
  });

  const shown = tab === 0 ? results : tab === 1 ? passed : failed;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Платформа САПР — Преподаватель</Typography>
          <Button color="inherit" onClick={() => navigate('/tests')}>Тесты</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          Результаты студентов
        </Typography>

        {/* Статистика */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Paper sx={{ p: 2, flex: 1, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight="bold">{results.length}</Typography>
            <Typography color="text.secondary">Всего попыток</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {passed.length}
            </Typography>
            <Typography color="text.secondary">Зачёт</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight="bold" color="error.main">
              {failed.length}
            </Typography>
            <Typography color="text.secondary">Не зачёт</Typography>
          </Paper>
        </Box>

        {/* Фильтры */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Все" />
          <Tab label="Зачёт" />
          <Tab label="Не зачёт" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <CircularProgress />
          </Box>
        ) : shown.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography color="text.secondary">Результатов нет</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><b>Студент</b></TableCell>
                  <TableCell><b>Тест</b></TableCell>
                  <TableCell><b>Баллы</b></TableCell>
                  <TableCell><b>Результат</b></TableCell>
                  <TableCell><b>Дата</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shown.map((r, i) => {
                  const pct = r.maxScore > 0
                    ? Math.round((r.score / r.maxScore) * 100)
                    : 0;
                  const ok = pct >= 60;
                  return (
                    <TableRow key={i} hover>
                      <TableCell>{r.studentName}</TableCell>
                      <TableCell>{r.testTitle}</TableCell>
                      <TableCell>{r.score} / {r.maxScore}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${pct}% — ${ok ? 'Зачёт' : 'Не зачёт'}`}
                          color={ok ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(r.startedAt).toLocaleDateString('ru-RU')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}