import { useState, useRef, useEffect } from 'react';
import {
    Box, Typography, Button, Paper,
    Alert, Chip, CircularProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { uploadReference, checkReferenceExists } from '../api/client';

interface Props {
    questionId: string;
    questionText: string;
}

export default function ReferenceUpload({ questionId, questionText }: Props) {
    const [status, setStatus]   = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [hasRef, setHasRef]   = useState(false);
    const inputRef              = useRef<HTMLInputElement>(null);

    // Проверяем есть ли уже эталон
    useEffect(() => {
        checkReferenceExists(questionId)
            .then(exists => setHasRef(exists))
            .catch(() => {});
    }, [questionId]);

    const handleFile = async (file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'dwg' && ext !== 'dxf') {
            setStatus('error');
            setMessage('Только DWG или DXF файлы');
            return;
        }

        setStatus('uploading');
        try {
            await uploadReference(questionId, file);
            setStatus('done');
            setHasRef(true);
            setMessage(`Эталон загружен: ${file.name}`);
        } catch {
            setStatus('error');
            setMessage('Ошибка загрузки');
        }
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body1" fontWeight={500}>
                    {questionText}
                </Typography>
                {hasRef && (
                    <Chip
                        label="Эталон загружен"
                        color="success"
                        size="small"
                        icon={<CheckCircleIcon />}
                    />
                )}
                {!hasRef && (
                    <Chip label="Эталон не загружен" color="warning" size="small" />
                )}
            </Box>

            <Paper
                variant="outlined"
                sx={{
                    p: 3, textAlign: 'center', borderRadius: 2,
                    borderStyle: 'dashed',
                    borderColor: hasRef ? 'success.main' : 'divider',
                    bgcolor: hasRef ? '#f0fdf4' : 'transparent'
                }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleFile(file);
                }}
            >
                {status === 'uploading' ? (
                    <>
                        <CircularProgress size={32} sx={{ mb: 1 }} />
                        <Typography>Загрузка эталона...</Typography>
                    </>
                ) : (
                    <>
                        <CloudUploadIcon sx={{
                            fontSize: 36,
                            color: hasRef ? 'success.main' : 'text.secondary',
                            mb: 1
                        }} />
                        <Typography variant="body2" mb={1}>
                            {hasRef
                                ? 'Загрузить новый эталон (заменит старый)'
                                : 'Загрузите эталонный чертёж DWG/DXF'}
                        </Typography>
                        <Button
                            variant={hasRef ? 'outlined' : 'contained'}
                            size="small"
                            onClick={() => inputRef.current?.click()}
                        >
                            Выбрать файл
                        </Button>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".dwg,.dxf"
                            style={{ display: 'none' }}
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleFile(file);
                            }}
                        />
                    </>
                )}
            </Paper>

            {message && (
                <Alert
                    severity={status === 'done' ? 'success' : 'error'}
                    sx={{ mt: 1 }}
                >
                    {message}
                </Alert>
            )}
        </Box>
    );
}