import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <Container maxWidth="md" sx={{ mt: 12 }}>
      <Stack spacing={3} alignItems="center">
        <Typography variant="h2" align="center">Grow Mentality</Typography>
        <Typography variant="h6" align="center" color="text.secondary">
          Streamline product research, assignments, and listings for your dropshipping team.
        </Typography>
        <Box>
          <Button variant="contained" size="large" onClick={() => navigate('/login')}>Login</Button>
        </Box>
      </Stack>
    </Container>
  );
}


