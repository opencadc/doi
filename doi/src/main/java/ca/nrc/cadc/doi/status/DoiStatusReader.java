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
import ca.nrc.cadc.doi.datacite.TitleType;
import ca.nrc.cadc.doi.io.DoiParsingException;
import org.jdom2.Document;
import org.jdom2.Element;

/**
 * Constructs a DoiStatus instance from a Document instance.
 *
 * @author yeunga
 */
public class DoiStatusReader {

    /**
     * Constructor.
     */
    public DoiStatusReader() {
    }

    protected DoiStatus buildStatus(Document doc) throws DoiParsingException {
        Element root = doc.getRootElement();
        return buildStatus(root);
    }

    public DoiStatus buildStatus(Element root) throws DoiParsingException {
        Identifier identifier = buildIdentifier(root);
        
        if (root.getChild("status") == null) {
            String msg = "status not found in doi status element.";
            throw new DoiParsingException(msg);
        }        
        Status status = Status.toValue(root.getChild("status").getText());
        
        // title and dataDirectory can be null, refer to DoiStatus constructor
        Title title = buildTitle(root);

        // dataDirectory can be null, refer to DoiStatus constructor
        String dataDirectory = null;
        if (root.getChild("dataDirectory") != null) {
            dataDirectory = root.getChild("dataDirectory").getText();
        }

        DoiStatus ds = new DoiStatus(identifier, title, dataDirectory, status);

        // optional element
        if (root.getChild("journalRef") != null) {
            String journalReference = root.getChild("journalRef").getText();
            ds.journalRef = journalReference;
        }

        // optional element
        if (root.getChild("reviewer") != null) {
            ds.reviewer = root.getChild("reviewer").getText();
        }

        return ds;
    }

    protected Identifier buildIdentifier(Element root) throws DoiParsingException {
        Element identifierElement = root.getChild(Identifier.NAME, root.getNamespace());
        if (identifierElement == null) {
            throw new DoiParsingException(String.format("required element '%s' not found",
                    Identifier.NAME));
        }
        String identifier = identifierElement.getText();
        String identifierType = identifierElement.getAttributeValue(Identifier.IDENTIFIER_TYPE);
        return new Identifier(identifier, identifierType);
    }

    protected Title buildTitle(Element root) throws DoiParsingException {
        Element titleElement = root.getChild(Title.NAME);
        if (titleElement == null) {
            return null;
        }
        Title title = new Title(titleElement.getText());
        String titleType = titleElement.getAttributeValue(Title.TITLE_TYPE);
        if (titleType != null) {
            title.titleType = TitleType.toValue(titleType);
        }
        title.lang = titleElement.getAttributeValue(Title.LANG);
        return title;
    }
}
