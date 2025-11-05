// src/pages/lister/ListerDashboard.jsx
import { useEffect, useMemo, useState } from 'react';
import { AppBar, Box, Button, Card, CardActions, CardContent, Grid, Toolbar, Typography, Divider, TextField } from '@mui/material';
import api from '../../lib/api.js';

export default function ListerDashboard({ user, onLogout }) {
  const [items, setItems] = useState([]);

  const load = async () => {
    const { data } = await api.get('/assignments/mine');
    setItems(data);
  };
  useEffect(() => { load(); }, []);

  const complete = async (assignmentId, qty) => {
    await api.post(`/assignments/${assignmentId}/complete`, { completedQuantity: qty });
    await load();
  };

  const pending = useMemo(() => items.filter(a => (a.completedQuantity || 0) < a.quantity), [items]);
  const completed = useMemo(() => items.filter(a => (a.completedQuantity || 0) >= a.quantity), [items]);

  const renderCard = (a) => {
    const t = a.task || {};
    return (
      <Card key={a._id}>
        <CardContent>
          <Typography variant="subtitle1">{t.productTitle}</Typography>
          <Typography variant="body2" color="text.secondary">{new Date(a.createdAt).toLocaleDateString()}</Typography>
          <Typography variant="body2">Range: {t.range} | Category: {t.category}</Typography>
          <Typography variant="body2">Qty: {a.quantity} | Completed: {a.completedQuantity || 0}</Typography>
          <Typography variant="body2">Listing: {a.listingPlatform?.name} / {a.store?.name}</Typography>
          {t.supplierLink ? (
            <Typography variant="body2">
              <a href={t.supplierLink} target="_blank" rel="noreferrer">Supplier Link</a>
            </Typography>
          ) : null}
        </CardContent>
        <CardActions>
          <TextField
            size="small"
            type="number"
            label="Completed Qty"
            inputProps={{ min: 0, max: a.quantity }}
            value={a.completedQuantity || 0}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (Number.isFinite(val) && val >= 0 && val <= a.quantity) {
                complete(a._id, val);
              }
            }}
            sx={{ width: 140, mr: 1 }}
          />
          <Button size="small" onClick={() => complete(a._id, a.quantity)}>Mark Fully Completed</Button>
        </CardActions>
      </Card>
    );
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>My Assignments</Typography>
          {user ? <Typography variant="body2" sx={{ mr: 2 }}>{user.username} (lister)</Typography> : null}
          <Button color="inherit" onClick={onLogout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Pending</Typography>
        <Grid container spacing={2}>
          {pending.map(a => (
            <Grid item xs={12} md={6} lg={4} key={a._id}>{renderCard(a)}</Grid>
          ))}
          {pending.length === 0 && (
            <Grid item xs={12}><Typography variant="body2" color="text.secondary">No pending assignments.</Typography></Grid>
          )}
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Completed</Typography>
        <Grid container spacing={2}>
          {completed.map(a => (
            <Grid item xs={12} md={6} lg={4} key={a._id}>{renderCard(a)}</Grid>
          ))}
          {completed.length === 0 && (
            <Grid item xs={12}><Typography variant="body2" color="text.secondary">No completed assignments yet.</Typography></Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
}
