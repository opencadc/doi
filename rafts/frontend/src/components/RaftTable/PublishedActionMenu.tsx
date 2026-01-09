'use client'

import { useState } from 'react'
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
} from '@mui/material'
import { MoreVertical, Eye, Download, Link2, Copy } from 'lucide-react'
import type { RaftData } from '@/types/doi'
import { useRouter } from 'next/navigation'

interface ActionMenuProps {
  rowData: RaftData
}

export default function ActionMenu({ rowData }: ActionMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const router = useRouter()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleView = () => {
    router.push(`/public-view/rafts/${rowData._id}`)
    handleClose()
  }

  const handleDownload = () => {
    // Implement download functionality - typically you'd create a download URL
    handleClose()
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(rowData._id)
    // You might want to show a toast notification here
    handleClose()
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/raft/${rowData._id}`
    navigator.clipboard.writeText(url)
    // You might want to show a toast notification here
    handleClose()
  }

  // Determine what actions are available based on status

  return (
    <div>
      <Tooltip title="Actions">
        <IconButton
          aria-label="more actions"
          aria-controls={open ? 'raft-action-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          size="small"
        >
          <MoreVertical size={18} />
        </IconButton>
      </Tooltip>
      <Menu
        id="raft-action-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
          dense: true,
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <Eye size={18} />
          </ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleDownload}>
          <ListItemIcon>
            <Download size={18} />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleCopyId}>
          <ListItemIcon>
            <Copy size={18} />
          </ListItemIcon>
          <ListItemText>Copy ID</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleCopyLink}>
          <ListItemIcon>
            <Link2 size={18} />
          </ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
        </MenuItem>

        <Divider />
      </Menu>
    </div>
  )
}
