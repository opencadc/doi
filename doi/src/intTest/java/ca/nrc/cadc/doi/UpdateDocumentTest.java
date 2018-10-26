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
*  $Revision: 5 $
*
************************************************************************
*/

package ca.nrc.cadc.doi;

import java.io.ByteArrayOutputStream;
import java.io.StringReader;
import java.net.URL;
import java.security.PrivilegedExceptionAction;

import javax.security.auth.Subject;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Test;

import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.doi.datacite.Creator;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.datacite.Title;
import ca.nrc.cadc.doi.status.DoiStatus;
import ca.nrc.cadc.doi.status.DoiStatusXmlReader;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.net.HttpDownload;
import ca.nrc.cadc.util.Log4jInit;

/**
 */
public class UpdateDocumentTest extends DocumentTest
{
    private static final Logger log = Logger.getLogger(UpdateDocumentTest.class);

    static final String JSON = "application/json";
    static final String TEST_JOURNAL_REF = "2018, Test Journal ref. ApJ 1000,100";

    static
    {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.auth", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.net", Level.INFO);
    }

    public UpdateDocumentTest() { };
    
    //@Test
    public void testUpdateDocument() throws Throwable
    {
        final Subject s = SSLUtil.createSubject(CADCAUTHTEST_CERT);

        this.buildInitialDocument();
        Subject.doAs(s, new PrivilegedExceptionAction<Object>()
        {
            public Object run() throws Exception
            {
                // post the job
                URL postUrl = new URL(baseURL);

                log.debug("baseURL: " + baseURL);
                log.debug("posting to: " + postUrl);
                
                // Check that the doi server processed the document and added an identifier
                String returnedDoc = postDocument(postUrl, initialDocument);
                Resource resource = xmlReader.read(returnedDoc);
                String returnedIdentifier = resource.getIdentifier().getText();
                Assert.assertFalse("New identifier not received from doi service.", initialResource.getIdentifier().getText().equals(returnedIdentifier));
                
                // Pull the suffix from the identifier
                String[] doiNumberParts = returnedIdentifier.split("/");
                
                try
                {
                    // For DOI status test below
                    URL docURL = new URL(baseURL + "/" + doiNumberParts[1]);
                    Title expectedTitle = resource.getTitles().get(0);
                    Creator expectedCreator = resource.getCreators().get(0);
    
                    // Get the DOI status
                    URL statusURL = new URL(docURL + "/status");
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    HttpDownload getStatus = new HttpDownload(statusURL, baos);
                    getStatus.run();
                    Assert.assertNull("GET " + statusURL.toString() + " in XML failed. ", getStatus.getThrowable());
                    DoiStatusXmlReader statusReader = new DoiStatusXmlReader();
                    DoiStatus doiStatus = statusReader.read(new StringReader(new String(baos.toByteArray(), "UTF-8")));
                    Assert.assertEquals("identifier from DOI status is different", returnedIdentifier, doiStatus.getIdentifier().getText());
                    Assert.assertEquals("title from DOI status is different", expectedTitle.getText(), doiStatus.getTitle().getText());
                    Assert.assertEquals("status is incorrect", Status.DRAFT, doiStatus.getStatus());
                    Assert.assertEquals("journalRef is incorrect", TEST_JOURNAL_REF, doiStatus.journalRef);
                }
                finally
                {
                    // delete containing folder using doiadmin credentials
                    deleteTestFolder(doiNumberParts[1]);
                }
                return resource;
            }
        });
    }
}