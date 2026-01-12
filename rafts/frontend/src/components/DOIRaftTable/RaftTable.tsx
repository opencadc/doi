'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
} from '@tanstack/react-table'
import type { DOIData } from '@/types/doi'
import { columns } from './columns'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  Box,
  FormControl,
  InputAdornment,
  Snackbar,
  Alert,
  Skeleton,
  useTheme,
} from '@mui/material'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RaftTableProps {
  data: DOIData[]
  /** Callback to refresh data after status changes */
  onRefresh?: () => void
  /** Show loading skeleton */
  isLoading?: boolean
}

// Extend TanStack Table's TableMeta to include our custom properties
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData> {
    onStatusChange?: (message: string, severity: 'success' | 'error') => void
  }
}

export default function RaftTable({ data, onRefresh, isLoading = false }: RaftTableProps) {
  const router = useRouter()
  const theme = useTheme()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })

  const handleStatusChange = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
    // Refresh data after status change
    if (onRefresh) {
      // Small delay to allow backend to process
      setTimeout(() => {
        onRefresh()
      }, 500)
    } else {
      // Fallback: try router.refresh for server components
      router.refresh()
    }
  }

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    meta: {
      onStatusChange: handleStatusChange,
    },
  })

  // Skeleton loading state
  if (isLoading) {
    return (
      <Paper elevation={2} sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 2 }}>
          <Skeleton variant="rectangular" height={40} />
        </Box>
        <TableContainer sx={{ minHeight: 400 }}>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((_, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? theme.palette.grey[800]
                          : theme.palette.grey[100],
                    }}
                  >
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ p: 2 }}>
          <Skeleton variant="rectangular" height={52} />
        </Box>
      </Paper>
    )
  }

  return (
    <Paper elevation={2} sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2 }}>
        <FormControl fullWidth variant="outlined" size="small">
          <TextField
            placeholder="Search RAFTs..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
            size="small"
          />
        </FormControl>
      </Box>

      <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="RAFT submissions table">
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    sx={{
                      fontWeight: 'bold',
                      cursor: header.column.getCanSort() ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted() as string] ?? null}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex}
        onPageChange={(_, page) => {
          table.setPageIndex(page)
        }}
        onRowsPerPageChange={(e) => {
          const size = e.target.value ? parseInt(e.target.value, 10) : 10
          table.setPageSize(size)
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  )
}
