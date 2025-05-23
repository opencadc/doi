/*
 ************************************************************************
 *******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
 **************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
 *
 *  (c) 2025.                            (c) 2025.
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
 *  : 5 $
 *
 ************************************************************************
 */

package ca.nrc.cadc.doi;

import ca.nrc.cadc.rest.InlineContentException;
import ca.nrc.cadc.rest.InlineContentHandler;
import java.io.IOException;
import java.io.InputStream;
import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

/**
 * The SearchInlineContentHandler class is responsible for handling inline content
 * with a specific focus on processing JSON data. This class implements the
 * InlineContentHandler interface and provides functionality to parse JSON input streams
 * into a structured {@code Content} object.
 *
 * <p>The handler enforces the requirement that the content type of the input must
 * be "application/json". It will reject any unsupported content types or closed
 * input streams by throwing appropriate exceptions.</p>
 *
 * <p>Key features:
 * - Validates that the input content type is JSON.
 * - Parses the JSON input stream and converts it to a map representation.
 * - Constructs a {@code Content} object with the parsed JSON data.</p>
 *
 * <p>Exceptions:
 * - Throws InlineContentException if the content type is not JSON.
 * - Throws IOException if the input stream is closed or not accessible.</p>
 *
 * <p>The processed content is assigned the name specified by {@code CONTENT_KEY},
 * which is "SearchJSON" in this implementation.</p>
 */
public class SearchInlineContentHandler implements InlineContentHandler {
    private static Logger log = Logger.getLogger(DoiInlineContentHandler.class);

    public static final String CONTENT_KEY = "SearchJSON";

    /**
     * Default constructor
     */
    public SearchInlineContentHandler() {
    }

    public Content accept(String name, String contentType, InputStream inputStream)
            throws InlineContentException, IOException {
        if (inputStream == null) {
            throw new IOException("The InputStream is closed");
        }
        if (!contentType.toLowerCase().contains("application/json")) {
            throw new InlineContentException("Content-Type must be application/json");
        }

        JSONTokener jsonTokener = new JSONTokener(inputStream);
        JSONObject jsonObject;
        try {
            jsonObject = new JSONObject(jsonTokener);
        } catch (JSONException e) {
            throw new InlineContentException("Error parsing JSON input: " + e.getMessage());
        }
        inputStream.close();

        InlineContentHandler.Content content = new InlineContentHandler.Content();
        content.name = CONTENT_KEY;
        content.value = jsonObject;
        return content;
    }

}
