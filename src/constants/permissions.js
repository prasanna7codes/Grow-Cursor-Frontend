/**
 * Permission Constants (Frontend Mirror)
 * 
 * This mirrors the backend permissionConstants.js.
 * Used for sidebar visibility checks and route guards.
 */

export const PERMISSIONS = {
    // Finance
    PAYONEER_SHEET: 'payoneer_sheet',
    BANK_ACCOUNTS: 'bank_accounts',
    TRANSACTIONS: 'transactions',
    EXTRA_EXPENSES: 'extra_expenses',
    CREDIT_CARD_NAMES: 'credit_card_names',

    // Product Research & Management
    PRODUCT_RESEARCH: 'product_research',
    AMAZON_LOOKUP: 'amazon_lookup',
    MANAGE_TEMPLATES: 'manage_templates',
    LISTINGS_DATABASE: 'listings_database',
    PRODUCT_UMBRELLAS: 'product_umbrellas',
    ASIN_STORAGE: 'asin_storage',
    ASIN_DIRECTORY: 'asin_directory',
    COLUMN_CREATOR: 'column_creator',

    // Listing Management
    LISTING_MANAGEMENT: 'listing_management',
    ASSIGNMENTS: 'assignments',
    TASK_LIST: 'task_list',
    LISTING_SHEET: 'listing_sheet',
    STORE_WISE_TASKS: 'store_wise_tasks',
    STORE_DAILY_TASKS: 'store_daily_tasks',
    LISTER_INFO: 'lister_info',
    RANGE_ANALYZER: 'range_analyzer',
    LISTINGS_SUMMARY: 'listings_summary',
    SELLING_PRIVILEGES: 'selling_privileges',
    EBAY_API_USAGE: 'ebay_api_usage',
    MANAGE_PLATFORMS: 'manage_platforms',
    MANAGE_STORES: 'manage_stores',
    MANAGE_CATEGORIES: 'manage_categories',
    MANAGE_RANGES: 'manage_ranges',
    FEED_UPLOAD: 'feed_upload',

    // Template Listings
    ADD_TEMPLATE_LISTINGS: 'add_template_listings',
    TEMPLATE_LISTINGS: 'template_listings',
    TEMPLATE_LISTING_ANALYTICS: 'template_listing_analytics',
    SELECT_SELLER: 'select_seller',
    SELLER_TEMPLATES: 'seller_templates',

    // Compatibility
    COMPATIBILITY_TASKS: 'compatibility_tasks',
    COMPATIBILITY_PROGRESS: 'compatibility_progress',
    COMPATIBILITY_DASHBOARD: 'compatibility_dashboard',
    EDIT_LISTINGS: 'edit_listings',
    COMPATIBILITY_EDITOR: 'compatibility_editor',
    ADD_COMPATIBILITY_EDITOR: 'add_compatibility_editor',

    // Orders / Fulfillment
    ORDERS_DASHBOARD: 'orders_dashboard',
    ORDER_ANALYTICS: 'order_analytics',
    SELLER_ANALYTICS: 'seller_analytics',
    FULFILLMENT: 'fulfillment',
    ALL_ORDERS_SHEET: 'all_orders_sheet',
    AWAITING_SHIPMENT: 'awaiting_shipment',
    AWAITING_SHEET: 'awaiting_sheet',
    AMAZON_ARRIVALS: 'amazon_arrivals',
    FULFILLMENT_NOTES: 'fulfillment_notes',
    DISPUTES: 'disputes',
    ACCOUNT_HEALTH: 'account_health',
    BUYER_MESSAGES: 'buyer_messages',
    CONVERSATION_MANAGEMENT: 'conversation_management',
    AMAZON_ACCOUNTS: 'amazon_accounts',
    CREDIT_CARDS: 'credit_cards',
    CONVERSATION_TRACKING: 'conversation_tracking',

    // HR / Employee
    ADD_USER: 'add_user',
    USER_CREDENTIALS: 'user_credentials',
    EMPLOYEE_DETAILS: 'employee_details',
    EMPLOYEE_MANAGEMENT: 'employee_management',
    LEAVE_ADMIN: 'leave_admin',
    WORKING_HOURS_TRACKING: 'working_hours_tracking',
    VIEW_ALL_MESSAGES: 'view_all_messages',

    // Admin
    MANAGE_PERMISSIONS: 'manage_permissions',

    // Other
    SELLER_PROFILE: 'seller_profile',
    LISTER_DASHBOARD: 'lister_dashboard',
};

/**
 * Check if a user has a given permission.
 * Superadmin always returns true.
 * @param {Object} user - The user object with { role, permissions }
 * @param  {...string} perms - One or more permission keys to check (OR logic)
 * @returns {boolean}
 */
export function hasPermission(user, ...perms) {
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    const userPerms = user.permissions || [];
    return perms.some(p => userPerms.includes(p));
}

/**
 * Check if a user has ANY of the given permissions (alias for hasPermission).
 */
export const hasAnyPermission = hasPermission;
