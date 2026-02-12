/*
 ************************************************************************
 *******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
 **************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
 *
 *  (c) 2026.                            (c) 2026.
 *  Government of Canada                 Gouvernement du Canada
 *  National Research Council            Conseil national de recherches
 *  Ottawa, Canada, K1A 0R6              Ottawa, Canada, K1A 0R6
 *  All rights reserved                  Tous droits réservés
 *
 *  NRC disclaims any warranties,        Le CNRC dénie toute garantie
 *  expressed, implied, or               énoncée, implicite ou légale,
 *  statutory, of any kind with          de quelque nature que ce
 *  respect to the software,             soit, concernant le logiciel,
 *  including without limitation         y compris sans restriction
 *  any warranty of merchantability      toute garantie de valeur
 *  or fitness for a particular          marchande ou de pertinence
 *  purpose. NRC shall not be            pour un usage particulier.
 *  liable in any event for any          Le CNRC ne pourra en aucun cas
 *  damages, whether direct or           être tenu responsable de tout
 *  indirect, special or general,        dommage, direct ou indirect,
 *  consequential or incidental,         particulier ou général,
 *  arising from the use of the          accessoire ou fortuit, résultant
 *  software.  Neither the name          de l'utilisation du logiciel. Ni
 *  of the National Research             le nom du Conseil National de
 *  Council of Canada nor the            Recherches du Canada ni les noms
 *  names of its contributors may        de ses  participants ne peuvent
 *  be used to endorse or promote        être utilisés pour approuver ou
 *  products derived from this           promouvoir les produits dérivés
 *  software without specific prior      de ce logiciel sans autorisation
 *  written permission.                  préalable et particulière
 *                                       par écrit.
 *
 *  This file is part of the             Ce fichier fait partie du projet
 *  OpenCADC project.                    OpenCADC.
 *
 *  OpenCADC is free software:           OpenCADC est un logiciel libre ;
 *  you can redistribute it and/or       vous pouvez le redistribuer ou le
 *  modify it under the terms of         modifier suivant les termes de
 *  the GNU Affero General Public        la "GNU Affero General Public
 *  License as published by the          License" telle que publiée
 *  Free Software Foundation,            par la Free Software Foundation
 *  either version 3 of the              : soit la version 3 de cette
 *  License, or (at your option)         licence, soit (à votre gré)
 *  any later version.                   toute version ultérieure.
 *
 *  OpenCADC is distributed in the       OpenCADC est distribué
 *  hope that it will be useful,         dans l'espoir qu'il vous
 *  but WITHOUT ANY WARRANTY;            sera utile, mais SANS AUCUNE
 *  without even the implied             GARANTIE : sans même la garantie
 *  warranty of MERCHANTABILITY          implicite de COMMERCIALISABILITÉ
 *  or FITNESS FOR A PARTICULAR          ni d'ADÉQUATION À UN OBJECTIF
 *  PURPOSE.  See the GNU Affero         PARTICULIER. Consultez la Licence
 *  General Public License for           Générale Publique GNU Affero
 *  more details.                        pour plus de détails.
 *
 *  You should have received             Vous devriez avoir reçu une
 *  a copy of the GNU Affero             copie de la Licence Générale
 *  General Public License along         Publique GNU Affero avec
 *  with OpenCADC.  If not, see          OpenCADC ; si ce n'est
 *  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
 *                                       <http://www.gnu.org/licenses/>.
 *
 ************************************************************************
 */

'use client'
import { createTheme, ThemeOptions, alpha } from '@mui/material/styles'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'

