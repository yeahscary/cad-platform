import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Box, Typography, Paper, AppBar, Toolbar,
    Button, Chip, CircularProgress, Divider, Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { apiClient } from '../api/client';
import ReferenceUpload from '../components/ReferenceUpload';

export default function TeacherTestPage() {
    const { id }      = useParams();
    const navigate    = useNavigate();
    const { role }    = useSelector((s: any) => s.auth);
    const [test, setTest]       = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (role !== 'Teacher') { navigate('/tests'); return; }
        apiClient.get(`/tests/${id}`)
            .then(res => setTest(res.data))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
            <CircularProgress />
        </Box>
    );

    if (!test) return (
        <Box sx={{ p: 3 }}>
            <Alert severity="error">Тест не найден</Alert>
        </Box>
    );

    const cadQuestions = test.questions.filter(
        (q: any) => q.type === 'CadUpload' || q.type === 2
    );

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
                        {test.title}
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>

                {/* Информация о тесте */}
                <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Typography variant="h6" mb={1}>Информация о тесте</Typography>
                    <Typography color="text.secondary" mb={2}>
                        {test.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label={`${test.questions.length} вопросов`} size="small" />
                        {test.timeLimitMinutes && (
                            <Chip
                                label={`${test.timeLimitMinutes} мин`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        )}
                    </Box>
                </Paper>

                {/* Загрузка эталонов */}
                {cadQuestions.length > 0 ? (
                    <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                        <Typography variant="h6" mb={1}>
                            Эталонные чертежи
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            Загрузите эталонный чертёж для каждого CAD-задания.
                            Система будет сравнивать работы студентов с эталоном,
                            учитывая возможные различия в масштабе.
                        </Typography>

                        <Divider sx={{ mb: 3 }} />

                        {cadQuestions.map((q: any, i: number) => (
                            <Box key={q.id}>
                                {i > 0 && <Divider sx={{ my: 2 }} />}
                                <ReferenceUpload
                                    questionId={q.id}
                                    questionText={`Задание ${i + 1}: ${q.text}`}
                                />
                            </Box>
                        ))}
                    </Paper>
                ) : (
                    <Alert severity="info">
                        В этом тесте нет заданий с загрузкой чертежей
                    </Alert>
                )}

                {/* Список всех вопросов */}
                <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" mb={2}>Все вопросы</Typography>
                    {test.questions.map((q: any, i: number) => (
                        <Box key={q.id} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {i + 1}.
                                </Typography>
                                <Typography variant="body1">{q.text}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                <Chip
                                    label={
                                        q.type === 'SingleChoice' || q.type === 0
                                            ? 'Один ответ'
                                            : q.type === 'MultipleChoice' || q.type === 1
                                            ? 'Несколько ответов'
                                            : 'Загрузка чертежа'
                                    }
                                    size="small"
                                    color={
                                        q.type === 'CadUpload' || q.type === 2
                                            ? 'primary'
                                            : 'default'
                                    }
                                />
                                <Chip
                                    label={`${q.points} балл`}
                                    size="small"
                                    variant="outlined"
                                />
                            </Box>
                        </Box>
                    ))}
                </Paper>
            </Box>
        </Box>
    );
}