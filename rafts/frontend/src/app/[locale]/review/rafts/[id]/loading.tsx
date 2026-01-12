import { Container, Paper, Skeleton, Box, Grid } from '@mui/material'

export default function Loading() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Main content area */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Breadcrumbs skeleton */}
          <Skeleton variant="text" width={250} height={24} sx={{ mb: 3 }} />

          {/* Back button skeleton */}
          <Skeleton variant="rounded" width={80} height={36} sx={{ mb: 3 }} />

          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {/* Header section */}
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Skeleton variant="rounded" width={100} height={24} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="70%" height={40} sx={{ mb: 1 }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Skeleton variant="text" width={120} height={20} />
                <Skeleton variant="text" width={150} height={20} />
              </Box>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, py: 1 }}>
                <Skeleton variant="rounded" width={80} height={36} />
                <Skeleton variant="rounded" width={100} height={36} />
                <Skeleton variant="rounded" width={120} height={36} />
              </Box>
            </Box>

            {/* Content */}
            <Box sx={{ p: 3 }}>
              <Skeleton variant="text" width={150} height={28} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" width="100%" height={120} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" width="100%" height={80} />
            </Box>
          </Paper>
        </Grid>

        {/* Side panel skeleton */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Skeleton variant="text" width={150} height={28} sx={{ mb: 3 }} />

            {/* Status section */}
            <Box sx={{ mb: 3 }}>
              <Skeleton variant="text" width={80} height={20} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" width={120} height={32} />
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Skeleton variant="rounded" width="100%" height={42} />
              <Skeleton variant="rounded" width="100%" height={42} />
            </Box>

            {/* Comments section */}
            <Box sx={{ mt: 4 }}>
              <Skeleton variant="text" width={100} height={24} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" width="100%" height={100} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
