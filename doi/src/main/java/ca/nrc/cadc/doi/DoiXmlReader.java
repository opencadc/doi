/*
************************************************************************
*******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
**************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
*
*  (c) 2009.                            (c) 2009.
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

package ca.nrc.cadc.doi;

import ca.nrc.cadc.xml.XmlUtil;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringReader;
import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.Map;
import org.apache.log4j.Logger;
import org.jdom2.Document;
import org.jdom2.JDOMException;
import org.jdom2.Namespace;

/**
 * Constructs a DoiMetadata from an XML source. This class is not thread safe but it is
 * re-usable  so it can safely be used to sequentially parse multiple XML node
 * documents.
 *
 * @author yeunga
 */
public class DoiXmlReader
{
    private static final Logger log = Logger.getLogger(DoiXmlReader.class);
    
    static final String XSI_NAMESPACE = "http://www.w3.org/2001/XMLSchema-instance";
    static final String DOI_NS_41 = "http://datacite.org/schema/kernel-4";
    static final String DOI_SCHEMA_RESOURCE_41 = "DoiMetadata-4.1.xsd";

    
    protected Map<String, String> schemaMap;
    protected Namespace xsiNamespace;

    /**
     * Constructor. XML Schema validation is enabled by default.
     */
    public DoiXmlReader() { this(true); }

    /**
     * Constructor. XML schema validation may be disabled, in which case the client
     * is likely to fail in horrible ways (e.g. NullPointerException) if it receives
     * invalid documents. However, performance may be improved.
     *
     * @param enableSchemaValidation
     */
    public DoiXmlReader(boolean enableSchemaValidation)
    {
        if (enableSchemaValidation)
        {
            String doiSchemaUrl4 = XmlUtil.getResourceUrlString(DOI_SCHEMA_RESOURCE_41, DoiXmlReader.class);
            log.debug("doiSchemaUrl4: " + doiSchemaUrl4);

            if (doiSchemaUrl4 == null)
                throw new RuntimeException("failed to load " + DOI_SCHEMA_RESOURCE_41 + " from classpath");

            schemaMap = new HashMap<String, String>();
            schemaMap.put(DOI_NS_41, doiSchemaUrl4);
            log.debug("schema validation enabled");
        }
        else
            log.debug("schema validation disabled");

        xsiNamespace = Namespace.getNamespace(XSI_NAMESPACE);
    }

    /**
     *  Construct a DOM document from an XML String source.
     *
     * @param xml String of the XML.
     * @return Document DOM document.
     * @throws DoiParsingException if there is an error parsing the XML.
     */
    public Document read(String xml) throws DoiParsingException
    {
        if (xml == null)
            throw new IllegalArgumentException("XML must not be null");
        try
        {
            return read(new StringReader(xml));
        }
        catch (IOException ioe)
        {
            String error = "Error reading XML: " + ioe.getMessage();
            throw new DoiParsingException(error, ioe);
        }
    }

    /**
     * Construct a DOM document from a InputStream.
     *
     * @param in InputStream.
     * @return Document DOM document.
     * @throws DoiParsingException if there is an error parsing the XML.
     */
    public Document read(InputStream in) throws IOException, DoiParsingException
    {
        if (in == null)
            throw new IOException("stream closed");
        try
        {
            return read(new InputStreamReader(in, "UTF-8"));
        }
        catch (UnsupportedEncodingException e)
        {
            throw new RuntimeException("UTF-8 encoding not supported");
        }
    }

    /**
     *  Construct a DOM document from a Reader.
     *
     * @param reader Reader.
     * @return Node Node.
     * @throws NodeParsingException if there is an error parsing the XML.
     */
    public Document read(Reader reader) 
    		throws DoiParsingException, IOException
    {
        if (reader == null)
            throw new IllegalArgumentException("reader must not be null");

        // Create a JDOM Document from the XML
        Document document;
        try
        {
            // TODO: investigate creating a SAXBuilder once and re-using it
            // as long as we can detect concurrent access (a la java collections)
            document = XmlUtil.buildDocument(reader, schemaMap);
        }
        catch (JDOMException jde)
        {
            String error = "XML failed schema validation: " + jde.getMessage();
            throw new DoiParsingException(error, jde);
        }
        
        return document;
    }
}
