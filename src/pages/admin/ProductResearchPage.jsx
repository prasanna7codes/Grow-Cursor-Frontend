import { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper, Chip
} from '@mui/material';
import api from '../../lib/api.js';

export default function ProductResearchPage() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [listers, setListers] = useState([]);
  const [sourcePlatforms, setSourcePlatforms] = useState([]);
  const [listingPlatforms, setListingPlatforms] = useState([]);
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState({ date: '', productTitle: '', link: '', sourcePrice: '', sellingPrice: '', quantity: '', sourcePlatformId: '', range: '', category: '', listingPlatformId: '', storeId: '', assignedListerId: '' });

  const load = async () => {
    const [{ data: tasks }, { data: l }, { data: sp }, { data: lp }] = await Promise.all([
      api.get('/tasks'),
      api.get('/users/listers'),
      api.get('/platforms', { params: { type: 'source' } }),
      api.get('/platforms', { params: { type: 'listing' } })
    ]);
    setRows(tasks);
    setListers(l);
    setSourcePlatforms(sp);
    setListingPlatforms(lp);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (form.listingPlatformId) {
      api.get('/stores', { params: { platformId: form.listingPlatformId } }).then(({ data }) => setStores(data));
    } else {
      setStores([]);
    }
  }, [form.listingPlatformId]);

  const handleCreate = async () => {
    const payload = { ...form, date: form.date || new Date().toISOString() };
    await api.post('/tasks', payload);
    setOpen(false);
    setForm({ date: '', productTitle: '', link: '', sourcePrice: '', sellingPrice: '', quantity: '', sourcePlatformId: '', range: '', category: '', listingPlatformId: '', storeId: '', assignedListerId: '' });
    await load();
  };

  const handleAssign = async (id, listerId) => {
    await api.post(`/tasks/${id}/assign`, { listerId });
    await load();
  };

  const openEdit = (row) => {
    setEditing(row);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const payload = {
      date: editing.date,
      productTitle: editing.productTitle,
      link: editing.link,
      sourcePrice: editing.sourcePrice,
      sellingPrice: editing.sellingPrice,
      quantity: editing.quantity,
      range: editing.range,
      category: editing.category,
      sourcePlatform: editing.sourcePlatform?._id || editing.sourcePlatform,
      listingPlatform: editing.listingPlatform?._id || editing.listingPlatform,
      store: editing.store?._id || editing.store
    };
    await api.put(`/tasks/${editing._id}`, payload);
    setEditOpen(false);
    setEditing(null);
    await load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" onClick={() => setOpen(true)}>Create</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Product Title</TableCell>
              <TableCell>Link</TableCell>
              <TableCell>Source Price</TableCell>
              <TableCell>Selling Price</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Source Platform</TableCell>
              <TableCell>Range</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Listing Platform</TableCell>
              <TableCell>Store</TableCell>
              <TableCell>Lister</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Send</TableCell>
              <TableCell>Edit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r._id}>
                <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                <TableCell>{r.productTitle}</TableCell>
                <TableCell><a href={r.link} target="_blank" rel="noreferrer">Link</a></TableCell>
                <TableCell>{r.sourcePrice}</TableCell>
                <TableCell>{r.sellingPrice}</TableCell>
                <TableCell>{r.quantity}</TableCell>
                <TableCell>{r.sourcePlatform?.name}</TableCell>
                <TableCell>{r.range}</TableCell>
                <TableCell>{r.category}</TableCell>
                <TableCell>{r.listingPlatform?.name}</TableCell>
                <TableCell>{r.store?.name}</TableCell>
                <TableCell>{r.assignedLister ? r.assignedLister.username : '-'}</TableCell>
                <TableCell>
                  <Chip size="small" label={r.status} color={r.status === 'completed' ? 'success' : r.status === 'assigned' ? 'info' : 'default'} />
                </TableCell>
                <TableCell>
                  {r.status === 'draft' ? (
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <Select displayEmpty value="" onChange={(e) => handleAssign(r._id, e.target.value)}>
                        <MenuItem value=""><em>Assign...</em></MenuItem>
                        {listers.map((l) => (
                          <MenuItem key={l._id} value={l._id}>{l.username}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => openEdit(r)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Product Research</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Date" type="date" InputLabelProps={{ shrink: true }} value={form.date || new Date().toISOString().slice(0,10)} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <TextField label="Product Title" value={form.productTitle} onChange={(e) => setForm({ ...form, productTitle: e.target.value })} />
            <TextField label="Link" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Source Price" type="number" value={form.sourcePrice} onChange={(e) => setForm({ ...form, sourcePrice: Number(e.target.value) })} />
              <TextField label="Selling Price" type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })} />
              <TextField label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </Stack>
            <FormControl fullWidth>
              <InputLabel>Source Platform</InputLabel>
              <Select label="Source Platform" value={form.sourcePlatformId} onChange={(e) => setForm({ ...form, sourcePlatformId: e.target.value })}>
                {sourcePlatforms.map((p) => (<MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>))}
              </Select>
            </FormControl>
            <TextField label="Range" value={form.range} onChange={(e) => setForm({ ...form, range: e.target.value })} />
            <TextField label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Listing Platform</InputLabel>
              <Select label="Listing Platform" value={form.listingPlatformId} onChange={(e) => setForm({ ...form, listingPlatformId: e.target.value })}>
                {listingPlatforms.map((p) => (<MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>))}
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={!form.listingPlatformId}>
              <InputLabel>Store</InputLabel>
              <Select label="Store" value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
                {stores.map((s) => (<MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Assign to Lister (optional)</InputLabel>
              <Select label="Assign to Lister (optional)" value={form.assignedListerId} onChange={(e) => setForm({ ...form, assignedListerId: e.target.value })}>
                <MenuItem value=""><em>None</em></MenuItem>
                {listers.map((l) => (<MenuItem key={l._id} value={l._id}>{l.username}</MenuItem>))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Product Research</DialogTitle>
        <DialogContent>
          {editing ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Date" type="date" InputLabelProps={{ shrink: true }} value={(editing.date || '').slice(0,10)} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
              <TextField label="Product Title" value={editing.productTitle} onChange={(e) => setEditing({ ...editing, productTitle: e.target.value })} />
              <TextField label="Link" value={editing.link} onChange={(e) => setEditing({ ...editing, link: e.target.value })} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Source Price" type="number" value={editing.sourcePrice} onChange={(e) => setEditing({ ...editing, sourcePrice: Number(e.target.value) })} />
                <TextField label="Selling Price" type="number" value={editing.sellingPrice} onChange={(e) => setEditing({ ...editing, sellingPrice: Number(e.target.value) })} />
                <TextField label="Quantity" type="number" value={editing.quantity} onChange={(e) => setEditing({ ...editing, quantity: Number(e.target.value) })} />
              </Stack>
              <FormControl fullWidth>
                <InputLabel>Source Platform</InputLabel>
                <Select label="Source Platform" value={editing.sourcePlatform?._id || editing.sourcePlatform} onChange={(e) => setEditing({ ...editing, sourcePlatform: e.target.value })}>
                  {sourcePlatforms.map((p) => (<MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>))}
                </Select>
              </FormControl>
              <TextField label="Range" value={editing.range} onChange={(e) => setEditing({ ...editing, range: e.target.value })} />
              <TextField label="Category" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              <FormControl fullWidth>
                <InputLabel>Listing Platform</InputLabel>
                <Select label="Listing Platform" value={editing.listingPlatform?._id || editing.listingPlatform} onChange={(e) => setEditing({ ...editing, listingPlatform: e.target.value })}>
                  {listingPlatforms.map((p) => (<MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>))}
                </Select>
              </FormControl>
              <FormControl fullWidth disabled={!editing.listingPlatform}>
                <InputLabel>Store</InputLabel>
                <Select label="Store" value={editing.store?._id || editing.store} onChange={(e) => setEditing({ ...editing, store: e.target.value })}>
                  {stores.map((s) => (<MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>))}
                </Select>
              </FormControl>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


