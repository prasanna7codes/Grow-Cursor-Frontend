import { Box, Alert, GlobalStyles } from '@mui/material';

/**
 * ReadOnlyGuard
 * 
 * Disables data-editing elements globally (including inside MUI Dialog portals)
 * when the user has read-only access.
 * 
 * Blocked: text inputs, number inputs, textareas, selects, checkboxes, switches, radio buttons
 * Allowed: buttons, links, tabs, pagination — anything used for navigation/viewing
 */
export default function ReadOnlyGuard({ readOnly, children }) {
  if (!readOnly) return children;

  return (
    <>
      <GlobalStyles
        styles={{
          // Disable all text/number inputs and textareas
          'input, textarea': {
            pointerEvents: 'none !important',
            opacity: '0.6 !important',
            cursor: 'not-allowed !important',
          },
          // Disable MUI selects
          '.MuiSelect-select': {
            pointerEvents: 'none !important',
            opacity: '0.6 !important',
            cursor: 'not-allowed !important',
          },
          // Disable toggles, checkboxes, radios
          '.MuiSwitch-root, .MuiCheckbox-root, .MuiRadio-root': {
            pointerEvents: 'none !important',
            opacity: '0.6 !important',
            cursor: 'not-allowed !important',
          },
        }}
      />
      <Alert severity="warning" sx={{ mb: 2, fontWeight: 'bold' }}>
        🔒 You have read-only access to this page. Editing is disabled.
      </Alert>
      {children}
    </>
  );
}
