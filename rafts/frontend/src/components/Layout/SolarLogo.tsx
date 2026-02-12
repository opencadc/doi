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

import React from 'react'

const SolarSystem = () => {
  return (
    <svg
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      className={`solar-system`}
    >
      {/* Outer orbit */}
      <circle
        cx="512"
        cy="512"
        r="330"
        fill="none"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
        strokeDasharray="1070 150"
      />

      {/* Inner orbit */}
      <circle
        cx="512"
        cy="512"
        r="220"
        fill="none"
        stroke="var(--orbit-color)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="1260 120"
      />

      {/* Sun in center */}
      <circle cx="512" cy="512" r="80" fill="#FDB813" />

      {/* Sun rays */}
      <line
        x1="512"
        y1="350"
        x2="512"
        y2="392"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <line
        x1="512"
        y1="632"
        x2="512"
        y2="674"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <line
        x1="350"
        y1="512"
        x2="392"
        y2="512"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <line
        x1="632"
        y1="512"
        x2="674"
        y2="512"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
      />

      <line
        x1="392"
        y1="392"
        x2="422"
        y2="422"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <line
        x1="602"
        y1="602"
        x2="632"
        y2="632"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <line
        x1="392"
        y1="632"
        x2="422"
        y2="602"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <line
        x1="602"
        y1="422"
        x2="632"
        y2="392"
        stroke="var(--orbit-color)"
        strokeWidth="15"
        strokeLinecap="round"
      />

      {/* Earth with continents */}
      <circle cx="200" cy="405" r="50" fill="#0077BE" />

      {/* Venus/Mercury */}
      <circle cx="720" cy="450" r="40" fill="#F3E5AB" />
    </svg>
  )
}

export default SolarSystem
