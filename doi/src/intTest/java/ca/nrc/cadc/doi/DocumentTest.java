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

import ca.nrc.cadc.net.FileContent;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.URL;
import java.security.PrivilegedExceptionAction;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.security.auth.Subject;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.jdom2.Namespace;
import org.junit.Assert;

import ca.nrc.cadc.auth.SSLUtil;
import ca.nrc.cadc.doi.datacite.Contributor;
import ca.nrc.cadc.doi.datacite.ContributorName;
import ca.nrc.cadc.doi.datacite.Creator;
import ca.nrc.cadc.doi.datacite.CreatorName;
import ca.nrc.cadc.doi.datacite.Description;
import ca.nrc.cadc.doi.datacite.DoiDate;
import ca.nrc.cadc.doi.datacite.DoiParsingException;
import ca.nrc.cadc.doi.datacite.DoiResourceType;
import ca.nrc.cadc.doi.datacite.DoiXmlReader;
import ca.nrc.cadc.doi.datacite.DoiXmlWriter;
import ca.nrc.cadc.doi.datacite.Identifier;
import ca.nrc.cadc.doi.datacite.NameIdentifier;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.datacite.Rights;
import ca.nrc.cadc.doi.datacite.Title;
import ca.nrc.cadc.net.HttpPost;
import ca.nrc.cadc.util.Log4jInit;

/**
 */
public class DocumentTest extends IntTestBase {
    private static final Logger log = Logger.getLogger(DocumentTest.class);

