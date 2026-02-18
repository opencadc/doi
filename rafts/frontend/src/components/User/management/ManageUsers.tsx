/*
 ************************************************************************
 *******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
 **************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
 *
 *  (c) 2026.                            (c) 2026.
 *  Government of Canada                 Gouvernement du Canada
 *  National Research Council            Conseil national de recherches
 *  Ottawa, Canada, K1A 0R6              Ottawa, Canada, K1A 0R6
 *  All rights reserved                  Tous droits réservés
 *
 *  NRC disclaims any warranties,        Le CNRC dénie toute garantie
 *  expressed, implied, or               énoncée, implicite ou légale,
 *  statutory, of any kind with          de quelque nature que ce
 *  respect to the software,             soit, concernant le logiciel,
 *  including without limitation         y compris sans restriction
 *  any warranty of merchantability      toute garantie de valeur
 *  or fitness for a particular          marchande ou de pertinence
 *  purpose. NRC shall not be            pour un usage particulier.
 *  liable in any event for any          Le CNRC ne pourra en aucun cas
 *  damages, whether direct or           être tenu responsable de tout
 *  indirect, special or general,        dommage, direct ou indirect,
 *  consequential or incidental,         particulier ou général,
 *  arising from the use of the          accessoire ou fortuit, résultant
 *  software.  Neither the name          de l'utilisation du logiciel. Ni
 *  of the National Research             le nom du Conseil National de
 *  Council of Canada nor the            Recherches du Canada ni les noms
 *  names of its contributors may        de ses  participants ne peuvent
 *  be used to endorse or promote        être utilisés pour approuver ou
 *  products derived from this           promouvoir les produits dérivés
 *  software without specific prior      de ce logiciel sans autorisation
 *  written permission.                  préalable et particulière
 *                                       par écrit.
 *
 *  This file is part of the             Ce fichier fait partie du projet
 *  OpenCADC project.                    OpenCADC.
 *
 *  OpenCADC is free software:           OpenCADC est un logiciel libre ;
 *  you can redistribute it and/or       vous pouvez le redistribuer ou le
 *  modify it under the terms of         modifier suivant les termes de
 *  the GNU Affero General Public        la "GNU Affero General Public
 *  License as published by the          License" telle que publiée
 *  Free Software Foundation,            par la Free Software Foundation
 *  either version 3 of the              : soit la version 3 de cette
 *  License, or (at your option)         licence, soit (à votre gré)
 *  any later version.                   toute version ultérieure.
 *
 *  OpenCADC is distributed in the       OpenCADC est distribué
 *  hope that it will be useful,         dans l'espoir qu'il vous
 *  but WITHOUT ANY WARRANTY;            sera utile, mais SANS AUCUNE
 *  without even the implied             GARANTIE : sans même la garantie
 *  warranty of MERCHANTABILITY          implicite de COMMERCIALISABILITÉ
 *  or FITNESS FOR A PARTICULAR          ni d'ADÉQUATION À UN OBJECTIF
 *  PURPOSE.  See the GNU Affero         PARTICULIER. Consultez la Licence
 *  General Public License for           Générale Publique GNU Affero
 *  more details.                        pour plus de détails.
 *
 *  You should have received             Vous devriez avoir reçu une
 *  a copy of the GNU Affero             copie de la Licence Générale
 *  General Public License along         Publique GNU Affero avec
 *  with OpenCADC.  If not, see          OpenCADC ; si ce n'est
 *  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
 *                                       <http://www.gnu.org/licenses/>.
 *
 ************************************************************************
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import UserTable from '@/components/User/management/UserTable'
import { User, getUsers } from '@/actions/user/getUsers'
import { Typography, Paper, Box, Chip, Alert } from '@mui/material'
import { Users, AlertCircle } from 'lucide-react'

export default function ManageUsers() {
  const [userData, setUserData] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [roleFilter, setRoleFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { success, data, error, meta } = await getUsers({
        page: page + 1, // API uses 1-based indexing
        limit,
        role: roleFilter || undefined,
        search: searchTerm || undefined,
      })
      if (success && data) {
        setUserData(data)
        setTotalCount(meta?.total || data.length)
        setIsAdmin(true) // If we got data, we're an admin
      } else {
        console.error('Error fetching user data:', error)
        setError(error || 'Failed to load user data')
        setUserData([])

        // If unauthorized, we're not an admin
        if (error?.includes('Unauthorized') || error?.includes('Admin role required')) {
          setIsAdmin(false)
        }
      }
    } catch (err) {
      console.error('Error in fetchData:', err)
      setError('An unexpected error occurred')
      setUserData([])
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, roleFilter, searchTerm])

  // Initial data load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(0) // Reset to first page when changing limit
  }

  const handleRoleFilterChange = (newFilter: string) => {
    setRoleFilter(newFilter)
    setPage(0) // Reset to first page when changing filter
  }

  const handleSearchChange = (newSearch: string) => {
    setSearchTerm(newSearch)
    setPage(0) // Reset to first page when searching
  }

  if (!isAdmin && !isLoading) {
    return (
      <Box className="p-8 max-w-3xl mx-auto">
        <Alert severity="error" icon={<AlertCircle />} sx={{ mb: 4 }}>
          <Typography variant="h6">Access Denied</Typography>
          <Typography>
            You don&apos;t have permission to access the user management section. This area is
            restricted to administrators only.
          </Typography>
        </Alert>
      </Box>
    )
  }

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center min-h-screen p-4 pb-8 gap-8 sm:p-8">
      <header className="row-start-1 w-full">
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Manage users, roles, and permissions for the RAFT system.
        </Typography>

        <Paper elevation={2} className="p-4 mb-6">
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Users size={24} className="mr-2" />
            <Typography variant="h6" component="h2">
              All Users
            </Typography>
            <Chip
              label={totalCount}
              color="primary"
              size="small"
              sx={{ ml: 1, verticalAlign: 'middle' }}
            />
          </Box>
          <Typography variant="body2">
            From this panel, you can view all users, change their roles, and manage their account
            status.
          </Typography>
        </Paper>
      </header>

      <main className="row-start-2 w-full max-w-7xl mx-auto">
        {error && !isLoading ? (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        ) : (
          <UserTable
            data={userData}
            isLoading={isLoading}
            onActionComplete={fetchData}
            totalCount={totalCount}
            page={page}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onFilterChange={handleRoleFilterChange}
            onSearchChange={handleSearchChange}
            currentFilter={roleFilter}
            currentSearch={searchTerm}
          />
        )}
      </main>

      <footer className="row-start-3 w-full text-center text-sm text-gray-500 mt-8">
        <div>CADC RAFT Publication System</div>
      </footer>
    </div>
  )
}
