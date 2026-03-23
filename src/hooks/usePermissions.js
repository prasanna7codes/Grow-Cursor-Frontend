import { useMemo } from 'react';
import { PAGE_MAP } from '../constants/pages.js';

/**
 * usePermissions hook
 * 
 * Provides page-level access checks using the user's role + explicit pagePermissions overrides.
 * 
 * Priority:
 * 1. Superadmin → always full access.
 * 2. Explicit override in user.pagePermissions → 'read' | 'update' | 'none'.
 * 3. Fallback to PAGE_REGISTRY defaultRoles for the user's role.
 * 
 * @param {Object} user - The user object { role, pagePermissions }
 * @returns {{ hasAccess, canUpdate, isReadOnly }}
 */
export default function usePermissions(user) {
  const permMap = useMemo(() => {
    const map = {};
    if (user?.pagePermissions) {
      for (const p of user.pagePermissions) {
        map[p.page] = p.accessLevel;
      }
    }
    return map;
  }, [user?.pagePermissions]);

  const hasAccess = (pageId) => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;

    // Check explicit override
    const override = permMap[pageId];
    if (override === 'none') return false;
    if (override === 'read' || override === 'update') return true;

    // Fallback to default roles from registry
    const page = PAGE_MAP[pageId];
    if (!page) return false;
    if (page.defaultRoles.includes('*')) return true;
    return page.defaultRoles.includes(user.role);
  };

  const canUpdate = (pageId) => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;

    // Check explicit override
    const override = permMap[pageId];
    if (override === 'update') return true;
    if (override === 'read' || override === 'none') return false;

    // Fallback: if user has default access, they get full (update) access (legacy behavior)
    const page = PAGE_MAP[pageId];
    if (!page) return false;
    if (page.defaultRoles.includes('*')) return true;
    return page.defaultRoles.includes(user.role);
  };

  const isReadOnly = (pageId) => {
    return hasAccess(pageId) && !canUpdate(pageId);
  };

  return { hasAccess, canUpdate, isReadOnly };
}
