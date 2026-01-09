'use client'

import React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { User } from '@/actions/user/getUsers'
import {
  Typography,
  Tooltip,
  IconButton,
  Box,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  UserCog,
  UserMinus,
  UserCheck,
  Calendar,
  ChevronDown,
  Shield,
  User as UserIcon,
} from 'lucide-react'
import { useState } from 'react'
import { changeUserRole } from '@/actions/user/changeUserRole'
import { toggleUserStatus } from '@/actions/user/toggleUserStatus'
import dayjs from 'dayjs'

// Define user table columns with action buttons
export const userColumns = (onActionComplete?: () => void): ColumnDef<User>[] => {
  // Role selector component
  const RoleSelector = ({ userId, currentRole }: { userId: string; currentRole: string }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
      setAnchorEl(null)
    }

    const handleRoleChange = async (newRole: string) => {
      if (newRole === currentRole) {
        handleClose()
        return
      }

      setIsLoading(true)
      try {
        await changeUserRole(userId, newRole)
        if (onActionComplete) onActionComplete()
      } catch (error) {
        console.error('Failed to change user role:', error)
      } finally {
        setIsLoading(false)
        handleClose()
      }
    }

    // These should match the UserRole enum in the backend
    const roles = ['contributor', 'reviewer', 'admin']

    return (
      <>
        <Chip
          label={currentRole}
          color={
            currentRole === 'admin' ? 'error' : currentRole === 'reviewer' ? 'primary' : 'default'
          }
          onClick={handleClick}
          onDelete={handleClick}
          deleteIcon={<ChevronDown size={16} />}
          disabled={isLoading}
          size="small"
        />
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          {roles.map((role) => (
            <MenuItem
              key={role}
              onClick={() => handleRoleChange(role)}
              selected={role === currentRole}
              disabled={isLoading}
            >
              <ListItemIcon>
                {role === 'admin' ? (
                  <Shield size={18} />
                ) : role === 'reviewer' ? (
                  <UserCog size={18} />
                ) : (
                  <UserIcon size={18} />
                )}
              </ListItemIcon>
              <ListItemText primary={role} />
            </MenuItem>
          ))}
        </Menu>
      </>
    )
  }

  // Toggle user active status
  const StatusToggle = ({ userId, isActive }: { userId: string; isActive: boolean }) => {
    const [isLoading, setIsLoading] = useState(false)

    const handleToggle = async () => {
      setIsLoading(true)
      try {
        await toggleUserStatus(userId, !isActive)
        if (onActionComplete) onActionComplete()
      } catch (error) {
        console.error('Failed to toggle user status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    return (
      <Tooltip title={isActive ? 'Deactivate User' : 'Activate User'}>
        <IconButton
          onClick={handleToggle}
          color={isActive ? 'error' : 'success'}
          disabled={isLoading}
          size="small"
        >
          {isActive ? <UserMinus size={18} /> : <UserCheck size={18} />}
        </IconButton>
      </Tooltip>
    )
  }

  return [
    {
      accessorKey: '_id',
      header: 'ID',
      cell: ({ row }) => {
        const id = row.getValue('_id') as string
        return (
          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            {id.substring(0, 8)}...
          </Typography>
        )
      },
    },
    {
      accessorKey: 'fullName',
      header: 'Name',
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      cell: ({ row }) => {
        const fullName = row.getValue('fullName') as string
        const email = row.original.email

        return (
          <Box>
            <Typography variant="body1" fontWeight="medium">
              {fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {email}
            </Typography>
          </Box>
        )
      },
    },
    {
      accessorKey: 'affiliation',
      header: 'Affiliation',
      cell: ({ row }) => {
        const affiliation = row.getValue('affiliation') as string
        return affiliation ? (
          <Typography variant="body2">{affiliation}</Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Not specified
          </Typography>
        )
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const userId = row.original._id
        const role = row.getValue('role') as string

        return <RoleSelector userId={userId} currentRole={role} />
      },
    },
    {
      accessorKey: 'isEmailVerified',
      header: 'Email Verified',
      cell: ({ row }) => {
        const isVerified = row.getValue('isEmailVerified') as boolean

        return (
          <Chip
            label={isVerified ? 'Verified' : 'Unverified'}
            color={isVerified ? 'success' : 'warning'}
            size="small"
          />
        )
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      // Remove this incorrect accessor function
      // accessorFn: (row) => !row.isLocked,
      cell: ({ row }) => {
        // Directly use the isActive field from the row data
        const isActive = row.original.isActive

        return (
          <Chip
            label={isActive ? 'Active' : 'Inactive'}
            color={isActive ? 'success' : 'error'}
            size="small"
          />
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt)

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calendar size={14} />
            <Typography variant="body2">{dayjs(date).format('MMM D, YYYY')}</Typography>
          </Box>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const userId = row.original._id
        // Use isActive directly instead of !isLocked
        const isActive = row.original.isActive

        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <StatusToggle userId={userId} isActive={isActive} />
          </Box>
        )
      },
    },
  ]
}
