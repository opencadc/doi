/*
************************************************************************
*******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
**************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
*
*  (c) 2024.                            (c) 2024.
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
import org.jdom2.Element;
import org.jdom2.Namespace;

/**
 * Writes a DoiStatus instance to an output.
 * 
 * @author yeunga
 */
public class DoiStatusWriter {

    public DoiStatusWriter() {
    }

    protected Element getRootElement(DoiStatus doiStatus) {
        return getDoiStatusElement(doiStatus);
    }

    public Element getDoiStatusElement(DoiStatus doiStatus) {
        Element element = new Element("doistatus");
        element.addContent(getIdentifierElement(doiStatus.getIdentifier()));
        element.addContent(getTitleElement(doiStatus.getTitle()));
        element.addContent(getStatusElement(doiStatus.getStatus().getValue()));
        Element dataDirectoryElement = getDataDirectoryElement(doiStatus.getDataDirectory());
        if (dataDirectoryElement != null) {
            element.addContent(dataDirectoryElement);
        }
        if (doiStatus.journalRef != null) {
            element.addContent(getJournalRefElement(doiStatus.journalRef));
        }
        return element;
    }

    protected Element getIdentifierElement(Identifier identifier) {
        Element element = new Element(Identifier.NAME);
        element.setText(identifier.getValue());
        element.setAttribute(Identifier.IDENTIFIER_TYPE, identifier.getIdentifierType());
        return element;

    }

    protected Element getTitleElement(Title title) {
        if (title == null) {
            return null;
        }
        Element element = new Element(Title.NAME);
        element.setText(title.getValue());
        if (title.titleType != null) {
            element.setAttribute(Title.TITLE_TYPE, title.titleType.getValue());
        }
        if (title.lang != null) {
            element.setAttribute(Title.LANG, title.lang, Namespace.XML_NAMESPACE);
        }
        return element;
    }

    protected Element getDataDirectoryElement(String dataDirectory) {
        if (dataDirectory == null) {
            return null;
        }
        Element element = new Element("dataDirectory");
        element.setText(dataDirectory);
        return element;
    }

    protected Element getStatusElement(String status) {
        Element element = new Element("status");
        element.setText(status);
        return element;
    }

    protected Element getJournalRefElement(String journalRef) {
        Element element = new Element("journalRef");
        element.setText(journalRef);
        return element;
    }

}
