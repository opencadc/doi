import { Box, CircularProgress } from '@mui/material'

export const FormSectionLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
    <CircularProgress />
  </Box>
)
