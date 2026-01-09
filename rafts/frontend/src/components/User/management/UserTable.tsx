'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
} from '@tanstack/react-table'
import { User } from '@/actions/user/getUsers'
import { userColumns } from './userColumns'
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
  LinearProgress,
  Typography,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputLabel,
  IconButton,
} from '@mui/material'
import { Search, Filter, X } from 'lucide-react'

interface UserTableProps {
  data: User[]
  isLoading?: boolean
  onActionComplete?: () => void
  totalCount: number
  page: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onFilterChange: (filter: string) => void
  onSearchChange: (search: string) => void
  currentFilter: string
  currentSearch?: string
}

export default function UserTable({
  data,
  isLoading = false,
  onActionComplete,
  totalCount,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onFilterChange,
  onSearchChange,
  currentFilter,
  currentSearch = '',
}: UserTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [searchTerm, setSearchTerm] = useState(currentSearch)

  const columns = userColumns(onActionComplete)

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / limit),
  })

  // Handle search with debounce
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleRoleFilterChange = (e: SelectChangeEvent) => {
    onFilterChange(e.target.value)
  }

  return (
    <Paper elevation={2} sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
        <FormControl variant="outlined" size="small" sx={{ flexGrow: 1 }}>
          <TextField
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearch}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // Trigger search when user presses Enter
                const searchValue = (e.target as HTMLInputElement).value.trim()
                // Pass the search term to parent component
                onSearchChange(searchValue)
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchTerm('')
                      // Clear search
                      onSearchChange('')
                    }}
                  >
                    <X size={16} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            size="small"
            fullWidth
          />
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="role-filter-label">Role</InputLabel>
          <Select
            labelId="role-filter-label"
            id="role-filter"
            value={currentFilter}
            label="Role"
            onChange={handleRoleFilterChange}
            size="small"
            startAdornment={
              <InputAdornment position="start">
                <Filter size={16} />
              </InputAdornment>
            }
          >
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="reviewer">Reviewer</MenuItem>
            <MenuItem value="contributor">Contributor</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {isLoading && <LinearProgress />}

      <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="User management table">
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
                      backgroundColor: '#f5f5f5',
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
            {data.length > 0 ? (
              data.map((row, i) => (
                <TableRow
                  key={row._id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {table
                    .getRowModel()
                    .rows[i]?.getVisibleCells()
                    .map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  {isLoading ? (
                    <Typography color="text.secondary">Loading data...</Typography>
                  ) : (
                    <Typography color="text.secondary">No users found</Typography>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalCount}
        rowsPerPage={limit}
        page={page}
        onPageChange={(_, newPage) => {
          onPageChange(newPage)
        }}
        onRowsPerPageChange={(e) => {
          const newLimit = parseInt(e.target.value, 10)
          onLimitChange(newLimit)
        }}
      />
    </Paper>
  )
}
