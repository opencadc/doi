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
 *  $Revision: 5 $
 *
 ************************************************************************
 */

package ca.nrc.cadc.doi.status;

import ca.nrc.cadc.util.StringBuilderWriter;
import ca.nrc.cadc.xml.JsonOutputter;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.util.List;
import org.apache.log4j.Logger;
import org.jdom2.Document;
import org.jdom2.Element;
import org.jdom2.output.Format;

/**
 *
 * @author yeunga
 */
public class DoiStatusListJsonWriter extends DoiStatusListWriter {

    private static final Logger log = Logger.getLogger(
        DoiStatusListJsonWriter.class
    );

    private boolean prettyPrint;

    public DoiStatusListJsonWriter() {
        this(true);
    }

    public DoiStatusListJsonWriter(boolean prettyPrint) {
        this.prettyPrint = prettyPrint;
    }

    /**
     * Write a list of DoiStatus instances to an OutputStream using UTF-8 encoding.
     *
     * @param doiStatusList
     *            List of DoiStatus instances to write.
     * @param out
     *            OutputStream to write to.
     * @throws IOException
     *             if the writer fails to write.
     */
    public void write(List<DoiStatus> doiStatusList, OutputStream out)
        throws IOException {
        OutputStreamWriter outWriter;
        try {
            outWriter = new OutputStreamWriter(out, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException("UTF-8 encoding not supported", e);
        }
        write(doiStatusList, outWriter);
    }

    /**
     * Write a list of DoiStatus instances to a StringBuilder.
     *
     * @param doiStatusList List of DoiStatus instances to write.
     * @param builder the builder to write to.
     * @throws IOException if the writer fails to write.
     */
    public void write(List<DoiStatus> doiStatusList, StringBuilder builder)
        throws IOException {
        write(doiStatusList, new StringBuilderWriter(builder));
    }

    /**
     * Write the list of DoiStatus instances to a writer.
     *
     * @param doiStatusList List of DoiStatus instances to write.
     * @param writer Writer to write to.
     * @throws IOException if the writer fails to write.
     */
    public void write(List<DoiStatus> doiStatusList, Writer writer)
        throws IOException {
        long start = System.currentTimeMillis();
        Element root = this.getRootElement(doiStatusList);
        write(root, writer);
        long end = System.currentTimeMillis();
        log.debug("Write elapsed time: " + (end - start) + "ms");
    }

    /**
     * Write a Document instance by providing the root element to a writer.
     *
     * @param root Root element to write.
     * @param writer Writer to write to.
     * @throws IOException if the writer fails to write.
     */
    protected void write(Element root, Writer writer) throws IOException {
        JsonOutputter outputter = new JsonOutputter();
        outputter.getListElementNames().add("doiStatuses");

        Format fmt = null;
        if (prettyPrint) {
            fmt = Format.getPrettyFormat();
            fmt.setIndent("  "); // 2 spaces
        }
        outputter.setFormat(fmt);
        outputter.output(new Document(root), writer);
    }
}