    static final String JSON = "application/json";
    static final String TEST_JOURNAL_REF = "2018, Test Journal ref. ApJ 1000,100";
    static final String NEW_JOURNAL_REF = "2018, Test Journal ref. ApJ 2000,200";

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.auth", Level.INFO);
        Log4jInit.setLevel("ca.nrc.cadc.net", Level.INFO);
    }

    protected Resource initialResource;
    protected DoiXmlReader xmlReader;
    protected String initialDocument;

    public DocumentTest() {
    };

    protected void buildInitialDocument() throws IOException, DoiParsingException {
        // read test xml file
        xmlReader = new DoiXmlReader(true);
        String fileName = "src/test/data/datacite-example-full-dummy-identifier-v4.1.xml";
        FileInputStream fis = new FileInputStream(fileName);
        initialResource = xmlReader.read(fis);
        fis.close();

        // write document generated by reader
        final StringBuilder builder = new StringBuilder();
        DoiXmlWriter writer = new DoiXmlWriter();
        writer.write(initialResource, builder);
        initialDocument = builder.toString();
    }

    protected String postDocument(URL postUrl, String document, String journalRef) {
        log.info("url: " + postUrl.getPath());
        Map<String, Object> params = new HashMap<String, Object>();
        FileContent fc = new FileContent(document, "text/xml");
        params.put("doiMetadata", fc);
        if (journalRef != null) {
            if (journalRef.length() > 0) {
                params.put("journalref", journalRef);
            } else {
                params.put("journalref", "");
            }
        }
        HttpPost httpPost = new HttpPost(postUrl, params, true);
        httpPost.run();

        // Check that there was no exception thrown
        if (httpPost.getThrowable() != null) {
            throw new RuntimeException(httpPost.getResponseBody() + ", " + httpPost.getThrowable());
        }

        // Check that the HttpPost was sent successfully
        Assert.assertEquals("HttpPost failed, return code = " + httpPost.getResponseCode(), httpPost.getResponseCode(),
                200);

        // return the posted document
        return httpPost.getResponseBody();
    }

    protected String createADocument(Subject s) throws Throwable {
        s = SSLUtil.createSubject(CADCAUTHTEST_CERT);
        this.buildInitialDocument();
        String doiSuffix = (String) Subject.doAs(s, new PrivilegedExceptionAction<Object>() {
            public Object run() throws Exception {
                // post the job
                URL postUrl = new URL(baseURL);

                log.debug("baseURL: " + baseURL);
                log.debug("posting to: " + postUrl);

                // Check that the doi server processed the document and added an identifier
                String returnedDoc = postDocument(postUrl, initialDocument, TEST_JOURNAL_REF);
                Resource resource = xmlReader.read(returnedDoc);
                String returnedIdentifier = resource.getIdentifier().getText();

                // Pull the suffix from the identifier
                String[] doiNumberParts = returnedIdentifier.split("/");
                return doiNumberParts[1];
            }
        });

        return doiSuffix;
    }
    
    protected boolean isNull(Object o1, Object o2) {
        return o1 == null && o2 == null;
    }
    
    protected boolean isEqualStrings(String s1, String s2) {
        if (s1 == null) {
            return isNull(s1, s2);
        } else {
            return s1.equals(s2);
        }
    }
    
    protected void compareNull(Object o1, Object o2, String field) {
        if (o1 == null) {
            Assert.assertNull("one " + field + " is not null", o2);
        } else {
            Assert.assertNotNull("one " + field + " is null", o2);
        }
    }

    protected void compareStrings(String s1, String s2, String field) {
        if (!isEqualStrings(s1, s2)) {
            Assert.fail(field + "is different: " + s1 + ", " + s2);
        }
    }

    protected void compareNamespace(Namespace eN, Namespace aN) {
        compareStrings(eN.getPrefix(), aN.getPrefix(), "namespace prefix");
        compareStrings(eN.getURI(), aN.getURI(), "namespace URI");
    }
    
    protected void compareIdentifier(Identifier eId, Identifier aId) {
        compareStrings(eId.getIdentifierType(), aId.getIdentifierType(), "identifierType");
        compareStrings(eId.getText(), aId.getText(), "identifier");
    }

    protected void compareCreatorName(CreatorName cn1, CreatorName cn2) {
        Assert.assertEquals("creatorName is different", cn1.getText(), cn2.getText());
        Assert.assertEquals("nameType is different", cn1.nameType, cn2.nameType);
    }

    protected void compareNameIdentifier(NameIdentifier id1, NameIdentifier id2) {
        compareNull(id1, id2, "nameIdentifier");
        if (id1 != null) {
            compareStrings(id1.getNameIdentifier(), id2.getNameIdentifier(), "nameIdentifier text");
            compareStrings(id1.getNameIdentifierScheme(), id2.getNameIdentifierScheme(),
                    "nameIdentifierScheme");
            compareNull(id1.schemeURI, id2.schemeURI, "schemeURI");
            if (id1.schemeURI != null) {
                Assert.assertTrue("schemeURI is different", id1.schemeURI.equals(id2.schemeURI));
            }
        }
    }

    protected void compareCreator(Creator creator1, Creator creator2) {
        compareCreatorName(creator1.getCreatorName(), creator2.getCreatorName());
        compareNameIdentifier(creator1.nameIdentifier, creator2.nameIdentifier);
        compareStrings(creator1.givenName, creator2.givenName, "givenName");
        compareStrings(creator1.familyName, creator2.familyName, "familyName");
        compareStrings(creator1.affiliation, creator2.affiliation, "affiliation");
    }

    protected void compareCreators(List<Creator> c1, List<Creator> c2) {
        Assert.assertNotNull("missing expected creators", c1);
        Assert.assertNotNull("missing actual creators", c2);
        Assert.assertEquals("different number of creators", c1.size(), c2.size());
        for (int i = 0; i < c1.size(); i++) {
            compareCreator(c1.get(i), c2.get(i));
        }
    }

    protected void compareResourceType(DoiResourceType eRT, DoiResourceType aRT, String field) {
        compareStrings(eRT.resourceTypeGeneral, aRT.resourceTypeGeneral, "resourceTypeGeneral");
        compareStrings(eRT.getResourceType().getValue(), aRT.getResourceType().getValue(), "resourceType");
    }
    
    protected void compareTitle(Title t1, Title t2) {
        compareStrings(t1.getLang(), t2.getLang(), "lang");
        compareStrings(t1.getText(), t2.getText(), "title");
        compareNull(t1.titleType, t2.titleType, "titleType");
        if (t1.titleType != null) {
            Assert.assertEquals("titleType is different", t1.titleType, t2.titleType);
        }
    }

    protected void compareTitles(List<Title> t1, List<Title> t2) {
        Assert.assertNotNull("missing expected titles", t1);
        Assert.assertNotNull("missing actual titles", t2);
        Assert.assertEquals("Number of titles is different", t1.size(), t2.size());
        for (int i = 0; i < t1.size(); i++) {
            compareTitle(t1.get(i), t2.get(i));
        }
    }

    protected boolean isEqualRights(Rights eR, Rights aR) {
        boolean same = isNull(eR, aR);
        if (!same && eR != null && aR != null) {
            same = isNull(eR.rightsURI, aR.rightsURI);
            if (!same && eR.rightsURI != null && aR.rightsURI != null) {
                same = eR.rightsURI.equals(aR.rightsURI);
            }
        }
        
        if (same && eR != null) {
            same = isEqualStrings(eR.getLang(), aR.getLang()) && isEqualStrings(eR.getText(), aR.getText());
        }
        
        return same;
    }
    
    protected void compareRightsList(List<Rights> eRL, List<Rights> aRL) {
        compareNull(eRL, aRL, "rightsList");
        if (eRL != null) {
            Assert.assertEquals("RightList size is different", eRL.size(), aRL.size());
            for (Rights eR : eRL) {
                boolean found = false;
                for (Rights aR : aRL) {
                    found = isEqualRights(eR, aR);
                    if (found) {
                        break;
                    }
                }
                
                Assert.assertTrue("missing rogjts: " + eR, found);
            }
        }
    }
    
    protected boolean isEqualContributorName(ContributorName eCN, ContributorName aCN) {
        boolean same = isNull(eCN, aCN);
        if (!same && eCN != null && aCN != null) {
            same = isNull(eCN.nameType, aCN.nameType);
            if (!same && eCN.nameType != null && aCN.nameType != null) {
                same = eCN.nameType == aCN.nameType;
            }
        }
        
        if (same && eCN != null) {
            same = isEqualStrings(eCN.getText(), aCN.getText());
        }
        
        return same;
    }
    
    protected boolean isEqualNameIdentifier(NameIdentifier eNId, NameIdentifier aNId) {
        boolean same = isNull(eNId, aNId);
        if (!same && eNId != null && aNId != null) {
            same = isNull(eNId.schemeURI, aNId.schemeURI);
            if (!same && eNId.schemeURI != null && aNId.schemeURI != null) {
                same = eNId.schemeURI.equals(aNId.schemeURI);
            }
        }
        
        if (same && eNId != null) {
            same = isEqualStrings(eNId.getNameIdentifier(), aNId.getNameIdentifier()) &&
                   isEqualStrings(eNId.getNameIdentifierScheme(), aNId.getNameIdentifierScheme());
        }
        return same;
    }
    
    protected boolean isEqualContributor(Contributor eC, Contributor aC) {
        boolean same = isNull(eC, aC);
        if (!same && eC != null && aC != null) {
            same = isEqualStrings(eC.givenName, aC.givenName) &&
                   isEqualStrings(eC.familyName, aC.familyName) &&
                   isEqualStrings(eC.affiliation, aC.affiliation) &&
                   isEqualNameIdentifier(eC.nameIdentifier, aC.nameIdentifier);
        }
        
        if (same && eC != null) {
            same = isEqualContributorName(eC.getContributorName(), aC.getContributorName()) &&
                   eC.getContributorType() == aC.getContributorType();
        }
        
        return same;
    }
    
    protected void compareContributors(List<Contributor> eCL, List<Contributor> aCL) {
        compareNull(eCL, aCL, "contributors");
        if (eCL != null) {
            Assert.assertEquals("Contributors size is different", eCL.size(), aCL.size());
            for (Contributor eC : eCL) {
                boolean found = false;
                for (Contributor aC : aCL) {
                    found = isEqualContributor(eC, aC);
                    if (found) {
                        break;
                    }
                }
                
                Assert.assertTrue("missing contributor: " + eC, found);
            }
        }
    }
    
    protected boolean isEqualDate(DoiDate eD, DoiDate aD) {
        boolean same = isNull(eD, aD);
        if (!same && eD != null && aD != null) {
            same = isEqualStrings(eD.dateInformation, aD.dateInformation);
        }
        
        if (same && eD != null) {
            same = isEqualStrings(eD.getIsoDate(), aD.getIsoDate()) &&
                   eD.getDateType() == aD.getDateType();
        }
        
        return same;
    }
    
    protected void compareDates(List<DoiDate> eDL, List<DoiDate> aDL) {
        compareNull(eDL, aDL, "dates");
        if (eDL != null) {
            Assert.assertEquals("Dates size is different", eDL.size(), aDL.size());
            for (DoiDate eD : eDL) {
                boolean found = false;
                for (DoiDate aD : aDL) {
                    found = isEqualDate(eD, aD);
                    if (found) {
                        break;
                    }
                }
                
                Assert.assertTrue("missing date: " + eD, found);
            }
        }
    }
    
    protected boolean isEqualDescription(Description eD, Description aD) {
        boolean same = isNull(eD, aD);
        if (!same && eD != null && aD != null) {
            same = isEqualStrings(eD.getLang(), aD.getLang()) &&
                   isEqualStrings(eD.getText(), aD.getText()) &&
                   eD.getDescriptionType() == aD.getDescriptionType();
        }
        
        return same;
    }

    protected void compareDescriptions(List<Description> eDL, List<Description> aDL) {
        compareNull(eDL, aDL, "descriptions");
        if (eDL != null) {
            Assert.assertEquals("Descriptions size is different", eDL.size(), aDL.size());
            for (Description eD : eDL) {
                boolean found = false;
                for (Description aD : aDL) {
                    found = isEqualDescription(eD, aD);
                    if (found) {
                        break;
                    }
                }
                
                Assert.assertTrue("missing description: " + eD, found);
            }
        }
    }
    
    protected void compareResource(Resource eR, Resource aR) {
        compareNamespace(eR.getNamespace(), aR.getNamespace());
        compareIdentifier(eR.getIdentifier(), aR.getIdentifier());
        compareCreators(eR.getCreators(), aR.getCreators());
        compareStrings(eR.getPublisher(), aR.getPublisher(), "publisher");
        compareStrings(eR.getPublicationYear(), aR.getPublicationYear(), "publicationyear");
        compareResourceType(eR.getResourceType(), aR.getResourceType(), "resourceType");
        compareTitles(eR.getTitles(), aR.getTitles());
        compareRightsList(eR.rightsList, aR.rightsList);
        compareContributors(eR.contributors, aR.contributors);
        compareDates(eR.dates, aR.dates);
        compareDescriptions(eR.descriptions, aR.descriptions);
        compareStrings(eR.language, aR.language, "language");
    }
}