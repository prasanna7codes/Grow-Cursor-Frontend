import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, Checkbox, FormControlLabel, FormGroup, Chip,
    TextField, InputAdornment, Alert, Snackbar, CircularProgress,
    Accordion, AccordionSummary, AccordionDetails, IconButton, Tooltip,
    Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../../lib/api';

export default function ManagePermissionsPage() {
    const [users, setUsers] = useState([]);
    const [availableData, setAvailableData] = useState(null); // { permissions, labels, groups }
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [editPerms, setEditPerms] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [migrating, setMigrating] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, availableRes] = await Promise.all([
                api.get('/permissions/all-users'),
                api.get('/permissions/available'),
            ]);
            setUsers(usersRes.data);
            setAvailableData(availableRes.data);
        } catch (err) {
            console.error('Failed to load permissions data:', err);
            setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setEditPerms([...(user.permissions || [])]);
        setDialogOpen(true);
    };

    const handleTogglePerm = (perm) => {
        setEditPerms(prev =>
            prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
        );
    };

    const handleToggleGroup = (groupPerms) => {
        const allSelected = groupPerms.every(p => editPerms.includes(p));
        if (allSelected) {
            setEditPerms(prev => prev.filter(p => !groupPerms.includes(p)));
        } else {
            setEditPerms(prev => [...new Set([...prev, ...groupPerms])]);
        }
    };

    const handleSelectAll = () => {
        if (!availableData) return;
        const allPerms = Object.values(availableData.permissions);
        const allSelected = allPerms.every(p => editPerms.includes(p));
        setEditPerms(allSelected ? [] : [...allPerms]);
    };

    const handleSave = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            await api.put(`/permissions/${selectedUser._id}`, { permissions: editPerms });
            setSnackbar({ open: true, message: `Permissions updated for ${selectedUser.username}`, severity: 'success' });
            setDialogOpen(false);
            fetchData(); // refresh
        } catch (err) {
            console.error('Failed to save permissions:', err);
            setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to save', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleMigrate = async () => {
        if (!window.confirm('This will populate permissions for all users who don\'t have any yet, based on their current role defaults. Continue?')) return;
        setMigrating(true);
        try {
            const { data } = await api.post('/permissions/migrate');
            setSnackbar({ open: true, message: data.message, severity: 'success' });
            fetchData();
        } catch (err) {
            console.error('Migration failed:', err);
            setSnackbar({ open: true, message: 'Migration failed', severity: 'error' });
        } finally {
            setMigrating(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.role?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" fontWeight={700}>
                    Manage User Permissions
                </Typography>
                <Button
                    variant="outlined"
                    color="warning"
                    startIcon={migrating ? <CircularProgress size={18} /> : <SyncIcon />}
                    onClick={handleMigrate}
                    disabled={migrating}
                >
                    {migrating ? 'Migrating...' : 'Migrate from Roles'}
                </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
                Superadmin always has full access and is not shown below. Assign permissions to control which pages each user can see and access.
            </Alert>

            <TextField
                fullWidth
                placeholder="Search users by username, email, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start"><SearchIcon /></InputAdornment>
                    ),
                }}
                size="small"
            />

            <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 300px)' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Permissions</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.map(user => (
                            <TableRow key={user._id} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>{user.username}</Typography>
                                    {user.email && <Typography variant="caption" color="text.secondary">{user.email}</Typography>}
                                </TableCell>
                                <TableCell>
                                    <Chip label={user.role} size="small" color="primary" variant="outlined" />
                                </TableCell>
                                <TableCell>{user.department || '—'}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 400 }}>
                                        {(user.permissions || []).length === 0 ? (
                                            <Typography variant="caption" color="text.secondary" fontStyle="italic">No permissions assigned</Typography>
                                        ) : (
                                            <>
                                                {(user.permissions || []).slice(0, 5).map(p => (
                                                    <Chip
                                                        key={p}
                                                        label={availableData?.labels?.[p] || p}
                                                        size="small"
                                                        sx={{ fontSize: '0.7rem' }}
                                                    />
                                                ))}
                                                {(user.permissions || []).length > 5 && (
                                                    <Chip
                                                        label={`+${user.permissions.length - 5} more`}
                                                        size="small"
                                                        color="default"
                                                        sx={{ fontSize: '0.7rem' }}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Edit Permissions">
                                        <IconButton size="small" onClick={() => handleEditUser(user)} color="primary">
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredUsers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">No users found</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit Permissions Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Edit Permissions — {selectedUser?.username}
                    <Chip label={selectedUser?.role} size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            {editPerms.length} permission{editPerms.length !== 1 ? 's' : ''} selected
                        </Typography>
                        <Button size="small" onClick={handleSelectAll}>
                            {availableData && Object.values(availableData.permissions).every(p => editPerms.includes(p))
                                ? 'Deselect All'
                                : 'Select All'
                            }
                        </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {availableData && Object.entries(availableData.groups).map(([groupName, groupPerms]) => {
                        const selectedInGroup = groupPerms.filter(p => editPerms.includes(p)).length;
                        const allSelected = selectedInGroup === groupPerms.length;
                        return (
                            <Accordion key={groupName} defaultExpanded={selectedInGroup > 0}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                        <Checkbox
                                            checked={allSelected}
                                            indeterminate={selectedInGroup > 0 && !allSelected}
                                            onChange={() => handleToggleGroup(groupPerms)}
                                            onClick={(e) => e.stopPropagation()}
                                            size="small"
                                        />
                                        <Typography fontWeight={600}>{groupName}</Typography>
                                        <Chip
                                            label={`${selectedInGroup}/${groupPerms.length}`}
                                            size="small"
                                            color={allSelected ? 'success' : selectedInGroup > 0 ? 'warning' : 'default'}
                                            sx={{ ml: 'auto', mr: 2 }}
                                        />
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <FormGroup sx={{ pl: 2 }}>
                                        {groupPerms.map(perm => (
                                            <FormControlLabel
                                                key={perm}
                                                control={
                                                    <Checkbox
                                                        checked={editPerms.includes(perm)}
                                                        onChange={() => handleTogglePerm(perm)}
                                                        size="small"
                                                    />
                                                }
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="body2">
                                                            {availableData.labels[perm] || perm}
                                                        </Typography>
                                                        {editPerms.includes(perm) && (
                                                            <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        ))}
                                    </FormGroup>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={18} /> : null}
                    >
                        {saving ? 'Saving...' : 'Save Permissions'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
