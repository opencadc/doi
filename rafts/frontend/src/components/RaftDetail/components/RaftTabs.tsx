'use client'

import React from 'react'
import { Box, Tabs, Tab } from '@mui/material'
import { useTranslations } from 'next-intl'
import { RAFT_DETAILS_TABS } from '@/components/RaftDetail/constants'

interface RaftTabsProps {
  value: number
  onChange: (event: React.SyntheticEvent, newValue: number) => void
}

// Get props for each tab for accessibility
const a11yProps = (index: number) => {
  return {
    id: `raft-tab-${index}`,
    'aria-controls': `raft-tabpanel-${index}`,
  }
}

const RaftTabs = ({ value, onChange }: RaftTabsProps) => {
  const t = useTranslations('raft_details')

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={value} onChange={onChange} aria-label="raft content tabs" sx={{ px: 2 }}>
        {RAFT_DETAILS_TABS.map((tab, index) => (
          <Tab label={t(tab)} {...a11yProps(index)} key={tab} />
        ))}
      </Tabs>
    </Box>
  )
}

export default RaftTabs
