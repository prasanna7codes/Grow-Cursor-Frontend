import { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import api from '../../lib/api.js';

export default function AdminAssignmentsPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    // no filters; global summary
    refresh();
  }, []);

  const refresh = async () => {
    const { data } = await api.get('/tasks/analytics/admin-lister');
    setRows(data);
  };

  const perAdmin = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const key = r.adminId || 'unassigned';
      if (!map.has(key)) map.set(key, { adminName: r.adminName || 'Unassigned', tasksCount: 0, quantityTotal: 0, completedCount: 0, completedQty: 0 });
      const agg = map.get(key);
      agg.tasksCount += r.tasksCount;
      agg.quantityTotal += r.quantityTotal;
      agg.completedCount += r.completedCount;
      agg.completedQty += r.completedQty;
    }
    return Array.from(map.values());
  }, [rows]);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Admin → Lister Assignment Summary</Typography>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>Per Admin Summary</Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Admin</TableCell>
              <TableCell>Tasks</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Completed Tasks</TableCell>
              <TableCell>Completed Quantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {perAdmin.map((r, idx) => (
              <TableRow key={idx}>
                <TableCell>{r.adminName}</TableCell>
                <TableCell>{r.tasksCount}</TableCell>
                <TableCell>{r.quantityTotal}</TableCell>
                <TableCell>{r.completedCount}</TableCell>
                <TableCell>{r.completedQty}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>Admin → Lister Detail</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Admin</TableCell>
              <TableCell>Lister</TableCell>
              <TableCell>Tasks</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Completed Tasks</TableCell>
              <TableCell>Completed Quantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, idx) => (
              <TableRow key={idx}>
                <TableCell>{r.adminName || 'Unassigned'}</TableCell>
                <TableCell>{r.listerName || '-'}</TableCell>
                <TableCell>{r.tasksCount}</TableCell>
                <TableCell>{r.quantityTotal}</TableCell>
                <TableCell>{r.completedCount}</TableCell>
                <TableCell>{r.completedQty}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}


