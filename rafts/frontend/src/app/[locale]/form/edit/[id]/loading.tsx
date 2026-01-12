import { Skeleton, Box } from '@mui/material'

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Breadcrumbs skeleton */}
      <Skeleton variant="text" width={200} height={24} sx={{ mb: 3 }} />

      {/* Title and buttons row */}
      <div className="flex justify-between items-center mb-4">
        <Skeleton variant="text" width={350} height={32} sx={{ flex: 1, textAlign: 'center' }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={100} height={36} />
          <Skeleton variant="rounded" width={40} height={36} />
        </Box>
      </div>

      {/* Step navigation skeleton */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          {[...Array(6)].map((_, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Skeleton variant="circular" width={32} height={32} />
              {i < 5 && <Skeleton variant="text" width={40} height={4} />}
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} variant="text" width={80} height={16} />
          ))}
        </Box>
      </Box>

      {/* Form content skeleton */}
      <Box
        sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 3, backgroundColor: 'white' }}
      >
        {/* Section title */}
        <Skeleton variant="text" width={200} height={28} sx={{ mb: 3 }} />

        {/* Form fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Skeleton variant="text" width={100} height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" width="100%" height={56} />
          </Box>

          <Box>
            <Skeleton variant="text" width={120} height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" width="100%" height={56} />
          </Box>

          <Box>
            <Skeleton variant="text" width={80} height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" width="100%" height={56} />
          </Box>

          <Box>
            <Skeleton variant="text" width={150} height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" width="100%" height={120} />
          </Box>
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Skeleton variant="rounded" width={100} height={42} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="rounded" width={120} height={42} />
            <Skeleton variant="rounded" width={100} height={42} />
          </Box>
        </Box>
      </Box>
    </div>
  )
}
