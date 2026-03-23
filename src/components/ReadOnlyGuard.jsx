import { Box, Alert } from '@mui/material';

/**
 * ReadOnlyGuard
 * 
 * Wraps page content and blocks ALL interactions (clicks, typing, etc.)
 * when the user only has read-only access to the page.
 * 
 * Uses a transparent overlay with pointer-events:none on the content area
 * so the user can still scroll and see the page, but cannot click/type anything.
 * 
 * @param {{ readOnly: boolean, children: React.ReactNode }} props
 */
export default function ReadOnlyGuard({ readOnly, children }) {
  if (!readOnly) return children;

  return (
    <Box sx={{ position: 'relative' }}>
      <Alert severity="warning" sx={{ mb: 2, fontWeight: 'bold' }}>
        🔒 You have read-only access to this page. All interactions are disabled.
      </Alert>
      <Box
        sx={{
          position: 'relative',
          '& *': {
            pointerEvents: 'none !important',
            userSelect: 'text',
          },
          // Re-enable scrolling on containers
          '& .MuiTableContainer-root, & .MuiDialog-root, & .MuiBox-root': {
            pointerEvents: 'auto !important',
          },
          // But disable clicks on interactive elements inside scrollable areas 
          '& button, & input, & select, & textarea, & a, & [role="button"], & .MuiSelect-select, & .MuiMenuItem-root, & .MuiIconButton-root, & .MuiButtonBase-root, & .MuiSwitch-root, & .MuiCheckbox-root, & .MuiRadio-root': {
            pointerEvents: 'none !important',
            opacity: 0.6,
            cursor: 'not-allowed !important',
          },
          // Keep scroll functionality
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
