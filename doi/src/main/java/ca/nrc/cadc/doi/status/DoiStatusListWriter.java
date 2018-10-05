/*
************************************************************************
*******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
**************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
*
*  (c) 2018.                            (c) 2018.
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
*  the GNU Affero General Public        la “GNU Affero General Public
*  License as published by the          License” telle que publiée
*  Free Software Foundation,            par la Free Software Foundation
*  either version 3 of the              : soit la version 3 de cette
*  License, or (at your option)         licence, soit (à votre gré)
*  any later version.                   toute version ultérieure.
*                                       
*  OpenCADC is distributed in the       OpenCADC est distribué
*  hope that it will be useful,         dans l’espoir qu’il vous
*  but WITHOUT ANY WARRANTY;            sera utile, mais SANS AUCUNE
*  without even the implied             GARANTIE : sans même la garantie
*  warranty of MERCHANTABILITY          implicite de COMMERCIALISABILITÉ
*  or FITNESS FOR A PARTICULAR          ni d’ADÉQUATION À UN OBJECTIF
*  PURPOSE.  See the GNU Affero         PARTICULIER. Consultez la Licence
*  General Public License for           Générale Publique GNU Affero
*  more details.                        pour plus de détails.
*                                       
*  You should have received             Vous devriez avoir reçu une
*  a copy of the GNU Affero             copie de la Licence Générale
*  General Public License along         Publique GNU Affero avec
*  with OpenCADC.  If not, see          OpenCADC ; si ce n’est
*  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
*                                       <http://www.gnu.org/licenses/>.
*
*  $Revision: 4 $
*
************************************************************************
*/

package ca.nrc.cadc.doi.status;

import ca.nrc.cadc.doi.datacite.Identifier;
import ca.nrc.cadc.doi.datacite.Title;

import java.util.List;

import org.apache.log4j.Logger;
import org.jdom2.Element;
import org.jdom2.Namespace;

/**
 * Writes a DoiStatus instance to an output.
 * 
 * @author yeunga
 */
public class DoiStatusListWriter 
{
    private static Logger log = Logger.getLogger(DoiStatusListWriter.class);

    public DoiStatusListWriter() { }

    protected Element getRootElement(List<DoiStatus> doiStatusList)
    {
        Element root = new Element("doiStatuses");
        for (DoiStatus doiStatus : doiStatusList)
        {
            Element statusElement = getDoiStatusElement(doiStatus);
            root.addContent(statusElement);
        }
        return root;
    }
    
    protected Element getDoiStatusElement(DoiStatus doiStatus)
    {
        Element ret = new Element("doistatus");

        // add identifier element
        Element identifierElement = getIdentifierElement(doiStatus.getIdentifier());
        ret.addContent(identifierElement);
        
        // add title element
        Element titlesElement = getTitleElement(doiStatus.getTitle());
        ret.addContent(titlesElement);
        
        // add publication year element
        Element dataDirectoryElement = getDataDirectoryElement(doiStatus.getDataDirectory());
        ret.addContent(dataDirectoryElement);
        
        // add status element
        Element resourceTypeElement = getStatusElement(doiStatus.getStatus().getValue());
        ret.addContent(resourceTypeElement);
        
        return ret;
    }
    
    protected Element getIdentifierElement(Identifier identifier)
    {
        Element ret = new Element("identifier");
        ret.setAttribute("identifierType", identifier.getIdentifierType());
        ret.setText(identifier.getText());
        return ret;
        
    }
    
    protected Element getTitleElement(Title title)
    {
        Element ret = new Element("title");
        ret.setAttribute("lang", title.getLang(), Namespace.XML_NAMESPACE);
        ret.setText(title.getText());
        
        if (title.titleType != null)
        {
            // set title type attribute
            ret.setAttribute("titleType", title.titleType);
        }
        
        return ret;
    }
    
    protected Element getDataDirectoryElement(String dataDirectory)
    {
        Element ret = new Element("dataDirectory");
        ret.setText(dataDirectory);
        return ret;
    }
    
    protected Element getStatusElement(String status)
    {
        Element ret = new Element("status");
        ret.setText(status);
        return ret;
    }
}
