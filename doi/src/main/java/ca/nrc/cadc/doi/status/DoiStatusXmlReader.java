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

import ca.nrc.cadc.doi.io.DoiParsingException;
import ca.nrc.cadc.xml.XmlUtil;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringReader;
import java.io.UnsupportedEncodingException;

import org.apache.log4j.Logger;
import org.jdom2.Document;
import org.jdom2.JDOMException;

/**
 * Constructs the status of a DOI instance from an XML source. This class is not
 * thread safe but it is re-usable so it can safely be used to sequentially
 * parse multiple XML node documents.
 *
 * @author yeunga
 */
public class DoiStatusXmlReader extends DoiStatusReader {
    private static final Logger log = Logger.getLogger(DoiStatusXmlReader.class);

    /**
     * Default constructor.
     */
    public DoiStatusXmlReader() {
    }

    /**
     * Construct a DoiStatus from an XML String source.
     *
     * @param xml
     *            String of the XML.
     * @return DoiStatus object .
     * @throws DoiParsingException
     *             if there is an error parsing the XML.
     */
    public DoiStatus read(String xml) throws DoiParsingException {
        if (xml == null)
            throw new IllegalArgumentException("XML must not be null");
        try {
            return read(new StringReader(xml));
        } catch (IOException ioe) {
            String error = "Error reading XML: " + ioe.getMessage();
            throw new DoiParsingException(error, ioe);
        }
    }

    /**
     * Construct a DoiStatus instance from a InputStream.
     *
     * @param in InputStream.
     * @return DoiStatus object.
     * @throws IOException if there is an error reading the InputStream.
     * @throws DoiParsingException if there is an error parsing the XML.
     */
    public DoiStatus read(InputStream in) throws IOException, DoiParsingException {
        if (in == null)
            throw new IOException("stream closed");
        try {
            return read(new InputStreamReader(in, "UTF-8"));
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException("UTF-8 encoding not supported");
        }
    }

    /**
     * Construct a DoiStatus instance from a Reader.
     *
     * @param reader Reader.
     * @return DoiStatus object containing the status of the specified DOI.
     * @throws DoiParsingException if there is an error parsing the XML.
     * @throws IOException if there is an error reading from the reader.
     */
    public DoiStatus read(Reader reader) throws DoiParsingException, IOException {
        if (reader == null)
            throw new IllegalArgumentException("reader must not be null");

        // Create a JDOM Document from the XML
        Document document;
        try {
            document = XmlUtil.buildDocument(reader, null);
        } catch (JDOMException jde) {
            String error = "XML failed schema validation: " + jde.getMessage();
            throw new DoiParsingException(error, jde);
        }

        // build a DoiStatus instance from the document
        return this.buildStatus(document);
    }
}
