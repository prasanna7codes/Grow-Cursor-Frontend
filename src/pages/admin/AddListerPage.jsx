import { useMemo, useState } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography, FormControl, InputLabel, Select, MenuItem, Snackbar, Alert } from '@mui/material';
import api from '../../lib/api.js';

export default function AddListerPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [showCreds, setShowCreds] = useState(false);
  const [creds, setCreds] = useState({ email: '', username: '', password: '', role: 'lister' });
  const currentUser = useMemo(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }, []);
  const isSuper = currentUser?.role === 'superadmin';
  const [role, setRole] = useState('lister');

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg('');
    await api.post('/users', { email, username, password, newUserRole: isSuper ? role : 'lister' });
    const createdRole = isSuper ? (role === 'admin' ? 'admin' : 'lister') : 'lister';
    setMsg(`${createdRole === 'admin' ? 'Admin' : 'Lister'} created`);
    setCreds({ email, username, password, role: createdRole });
    setShowCreds(true);
    setEmail('');
    setUsername('');
    setPassword('');
    setRole('lister');
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 520 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Add User</Typography>
      <Stack spacing={2} component="form" onSubmit={handleCreate}>
        <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {isSuper ? (
          <FormControl>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
              <MenuItem value="lister">Lister</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        ) : null}
        <Box>
          <Button type="submit" variant="contained">Create</Button>
        </Box>
        {msg ? <Typography color="success.main">{msg}</Typography> : null}
      </Stack>
      <Snackbar open={showCreds} autoHideDuration={10000} onClose={() => setShowCreds(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setShowCreds(false)} severity="info" sx={{ width: '100%' }}>
          Share these credentials securely:
          <br />Email: {creds.email}
          <br />Username: {creds.username}
          <br />Password: {creds.password}
          <br />Role: {creds.role}
        </Alert>
      </Snackbar>
    </Paper>
  );
}


