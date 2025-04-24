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

package ca.nrc.cadc.doi.io;

import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.xml.JsonInputter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import org.json.JSONException;

/**
 * Constructs a DoiMetadata from a JSON source. This class is not thread safe
 * but it is re-usable so it can safely be used to sequentially parse multiple
 * JSON node documents.
 *
 * @author yeunga
 */
public class DoiJsonReader extends DoiReader {

    /**
     * Constructor. XML Schema validation is enabled by default.
     */
    public DoiJsonReader() {
    }

    /**
     * Construct a DOM document from an JSON String source.
     *
     * @param json String of the JSON.
     * @return Resource object containing all doi metadata.
     * @throws DoiParsingException if there is an error parsing the JSON.
     */
    public Resource read(String json) throws DoiParsingException {
        if (json == null) {
            throw new IllegalArgumentException("JSON must not be null");
        }

        try {
            JsonInputter inputter = new JsonInputter();
            return this.buildResource(inputter.input(json));
        } catch (JSONException e) {
            String error = "JSON parsing error: " + e.getMessage();
            throw new DoiParsingException(error, e);
        }
    }

    /**
     * Construct a DOM document from a InputStream.
     *
     * @param in InputStream.
     * @return Resource object containing all doi metadata.
     * @throws DoiParsingException if there is an error parsing the XML.
     */
    public Resource read(InputStream in) throws DoiParsingException {
        if (in == null) {
            throw new IllegalArgumentException("InputStream is closed");
        }

        return read(new InputStreamReader(in, StandardCharsets.UTF_8));
    }

    /**
     * Construct a DOM document from a Reader.
     *
     * @param reader Reader.
     * @return Resource object containing all doi metadata.
     * @throws DoiParsingException when the document is invalid
     */
    public Resource read(Reader reader) throws DoiParsingException {
        if (reader == null) {
            throw new IllegalArgumentException("reader must not be null");
        }

        try {
            return read(convert(reader));
        } catch (IOException e) {
            String error = "Error reading JSON: " + e.getMessage();
            throw new DoiParsingException(error, e);
        }
    }

    private String convert(Reader reader) throws IOException {
        StringBuilder sb = new StringBuilder();
        char[] buffer = new char[8192];
        int charsRead;
        while ((charsRead = reader.read(buffer)) != -1) {
            sb.append(buffer, 0, charsRead);
        }
        return sb.toString();
    }

}
