import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, AppBar, Toolbar, Button,
  CircularProgress, Alert, Chip, LinearProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { apiClient } from '../api/client';

export default function AttemptDetailsPage() {
  const { attemptId } = useParams();
  const navigate      = useNavigate();
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/attempts/${attemptId}/details`)
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress />
    </Box>
  );

  if (!data) return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error">Результат не найден</Alert>
    </Box>
  );

  const percent = data.maxScore > 0
    ? Math.round((data.score / data.maxScore) * 100)
    : 0;

  const passed = percent >= 60;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/results')}
            sx={{ mr: 2 }}
          >
            Назад
          </Button>
          <Typography variant="h6">{data.testTitle}</Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>

        {/* Итоговый результат */}
        <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h3" fontWeight="bold" color={passed ? 'success.main' : 'error.main'}>
            {percent}%
          </Typography>
          <Typography variant="h6" mb={2}>
            {data.score} из {data.maxScore} баллов
          </Typography>
          <LinearProgress
            variant="determinate"
            value={percent}
            color={passed ? 'success' : 'error'}
            sx={{ height: 10, borderRadius: 5, mb: 2 }}
          />
          <Chip
            label={passed ? 'Зачёт' : 'Не зачёт'}
            color={passed ? 'success' : 'error'}
            size="medium"
          />
        </Paper>

        {/* Разбор по вопросам */}
        <Typography variant="h6" mb={2}>Разбор ответов</Typography>

        {data.questions.map((q: any, i: number) => {
          const isCad     = q.questionType === 'CadUpload' || q.questionType === 2;
          const isCorrect = q.isCorrect;
          const noAnswer  = q.isCorrect === null || q.isCorrect === undefined;

          return (
            <Paper
              key={i}
              elevation={1}
              sx={{
                p: 3, mb: 2, borderRadius: 2,
                borderLeft: '4px solid',
                borderColor: noAnswer
                  ? 'grey.400'
                  : isCorrect
                  ? 'success.main'
                  : 'error.main'
              }}
            >
              {/* Заголовок вопроса */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body1" fontWeight={500}>
                  {i + 1}. {q.questionText}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                  <Typography variant="body2" color="text.secondary">
                    {q.earnedPoints} / {q.points} б.
                  </Typography>
                  {noAnswer ? (
                    <Chip label="Нет ответа" size="small" />
                  ) : isCorrect ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CancelIcon color="error" />
                  )}
                </Box>
              </Box>

              {/* CAD вопрос */}
              {isCad && (
                <Alert severity={noAnswer ? 'warning' : isCorrect ? 'success' : 'error'}>
                  {noAnswer
                    ? 'Файл не был загружен'
                    : isCorrect
                    ? 'Чертёж принят системой'
                    : 'Чертёж не прошёл проверку'}
                </Alert>
              )}

              {/* Тестовый вопрос */}
              {!isCad && q.options.map((opt: any, oi: number) => {
                let bgcolor = 'transparent';
                let color   = 'text.primary';

                if (opt.isCorrect && opt.wasSelected) {
                  bgcolor = '#e8f5e9'; color = 'success.dark';
                } else if (opt.isCorrect && !opt.wasSelected) {
                  bgcolor = '#fff3e0'; color = 'warning.dark';
                } else if (!opt.isCorrect && opt.wasSelected) {
                  bgcolor = '#ffebee'; color = 'error.dark';
                }

                return (
                  <Box
                    key={oi}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1,
                      p: 1.5, mb: 0.5, borderRadius: 1, bgcolor
                    }}
                  >
                    {opt.isCorrect && opt.wasSelected && (
                      <CheckCircleIcon fontSize="small" color="success" />
                    )}
                    {opt.isCorrect && !opt.wasSelected && (
                      <CheckCircleIcon fontSize="small" color="warning" />
                    )}
                    {!opt.isCorrect && opt.wasSelected && (
                      <CancelIcon fontSize="small" color="error" />
                    )}
                    {!opt.isCorrect && !opt.wasSelected && (
                      <Box sx={{ width: 20 }} />
                    )}
                    <Typography variant="body2" color={color}>
                      {opt.text}
                      {opt.isCorrect && !opt.wasSelected && (
                        <Typography component="span" variant="caption" sx={{ ml: 1 }} color="warning.dark">
                          (правильный ответ)
                        </Typography>
                      )}
                      {opt.wasSelected && !opt.isCorrect && (
                        <Typography component="span" variant="caption" sx={{ ml: 1 }} color="error.dark">
                          (ваш ответ)
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                );
              })}
            </Paper>
          );
        })}

        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate('/tests')}
          sx={{ borderRadius: 2, mt: 1 }}
        >
          Вернуться к тестам
        </Button>
      </Box>
    </Box>
  );
}