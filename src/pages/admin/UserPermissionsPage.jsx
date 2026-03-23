import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Select, MenuItem, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Alert, Snackbar, InputAdornment, FormControl, Divider, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../lib/api';
import { PAGE_REGISTRY, PAGE_GROUPS } from '../../constants/pages.js';

// Access level options for the permission editor
const ACCESS_OPTIONS = [
  { value: 'default', label: 'Default (Role)', color: 'default' },
  { value: 'read', label: 'Read Only', color: 'info' },
  { value: 'update', label: 'Full Access', color: 'success' },
  { value: 'none', label: 'Revoked', color: 'error' },
];

export default function UserPermissionsPage({ user }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editPerms, setEditPerms] = useState({});
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  // Fetch all users with permissions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/users/all-with-permissions');
        setUsers(data);
      } catch (err) {
        setSnack({ open: true, msg: 'Failed to load users', severity: 'error' });
      }
    };
    fetchUsers();
  }, []);

  // Build permission map when user is selected
  useEffect(() => {
    if (!selectedUser) return;
    const permMap = {};
    (selectedUser.pagePermissions || []).forEach(p => {
      permMap[p.page] = p.accessLevel;
    });
    setEditPerms(permMap);
  }, [selectedUser]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (u.role === 'superadmin') return false; // Don't show self / other superadmins
      const matchSearch = !search ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase());
      const matchRole = !roleFilter || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  // Unique roles for filter dropdown
  const roles = useMemo(() => {
    return [...new Set(users.filter(u => u.role !== 'superadmin').map(u => u.role))].sort();
  }, [users]);

  // Handle permission change
  const handlePermChange = (pageId, value) => {
    setEditPerms(prev => {
      const next = { ...prev };
      if (value === 'default') {
        delete next[pageId];
      } else {
        next[pageId] = value;
      }
      return next;
    });
  };

  // Get the effective access for display
  const getEffectiveAccess = (pageId) => {
    if (editPerms[pageId]) return editPerms[pageId];
    return 'default';
  };

  // Save permissions
  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const pagePermissions = Object.entries(editPerms).map(([page, accessLevel]) => ({
        page, accessLevel
      }));
      await api.put(`/users/${selectedUser._id}/permissions`, { pagePermissions });

      // Update local state
      setUsers(prev => prev.map(u =>
        u._id === selectedUser._id ? { ...u, pagePermissions } : u
      ));
      setSelectedUser(prev => ({ ...prev, pagePermissions }));
      setSnack({ open: true, msg: `Permissions saved for ${selectedUser.username}`, severity: 'success' });
    } catch (err) {
      setSnack({ open: true, msg: 'Failed to save permissions', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Group pages by their group for the editor
  const groupedPages = useMemo(() => {
    const groups = {};
    // Top-level pages (no group)
    const topLevel = PAGE_REGISTRY.filter(p => !p.group && p.id !== 'UserPermissions');
    if (topLevel.length) groups['General'] = topLevel;
    // Grouped pages
    PAGE_GROUPS.forEach(g => {
      const pages = PAGE_REGISTRY.filter(p => p.group === g);
      if (pages.length) groups[g] = pages;
    });
    return groups;
  }, []);

  // Check if user has default access to a page
  const hasDefaultAccess = (pageId) => {
    if (!selectedUser) return false;
    const page = PAGE_REGISTRY.find(p => p.id === pageId);
    if (!page) return false;
    return page.defaultRoles.includes('*') || page.defaultRoles.includes(selectedUser.role);
  };

  // Count overrides for a user
  const getOverrideCount = (u) => (u.pagePermissions || []).length;

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        User Permissions Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Override page access for individual users. Users with no overrides use their role's default access.
      </Typography>

      {/* User List */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
            }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              displayEmpty
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="">All Roles</MenuItem>
              {roles.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Username</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>Department</strong></TableCell>
                <TableCell><strong>Overrides</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map(u => (
                <TableRow
                  key={u._id}
                  hover
                  selected={selectedUser?._id === u._id}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setSelectedUser(u)}
                >
                  <TableCell>{u.username}</TableCell>
                  <TableCell>
                    <Chip label={u.role} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{u.department || '—'}</TableCell>
                  <TableCell>
                    {getOverrideCount(u) > 0 ? (
                      <Chip label={`${getOverrideCount(u)} overrides`} size="small" color="primary" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">None</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">No users found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Permission Editor Dialog */}
      <Dialog
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  Edit Permissions: <strong>{selectedUser.username}</strong>
                  <Chip label={selectedUser.role} size="small" sx={{ ml: 1 }} />
                </Box>
                <IconButton onClick={() => setSelectedUser(null)}><CloseIcon /></IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Default</strong> = uses role's built-in access. Override to grant, restrict, or revoke access to specific pages.
              </Alert>

              {Object.entries(groupedPages).map(([groupName, pages]) => (
                <Box key={groupName} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: 'primary.main' }}>
                    {groupName}
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Page</strong></TableCell>
                          <TableCell><strong>Default Access</strong></TableCell>
                          <TableCell><strong>Override</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pages.map(page => (
                          <TableRow key={page.id}>
                            <TableCell>{page.name}</TableCell>
                            <TableCell>
                              {hasDefaultAccess(page.id) ? (
                                <Chip label="Has Access" size="small" color="success" variant="outlined" />
                              ) : (
                                <Chip label="No Access" size="small" color="default" variant="outlined" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Select
                                size="small"
                                value={getEffectiveAccess(page.id)}
                                onChange={(e) => handlePermChange(page.id, e.target.value)}
                                sx={{ minWidth: 160 }}
                              >
                                {ACCESS_OPTIONS.map(opt => (
                                  <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Divider sx={{ mt: 1 }} />
                </Box>
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedUser(null)}>Cancel</Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Permissions'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
