import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Chip
} from '@mui/material';
import api from '../../lib/api';

const SellerLimitsPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        fetchLimits();
    }, []);

    const fetchLimits = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/seller-limits');
            setData(response.data);
            setLastUpdated(new Date());
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch seller limits:', err);
            setError('Failed to fetch seller limits. Please try again later.');
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Seller Limits
                    </Typography>
                    {lastUpdated && (
                        <Typography variant="subtitle2" color="text.secondary">
                            Last Updated: {lastUpdated.toLocaleTimeString()}
                        </Typography>
                    )}
                </Box>
                <Box>
                    {/* Refresh Button */}
                    <Box
                        sx={{
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            bgcolor: 'primary.main',
                            color: 'white',
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            opacity: loading ? 0.7 : 1,
                            '&:hover': {
                                bgcolor: loading ? 'primary.main' : 'primary.dark',
                            }
                        }}
                        onClick={!loading ? fetchLimits : undefined}
                    >
                        {loading && <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />}
                        <Typography variant="button">
                            {loading ? 'Fetching Data...' : 'Refresh'}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {loading && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Fetching latest seller limits from eBay... This may take a few moments.
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="seller limits table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Seller Name</TableCell>
                            <TableCell align="right">Quantity Limit Remaining</TableCell>
                            <TableCell align="right">Amount Limit Remaining</TableCell>
                            <TableCell align="center">Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow
                                key={row.sellerId}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    {row.username}
                                </TableCell>
                                <TableCell align="right">
                                    {row.quantityLimitRemaining !== 'N/A' ? parseInt(row.quantityLimitRemaining).toLocaleString() : 'N/A'}
                                </TableCell>
                                <TableCell align="right">
                                    {row.amountLimitRemaining && row.amountLimitRemaining !== 'N/A' && row.amountCurrency
                                        ? `${new Intl.NumberFormat('en-US', { style: 'currency', currency: row.amountCurrency }).format(row.amountLimitRemaining)}`
                                        : 'N/A'}
                                </TableCell>
                                <TableCell align="center">
                                    <Chip
                                        label={row.status}
                                        color={row.status === 'Success' ? 'success' : 'error'}
                                        size="small"
                                    />
                                    {row.error && (
                                        <Typography variant="caption" display="block" color="error">
                                            {row.error}
                                        </Typography>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && !loading && !error && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    No Data Available
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SellerLimitsPage;
