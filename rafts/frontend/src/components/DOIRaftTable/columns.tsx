'use client'

import { ColumnDef } from '@tanstack/react-table'
import type { DOIData } from '@/types/doi'
import ActionMenu from './ActionMenu'
import StatusBadge from './StatusBadge'
import { CITATION_PARTIAL_URL, STORAGE_PARTIAL_URL } from '@/utilities/constants'

// Define table columns
export const columns: ColumnDef<DOIData>[] = [
  {
    accessorKey: 'identifier',
    header: 'Landing page',
    cell: ({ row }) => {
      const doi = (row.getValue('identifier') as string)?.split?.('/')?.[1] as string
      return (
        <a
          href={`${CITATION_PARTIAL_URL}${doi}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {doi}
        </a>
      )
    },
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => {
      const title = row.getValue('title') as string
      return <div className="font-medium">{title}</div>
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return <StatusBadge status={status} />
    },
  },
  {
    accessorKey: 'dataDirectory',
    header: 'Data Directory',
    cell: ({ row }) => {
      const path = row.getValue('dataDirectory') as string | null
      return path ? (
        <a
          href={`${STORAGE_PARTIAL_URL}${path}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {path}
        </a>
      ) : (
        <span className="text-gray-400">-</span>
      )
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row, table }) => {
      const onStatusChange = table.options.meta?.onStatusChange
      return <ActionMenu rowData={row.original} onStatusChange={onStatusChange} />
    },
  },
]