// Function to create the theme options for a specific mode
const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  typography: {
    fontFamily: 'var(--font-roboto), "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 300,
      fontSize: '6rem',
      lineHeight: 1.167,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontWeight: 300,
      fontSize: '3.75rem',
      lineHeight: 1.2,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontWeight: 400,
      fontSize: '3rem',
      lineHeight: 1.167,
      letterSpacing: '0em',
    },
    h4: {
      fontWeight: 400,
      fontSize: '2.125rem',
      lineHeight: 1.235,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontWeight: 400,
      fontSize: '1.5rem',
      lineHeight: 1.334,
      letterSpacing: '0em',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.6,
      letterSpacing: '0.0075em',
    },
    subtitle1: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.75,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.57,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.43,
      letterSpacing: '0.01071em',
    },
    button: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'uppercase',
    },
    caption: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.66,
      letterSpacing: '0.03333em',
    },
    overline: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 2.66,
      letterSpacing: '0.08333em',
      textTransform: 'uppercase',
    },
  },
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          //
          // -------------------------------------------
          // LIGHT MODE PALETTE
          // -------------------------------------------
          //
          primary: {
            main: '#00796B', // A deep, elegant teal
            light: '#48a999',
            dark: '#004c40',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#C2185B', // A vibrant, engaging magenta
            light: '#f6598c',
            dark: '#8c0032',
            contrastText: '#ffffff',
          },
          error: {
            main: '#D32F2F', // Standard Material Red
            light: '#EF5350',
            dark: '#C62828',
            contrastText: '#ffffff',
          },
          warning: {
            main: '#F57C00', // A rich, noticeable amber
            light: '#FFA726',
            dark: '#E65100',
            contrastText: '#000000', // Black text for high contrast
          },
          info: {
            main: '#0288D1', // A clear, friendly blue
            light: '#29B6F6',
            dark: '#01579B',
            contrastText: '#ffffff',
          },
          success: {
            main: '#2E7D32', // A reassuring, deep green
            light: '#4CAF50',
            dark: '#1B5E20',
            contrastText: '#ffffff',
          },
          background: {
            default: '#F7F9FC', // A very light, clean grey
            paper: '#ffffff', // Pure white for cards and surfaces
          },
          text: {
            primary: '#121212',
            secondary: '#5f6368',
            disabled: '#9e9e9e',
          },
          divider: 'rgba(0, 0, 0, 0.12)',
          action: {
            active: 'rgba(0, 0, 0, 0.54)',
            hover: 'rgba(0, 0, 0, 0.06)', // "Dimming" effect - slightly darker overlay
            selected: 'rgba(0, 0, 0, 0.08)',
            disabled: 'rgba(0, 0, 0, 0.26)',
            disabledBackground: 'rgba(0, 0, 0, 0.12)',
          },
        }
      : {
          //
          // -------------------------------------------
          // DARK MODE PALETTE (REVISED FOR ACCESSIBILITY & AESTHETICS)
          // -------------------------------------------
          //
          primary: {
            main: '#26A69A', // A vibrant teal that passes contrast checks with black text
            light: '#64d8cb',
            dark: '#00766c',
            contrastText: '#000000',
          },
          secondary: {
            main: '#C2185B', // Using the richer light-mode main for better contrast with white text
            light: '#F06292',
            dark: '#8c0032',
            contrastText: '#ffffff',
          },
          error: {
            main: '#D32F2F', // Using the richer light-mode main for better contrast with white text
            light: '#EF5350',
            dark: '#C62828',
            contrastText: '#ffffff',
          },
          warning: {
            main: '#FF9800', // This orange has great contrast with black and works well
            light: '#FFB74D',
            dark: '#F57C00',
            contrastText: '#000000',
          },
          info: {
            main: '#0288D1', // Using the richer light-mode main for better contrast with white text
            light: '#29B6F6',
            dark: '#01579B',
            contrastText: '#ffffff',
          },
          success: {
            main: '#2E7D32', // Using the richer light-mode main for better contrast with white text
            light: '#4CAF50',
            dark: '#1B5E20',
            contrastText: '#ffffff',
          },
          background: {
            default: '#121212', // MUI standard dark background
            paper: '#1E1E1E', // A slightly lighter surface for elevation
          },
          text: {
            primary: '#E0E0E0', // Off-white for comfortable reading
            secondary: '#A4A4A4',
            disabled: '#616161',
          },
          divider: 'rgba(255, 255, 255, 0.12)',
          action: {
            active: '#ffffff',
            hover: 'rgba(255, 255, 255, 0.1)', // "Glowing" effect - slightly brighter overlay
            selected: 'rgba(255, 255, 255, 0.16)',
            disabled: 'rgba(255, 255, 255, 0.3)',
            disabledBackground: 'rgba(255, 255, 255, 0.12)',
          },
        }),
  },
  components: {
    // --- Global Styles ---
    MuiCssBaseline: {
      styleOverrides: (theme) => `
        body {
          background-color: ${theme.palette.background.default};
          color: ${theme.palette.text.primary};
          // Improve text rendering
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        /* Ensure links are clearly visible */
        a {
           color: ${mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main};
           text-decoration: underline;
        }
         a:hover {
           color: ${mode === 'dark' ? alpha(theme.palette.primary.light, 0.8) : theme.palette.primary.dark};
         }
      `,
    },
    // --- Form Input Styling (Outlined is common) ---
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          // Use paper background for contrast against page background
          backgroundColor: mode === 'dark' ? '#101223' : theme.palette.background.default,
          // Ensure text color is correct
          color: theme.palette.text.primary,
          ...(mode === 'dark' && {
            // Dark mode specific border/focus styles
            '& .MuiOutlinedInput-notchedOutline': {
              // Use divider color for a subtle but visible border
              borderColor: theme.palette.divider, // More consistent than arbitrary rgba
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              // Slightly lighter border on hover
              borderColor: alpha(theme.palette.text.primary, 0.4),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              // Use primary color for focus, make it thicker
              borderColor: theme.palette.primary.main,
              borderWidth: 2,
            },
            // Error state
            ...(ownerState.error && {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.error.main,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.error.light, // Lighter red on hover
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.error.main, // Keep red when focused + error
              },
            }),
            // Ensure input text color is primary
            '& input': {
              color: theme.palette.text.primary,
            },
            // Style placeholder text
            '& ::placeholder': {
              color: theme.palette.text.secondary,
              opacity: 0.8, // Don't make placeholder too faint
            },
          }),
        }),
      },
    },
    // --- Label Styling ---
    MuiInputLabel: {
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          // Default label color
          color: theme.palette.text.secondary,
          ...(mode === 'dark' && {
            // Slightly brighter secondary text color is good for labels
            color: theme.palette.text.secondary, // Uses the refined #b0b0b0
            // Focused state
            '&.Mui-focused': {
              // Don't override error color if focused AND error
              color: ownerState.error ? theme.palette.error.main : theme.palette.primary.main,
            },
            // Error state
            ...(ownerState.error && {
              color: theme.palette.error.main,
            }),
          }),
        }),
      },
    },
    // --- Helper Text Styling ---
    MuiFormHelperText: {
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          // Default helper text color (often same as secondary)
          color: theme.palette.text.secondary,
          ...(mode === 'dark' && {
            // Slightly lighter than default secondary might be good here
            color: alpha(theme.palette.text.secondary, 0.9), // Subtly different if needed, or keep same as label
            // Error state
            ...(ownerState.error && {
              color: theme.palette.error.main,
            }),
          }),
        }),
      },
    },
    // --- Button Styling ---
    MuiButton: {
      styleOverrides: {
        root: () => ({
          fontSize: '1rem', // Ensure buttons aren't too small
          textTransform: 'none', // Often preferred over ALL CAPS
          fontWeight: 600, // Make button text bold for clarity
          // Add specific dark mode styles if needed beyond palette colors
          ...(mode === 'dark' &&
            {
              // Example: Ensure outlined buttons have sufficient contrast
              // if (ownerState.variant === 'outlined') {
              //  borderColor: alpha(theme.palette.text.primary, 0.5),
              // }
            }),
        }),
        // Ensure contained buttons have good contrast and maybe a subtle shadow
        contained: () => ({
          ...(mode === 'dark' && {
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)', // Subtle shadow can help lift elements
          }),
        }),
      },
      // Define default props if desired
      // defaultProps: {
      //   disableElevation: true, // Example: Flat buttons by default
      // }
    },
    // --- Fieldset/FormControl Spacing ---
    MuiFormControl: {
      styleOverrides: {
        root: {
          // Add consistent spacing below form elements
          marginBottom: '1.25rem', // ~20px
        },
      },
    },
    // --- Legend specific styling (often used with Fieldset) ---
    MuiFormLabel: {
      // Targets <legend> when used in FormControl/Fieldset context
      styleOverrides: {
        root: ({ theme }) => ({
          ...(mode === 'dark' && {
            color: theme.palette.text.primary, // Make legends prominent like titles
            fontWeight: 600,
            marginBottom: '0.5rem', // Space below legend inside fieldset
            fontSize: '1.1rem',
          }),
        }),
      },
    },
    // --- Paper/Card styling ---
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          // Use paper background color
          backgroundColor: theme.palette.background.paper,
          // Remove MUI's default subtle background image in dark mode if present
          backgroundImage: mode === 'dark' ? 'none' : undefined,
          // Add a subtle border to Paper elements in dark mode to help define edges
          ...(mode === 'dark' && {
            border: `1px solid ${theme.palette.divider}`,
          }),
        }),
      },
      // Optionally default elevation
      // defaultProps: {
      //   elevation: 2, // Slight elevation
      // }
    },
    // --- Optional: App Bar ---
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          ...(mode === 'dark' && {
            // Use paper background for AppBar, remove default gradient/image
            backgroundColor: theme.palette.background.paper,
            backgroundImage: 'none',
            boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.5)}`, // Subtle bottom shadow
          }),
        }),
      },
      // defaultProps: {
      //   elevation: 0, // Control shadow via styleOverrides if needed
      // }
    },
  },
})

// Static theme for server-side rendering (usually defaults to light)
export const staticTheme = createTheme(getDesignTokens('light'))

// Helper to detect initial theme from DOM (next-themes sets class before hydration)
function getInitialTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined') {
    // next-themes sets the class on <html> before React hydration
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  }
  return 'light' // Server-side fallback
}

// Theme hook for client-side rendering
export function useAppTheme() {
  // Use 'system' if you want next-themes to handle OS preference initially
  const { resolvedTheme } = useTheme()
  // Create theme based on the current resolved theme ('light' or 'dark')
  return useMemo(() => {
    // Use resolvedTheme if available, otherwise detect from DOM class
    const currentMode = (resolvedTheme as 'light' | 'dark') || getInitialTheme()
    return createTheme(getDesignTokens(currentMode))
  }, [resolvedTheme])
}

// Export the hook as default or alongside staticTheme as needed
export default useAppTheme // Or export both: export { useAppTheme, staticTheme }
