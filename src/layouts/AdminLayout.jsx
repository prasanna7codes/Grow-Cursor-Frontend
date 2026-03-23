import { useMemo, useState, useEffect } from 'react';
import { Link, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
  Button,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import InsightsIcon from '@mui/icons-material/Insights';
import StoreIcon from '@mui/icons-material/Store';
import AppsIcon from '@mui/icons-material/Apps';
import CategoryIcon from '@mui/icons-material/Category';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ProductResearchPage from '../pages/admin/ProductResearchPage.jsx';
import AddListerPage from '../pages/admin/AddListerPage.jsx';
import ListingManagementPage from '../pages/admin/ListingManagementPage.jsx';
import ManagePlatformsPage from '../pages/admin/ManagePlatformsPage.jsx';
import ManageStoresPage from '../pages/admin/ManageStoresPage.jsx';
import AdminAssignmentsPage from '../pages/admin/AdminAssignmentsPage.jsx';
import ManageRangesPage from '../pages/admin/ManageRangesPage.jsx';
import ManageCategoriesPage from '../pages/admin/ManageCategoriesPage.jsx';
import ListingsSummaryPage from '../pages/admin/ListingsSummaryPage.jsx';
import UserCredentialsPage from '../pages/admin/UserCredentialsPage.jsx';
import ListingSheetPage from '../pages/admin/ListingSheetPage.jsx';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import TaskIcon from '@mui/icons-material/Task';
import EditIcon from '@mui/icons-material/Edit';

import TaskListPage from '../pages/admin/TaskListPage.jsx';
import StockLedgerPage from '../pages/admin/StockLedgerPage.jsx';
import StoreWiseTaskListPage from '../pages/admin/StoreWiseTaskListPage.jsx';
import StoreTaskDetailPage from '../pages/admin/StoreTaskDetailPage.jsx';
import StoreDailyTasksPage from '../pages/admin/StoreDailyTasksPage.jsx';
import ListerInfoPage from '../pages/admin/ListerInfoPage.jsx';
import ListerInfoDetailPage from '../pages/admin/ListerInfoDetailPage.jsx';
import AdminTaskList from '../pages/compatibility/AdminTaskList.jsx';
import EditorDashboard from '../pages/compatibility/EditorDashboard.jsx';
import ProgressTrackingPage from '../pages/compatibility/ProgressTrackingPage.jsx';
import CompatibilityBatchHistoryPage from '../pages/compatibility/CompatibilityBatchHistoryPage.jsx';

import FulfillmentDashboard from '../pages/admin/FulfillmentDashboard.jsx';
import AllOrdersSheetPage from '../pages/admin/AllOrdersSheetPage.jsx';
import AwaitingShipmentPage from '../pages/admin/AwaitingShipmentPage.jsx';
import AwaitingSheetPage from '../pages/admin/AwaitingSheetPage.jsx';
import AmazonArrivalsPage from '../pages/admin/AmazonArrivalsPage.jsx';
import FulfillmentNotesPage from '../pages/admin/FulfillmentNotesPage.jsx';
import ConversationTrackingPage from '../pages/admin/ConversationTrackingPage.jsx';
// CancelledStatusPage is now embedded in Issues and Resolutions (DisputesPage)
import DisputesPage from '../pages/admin/DisputesPage.jsx';
import AccountHealthReportPage from '../pages/admin/AccountHealthReportPage.jsx';
import PayoneerSheetPage from '../pages/admin/PayoneerSheetPage.jsx';
import BankAccountsPage from '../pages/admin/BankAccountsPage.jsx';
import TransactionPage from '../pages/admin/TransactionPage.jsx';
import ExtraExpensePage from '../pages/admin/ExtraExpensePage.jsx';
//import MessageReceivedPage from '../pages/admin/MessageReceivedPage.jsx';
import AboutMePage from '../pages/AboutMePage.jsx';
import EmployeeDetailsPage from '../pages/admin/EmployeeDetailsPage.jsx';
import EmployeeManagementPage from '../pages/admin/EmployeeManagementPage.jsx';
import BuyerChatPage from '../pages/admin/BuyerChatPage.jsx';
import RangeAnalyzerPage from '../pages/admin/RangeAnalyzerPage.jsx';
import FeedUploadPage from '../pages/ebay/FeedUploadPage.jsx';
import SellingPrivilegesPage from '../pages/admin/SellingPrivilegesPage.jsx';
import EbayApiUsagePage from '../pages/admin/EbayApiUsagePage.jsx';
import FeedUploadStatsPage from '../pages/admin/FeedUploadStatsPage.jsx';
import SalaryPage from '../pages/admin/SalaryPage.jsx';
import SellerFundsPage from '../pages/admin/SellerFundsPage.jsx';

import DashboardIcon from '@mui/icons-material/Dashboard';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import CompatibilityDashboard from '../pages/compatibility/CompatibilityDashboard.jsx';
import EditListingsDashboard from '../pages/listings/EditListingsDashboard.jsx';

import ConversationManagementPage from '../pages/admin/ConversationManagementPage.jsx';
import ManageAmazonAccountsPage from '../pages/admin/ManageAmazonAccountsPage.jsx';
import InternalMessagesPage from '../pages/admin/InternalMessagesPage.jsx';
import InternalMessagesAdminPage from '../pages/admin/InternalMessagesAdminPage.jsx';
import ManageCreditCardsPage from '../pages/admin/ManageCreditCardsPage.jsx';
import ManageCreditCardNamesPage from '../pages/admin/ManageCreditCardNamesPage.jsx';
import AffiliateOrdersPage from '../pages/admin/AffiliateOrdersPage.jsx';
import LinkIcon from '@mui/icons-material/Link';
import IdeasPage from '../pages/IdeasPage.jsx';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import OrderAnalyticsPage from '../pages/admin/OrderAnalyticsPage.jsx';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SellerAnalyticsPage from '../pages/admin/SellerAnalyticsPage.jsx';
import OrdersDepartmentDashboardPage from '../pages/admin/OrdersDepartmentDashboardPage.jsx';
// WorksheetPage is now embedded in Issues and Resolutions (DisputesPage)
import BarChartIcon from '@mui/icons-material/BarChart';
import ChatIcon from '@mui/icons-material/Chat';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AmazonLookupPage from '../pages/admin/AmazonLookupPage.jsx';
import SearchIcon from '@mui/icons-material/Search';
import ManageProductUmbrellasPage from '../pages/admin/ManageProductUmbrellasPage.jsx';
import UmbrellaIcon from '@mui/icons-material/Umbrella';
import ASINStoragePage from '../pages/admin/ASINStoragePage.jsx';
import StorageIcon from '@mui/icons-material/Storage';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import LayersIcon from '@mui/icons-material/Layers';
import ColumnCreatorPage from '../pages/admin/ColumnCreatorPage.jsx';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ManageTemplatesPage from '../pages/admin/ManageTemplatesPage.jsx';
import TemplateListingsPage from '../pages/admin/TemplateListingsPage.jsx';
import TemplateListingAnalyticsPage from '../pages/admin/TemplateListingAnalyticsPage.jsx';
import SelectSellerPage from '../pages/admin/SelectSellerPage.jsx';
import SellerTemplatesPage from '../pages/admin/SellerTemplatesPage.jsx';
import ListingDirectoryPage from '../pages/admin/ListingDirectoryPage.jsx';
import TemplateDirectoryPage from '../pages/admin/TemplateDirectoryPage.jsx';
import TemplateDatabasePage from '../pages/admin/TemplateDatabasePage.jsx';
import CsvStoragePage from '../pages/admin/CsvStoragePage.jsx';
import DescriptionIcon from '@mui/icons-material/Description';
import HomeIcon from '@mui/icons-material/Home';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LeaveManagementPage from '../pages/LeaveManagementPage.jsx';
import LeaveAdminPage from '../pages/admin/LeaveAdminPage.jsx';
import AttendanceAdminPage from '../pages/admin/AttendanceAdminPage.jsx';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AsinDirectoryPage from '../pages/admin/AsinDirectoryPage.jsx';
import AsinListPage from '../pages/admin/AsinListPage.jsx';
import UserSellerAssignmentPage from '../pages/admin/UserSellerAssignmentPage.jsx';
import UserPerformancePage from '../pages/admin/UserPerformancePage.jsx';
import AiFitmentUsagePage from '../pages/admin/AiFitmentUsagePage.jsx';
import ListingStatsPage from '../pages/admin/ListingStatsPage.jsx';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SecurityIcon from '@mui/icons-material/Security';
import usePermissions from '../hooks/usePermissions.js';
import UserPermissionsPage from '../pages/admin/UserPermissionsPage.jsx';
import ReadOnlyGuard from '../components/ReadOnlyGuard.jsx';

const drawerWidth = 230;

// Shared flyout menu positioning — all flyouts open to the right of their anchor
const flyoutMenuPositionProps = {
  anchorOrigin: { vertical: 'top', horizontal: 'right' },
  transformOrigin: { vertical: 'top', horizontal: 'left' },
};

// Custom styling for selected sidebar items
const selectedMenuItemStyle = {
  '&.Mui-selected': {
    backgroundColor: 'rgba(25, 118, 210, 0.25)',
    '&:hover': {
      backgroundColor: 'rgba(25, 118, 210, 0.35)',
    }
  }
};

// Helper component for sidebar icons with tooltips when collapsed
const NavIcon = ({ icon: Icon, label, sidebarOpen }) => (
  sidebarOpen ? (
    <Icon />
  ) : (
    <Tooltip
      title={label}
      placement="right"
      arrow
      enterDelay={200}
      leaveDelay={200}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon />
      </span>
    </Tooltip>
  )
);

export default function AdminLayout({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Flyout menu anchor states
  const [listingAnchorEl, setListingAnchorEl] = useState(null);
  const [monitoringAnchorEl, setMonitoringAnchorEl] = useState(null);
  const [compatAnchorEl, setCompatAnchorEl] = useState(null);
  const [ordersAnchorEl, setOrdersAnchorEl] = useState(null);
  const [manageAnchorEl, setManageAnchorEl] = useState(null);
  const [financeAnchorEl, setFinanceAnchorEl] = useState(null);
  const [asinImporterAnchorEl, setAsinImporterAnchorEl] = useState(null);
  const [templateListingAnchorEl, setTemplateListingAnchorEl] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Close all flyout menus + mobile drawer in one call
  const closeAllMenus = () => {
    setListingAnchorEl(null);
    setMonitoringAnchorEl(null);
    setCompatAnchorEl(null);
    setOrdersAnchorEl(null);
    setManageAnchorEl(null);
    setFinanceAnchorEl(null);
    setAsinImporterAnchorEl(null);
    setTemplateListingAnchorEl(null);
    setMobileOpen(false);
  };

  // --- ROLE DEFINITIONS ---
  const isSuper = user?.role === 'superadmin';
  const isProductAdmin = user?.role === 'productadmin';
  const isListingAdmin = user?.role === 'listingadmin';
  const isCompatibilityAdmin = user?.role === 'compatibilityadmin';
  const isCompatibilityEditor = user?.role === 'compatibilityeditor';
  const isFulfillmentAdmin = user?.role === 'fulfillmentadmin';
  const isHRAdmin = user?.role === 'hradmin';
  const isOperationHead = user?.role === 'operationhead';
  const isSeller = user?.role === 'seller';

  // New Roles
  const isHOC = user?.role === 'hoc';
  const isComplianceManager = user?.role === 'compliancemanager';

  // Lister Roles
  const isLister = user?.role === 'lister';
  const isAdvanceLister = user?.role === 'advancelister';
  const isTrainee = user?.role === 'trainee';
  const isAnyLister = isLister || isAdvanceLister || isTrainee;

  // Dynamic page-level permission checks
  const { hasAccess, isReadOnly } = usePermissions(user);

  // Helper: wrap a page element with ReadOnlyGuard for a given pageId
  const guarded = (pageId, element) => (
    <ReadOnlyGuard readOnly={isReadOnly(pageId)}>{element}</ReadOnlyGuard>
  );

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {/* Back to Lister Dashboard - visible only to listers */}
        {isAnyLister && (
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/lister"
              onClick={() => setMobileOpen(false)}
              sx={selectedMenuItemStyle}
            >
              <ListItemIcon>
                <NavIcon icon={HomeIcon} label="Back to My Dashboard" sidebarOpen={sidebarOpen} />
              </ListItemIcon>
              {sidebarOpen && <ListItemText primary="My Dashboard" />}
            </ListItemButton>
          </ListItem>
        )}

        {/* Divider after lister dashboard link */}
        {isAnyLister && <Divider sx={{ my: 1 }} />}

        {/* Ideas & Issues - visible to ALL users */}
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/admin/ideas"
            onClick={() => setMobileOpen(false)}
            selected={location.pathname === '/admin/ideas'}
            sx={selectedMenuItemStyle}
          >
            <ListItemIcon>
              <NavIcon icon={LightbulbIcon} label="Ideas & Issues Board" sidebarOpen={sidebarOpen} />
            </ListItemIcon>
            {sidebarOpen && <ListItemText primary="Ideas & Issues" />}
          </ListItemButton>
        </ListItem>

        {/* About Me - visible to all users except superadmin */}
        {!isSuper && (
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/admin/about-me"
              onClick={() => setMobileOpen(false)}
              selected={location.pathname === '/admin/about-me'}
              sx={selectedMenuItemStyle}
            >
              <ListItemIcon>
                <NavIcon icon={SupervisorAccountIcon} label="View Your Profile" sidebarOpen={sidebarOpen} />
              </ListItemIcon>
              {sidebarOpen && <ListItemText primary="About Me" />}
            </ListItemButton>
          </ListItem>
        )}

        {/* Internal Messages - visible to ALL users */}
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/admin/internal-messages"
            onClick={() => setMobileOpen(false)}
            selected={location.pathname === '/admin/internal-messages'}
            sx={selectedMenuItemStyle}
          >
            <ListItemIcon>
              <NavIcon icon={ChatIcon} label="Team Chat & Messaging" sidebarOpen={sidebarOpen} />
            </ListItemIcon>
            {sidebarOpen && <ListItemText primary="Team Chat" />}
          </ListItemButton>
        </ListItem>

        {/* Finance Dropdown */}
        {(hasAccess('PayoneerSheet') || hasAccess('BankAccounts') || hasAccess('Transactions') || hasAccess('ExtraExpenses') || hasAccess('CreditCardNames') || hasAccess('Salary')) && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={(e) => setFinanceAnchorEl(e.currentTarget)}
                sx={{ justifyContent: 'space-between' }}
              >
                <ListItemIcon>
                  <NavIcon icon={AttachMoneyIcon} label="Finance" sidebarOpen={sidebarOpen} />
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary="Finance" />}
                {sidebarOpen && <ChevronRightIcon fontSize="small" />}
              </ListItemButton>
            </ListItem>

            {/* Sideways flyout menu */}
            <Menu
              anchorEl={financeAnchorEl}
              open={Boolean(financeAnchorEl)}
              onClose={() => setFinanceAnchorEl(null)}
              {...flyoutMenuPositionProps}
              sx={{ '& .MuiPaper-root': { minWidth: '220px' } }}
            >
              {hasAccess('PayoneerSheet') && <MenuItem component={Link} to="/admin/payoneer" onClick={closeAllMenus}>Payoneer Sheet</MenuItem>}
              {hasAccess('BankAccounts') && <MenuItem component={Link} to="/admin/bank-accounts" onClick={closeAllMenus}>Bank Accounts</MenuItem>}
              {hasAccess('Transactions') && <MenuItem component={Link} to="/admin/transactions" onClick={closeAllMenus}>Transactions</MenuItem>}
              {hasAccess('ExtraExpenses') && <MenuItem component={Link} to="/admin/extra-expenses" onClick={closeAllMenus}>Extra Expenses</MenuItem>}
              {hasAccess('CreditCardNames') && <MenuItem component={Link} to="/admin/credit-card-names" onClick={closeAllMenus}>Credit Card Names</MenuItem>}
              {hasAccess('Salary') && <MenuItem component={Link} to="/admin/salary" onClick={closeAllMenus}>Salary Page</MenuItem>}
            </Menu>

            {/* View All Messages - standalone */}
            {hasAccess('InternalMessagesAdmin') && (
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/admin/internal-messages-admin"
                onClick={() => setMobileOpen(false)}
                selected={location.pathname === '/admin/internal-messages-admin'}
                sx={selectedMenuItemStyle}
              >
                <ListItemIcon>
                  <NavIcon icon={AdminPanelSettingsIcon} label="Admin Panel - View All Messages" sidebarOpen={sidebarOpen} />
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary="View All Messages" />}
              </ListItemButton>
            </ListItem>)}

            {/* Working Hours Tracking */}
            {hasAccess('Attendance') && (
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/admin/attendance"
                onClick={() => setMobileOpen(false)}
                selected={location.pathname === '/admin/attendance'}
                sx={selectedMenuItemStyle}
              >
                <ListItemIcon>
                  <NavIcon icon={AccessTimeIcon} label="Working Hours Tracking" sidebarOpen={sidebarOpen} />
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary="Working Hours Tracking" />}
              </ListItemButton>
            </ListItem>)}
          </>
        )}

        {/* Product Research */}
        {hasAccess('ProductResearch') ? (
          <>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/admin/research"
                onClick={() => setMobileOpen(false)}
                selected={location.pathname === '/admin/research'}
                sx={selectedMenuItemStyle}
              >
                <ListItemIcon>
                  <NavIcon icon={Inventory2Icon} label="Product Research & Analysis" sidebarOpen={sidebarOpen} />
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary="Product Research" />}
              </ListItemButton>
            </ListItem>

          </>
        ) : null}

        {/* Template Listing flyout */}
        {(hasAccess('ManageTemplates') || hasAccess('ListingsDatabase') || hasAccess('SelectSeller') || hasAccess('ListingDirectory') || hasAccess('TemplateDirectory')) && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={(e) => setTemplateListingAnchorEl(e.currentTarget)}
                sx={{ justifyContent: 'space-between' }}
              >
                <ListItemIcon>
                  <NavIcon icon={LayersIcon} label="Template Listing" sidebarOpen={sidebarOpen} />
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary="Template Listing" />}
                {sidebarOpen && <ChevronRightIcon fontSize="small" />}
              </ListItemButton>
            </ListItem>

            <Menu
              anchorEl={templateListingAnchorEl}
              open={Boolean(templateListingAnchorEl)}
              onClose={() => setTemplateListingAnchorEl(null)}
              {...flyoutMenuPositionProps}
              sx={{ '& .MuiPaper-root': { minWidth: '220px' } }}
            >
              {hasAccess('ManageTemplates') && <MenuItem component={Link} to="/admin/manage-templates" onClick={closeAllMenus}>Manage Templates</MenuItem>}
              {hasAccess('ListingsDatabase') && <MenuItem component={Link} to="/admin/listings-database" onClick={closeAllMenus}>Listings Database</MenuItem>}
              {hasAccess('SelectSeller') && <MenuItem component={Link} to="/admin/select-seller" onClick={closeAllMenus}>Add Template Listings</MenuItem>}
              {hasAccess('ListingDirectory') && <MenuItem component={Link} to="/admin/listing-directory" onClick={closeAllMenus}>Listing Directory</MenuItem>}
              {hasAccess('TemplateDirectory') && <MenuItem component={Link} to="/admin/template-directory" onClick={closeAllMenus}>Template Directory</MenuItem>}
            </Menu>
          </>
        )}

        {/* ASIN Importer */}
        {(hasAccess('AsinDirectory') || hasAccess('AsinLists')) ? (
          <>

            {/* ASIN Importer */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={(e) => setAsinImporterAnchorEl(e.currentTarget)}
                sx={{ justifyContent: 'space-between' }}
              >
                <ListItemIcon>
                  <NavIcon icon={ImportExportIcon} label="ASIN Importer" sidebarOpen={sidebarOpen} />
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary="ASIN Importer" />}
                {sidebarOpen && <ChevronRightIcon fontSize="small" />}
              </ListItemButton>
            </ListItem>

            <Menu
              anchorEl={asinImporterAnchorEl}
              open={Boolean(asinImporterAnchorEl)}
              onClose={() => setAsinImporterAnchorEl(null)}
              {...flyoutMenuPositionProps}
              sx={{ '& .MuiPaper-root': { minWidth: '220px' } }}
            >
              {hasAccess('AsinDirectory') && <MenuItem component={Link} to="/admin/asin-directory" onClick={closeAllMenus}>ASIN Directory</MenuItem>}
              {hasAccess('AsinLists') && <MenuItem component={Link} to="/admin/asin-lists" onClick={closeAllMenus}>ASIN Lists</MenuItem>}
            </Menu>

          </>
        ) : null}

        {/* Feed Upload */}
        {hasAccess('FeedUpload') && (
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/admin/feed-upload"
              onClick={() => setMobileOpen(false)}
              selected={location.pathname === '/admin/feed-upload'}
              sx={selectedMenuItemStyle}
            >
              <ListItemIcon>
                <NavIcon icon={CloudUploadIcon} label="Feed Upload" sidebarOpen={sidebarOpen} />
              </ListItemIcon>
              {sidebarOpen && <ListItemText primary="Feed Upload (CSV)" />}
            </ListItemButton>
          </ListItem>
        )}

        {/* CSV Storage */}
        {hasAccess('CsvStorage') && (
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/admin/csv-storage"
              onClick={() => setMobileOpen(false)}
              selected={location.pathname === '/admin/csv-storage'}
              sx={selectedMenuItemStyle}
            >
              <ListItemIcon>
                <NavIcon icon={StorageIcon} label="CSV Storage" sidebarOpen={sidebarOpen} />
              </ListItemIcon>
              {sidebarOpen && <ListItemText primary="CSV Storage" />}
            </ListItemButton>
          </ListItem>
        )}

        {/* Listing Dropdown with Monitoring Subdropdown */}
        {(hasAccess('SellingPrivileges') || hasAccess('EbayApiUsage') || hasAccess('SellerFunds') || hasAccess('ProductTable') || hasAccess('FeedUploadStats')) && (
          <>

            {/* Selling Privileges */}
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/admin/selling-privileges"
                onClick={() => setMobileOpen(false)}
                selected={location.pathname === '/admin/selling-privileges'}
                sx={selectedMenuItemStyle}
              >
                <ListItemIcon>
                  <NavIcon icon={InsightsIcon} label="Selling Privileges" sidebarOpen={sidebarOpen} />
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary="Selling Privileges" />}
              </ListItemButton>
            </ListItem>

            {/* eBay API Usage */}
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/admin/ebay-api-usage"
                onClick={() => setMobileOpen(false)}
                selected={location.pathname === '/admin/ebay-api-usage'}
                sx={selectedMenuItemStyle}
              >
                <ListItemIcon>
                  <NavIcon icon={BarChartIcon} label="eBay API Usage" sidebarOpen={sidebarOpen} />
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary="eBay API Usage" />}
              </ListItemButton>
            </ListItem>

            {/* Seller Funds */}
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/admin/seller-funds"
                onClick={() => setMobileOpen(false)}
                selected={location.pathname === '/admin/seller-funds'}
                sx={selectedMenuItemStyle}
              >
                <ListItemIcon>
                  <NavIcon icon={AccountBalanceIcon} label="Seller Funds" sidebarOpen={sidebarOpen} />
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary="Seller Funds" />}
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                onClick={(e) => setListingAnchorEl(e.currentTarget)}
                sx={{ justifyContent: 'space-between' }}
              >
                <ListItemIcon>
                  <NavIcon icon={ListAltIcon} label="Listing Management" sidebarOpen={sidebarOpen} />
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary="Listing" />}
                {sidebarOpen && <ChevronRightIcon fontSize="small" />}
              </ListItemButton>
            </ListItem>

            {/* Sideways flyout menu */}
            <Menu
              anchorEl={listingAnchorEl}
              open={Boolean(listingAnchorEl)}
              onClose={() => { setListingAnchorEl(null); setMonitoringAnchorEl(null); }}
              {...flyoutMenuPositionProps}
              sx={{ '& .MuiPaper-root': { minWidth: '220px' } }}
            >
              {hasAccess('ProductTable') && <MenuItem component={Link} to="/admin/listing" onClick={closeAllMenus}>Product Table</MenuItem>}
              {hasAccess('FeedUpload') && <MenuItem component={Link} to="/admin/feed-upload" onClick={closeAllMenus}>Feed Upload (CSV)</MenuItem>}
              {hasAccess('FeedUploadStats') && <MenuItem component={Link} to="/admin/feed-upload-stats" onClick={closeAllMenus}>Feed Upload Stats</MenuItem>}
              <MenuItem
                onMouseEnter={(e) => setMonitoringAnchorEl(e.currentTarget)}
                onMouseLeave={() => setMonitoringAnchorEl(null)}
                sx={{ display: 'flex', justifyContent: 'space-between' }}
              >
                Monitoring <ExpandMore sx={{ transform: 'rotate(-90deg)', ml: 1 }} />
              </MenuItem>
            </Menu>

            {/* Nested Monitoring flyout menu */}
            <Menu
              anchorEl={monitoringAnchorEl}
              open={Boolean(monitoringAnchorEl)}
              onClose={() => setMonitoringAnchorEl(null)}
              {...flyoutMenuPositionProps}
              MenuListProps={{
                onMouseEnter: () => monitoringAnchorEl && setMonitoringAnchorEl(monitoringAnchorEl),
                onMouseLeave: () => setMonitoringAnchorEl(null),
              }}
              sx={{ pointerEvents: 'none', '& .MuiPaper-root': { pointerEvents: 'auto', minWidth: '220px', maxHeight: '80vh' } }}
            >
              {hasAccess('TaskList') && <MenuItem component={Link} to="/admin/task-list" onClick={closeAllMenus}>Task List</MenuItem>}
              {hasAccess('Assignments') && <MenuItem component={Link} to="/admin/assignments" onClick={closeAllMenus}>Assignments</MenuItem>}
              {hasAccess('ListingsSummary') && <MenuItem component={Link} to="/admin/listings-summary" onClick={closeAllMenus}>Listings Summary</MenuItem>}
              {hasAccess('ListingSheet') && <MenuItem component={Link} to="/admin/listing-sheet" onClick={closeAllMenus}>Listing Sheet</MenuItem>}
              {hasAccess('StoreWiseTasks') && <MenuItem component={Link} to="/admin/store-wise-tasks" onClick={closeAllMenus}>Store-Wise Tasks</MenuItem>}
              {hasAccess('StoreDailyTasks') && <MenuItem component={Link} to="/admin/store-daily-tasks" onClick={closeAllMenus}>Store Daily Tasks</MenuItem>}
              {hasAccess('ListerInfo') && <MenuItem component={Link} to="/admin/lister-info" onClick={closeAllMenus}>Lister Info</MenuItem>}
              {hasAccess('RangeAnalyzer') && <MenuItem component={Link} to="/admin/range-analyzer" onClick={closeAllMenus}>Range Analyzer</MenuItem>}
            </Menu>
          </>
        )}

        {/* Compatibility Dropdown */}
        {(hasAccess('CompatibilityTasks') || hasAccess('CompatibilityProgress') || hasAccess('AiFitmentUsage') || hasAccess('ListingStats') || hasAccess('CompatibilityBatchHistory')) && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={(e) => setCompatAnchorEl(e.currentTarget)}
                sx={{ justifyContent: 'space-between' }}
              >
                <ListItemIcon>
                  <NavIcon icon={TaskIcon} label="Compatibility Management" sidebarOpen={sidebarOpen} />
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary="Compatibility" />}
                {sidebarOpen && <ChevronRightIcon fontSize="small" />}
              </ListItemButton>
            </ListItem>

            {/* Sideways flyout menu */}
            <Menu
              anchorEl={compatAnchorEl}
              open={Boolean(compatAnchorEl)}
              onClose={() => setCompatAnchorEl(null)}
              {...flyoutMenuPositionProps}
              sx={{ '& .MuiPaper-root': { minWidth: '220px' } }}
            >
              {hasAccess('CompatibilityTasks') && <MenuItem component={Link} to="/admin/compatibility-tasks" onClick={closeAllMenus}>Compatibility Tasks</MenuItem>}
              {hasAccess('CompatibilityProgress') && <MenuItem component={Link} to="/admin/compatibility-progress" onClick={closeAllMenus}>Progress Tracking</MenuItem>}
              {hasAccess('AiFitmentUsage') && <MenuItem component={Link} to="/admin/ai-fitment-usage" onClick={closeAllMenus}>AI Fitment Usage</MenuItem>}
              {hasAccess('ListingStats') && <MenuItem component={Link} to="/admin/listing-stats" onClick={closeAllMenus}>Listing Statistics</MenuItem>}
              {hasAccess('CompatibilityBatchHistory') && <MenuItem component={Link} to="/admin/compatibility-batch-history" onClick={closeAllMenus}>Batch History</MenuItem>}
            </Menu>
          </>
        )}

        {hasAccess('CompatibilityDashboard') && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/admin/compatibility-dashboard"
                onClick={() => setMobileOpen(false)}
                selected={location.pathname === '/admin/compatibility-dashboard'}
                sx={selectedMenuItemStyle}
              >
                <ListItemIcon>
                  <NavIcon icon={DashboardIcon} label="Compatibility Dashboard" sidebarOpen={sidebarOpen} />
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary="Compat. Dashboard" />}
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/admin/edit-listings"
                onClick={() => setMobileOpen(false)}
                selected={location.pathname === '/admin/edit-listings'}
                sx={selectedMenuItemStyle}
              >
                <ListItemIcon>
                  <NavIcon icon={EditIcon} label="Edit Listings" sidebarOpen={sidebarOpen} />
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary="Edit Listings" />}
              </ListItemButton>
            </ListItem>
          </>
        )}

        {/* Orders Dept Dropdown */}
        {(hasAccess('OrdersDashboard') || hasAccess('FulfillmentDashboard') || hasAccess('Disputes')) && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={(e) => setOrdersAnchorEl(e.currentTarget)}
                sx={{ justifyContent: 'space-between' }}
              >
                <ListItemIcon>
                  <NavIcon icon={LocalShippingIcon} label="Orders & Fulfillment" sidebarOpen={sidebarOpen} />
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary="Orders Dept" />}
                {sidebarOpen && <ChevronRightIcon fontSize="small" />}
              </ListItemButton>
            </ListItem>

            {/* Sideways flyout menu */}
            <Menu
              anchorEl={ordersAnchorEl}
              open={Boolean(ordersAnchorEl)}
              onClose={() => setOrdersAnchorEl(null)}
              {...flyoutMenuPositionProps}
              sx={{ '& .MuiPaper-root': { minWidth: '220px', maxHeight: '80vh' } }}
            >
              {hasAccess('OrdersDashboard') && <MenuItem component={Link} to="/admin/orders-dashboard" onClick={closeAllMenus}>Orders Dashboard</MenuItem>}
              {hasAccess('OrderAnalytics') && <MenuItem component={Link} to="/admin/order-analytics" onClick={closeAllMenus}>Order Analytics</MenuItem>}
              {hasAccess('SellerAnalytics') && <MenuItem component={Link} to="/admin/seller-analytics" onClick={closeAllMenus}>Seller Analytics</MenuItem>}
              {hasAccess('FulfillmentDashboard') && <MenuItem component={Link} to="/admin/fulfillment" onClick={closeAllMenus}>All Orders</MenuItem>}
              {hasAccess('AllOrdersSheet') && <MenuItem component={Link} to="/admin/all-orders-sheet" onClick={closeAllMenus}>All Orders Sheet (USD)</MenuItem>}
              {hasAccess('AwaitingShipment') && <MenuItem component={Link} to="/admin/awaiting-shipment" onClick={closeAllMenus}>Awaiting Shipment</MenuItem>}
              {hasAccess('AwaitingSheet') && <MenuItem component={Link} to="/admin/awaiting-sheet" onClick={closeAllMenus}>Awaiting Sheet</MenuItem>}
              {hasAccess('AmazonArrivals') && <MenuItem component={Link} to="/admin/amazon-arrivals" onClick={closeAllMenus}>Amazon Arrivals</MenuItem>}
              {hasAccess('FulfillmentNotes') && <MenuItem component={Link} to="/admin/fulfillment-notes" onClick={closeAllMenus}>Fulfillment Notes</MenuItem>}
              {hasAccess('Disputes') && <MenuItem component={Link} to="/admin/disputes" onClick={closeAllMenus}>Issues and Resolutions</MenuItem>}
              {hasAccess('AccountHealth') && <MenuItem component={Link} to="/admin/account-health" onClick={closeAllMenus}>Account Health Report</MenuItem>}
              {hasAccess('MessageReceived') && <MenuItem component={Link} to="/admin/message-received" onClick={closeAllMenus}>Buyer Messages</MenuItem>}
              {hasAccess('ConversationManagement') && <MenuItem component={Link} to="/admin/conversation-management" onClick={closeAllMenus}>Conversation Mgmt</MenuItem>}
              {hasAccess('AmazonAccounts') && <MenuItem component={Link} to="/admin/amazon-accounts" onClick={closeAllMenus}>Manage Amazon Accts</MenuItem>}
              {hasAccess('CreditCards') && <MenuItem component={Link} to="/admin/credit-cards" onClick={closeAllMenus}>Manage Credit Cards</MenuItem>}
              <Divider />
              {hasAccess('AffiliateOrders') && <MenuItem component={Link} to="/admin/affiliate-orders" onClick={closeAllMenus}>Affiliate Orders</MenuItem>}
            </Menu>
          </>
        )}

        {/* Manage Components Dropdown */}
        {(hasAccess('ManageCategories') || hasAccess('ManagePlatforms') || hasAccess('ManageStores')) && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={(e) => setManageAnchorEl(e.currentTarget)}
                sx={{ justifyContent: 'space-between' }}
              >
                <ListItemIcon><CategoryIcon /></ListItemIcon>
                {sidebarOpen && <ListItemText primary="Manage Components" />}
                {sidebarOpen && <ChevronRightIcon fontSize="small" />}
              </ListItemButton>
            </ListItem>

            {/* Sideways flyout menu */}
            <Menu
              anchorEl={manageAnchorEl}
              open={Boolean(manageAnchorEl)}
              onClose={() => setManageAnchorEl(null)}
              {...flyoutMenuPositionProps}
              sx={{ '& .MuiPaper-root': { minWidth: '220px' } }}
            >
              {hasAccess('ManageCategories') && <MenuItem component={Link} to="/admin/categories" onClick={closeAllMenus}>Manage Categories</MenuItem>}
              {hasAccess('ManagePlatforms') && <MenuItem component={Link} to="/admin/platforms" onClick={closeAllMenus}>Manage Platforms</MenuItem>}
              {hasAccess('ManageStores') && <MenuItem component={Link} to="/admin/stores" onClick={closeAllMenus}>Manage Stores</MenuItem>}
            </Menu>
          </>
        )}

        {hasAccess('ManageCategories') && !isSuper ? (
          <>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/admin/categories"
                onClick={() => setMobileOpen(false)}
                selected={location.pathname === '/admin/categories'}
                sx={selectedMenuItemStyle}
              >
                <ListItemIcon><CategoryIcon /></ListItemIcon>
                {sidebarOpen && <ListItemText primary="Manage Categories" />}
              </ListItemButton>
            </ListItem>
          </>
        ) : null}

        {hasAccess('AddUser') ? (
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/admin/add-user"
              onClick={() => setMobileOpen(false)}
              selected={location.pathname === '/admin/add-user'}
              sx={selectedMenuItemStyle}
            >
              <ListItemIcon><AddCircleIcon /></ListItemIcon>
              {sidebarOpen && <ListItemText primary="Add User" />}
            </ListItemButton>
          </ListItem>
        ) : null}

        {hasAccess('AddCompatibilityEditor') && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/admin/add-compatibility-editor"
                onClick={() => setMobileOpen(false)}
                selected={location.pathname === '/admin/add-compatibility-editor'}
                sx={selectedMenuItemStyle}
              >
                <ListItemIcon><AddCircleIcon /></ListItemIcon>
                {sidebarOpen && <ListItemText primary="Add Compatibility Editor" />}
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/admin/compatibility-tasks"
                onClick={() => setMobileOpen(false)}
                selected={location.pathname === '/admin/compatibility-tasks'}
                sx={selectedMenuItemStyle}
              >
                <ListItemIcon><TaskIcon /></ListItemIcon>
                {sidebarOpen && <ListItemText primary="Available Tasks" />}
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/admin/compatibility-progress"
                onClick={() => setMobileOpen(false)}
                selected={location.pathname === '/admin/compatibility-progress'}
                sx={selectedMenuItemStyle}
              >
                <ListItemIcon><InsightsIcon /></ListItemIcon>
                {sidebarOpen && <ListItemText primary="Progress Tracking" />}
              </ListItemButton>
            </ListItem>
          </>
        )}

        {hasAccess('CompatibilityEditor') && (
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/admin/compatibility-editor"
              onClick={() => setMobileOpen(false)}
              selected={location.pathname === '/admin/compatibility-editor'}
              sx={selectedMenuItemStyle}
            >
              <ListItemIcon><TaskIcon /></ListItemIcon>
              {sidebarOpen && <ListItemText primary="My Assignments" />}
            </ListItemButton>
          </ListItem>
        )}


        {/* Employee Management */}
        {hasAccess('EmployeeManagement') && (
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/admin/employee-management"
              onClick={() => setMobileOpen(false)}
              selected={location.pathname === '/admin/employee-management'}
              sx={selectedMenuItemStyle}
            >
              <ListItemIcon>
                <NavIcon icon={AdminPanelSettingsIcon} label="Employee Management" sidebarOpen={sidebarOpen} />
              </ListItemIcon>
              {sidebarOpen && <ListItemText primary="Employee Management" />}
            </ListItemButton>
          </ListItem>
        )}


        {/* User-Seller Assignments */}
        {hasAccess('UserSellerAssignments') && (
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/admin/user-seller-assignments"
              onClick={() => setMobileOpen(false)}
              selected={location.pathname === '/admin/user-seller-assignments'}
              sx={selectedMenuItemStyle}
            >
              <ListItemIcon>
                <NavIcon icon={AssignmentIcon} label="User-Seller Assignments" sidebarOpen={sidebarOpen} />
              </ListItemIcon>
              {sidebarOpen && <ListItemText primary="User-Seller Assignments" />}
            </ListItemButton>
          </ListItem>
        )}

        {/* User Performance - visible to ALL users */}
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/admin/user-performance"
            onClick={() => setMobileOpen(false)}
            selected={location.pathname === '/admin/user-performance'}
            sx={selectedMenuItemStyle}
          >
            <ListItemIcon>
              <NavIcon icon={TrendingUpIcon} label={isSuper || isHRAdmin || user?.role === 'hr' ? "User Performance Log" : "My Performance"} sidebarOpen={sidebarOpen} />
            </ListItemIcon>
            {sidebarOpen && <ListItemText primary={isSuper || isHRAdmin || user?.role === 'hr' ? "User Performance Log" : "My Performance"} />}
          </ListItemButton>
        </ListItem>

        {/* Leave Management - visible to ALL users for applying leaves */}
        {(!isSuper) && (<ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/admin/my-leaves"
            onClick={() => setMobileOpen(false)}
            selected={location.pathname === '/admin/my-leaves'}
            sx={selectedMenuItemStyle}
          >
            <ListItemIcon>
              <NavIcon icon={EventAvailableIcon} label="My Leave Requests" sidebarOpen={sidebarOpen} />
            </ListItemIcon>
            {sidebarOpen && <ListItemText primary="My Leaves" />}
          </ListItemButton>
        </ListItem>)}

        {/* Leave Admin */}
        {hasAccess('LeaveAdmin') && (
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/admin/leave-admin"
              onClick={() => setMobileOpen(false)}
              selected={location.pathname === '/admin/leave-admin'}
              sx={selectedMenuItemStyle}
            >
              <ListItemIcon>
                <NavIcon icon={AdminPanelSettingsIcon} label="Leave Management (Admin)" sidebarOpen={sidebarOpen} />
              </ListItemIcon>
              {sidebarOpen && <ListItemText primary="Leave Admin" />}
            </ListItemButton>
          </ListItem>
        )}

        {/* Employee Details */}
        {hasAccess('EmployeeDetails') && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to="/admin/employee-details"
                onClick={() => setMobileOpen(false)}
                selected={location.pathname === '/admin/employee-details'}
                sx={selectedMenuItemStyle}
              >
                <ListItemIcon>
                  <NavIcon icon={SupervisorAccountIcon} label="[Testing] Employee Details" sidebarOpen={sidebarOpen} />
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary="[Testing] Employee Details" />}
              </ListItemButton>
            </ListItem>
          </>
        )}

        {/* User Permissions - superadmin only */}
        {hasAccess('UserPermissions') && (
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/admin/user-permissions"
              onClick={() => setMobileOpen(false)}
              selected={location.pathname === '/admin/user-permissions'}
              sx={selectedMenuItemStyle}
            >
              <ListItemIcon>
                <NavIcon icon={SecurityIcon} label="User Permissions" sidebarOpen={sidebarOpen} />
              </ListItemIcon>
              {sidebarOpen && <ListItemText primary="User Permissions" />}
            </ListItemButton>
          </ListItem>
        )}

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
          <IconButton color="inherit" edge="start" onClick={() => setSidebarOpen((open) => !open)} sx={{ mr: 2, display: { xs: 'none', sm: 'inline-flex' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Admin Dashboard</Typography>
          <Button color="inherit" startIcon={<ChatIcon />} onClick={() => navigate('/admin/internal-messages')} sx={{ mr: 1 }}>
            Team Chat
          </Button>
          <Typography variant="body2" sx={{ mr: 2 }}>{user?.username} ({user?.role})</Typography>
          <Button color="inherit" onClick={onLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: sidebarOpen ? drawerWidth : 56 }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '3px',
                '&:hover': {
                  background: 'rgba(0, 0, 0, 0.3)',
                },
              },
            }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: sidebarOpen ? drawerWidth : 56,
              transition: 'width 0.2s',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '3px',
                '&:hover': {
                  background: 'rgba(0, 0, 0, 0.3)',
                },
              },
            }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${sidebarOpen ? drawerWidth : 56}px)` }, transition: 'width 0.2s' }}>
        <Toolbar />
        <Routes>
          {/* Universal routes */}
          <Route path="/ideas" element={guarded('Ideas', <IdeasPage />)} />
          <Route path="/about-me" element={guarded('AboutMe', <AboutMePage />)} />
          <Route path="/internal-messages" element={guarded('InternalMessages', <InternalMessagesPage />)} />
          <Route path="/user-performance" element={guarded('UserPerformance', <UserPerformancePage />)} />
          <Route path="/my-leaves" element={guarded('MyLeaves', <LeaveManagementPage />)} />

          {/* Product routes */}
          {hasAccess('ProductResearch') && <Route path="/research" element={guarded('ProductResearch', <ProductResearchPage />)} />}
          {hasAccess('ProductResearch') && <Route path="/ranges" element={guarded('ProductResearch', <ManageRangesPage />)} />}
          {hasAccess('ManageCategories') && <Route path="/categories" element={guarded('ManageCategories', <ManageCategoriesPage />)} />}
          {hasAccess('ProductResearch') && <Route path="/amazon-lookup" element={guarded('ProductResearch', <AmazonLookupPage />)} />}
          {hasAccess('ProductResearch') && <Route path="/product-umbrellas" element={guarded('ProductResearch', <ManageProductUmbrellasPage />)} />}
          {hasAccess('ProductResearch') && <Route path="/asin-storage" element={guarded('ProductResearch', <ASINStoragePage />)} />}
          {hasAccess('ProductResearch') && <Route path="/column-creator" element={guarded('ProductResearch', <ColumnCreatorPage />)} />}

          {/* ASIN Importer */}
          {hasAccess('AsinDirectory') && <Route path="/asin-directory" element={guarded('AsinDirectory', <AsinDirectoryPage />)} />}
          {hasAccess('AsinLists') && <Route path="/asin-lists" element={guarded('AsinLists', <AsinListPage />)} />}

          {/* Listing routes */}
          {hasAccess('ProductTable') && <Route path="/listing" element={guarded('ProductTable', <ListingManagementPage />)} />}
          {hasAccess('Assignments') && <Route path="/assignments" element={guarded('Assignments', <AdminAssignmentsPage />)} />}
          {hasAccess('TaskList') && <Route path="/task-list" element={guarded('TaskList', <TaskListPage />)} />}
          {hasAccess('ListingSheet') && <Route path="/listing-sheet" element={guarded('ListingSheet', <ListingSheetPage />)} />}
          {hasAccess('StoreWiseTasks') && <Route path="/store-wise-tasks" element={guarded('StoreWiseTasks', <StoreWiseTaskListPage />)} />}
          {hasAccess('StoreWiseTasks') && <Route path="/store-wise-tasks/details" element={guarded('StoreWiseTasks', <StoreTaskDetailPage />)} />}
          {hasAccess('StoreDailyTasks') && <Route path="/store-daily-tasks" element={guarded('StoreDailyTasks', <StoreDailyTasksPage />)} />}
          {hasAccess('ListerInfo') && <Route path="/lister-info" element={guarded('ListerInfo', <ListerInfoPage />)} />}
          {hasAccess('ListerInfo') && <Route path="/lister-info/details" element={guarded('ListerInfo', <ListerInfoDetailPage />)} />}
          {hasAccess('RangeAnalyzer') && <Route path="/range-analyzer" element={guarded('RangeAnalyzer', <RangeAnalyzerPage />)} />}
          {hasAccess('AddUser') && <Route path="/add-user" element={guarded('AddUser', <AddListerPage />)} />}
          {hasAccess('FeedUpload') && <Route path="/feed-upload" element={guarded('FeedUpload', <FeedUploadPage />)} />}
          {hasAccess('CsvStorage') && <Route path="/csv-storage" element={guarded('CsvStorage', <CsvStoragePage />)} />}
          {hasAccess('ManagePlatforms') && <Route path="/platforms" element={guarded('ManagePlatforms', <ManagePlatformsPage />)} />}
          {hasAccess('ManageStores') && <Route path="/stores" element={guarded('ManageStores', <ManageStoresPage />)} />}
          {hasAccess('ListingsSummary') && <Route path="/listings-summary" element={guarded('ListingsSummary', <ListingsSummaryPage />)} />}
          {hasAccess('SellingPrivileges') && <Route path="/selling-privileges" element={guarded('SellingPrivileges', <SellingPrivilegesPage />)} />}
          {hasAccess('EbayApiUsage') && <Route path="/ebay-api-usage" element={guarded('EbayApiUsage', <EbayApiUsagePage />)} />}
          {hasAccess('SellerFunds') && <Route path="/seller-funds" element={guarded('SellerFunds', <SellerFundsPage />)} />}
          {hasAccess('FeedUploadStats') && <Route path="/feed-upload-stats" element={guarded('FeedUploadStats', <FeedUploadStatsPage />)} />}

          {/* Finance / Superadmin routes */}
          {isSuper && <Route path="/user-credentials" element={<UserCredentialsPage />} />}
          {hasAccess('PayoneerSheet') && <Route path="/payoneer" element={guarded('PayoneerSheet', <PayoneerSheetPage />)} />}
          {hasAccess('BankAccounts') && <Route path="/bank-accounts" element={guarded('BankAccounts', <BankAccountsPage />)} />}
          {hasAccess('Transactions') && <Route path="/transactions" element={guarded('Transactions', <TransactionPage />)} />}
          {hasAccess('ExtraExpenses') && <Route path="/extra-expenses" element={guarded('ExtraExpenses', <ExtraExpensePage />)} />}
          {hasAccess('ManageTemplates') && <Route path="/manage-templates" element={guarded('ManageTemplates', <ManageTemplatesPage />)} />}
          {hasAccess('ListingsDatabase') && <Route path="/listings-database" element={guarded('ListingsDatabase', <TemplateDatabasePage />)} />}
          {hasAccess('Salary') && <Route path="/salary" element={guarded('Salary', <SalaryPage />)} />}

          {/* Template Listing routes */}
          {hasAccess('SelectSeller') && <Route path="/template-listings" element={guarded('SelectSeller', <TemplateListingsPage />)} />}
          {hasAccess('ListingDirectory') && <Route path="/listing-directory" element={guarded('ListingDirectory', <ListingDirectoryPage />)} />}
          {hasAccess('TemplateDirectory') && <Route path="/template-directory" element={guarded('TemplateDirectory', <TemplateDirectoryPage />)} />}
          {hasAccess('SelectSeller') && <Route path="/template-listing-analytics" element={guarded('SelectSeller', <TemplateListingAnalyticsPage />)} />}
          {hasAccess('SelectSeller') && <Route path="/select-seller" element={guarded('SelectSeller', <SelectSellerPage />)} />}
          {hasAccess('SelectSeller') && <Route path="/seller-templates" element={guarded('SelectSeller', <SellerTemplatesPage />)} />}

          {/* HR routes */}
          {hasAccess('EmployeeDetails') && <Route path="/employee-details" element={guarded('EmployeeDetails', <EmployeeDetailsPage />)} />}
          {hasAccess('EmployeeManagement') && <Route path="/employee-management" element={guarded('EmployeeManagement', <EmployeeManagementPage />)} />}
          {hasAccess('LeaveAdmin') && <Route path="/leave-admin" element={guarded('LeaveAdmin', <LeaveAdminPage />)} />}
          {hasAccess('UserSellerAssignments') && <Route path="/user-seller-assignments" element={guarded('UserSellerAssignments', <UserSellerAssignmentPage />)} />}

          {/* Compatibility routes */}
          {hasAccess('AddCompatibilityEditor') && <Route path="/add-compatibility-editor" element={guarded('AddCompatibilityEditor', <AddListerPage />)} />}
          {hasAccess('CompatibilityTasks') && <Route path="/compatibility-tasks" element={guarded('CompatibilityTasks', <AdminTaskList />)} />}
          {hasAccess('CompatibilityProgress') && <Route path="/compatibility-progress" element={guarded('CompatibilityProgress', <ProgressTrackingPage />)} />}
          {hasAccess('AiFitmentUsage') && <Route path="/ai-fitment-usage" element={guarded('AiFitmentUsage', <AiFitmentUsagePage />)} />}
          {hasAccess('ListingStats') && <Route path="/listing-stats" element={guarded('ListingStats', <ListingStatsPage />)} />}
          {hasAccess('CompatibilityEditor') && <Route path="/compatibility-editor" element={guarded('CompatibilityEditor', <EditorDashboard />)} />}
          {hasAccess('CompatibilityDashboard') && <Route path="/compatibility-dashboard" element={guarded('CompatibilityDashboard', <CompatibilityDashboard />)} />}
          {hasAccess('CompatibilityBatchHistory') && <Route path="/compatibility-batch-history" element={guarded('CompatibilityBatchHistory', <CompatibilityBatchHistoryPage />)} />}
          {hasAccess('EditListings') && <Route path="/edit-listings" element={guarded('EditListings', <EditListingsDashboard />)} />}

          {/* Orders Dept routes */}
          {hasAccess('OrdersDashboard') && <Route path="/orders-dashboard" element={guarded('OrdersDashboard', <OrdersDepartmentDashboardPage />)} />}
          {hasAccess('OrderAnalytics') && <Route path="/order-analytics" element={guarded('OrderAnalytics', <OrderAnalyticsPage />)} />}
          {hasAccess('Disputes') && <Route path="/worksheet" element={guarded('Disputes', <DisputesPage initialTab={4} />)} />}
          {hasAccess('SellerAnalytics') && <Route path="/seller-analytics" element={guarded('SellerAnalytics', <SellerAnalyticsPage />)} />}
          {hasAccess('FulfillmentDashboard') && <Route path="/fulfillment" element={guarded('FulfillmentDashboard', <FulfillmentDashboard />)} />}
          {hasAccess('AllOrdersSheet') && <Route path="/all-orders-sheet" element={guarded('AllOrdersSheet', <AllOrdersSheetPage />)} />}
          {hasAccess('AwaitingShipment') && <Route path="/awaiting-shipment" element={guarded('AwaitingShipment', <AwaitingShipmentPage />)} />}
          {hasAccess('AwaitingSheet') && <Route path="/awaiting-sheet" element={guarded('AwaitingSheet', <AwaitingSheetPage />)} />}
          {hasAccess('AmazonArrivals') && <Route path="/amazon-arrivals" element={guarded('AmazonArrivals', <AmazonArrivalsPage />)} />}
          {hasAccess('FulfillmentNotes') && <Route path="/fulfillment-notes" element={guarded('FulfillmentNotes', <FulfillmentNotesPage />)} />}
          {hasAccess('FulfillmentDashboard') && <Route path="/conversation-tracking" element={guarded('FulfillmentDashboard', <ConversationTrackingPage />)} />}
          {hasAccess('Disputes') && <Route path="/cancelled-status" element={guarded('Disputes', <DisputesPage initialTab={3} />)} />}
          {hasAccess('Disputes') && <Route path="/return-requested" element={guarded('Disputes', <DisputesPage initialTab={2} />)} />}
          {hasAccess('Disputes') && <Route path="/disputes" element={guarded('Disputes', <DisputesPage />)} />}
          {hasAccess('AccountHealth') && <Route path="/account-health" element={guarded('AccountHealth', <AccountHealthReportPage />)} />}
          {hasAccess('MessageReceived') && <Route path="/message-received" element={guarded('MessageReceived', <BuyerChatPage />)} />}
          {hasAccess('ConversationManagement') && <Route path="/conversation-management" element={guarded('ConversationManagement', <ConversationManagementPage />)} />}
          {hasAccess('AmazonAccounts') && <Route path="/amazon-accounts" element={guarded('AmazonAccounts', <ManageAmazonAccountsPage />)} />}
          {hasAccess('CreditCards') && <Route path="/credit-cards" element={guarded('CreditCards', <ManageCreditCardsPage />)} />}
          {hasAccess('CreditCardNames') && <Route path="/credit-card-names" element={guarded('CreditCardNames', <ManageCreditCardNamesPage />)} />}
          {hasAccess('AffiliateOrders') && <Route path="/affiliate-orders" element={guarded('AffiliateOrders', <AffiliateOrdersPage />)} />}

          {/* Superadmin-only */}
          {hasAccess('InternalMessagesAdmin') && <Route path="/internal-messages-admin" element={<InternalMessagesAdminPage />} />}
          {hasAccess('Attendance') && <Route path="/attendance" element={<AttendanceAdminPage />} />}
          {hasAccess('UserPermissions') && <Route path="/user-permissions" element={<UserPermissionsPage user={user} />} />}

          {/* Default redirect (keeps existing role-based logic for landing page) */}
          <Route path="*" element={<Navigate to={
            isProductAdmin || isSuper ? "/admin/research" :
              isListingAdmin ? "/admin/listing" :
                isCompatibilityAdmin ? "/admin/compatibility-tasks" :
                  isCompatibilityEditor ? "/admin/compatibility-editor" :
                    (isFulfillmentAdmin || isHOC || isComplianceManager) ? "/admin/fulfillment" :
                      isHRAdmin || isOperationHead ? "/admin/employee-details" :
                        "/admin/about-me"
          } replace />} />
        </Routes>
      </Box>
    </Box>
  );
}
