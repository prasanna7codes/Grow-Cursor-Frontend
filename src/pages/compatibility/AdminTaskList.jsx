import { useEffect, useState } from 'react';
import {
  Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Stack, FormControl, InputLabel, Select, MenuItem, TextField, Typography, Chip,
  IconButton, Checkbox
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../lib/api.js';

export default function AdminTaskList() {
  const [assignments, setAssignments] = useState([]);
  const [editors, setEditors] = useState([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharing, setSharing] = useState(null);
  const [form, setForm] = useState({ editorId: '', rangeQuantities: [], notes: '' });
  const [loading, setLoading] = useState(false);
    // Track shared status for assignments (persisted)
    const [sharedStatus, setSharedStatus] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: eligible }, { data: editors }] = await Promise.all([
        api.get('/compatibility/eligible'),
        api.get('/users/compatibility-editors')
      ]);
      setAssignments(eligible || []);
      setEditors(editors || []);

        // Fetch compatibility assignments to check shared status
        const { data: compat } = await api.get('/compatibility/progress');
        // Map sourceAssignmentId to true if any compatibility assignment exists
        const sharedMap = {};
        (compat || []).forEach(ca => {
          if (ca.sourceAssignment?._id) sharedMap[ca.sourceAssignment._id] = true;
        });
        setSharedStatus(sharedMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openShare = (assignment) => {
    setSharing(assignment);
    // Initialize rangeQuantities from the assignment's range breakdown
    // Auto-select all ranges with full quantities by default
    const rqList = (assignment.rangeQuantities || []).map(rq => ({
      rangeId: rq.range?._id || rq.range,
      rangeName: rq.range?.name || '',
      quantity: rq.quantity || 0,
      selected: true  // Auto-select all ranges by default
    }));
    setForm({ editorId: '', rangeQuantities: rqList, notes: '' });
    setShareOpen(true);
  };

  const handleToggleRange = (index) => {
    setForm(f => ({
      ...f,
      rangeQuantities: f.rangeQuantities.map((rq, i) => 
        i === index ? { ...rq, selected: !rq.selected } : rq
      )
    }));
  };

  const handleQuantityChange = (index, value) => {
    setForm(f => ({
      ...f,
      rangeQuantities: f.rangeQuantities.map((rq, i) => 
        i === index ? { ...rq, quantity: Number(value) || 0 } : rq
      )
    }));
  };

  const handleShare = async () => {
    const { editorId, rangeQuantities, notes } = form;
    const selectedRanges = rangeQuantities.filter(rq => rq.selected && rq.quantity > 0);
    
    if (!editorId || selectedRanges.length === 0) {
      alert('Please select an editor and at least one range with quantity > 0');
      return;
    }

    try {
      await api.post('/compatibility/assign', {
        sourceAssignmentId: sharing._id,
        editorId,
        rangeQuantities: selectedRanges.map(rq => ({ rangeId: rq.rangeId, quantity: rq.quantity })),
        notes
      });
      setShareOpen(false);
      setSharing(null);
      alert('Task shared successfully!');
      await load();
    } catch (e) {
      console.error(e);
      alert('Failed to assign compatibility task');
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb:2 }}>Compatibility Admin - Ebay Motors</Typography>
      
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              
              <TableCell>Supplier Link</TableCell>
              
              <TableCell>Source Platform</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Subcategory</TableCell>
              <TableCell>Listing Platform</TableCell>
              <TableCell>Store</TableCell>
              <TableCell>Range Quantity Breakdown</TableCell>
                  <TableCell>Shared</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map(a => (
              <TableRow key={a._id}>
                <TableCell>{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                
                <TableCell>
                  {a.task?.supplierLink ? (
                    <a href={a.task.supplierLink} target="_blank" rel="noreferrer">Link</a>
                  ) : '-'}
                </TableCell>
                
                <TableCell>{a.task?.sourcePlatform?.name || '-'}</TableCell>
                <TableCell>{a.task?.category?.name || '-'}</TableCell>
                <TableCell>{a.task?.subcategory?.name || '-'}</TableCell>
                <TableCell>{a.listingPlatform?.name || '-'}</TableCell>
                <TableCell>{a.store?.name || '-'}</TableCell>
                <TableCell>
                  <Stack direction="column" spacing={0.5}>
                    {(a.rangeQuantities || []).map((rq, i) => (
                      <Chip key={i} label={`${rq.range?.name || '-'}: ${rq.quantity || 0}`} size="small" />
                    ))}
                  </Stack>
                </TableCell>
                  <TableCell>
                    {sharedStatus[a._id] ? (
                      <Chip label="Shared" color="success" size="small" />
                    ) : (
                      <Chip label="Not Shared" color="default" size="small" />
                    )}
                  </TableCell>
                <TableCell>
                  <Button size="small" variant="contained" onClick={() => openShare(a)}>
                    Share
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {assignments.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No completed Ebay Motors tasks available
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      

      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Share Task with Compatibility Editor</DialogTitle>
        <DialogContent>
          {sharing && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              
              <Typography variant="body2"><strong>Category:</strong> {sharing.task?.category?.name}</Typography>
              <Typography variant="body2"><strong>Subcategory:</strong> {sharing.task?.subcategory?.name}</Typography>
              <Typography variant="body2"><strong>Listing:</strong> {sharing.listingPlatform?.name} / {sharing.store?.name}</Typography>
              
              <FormControl fullWidth>
                <InputLabel>Select Editor</InputLabel>
                <Select 
                  label="Select Editor" 
                  value={form.editorId} 
                  onChange={(e) => setForm(f => ({ ...f, editorId: e.target.value }))}
                >
                  {editors.map(ed => (
                    <MenuItem key={ed._id} value={ed._id}>{ed.username}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Ranges and Quantities to Share:
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  All ranges are selected by default. You can modify quantities or unselect ranges if needed.
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">Select</TableCell>
                      <TableCell>Range</TableCell>
                      <TableCell>Original Quantity</TableCell>
                      <TableCell>Quantity to Share</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {form.rangeQuantities.map((rq, index) => (
                      <TableRow key={index}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={rq.selected}
                            onChange={() => handleToggleRange(index)}
                          />
                        </TableCell>
                        <TableCell>{rq.rangeName}</TableCell>
                        <TableCell>{rq.quantity}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={rq.selected ? rq.quantity : 0}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            disabled={!rq.selected}
                            inputProps={{ min: 0, max: rq.quantity }}
                            sx={{ width: 120 }}
                            helperText={rq.selected ? `Max: ${rq.quantity}` : ''}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

              <TextField 
                label="Notes (Optional)" 
                multiline 
                rows={3} 
                value={form.notes} 
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} 
                fullWidth
                placeholder="Add any instructions or notes for the editor..."
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleShare} 
            disabled={!form.editorId || !form.rangeQuantities.some(rq => rq.selected && rq.quantity > 0)}
          >
            Share Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
