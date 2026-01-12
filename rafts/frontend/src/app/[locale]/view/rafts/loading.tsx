import { Container, Skeleton, Box } from '@mui/material'

export default function Loading() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center min-h-screen p-4 pb-8 gap-8 sm:p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="row-start-1 w-full">
        <div className="flex justify-between items-center mb-4">
          <Skeleton variant="text" width={280} height={40} />
          <Skeleton variant="rounded" width={150} height={40} />
        </div>
      </header>
      <main className="row-start-2 w-full max-w-7xl mx-auto">
        {/* Table header skeleton */}
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="rounded" width="100%" height={56} />
        </Box>

        {/* Table rows skeleton */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rounded" width="100%" height={52} />
          ))}
        </Box>
      </main>
      <footer className="row-start-3 w-full text-center text-sm text-gray-500 mt-8">
        <Skeleton variant="text" width={200} height={20} sx={{ mx: 'auto' }} />
      </footer>
    </div>
  )
}
