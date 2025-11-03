import { useMemo, useState } from 'react';
import { Link, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import InsightsIcon from '@mui/icons-material/Insights';
import StoreIcon from '@mui/icons-material/Store';
import AppsIcon from '@mui/icons-material/Apps';
import ProductResearchPage from '../pages/admin/ProductResearchPage.jsx';
import AddListerPage from '../pages/admin/AddListerPage.jsx';
import ListingAnalyticsPage from '../pages/admin/ListingAnalyticsPage.jsx';
import ManagePlatformsPage from '../pages/admin/ManagePlatformsPage.jsx';
import ManageStoresPage from '../pages/admin/ManageStoresPage.jsx';
import AdminAssignmentsPage from '../pages/admin/AdminAssignmentsPage.jsx';
import ListerInsightsPage from '../pages/admin/ListerInsightsPage.jsx';

const drawerWidth = 260;

export default function AdminLayout({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const isSuper = user?.role === 'superadmin';

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/admin/research" onClick={() => setMobileOpen(false)}>
            <ListItemIcon><Inventory2Icon /></ListItemIcon>
            <ListItemText primary="Product Research" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/admin/listing" onClick={() => setMobileOpen(false)}>
            <ListItemIcon><InsightsIcon /></ListItemIcon>
            <ListItemText primary="Listing" />
          </ListItemButton>
        </ListItem>
        {isSuper ? (
          <>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/admin/assignments" onClick={() => setMobileOpen(false)}>
                <ListItemIcon><InsightsIcon /></ListItemIcon>
                <ListItemText primary="Assignments" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/admin/lister-insights" onClick={() => setMobileOpen(false)}>
                <ListItemIcon><InsightsIcon /></ListItemIcon>
                <ListItemText primary="Lister Insights" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/admin/platforms" onClick={() => setMobileOpen(false)}>
                <ListItemIcon><AppsIcon /></ListItemIcon>
                <ListItemText primary="Platforms" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/admin/stores" onClick={() => setMobileOpen(false)}>
                <ListItemIcon><StoreIcon /></ListItemIcon>
                <ListItemText primary="Stores" />
              </ListItemButton>
            </ListItem>
          </>
        ) : null}
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/admin/add-user" onClick={() => setMobileOpen(false)}>
            <ListItemIcon><AddCircleIcon /></ListItemIcon>
            <ListItemText primary="Add User" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Admin Dashboard</Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>{user?.username} ({user?.role})</Typography>
          <Button color="inherit" onClick={onLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Routes>
          <Route path="/research" element={<ProductResearchPage />} />
          <Route path="/add-user" element={<AddListerPage />} />
          <Route path="/listing" element={<ListingAnalyticsPage />} />
          {isSuper ? (
            <>
              <Route path="/assignments" element={<AdminAssignmentsPage />} />
              <Route path="/lister-insights" element={<ListerInsightsPage />} />
              <Route path="/platforms" element={<ManagePlatformsPage />} />
              <Route path="/stores" element={<ManageStoresPage />} />
            </>
          ) : null}
          <Route path="*" element={<Navigate to="/admin/research" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}


