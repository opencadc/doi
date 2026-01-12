import { Container, Paper, Skeleton, Box } from '@mui/material'

export default function Loading() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs skeleton */}
      <Skeleton variant="text" width={200} height={24} sx={{ mb: 3 }} />

      {/* Back button skeleton */}
      <Skeleton variant="rounded" width={80} height={36} sx={{ mb: 3 }} />

      {/* Main content */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
        {/* Header section skeleton */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          {/* Status badge */}
          <Skeleton variant="rounded" width={80} height={24} sx={{ mb: 2 }} />

          {/* Title */}
          <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1 }} />

          {/* Metadata row */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Skeleton variant="text" width={120} height={20} />
            <Skeleton variant="text" width={150} height={20} />
            <Skeleton variant="text" width={100} height={20} />
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rounded" width={100} height={36} />
            <Skeleton variant="rounded" width={100} height={36} />
            <Skeleton variant="rounded" width={120} height={36} />
          </Box>
        </Box>

        {/* Tabs skeleton */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, py: 1 }}>
            <Skeleton variant="rounded" width={80} height={36} />
            <Skeleton variant="rounded" width={100} height={36} />
            <Skeleton variant="rounded" width={120} height={36} />
          </Box>
        </Box>

        {/* Tab content skeleton */}
        <Box sx={{ p: 3 }}>
          {/* Section title */}
          <Skeleton variant="text" width={150} height={28} sx={{ mb: 2 }} />

          {/* Content blocks */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Skeleton variant="text" width={100} height={20} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" width="100%" height={60} />
            </Box>

            <Box>
              <Skeleton variant="text" width={120} height={20} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" width="100%" height={100} />
            </Box>

            <Box>
              <Skeleton variant="text" width={80} height={20} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" width="100%" height={80} />
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}
