import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box, Typography, Button, Paper, Radio, Checkbox,
  FormControlLabel, CircularProgress, Alert, LinearProgress, Chip
} from '@mui/material';
import { apiClient } from '../api/client';
import CadUpload from '../components/CadUpload';

export default function TestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = useSelector((s: any) => s.auth.userId);

  const [test, setTest] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [cadDone, setCadDone] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: testData } = await apiClient.get(`/tests/${id}`);
      setTest(testData);

      if (testData.timeLimitMinutes) {
        setTimeLeft(testData.timeLimitMinutes * 60);
      }

      const { data: attempt } = await apiClient.post('/attempts/start', {
        testId: id,
        studentId: userId
      });
      setAttemptId(attempt.id);
      setLoading(false);
    };
    init();
  }, [id]);

  useEffect(() => {
    if (timeLeft === null || finished) return;
    if (timeLeft <= 0) { handleFinish(); return; }
    const timer = setTimeout(() => setTimeLeft(t => (t ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, finished]);

  const currentQuestion = test?.questions[currentIndex];

  const isCadQuestion = (type: any) => type === 'CadUpload' || type === 2;

  const toggleOption = (optionId: string) => {
    if (currentQuestion.type === 'SingleChoice' || currentQuestion.type === 0) {
      setSelected([optionId]);
    } else {
      setSelected(prev =>
        prev.includes(optionId)
          ? prev.filter(i => i !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleNext = async () => {
    if (!attemptId) return;

    if (!isCadQuestion(currentQuestion.type)) {
      if (selected.length === 0) return;

      const { data } = await apiClient.post(`/attempts/${attemptId}/answer`, {
        questionId: currentQuestion.id,
        selectedOptionIds: selected
      });

      setAnswers(prev => [...prev, { ...data, questionIndex: currentIndex }]);
    }

    if (currentIndex < test.questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelected([]);
      setCadDone(false);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (!attemptId) return;
    const { data } = await apiClient.post(`/attempts/${attemptId}/finish`);
    setResult(data);
    setFinished(true);
  };

  const handleCadResult = (passed: boolean, score: number) => {
    setAnswers(prev => [...prev, {
      isCorrect: passed,
      earned: score,
      questionIndex: currentIndex
    }]);
    setCadDone(true);

    setTimeout(() => {
      if (currentIndex < test.questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelected([]);
        setCadDone(false);
      } else {
        handleFinish();
      }
    }, 2000);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress />
    </Box>
  );

  if (finished && result) return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, p: 3, textAlign: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" mb={2}>Тест завершён!</Typography>
        <Typography variant="h2" color="primary" fontWeight="bold">
          {result.percent}%
        </Typography>
        <Typography variant="h6" mt={1} mb={3}>
          {result.score} из {result.maxScore} баллов
        </Typography>
        <Alert severity={result.percent >= 60 ? 'success' : 'warning'} sx={{ mb: 3 }}>
          {result.percent >= 60
            ? 'Тест пройден успешно!'
            : 'Недостаточно баллов. Попробуйте ещё раз.'}
        </Alert>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="outlined" onClick={() => navigate('/results')}>
            Мои результаты
          </Button>
          <Button variant="contained" onClick={() => navigate('/tests')}>
            Вернуться к тестам
          </Button>
        </Box>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', p: 3, mt: 4 }}>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">{test.title}</Typography>
        {timeLeft !== null && (
          <Chip
            label={`${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`}
            color={timeLeft < 60 ? 'error' : 'primary'}
          />
        )}
      </Box>

      <LinearProgress
        variant="determinate"
        value={(currentIndex / test.questions.length) * 100}
        sx={{ mb: 3, borderRadius: 1 }}
      />

      <Typography variant="body2" color="text.secondary" mb={2}>
        Вопрос {currentIndex + 1} из {test.questions.length}
      </Typography>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>

        {isCadQuestion(currentQuestion.type) ? (
          <CadUpload
            attemptId={attemptId!}
            questionId={currentQuestion.id}
            questionText={currentQuestion.text}
            onResult={handleCadResult}
          />
        ) : (
          <>
            <Typography variant="h6" mb={2}>{currentQuestion.text}</Typography>

            <Typography variant="caption" color="text.secondary" mb={2} display="block">
              {currentQuestion.type === 'SingleChoice' || currentQuestion.type === 0
                ? 'Выберите один вариант'
                : 'Выберите все правильные варианты'}
            </Typography>

            {currentQuestion.options.map((opt: any) => (
              <Paper
                key={opt.id}
                variant="outlined"
                sx={{
                  p: 2, mb: 1, borderRadius: 2, cursor: 'pointer',
                  borderColor: selected.includes(opt.id) ? 'primary.main' : 'divider',
                  bgcolor: selected.includes(opt.id) ? '#e3f2fd' : 'transparent',
                  '&:hover': { borderColor: 'primary.main' }
                }}
                onClick={() => toggleOption(opt.id)}
              >
                <FormControlLabel
                  control={
                    currentQuestion.type === 'SingleChoice' || currentQuestion.type === 0
                      ? <Radio checked={selected.includes(opt.id)} />
                      : <Checkbox checked={selected.includes(opt.id)} />
                  }
                  label={opt.text}
                  sx={{ m: 0, width: '100%' }}
                />
              </Paper>
            ))}
          </>
        )}
      </Paper>

      {!isCadQuestion(currentQuestion.type) && (
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleNext}
          disabled={selected.length === 0}
          sx={{ borderRadius: 2 }}
        >
          {currentIndex < test.questions.length - 1
            ? 'Следующий вопрос →'
            : 'Завершить тест'}
        </Button>
      )}

      {isCadQuestion(currentQuestion.type) && cadDone && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Переходим к следующему вопросу...
        </Alert>
      )}
    </Box>
  );
}