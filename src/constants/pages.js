/**
 * Central Page Registry
 * 
 * This is the single source of truth for all configurable pages in the admin dashboard.
 * 
 * When adding a new page:
 * 1. Add an entry here with { id, name, path, group, defaultRoles }
 * 2. The page will automatically appear in the sidebar (via AdminLayout) and
 *    in the super admin's permission management UI.
 * 
 * Fields:
 * - id: Unique identifier (used in pagePermissions and usePermissions hook)
 * - name: Human-readable display name shown in sidebar and permission UI
 * - path: Route path relative to /admin/ (e.g. 'research' → /admin/research)
 * - group: Sidebar group for organizing. null = top-level item
 * - defaultRoles: Roles that have access by default. ['*'] = all authenticated users.
 *                 Superadmin always has access regardless of this setting.
 */

export const PAGE_REGISTRY = [
  // ── Universal Pages (all users) ───────────────────────────────────────
  { id: 'Ideas', name: 'Ideas & Issues', path: 'ideas', group: null, defaultRoles: ['*'] },
  { id: 'AboutMe', name: 'About Me', path: 'about-me', group: null, defaultRoles: ['*'] },
  { id: 'InternalMessages', name: 'Team Chat', path: 'internal-messages', group: null, defaultRoles: ['*'] },
  { id: 'UserPerformance', name: 'User Performance', path: 'user-performance', group: null, defaultRoles: ['*'] },
  { id: 'MyLeaves', name: 'My Leaves', path: 'my-leaves', group: null, defaultRoles: ['*'] },

  // ── Finance (superadmin only by default) ──────────────────────────────
  { id: 'PayoneerSheet', name: 'Payoneer Sheet', path: 'payoneer', group: 'Finance', defaultRoles: ['superadmin'] },
  { id: 'BankAccounts', name: 'Bank Accounts', path: 'bank-accounts', group: 'Finance', defaultRoles: ['superadmin'] },
  { id: 'Transactions', name: 'Transactions', path: 'transactions', group: 'Finance', defaultRoles: ['superadmin'] },
  { id: 'ExtraExpenses', name: 'Extra Expenses', path: 'extra-expenses', group: 'Finance', defaultRoles: ['superadmin'] },
  { id: 'CreditCardNames', name: 'Credit Card Names', path: 'credit-card-names', group: 'Finance', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },
  { id: 'Salary', name: 'Salary Page', path: 'salary', group: 'Finance', defaultRoles: ['superadmin'] },

  // ── Superadmin-only standalone ─────────────────────────────────────────
  { id: 'InternalMessagesAdmin', name: 'View All Messages', path: 'internal-messages-admin', group: null, defaultRoles: ['superadmin'] },
  { id: 'Attendance', name: 'Working Hours Tracking', path: 'attendance', group: null, defaultRoles: ['superadmin'] },

  // ── Product (productadmin, superadmin) ─────────────────────────────────
  { id: 'ProductResearch', name: 'Product Research', path: 'research', group: 'Product', defaultRoles: ['superadmin', 'productadmin'] },

  // ── Template Listing (superadmin + listers) ────────────────────────────
  { id: 'ManageTemplates', name: 'Manage Templates', path: 'manage-templates', group: 'Template Listing', defaultRoles: ['superadmin'] },
  { id: 'ListingsDatabase', name: 'Listings Database', path: 'listings-database', group: 'Template Listing', defaultRoles: ['superadmin'] },
  { id: 'SelectSeller', name: 'Add Template Listings', path: 'select-seller', group: 'Template Listing', defaultRoles: ['superadmin', 'lister', 'advancelister', 'trainee'] },
  { id: 'ListingDirectory', name: 'Listing Directory', path: 'listing-directory', group: 'Template Listing', defaultRoles: ['superadmin', 'lister', 'advancelister', 'trainee'] },
  { id: 'TemplateDirectory', name: 'Template Directory', path: 'template-directory', group: 'Template Listing', defaultRoles: ['superadmin', 'lister', 'advancelister', 'trainee'] },

  // ── ASIN Importer (superadmin only) ────────────────────────────────────
  { id: 'AsinDirectory', name: 'ASIN Directory', path: 'asin-directory', group: 'ASIN Importer', defaultRoles: ['superadmin', 'productadmin'] },
  { id: 'AsinLists', name: 'ASIN Lists', path: 'asin-lists', group: 'ASIN Importer', defaultRoles: ['superadmin', 'productadmin'] },

  // ── Feed Upload / CSV ──────────────────────────────────────────────────
  { id: 'FeedUpload', name: 'Feed Upload (CSV)', path: 'feed-upload', group: null, defaultRoles: ['superadmin', 'listingadmin', 'lister'] },
  { id: 'CsvStorage', name: 'CSV Storage', path: 'csv-storage', group: null, defaultRoles: ['superadmin', 'listingadmin', 'lister'] },

  // ── Listing (listingadmin, superadmin) ──────────────────────────────────
  { id: 'SellingPrivileges', name: 'Selling Privileges', path: 'selling-privileges', group: null, defaultRoles: ['superadmin', 'listingadmin'] },
  { id: 'EbayApiUsage', name: 'eBay API Usage', path: 'ebay-api-usage', group: null, defaultRoles: ['superadmin', 'listingadmin'] },
  { id: 'SellerFunds', name: 'Seller Funds', path: 'seller-funds', group: null, defaultRoles: ['superadmin', 'listingadmin'] },

  // ── Listing Flyout ─────────────────────────────────────────────────────
  { id: 'ProductTable', name: 'Product Table', path: 'listing', group: 'Listing', defaultRoles: ['superadmin', 'listingadmin'] },
  { id: 'FeedUploadStats', name: 'Feed Upload Stats', path: 'feed-upload-stats', group: 'Listing', defaultRoles: ['superadmin', 'listingadmin'] },

  // ── Monitoring (nested under Listing) ──────────────────────────────────
  { id: 'TaskList', name: 'Task List', path: 'task-list', group: 'Monitoring', defaultRoles: ['superadmin', 'listingadmin'] },
  { id: 'Assignments', name: 'Assignments', path: 'assignments', group: 'Monitoring', defaultRoles: ['superadmin', 'listingadmin'] },
  { id: 'ListingsSummary', name: 'Listings Summary', path: 'listings-summary', group: 'Monitoring', defaultRoles: ['superadmin', 'listingadmin'] },
  { id: 'ListingSheet', name: 'Listing Sheet', path: 'listing-sheet', group: 'Monitoring', defaultRoles: ['superadmin', 'listingadmin'] },
  { id: 'StoreWiseTasks', name: 'Store-Wise Tasks', path: 'store-wise-tasks', group: 'Monitoring', defaultRoles: ['superadmin', 'listingadmin'] },
  { id: 'StoreDailyTasks', name: 'Store Daily Tasks', path: 'store-daily-tasks', group: 'Monitoring', defaultRoles: ['superadmin', 'listingadmin'] },
  { id: 'ListerInfo', name: 'Lister Info', path: 'lister-info', group: 'Monitoring', defaultRoles: ['superadmin', 'listingadmin'] },
  { id: 'RangeAnalyzer', name: 'Range Analyzer', path: 'range-analyzer', group: 'Monitoring', defaultRoles: ['superadmin', 'listingadmin'] },

  // ── Compatibility ──────────────────────────────────────────────────────
  { id: 'CompatibilityTasks', name: 'Compatibility Tasks', path: 'compatibility-tasks', group: 'Compatibility', defaultRoles: ['superadmin', 'compatibilityadmin'] },
  { id: 'CompatibilityProgress', name: 'Progress Tracking', path: 'compatibility-progress', group: 'Compatibility', defaultRoles: ['superadmin', 'compatibilityadmin'] },
  { id: 'AiFitmentUsage', name: 'AI Fitment Usage', path: 'ai-fitment-usage', group: 'Compatibility', defaultRoles: ['superadmin', 'compatibilityadmin'] },
  { id: 'ListingStats', name: 'Listing Statistics', path: 'listing-stats', group: 'Compatibility', defaultRoles: ['superadmin', 'compatibilityadmin'] },
  { id: 'CompatibilityBatchHistory', name: 'Batch History', path: 'compatibility-batch-history', group: 'Compatibility', defaultRoles: ['superadmin', 'compatibilityadmin', 'compatibilityeditor'] },
  { id: 'CompatibilityDashboard', name: 'Compat. Dashboard', path: 'compatibility-dashboard', group: null, defaultRoles: ['superadmin', 'compatibilityadmin', 'compatibilityeditor'] },
  { id: 'EditListings', name: 'Edit Listings', path: 'edit-listings', group: null, defaultRoles: ['superadmin', 'compatibilityadmin', 'compatibilityeditor'] },
  { id: 'CompatibilityEditor', name: 'My Assignments', path: 'compatibility-editor', group: null, defaultRoles: ['compatibilityeditor'] },

  // ── Orders Dept ────────────────────────────────────────────────────────
  { id: 'OrdersDashboard', name: 'Orders Dashboard', path: 'orders-dashboard', group: 'Orders Dept', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },
  { id: 'OrderAnalytics', name: 'Order Analytics', path: 'order-analytics', group: 'Orders Dept', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },
  { id: 'SellerAnalytics', name: 'Seller Analytics', path: 'seller-analytics', group: 'Orders Dept', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },
  { id: 'FulfillmentDashboard', name: 'All Orders', path: 'fulfillment', group: 'Orders Dept', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },
  { id: 'AllOrdersSheet', name: 'All Orders Sheet (USD)', path: 'all-orders-sheet', group: 'Orders Dept', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },
  { id: 'AwaitingShipment', name: 'Awaiting Shipment', path: 'awaiting-shipment', group: 'Orders Dept', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },
  { id: 'AwaitingSheet', name: 'Awaiting Sheet', path: 'awaiting-sheet', group: 'Orders Dept', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },
  { id: 'AmazonArrivals', name: 'Amazon Arrivals', path: 'amazon-arrivals', group: 'Orders Dept', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },
  { id: 'FulfillmentNotes', name: 'Fulfillment Notes', path: 'fulfillment-notes', group: 'Orders Dept', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },
  { id: 'Disputes', name: 'Issues and Resolutions', path: 'disputes', group: 'Orders Dept', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },
  { id: 'AccountHealth', name: 'Account Health Report', path: 'account-health', group: 'Orders Dept', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },
  { id: 'MessageReceived', name: 'Buyer Messages', path: 'message-received', group: 'Orders Dept', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },
  { id: 'ConversationManagement', name: 'Conversation Mgmt', path: 'conversation-management', group: 'Orders Dept', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },
  { id: 'AmazonAccounts', name: 'Manage Amazon Accts', path: 'amazon-accounts', group: 'Orders Dept', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },
  { id: 'CreditCards', name: 'Manage Credit Cards', path: 'credit-cards', group: 'Orders Dept', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },
  { id: 'AffiliateOrders', name: 'Affiliate Orders', path: 'affiliate-orders', group: 'Orders Dept', defaultRoles: ['superadmin', 'fulfillmentadmin', 'hoc', 'compliancemanager'] },

  // ── Manage Components (superadmin only) ────────────────────────────────
  { id: 'ManageCategories', name: 'Manage Categories', path: 'categories', group: 'Manage Components', defaultRoles: ['superadmin', 'productadmin'] },
  { id: 'ManagePlatforms', name: 'Manage Platforms', path: 'platforms', group: 'Manage Components', defaultRoles: ['superadmin', 'listingadmin'] },
  { id: 'ManageStores', name: 'Manage Stores', path: 'stores', group: 'Manage Components', defaultRoles: ['superadmin', 'listingadmin'] },

  // ── User Management ────────────────────────────────────────────────────
  { id: 'AddUser', name: 'Add User', path: 'add-user', group: null, defaultRoles: ['superadmin', 'listingadmin', 'hradmin', 'operationhead'] },
  { id: 'AddCompatibilityEditor', name: 'Add Compatibility Editor', path: 'add-compatibility-editor', group: null, defaultRoles: ['superadmin', 'compatibilityadmin'] },

  // ── HR / Employee ──────────────────────────────────────────────────────
  { id: 'EmployeeManagement', name: 'Employee Management', path: 'employee-management', group: null, defaultRoles: ['superadmin', 'hradmin'] },
  { id: 'UserSellerAssignments', name: 'User-Seller Assignments', path: 'user-seller-assignments', group: null, defaultRoles: ['superadmin', 'hradmin', 'hr'] },
  { id: 'LeaveAdmin', name: 'Leave Admin', path: 'leave-admin', group: null, defaultRoles: ['superadmin', 'hradmin'] },
  { id: 'EmployeeDetails', name: 'Employee Details', path: 'employee-details', group: null, defaultRoles: ['superadmin', 'hradmin', 'operationhead'] },

  // ── Super Admin Only ───────────────────────────────────────────────────
  { id: 'UserPermissions', name: 'User Permissions', path: 'user-permissions', group: null, defaultRoles: ['superadmin'] },
];

// Lookup map for O(1) access by page ID
export const PAGE_MAP = Object.fromEntries(PAGE_REGISTRY.map(p => [p.id, p]));

// Get unique groups (non-null) in registry order
export const PAGE_GROUPS = [...new Set(PAGE_REGISTRY.map(p => p.group).filter(Boolean))];
