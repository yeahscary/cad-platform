import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, AppBar, Toolbar, Button,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Checkbox, FormControlLabel, Alert, CircularProgress,
  Divider, IconButton, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { apiClient } from '../api/client';

interface Option {
  text: string;
  isCorrect: boolean;
}

interface Question {
  text: string;
  type: 'SingleChoice' | 'MultipleChoice' | 'CadUpload';
  points: number;
  options: Option[];
}

export default function CreateTestPage() {
  const navigate = useNavigate();

  const [title, setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  // Добавить новый вопрос
  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      text: '',
      type: 'SingleChoice',
      points: 1,
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    }]);
  };

  // Удалить вопрос
  const removeQuestion = (qi: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== qi));
  };

  // Изменить поле вопроса
  const updateQuestion = (qi: number, field: string, value: any) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qi) return q;
      const updated = { ...q, [field]: value };
      // Если тип изменился на CadUpload — убираем варианты
      if (field === 'type' && value === 'CadUpload') {
        updated.options = [];
      }
      // Если тип изменился на тестовый — добавляем варианты
      if (field === 'type' && value !== 'CadUpload' && q.type === 'CadUpload') {
        updated.options = [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ];
      }
      return updated;
    }));
  };

  // Добавить вариант ответа
  const addOption = (qi: number) => {
    setQuestions(prev => prev.map((q, i) =>
      i === qi
        ? { ...q, options: [...q.options, { text: '', isCorrect: false }] }
        : q
    ));
  };

  // Удалить вариант ответа
  const removeOption = (qi: number, oi: number) => {
    setQuestions(prev => prev.map((q, i) =>
      i === qi
        ? { ...q, options: q.options.filter((_, j) => j !== oi) }
        : q
    ));
  };

  // Изменить вариант ответа
  const updateOption = (qi: number, oi: number, field: string, value: any) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qi) return q;
      const newOptions = q.options.map((opt, j) => {
        if (j !== oi) {
          // Для SingleChoice — сбрасываем другие варианты
          if (field === 'isCorrect' && value && q.type === 'SingleChoice') {
            return { ...opt, isCorrect: false };
          }
          return opt;
        }
        return { ...opt, [field]: value };
      });
      return { ...q, options: newOptions };
    }));
  };

  // Проверка формы
  const validate = () => {
    if (!title.trim()) return 'Введите название теста';
    if (questions.length === 0) return 'Добавьте хотя бы один вопрос';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Вопрос ${i + 1}: введите текст вопроса`;
      if (q.type !== 'CadUpload') {
        if (q.options.length < 2) return `Вопрос ${i + 1}: добавьте минимум 2 варианта`;
        if (q.options.some(o => !o.text.trim())) return `Вопрос ${i + 1}: заполните все варианты`;
        if (!q.options.some(o => o.isCorrect)) return `Вопрос ${i + 1}: отметьте правильный ответ`;
      }
    }
    return null;
  };

  // Отправить тест
  const handleSubmit = async (publish: boolean) => {
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');

    try {
      const { data } = await apiClient.post('/tests', {
        title,
        description,
        timeLimitMinutes: timeLimit ? parseInt(timeLimit) : null,
        questions: questions.map(q => ({
          text:    q.text,
          type:    q.type,
          points:  q.points,
          options: q.options
        }))
      });

      if (publish) {
        await apiClient.post(`/tests/${data.id}/publish`);
      }

      setSuccess(true);
      setTimeout(() => navigate('/tests'), 1500);
    } catch {
      setError('Ошибка при создании теста');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/tests')}
            sx={{ mr: 2 }}
          >
            Назад
          </Button>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Создание теста
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Тест успешно создан!
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Основная информация */}
        <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" mb={2}>Основная информация</Typography>

          <TextField
            fullWidth
            label="Название теста"
            value={title}
            onChange={e => setTitle(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Описание (необязательно)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Ограничение времени (минуты)"
            value={timeLimit}
            onChange={e => setTimeLimit(e.target.value)}
            type="number"
            helperText="Оставьте пустым если без ограничения"
            sx={{ width: 280 }}
          />
        </Paper>

        {/* Вопросы */}
        {questions.map((q, qi) => (
          <Paper key={qi} elevation={1} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Вопрос {qi + 1}
                <Chip
                  label={
                    q.type === 'SingleChoice'   ? 'Один ответ' :
                    q.type === 'MultipleChoice' ? 'Несколько ответов' :
                    'Загрузка чертежа'
                  }
                  size="small"
                  color={q.type === 'CadUpload' ? 'primary' : 'default'}
                  sx={{ ml: 1 }}
                />
              </Typography>
              <IconButton color="error" onClick={() => removeQuestion(qi)}>
                <DeleteIcon />
              </IconButton>
            </Box>

            <TextField
              fullWidth
              label="Текст вопроса"
              value={q.text}
              onChange={e => updateQuestion(qi, 'text', e.target.value)}
              sx={{ mb: 2 }}
              required
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel>Тип вопроса</InputLabel>
                <Select
                  value={q.type}
                  label="Тип вопроса"
                  onChange={e => updateQuestion(qi, 'type', e.target.value)}
                >
                  <MenuItem value="SingleChoice">Один правильный ответ</MenuItem>
                  <MenuItem value="MultipleChoice">Несколько правильных</MenuItem>
                  <MenuItem value="CadUpload">Загрузка чертежа DWG/DXF</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Баллы за вопрос"
                type="number"
                value={q.points}
                onChange={e => updateQuestion(qi, 'points', parseFloat(e.target.value) || 1)}
                sx={{ width: 150 }}
                inputProps={{ min: 0.5, step: 0.5 }}
              />
            </Box>

            {/* Варианты ответов */}
            {q.type !== 'CadUpload' && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {q.type === 'SingleChoice'
                    ? 'Отметьте один правильный вариант'
                    : 'Отметьте все правильные варианты'}
                </Typography>

                {q.options.map((opt, oi) => (
                  <Box
                    key={oi}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={opt.isCorrect}
                          onChange={e => updateOption(qi, oi, 'isCorrect', e.target.checked)}
                          color="success"
                        />
                      }
                      label=""
                      sx={{ mr: 0 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label={`Вариант ${oi + 1}`}
                      value={opt.text}
                      onChange={e => updateOption(qi, oi, 'text', e.target.value)}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeOption(qi, oi)}
                      disabled={q.options.length <= 2}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}

                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => addOption(qi)}
                  sx={{ mt: 1 }}
                >
                  Добавить вариант
                </Button>
              </>
            )}

            {q.type === 'CadUpload' && (
              <Alert severity="info" sx={{ mt: 1 }}>
                После создания теста загрузите эталонный чертёж через страницу управления тестом
              </Alert>
            )}
          </Paper>
        ))}

        {/* Кнопка добавить вопрос */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addQuestion}
          sx={{ mb: 3, borderRadius: 2, borderStyle: 'dashed', py: 1.5 }}
        >
          Добавить вопрос
        </Button>

        {/* Кнопки сохранения */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => handleSubmit(false)}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            Сохранить как черновик
          </Button>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Создать и опубликовать'}
          </Button>
        </Box>

      </Box>
    </Box>
  );
}