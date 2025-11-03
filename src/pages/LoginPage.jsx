import { useState } from 'react';
import { Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import api from '../lib/api.js';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      onLogin(data.token, data.user);
    } catch (e) {
      setError(e?.response?.data?.error || 'Login failed');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 12 }}>
      <Paper sx={{ p: 4 }}>
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Typography variant="h5">Sign in</Typography>
          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error ? (
            <Typography color="error" variant="body2">{error}</Typography>
          ) : null}
          <Box>
            <Button type="submit" variant="contained">Login</Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}


