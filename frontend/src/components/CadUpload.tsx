import { useState, useRef } from 'react';
import { Box, Typography, Button, LinearProgress, Alert, Paper } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { apiClient } from '../api/client';

interface Props {
  attemptId: string;
  questionId: string;
  questionText: string;
  onResult: (passed: boolean, score: number) => void;
}

export default function CadUpload({ attemptId, questionId, questionText, onResult }: Props) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'passed' | 'failed' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'dwg' && ext !== 'dxf') {
      setStatus('error');
      setMessage('Допустимы только файлы .DWG и .DXF');
      return;
    }

    setFileName(file.name);
    setStatus('uploading');

    try {
      const form = new FormData();
      form.append('file', file);

      const { data } = await apiClient.post(
        `/cad/upload/${attemptId}/${questionId}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setStatus(data.status === 'Passed' ? 'passed' : 'failed');
      setMessage(data.message);
      onResult(data.status === 'Passed', data.score ?? 0);
    } catch {
      setStatus('error');
      setMessage('Ошибка загрузки файла');
    }
  };

  return (
    <Box>
      <Typography variant="h6" mb={2}>{questionText}</Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 4, textAlign: 'center', borderRadius: 2,
          borderStyle: 'dashed',
          borderColor:
            status === 'passed' ? 'success.main' :
            status === 'failed' ? 'error.main' : 'divider',
        }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {status === 'idle' && (
          <>
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography mb={2}>
              Перетащите DWG/DXF файл сюда или нажмите кнопку
            </Typography>
            <Button
              variant="outlined"
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

        {status === 'uploading' && (
          <>
            <Typography mb={2}>Загрузка и проверка: {fileName}</Typography>
            <LinearProgress sx={{ borderRadius: 2 }} />
          </>
        )}

        {status === 'passed' && (
          <>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            <Typography color="success.main" fontWeight="bold">Файл принят!</Typography>
            <Typography variant="body2" color="text.secondary">{fileName}</Typography>
          </>
        )}

        {status === 'failed' && (
          <>
            <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
            <Typography color="error.main" fontWeight="bold">Файл не прошёл проверку</Typography>
            <Typography variant="body2" color="text.secondary">{fileName}</Typography>
            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => {
              setStatus('idle');
              setFileName('');
            }}>
              Попробовать снова
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>
            <Button variant="outlined" onClick={() => setStatus('idle')}>
              Попробовать снова
            </Button>
          </>
        )}
      </Paper>

      {message && (status === 'passed' || status === 'failed') && (
        <Alert severity={status === 'passed' ? 'success' : 'warning'} sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
    </Box>
  );
}