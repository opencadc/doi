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

import { useEffect, useState, useCallback } from 'react'
import { CADC_COOKIE_DOMAIN_URL, CANFAR_COOKIE_DOMAIN_URL } from '@/auth/cadc-auth/constants'
import { Session } from 'next-auth'

export function useSetCADCCookies(session: Session) {
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [isSetupComplete, setIsSetupComplete] = useState(false)

  // Function to set up cookies using iframes
  const setupCookiesWithIframe = useCallback(async () => {
    if (!session?.accessToken || isSetupComplete) return false

    setIsSettingUp(true)

    try {
      // Create a promise that resolves when iframe loads or times out
      const loadInIframe = (url: string, token: string): Promise<boolean> => {
        return new Promise((resolve) => {
          const iframe = document.createElement('iframe')
          iframe.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;'
          iframe.src = `${url}${token}`

          // Set timeout to resolve after 5 seconds
          const timeout = setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe)
            }
            resolve(true) // Assume success after timeout
          }, 5000)

          // Resolve when loaded
          iframe.onload = () => {
            clearTimeout(timeout)
            document.body.removeChild(iframe)
            resolve(true)
          }

          document.body.appendChild(iframe)
        })
      }

      // Load both endpoints sequentially
      await loadInIframe(CANFAR_COOKIE_DOMAIN_URL, session.accessToken)
      await loadInIframe(CADC_COOKIE_DOMAIN_URL, session.accessToken)

      setIsSetupComplete(true)
      return true
    } catch (error) {
      console.error('Error setting CADC cookies:', error)
      return false
    } finally {
      setIsSettingUp(false)
    }
  }, [session?.accessToken, isSetupComplete])

  // Automatic setup
  useEffect(() => {
    if (session?.accessToken && !isSetupComplete && !isSettingUp) {
      setupCookiesWithIframe()
    }
  }, [session, isSetupComplete, isSettingUp, setupCookiesWithIframe])

  // Return function for manual triggering
  return {
    setupCookies: setupCookiesWithIframe,
    isSettingUp,
    isSetupComplete,
  }
}
