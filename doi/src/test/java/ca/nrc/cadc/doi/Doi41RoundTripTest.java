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
 *  : 5 $
 *
 ************************************************************************
 */

package ca.nrc.cadc.doi;

import ca.nrc.cadc.doi.datacite.Affiliation;
import ca.nrc.cadc.doi.datacite.Contributor;
import ca.nrc.cadc.doi.datacite.ContributorName;
import ca.nrc.cadc.doi.datacite.ContributorType;
import ca.nrc.cadc.doi.datacite.Creator;
import ca.nrc.cadc.doi.datacite.CreatorName;
import ca.nrc.cadc.doi.datacite.Date;
import ca.nrc.cadc.doi.datacite.DateType;
import ca.nrc.cadc.doi.datacite.Description;
import ca.nrc.cadc.doi.datacite.DescriptionType;
import ca.nrc.cadc.doi.datacite.DoiResourceType;
import ca.nrc.cadc.doi.datacite.Identifier;
import ca.nrc.cadc.doi.datacite.Language;
import ca.nrc.cadc.doi.datacite.NameIdentifier;
import ca.nrc.cadc.doi.datacite.NameType;
import ca.nrc.cadc.doi.datacite.PublicationYear;
import ca.nrc.cadc.doi.datacite.Publisher;
import ca.nrc.cadc.doi.datacite.RelatedIdentifier;
import ca.nrc.cadc.doi.datacite.RelatedIdentifierType;
import ca.nrc.cadc.doi.datacite.RelationType;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.datacite.ResourceType;
import ca.nrc.cadc.doi.datacite.Rights;
import ca.nrc.cadc.doi.datacite.Size;
import ca.nrc.cadc.doi.datacite.Title;
import ca.nrc.cadc.doi.datacite.TitleType;
import ca.nrc.cadc.doi.io.DoiJsonReader;
import ca.nrc.cadc.doi.io.DoiJsonWriter;
import ca.nrc.cadc.doi.io.DoiXmlReader;
import ca.nrc.cadc.doi.io.DoiXmlWriter;
import ca.nrc.cadc.util.Log4jInit;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.jdom2.Namespace;
import org.junit.Assert;
import org.junit.Test;

public class Doi41RoundTripTest extends BaseTest {
    private static final Logger log = Logger.getLogger(Doi41RoundTripTest.class);

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.DEBUG);
    }

    @Test
    public void xmlMinSchemaTest() {
        doXMLTest(false);
    }

    @Test
    public void xmlFullSchemaTest() {
        doXMLTest(true);
    }

    @Test
    public void jsonMinSchemaTest() {
        doJSONTest(false);
    }

    @Test
    public void jsonFullSchemaTest() {
        doJSONTest(true);
    }

    void doXMLTest(boolean full) {
        try {
            Resource expected = getResource(full);
            StringBuilder sb = new StringBuilder();

            DoiXmlWriter writer = new DoiXmlWriter();
            writer.write(expected, sb);
            log.debug(sb.toString());

            DoiXmlReader reader = new DoiXmlReader();
            Resource actual = reader.read(sb.toString());

            compareResource(expected, actual);
        } catch (Exception e) {
            log.error("Unexpected exception", e);
            Assert.fail(e.getMessage());
        }
    }

    void doJSONTest(boolean full) {
        try {
            Resource expected = getResource(full);
            StringBuilder sb = new StringBuilder();

            DoiJsonWriter writer = new DoiJsonWriter();
            writer.write(expected, sb);
            log.debug(sb.toString());

            DoiJsonReader reader = new DoiJsonReader();
            Resource actual = reader.read(sb.toString());

            compareResource(expected, actual);
        } catch (Exception e) {
            log.error("Unexpected exception", e);
            Assert.fail(e.getMessage());
        }
    }

    /**
     *
     */
    Resource getResource(boolean full) {

        Resource resource =  new Resource(getNamespace(), getIdentifier(), getCreators(full),
                getTitles(full), getPublisher(full), getPublicationYear(), getDoiResourceType());
        if (full) {
            resource.contributors = getContributors(full);
            resource.dates = getDates(full);
            resource.sizes = getSizes(full);
            resource.language = getLanguage();
            resource.relatedIdentifiers = getRelatedIdentifiers(full);
            resource.rightsList = getRightsList(full);
            resource.descriptions = getDescriptions(full);
        }
        return resource;
    }

    protected Namespace getNamespace() {
        return Namespace.getNamespace("http://datacite.org/schema/kernel-4");
    }

    // required
    protected Identifier getIdentifier() {
        return new Identifier("10.5072/example", "DOI");
    }

    protected List<Creator> getCreators(boolean full) {
        List<Creator> creators = new ArrayList<>();
        Creator creator = new Creator(getCreatorName(full));
        if (full) {
            creator.givenName = "Jill";
            creator.familyName = "Smith";
            creator.nameIdentifier = getNameIdentifier(full);
            creator.affiliation = getAffiliation(full);
        }
        creators.add(creator);
        if (full) {
            Creator other = new Creator(getCreatorName(full));
            other.givenName = "Jack";
            other.familyName = "Jones";
            other.nameIdentifier = getNameIdentifier(full);
            other.affiliation = getAffiliation(full);
            creators.add(other);
        }
        return creators;
    }

    protected List<Title> getTitles(boolean full) {
        List<Title> titles = new ArrayList<>();
        Title title = new Title("Test title one");
        if (full) {
            title.titleType = TitleType.SUBTITLE;
        }
        titles.add(title);
        if (full) {
            Title other = new Title("Test title two");
            other.titleType = TitleType.ALTERNATIVE_TITLE;
            titles.add(other);
        }
        return titles;
    }

    protected Publisher getPublisher(boolean full) {
        return new Publisher("Test publisher");
    }

    protected PublicationYear getPublicationYear() {
        return new PublicationYear("1999");
    }

    protected DoiResourceType getDoiResourceType() {
        DoiResourceType doiResourceType = new DoiResourceType(ResourceType.DATA_SET);
        doiResourceType.text = "XML";
        return doiResourceType;
    }

    // optional
    protected List<Contributor> getContributors(boolean full) {
        List<Contributor> contributors = new ArrayList<>();
        ContributorName contributorName = new ContributorName("Test contributor");
        if (full) {
            contributorName.nameType = NameType.ORGANIZATIONAL;
        }
        Contributor contributor = new Contributor(contributorName, ContributorType.RESEARCHER);
        if (full) {
            contributor.givenName = "Jack";
            contributor.familyName = "Jones";
            contributor.nameIdentifier = getNameIdentifier(full);
            contributor.affiliation = getAffiliation(full);
        }
        contributors.add(contributor);
        if (full) {
            Contributor other = new Contributor(contributorName, ContributorType.RESEARCHER);
            other.givenName = "Jill";
            other.familyName = "Smith";
            other.nameIdentifier = getNameIdentifier(full);
            other.affiliation = getAffiliation(full);
            contributors.add(other);
        }
        return contributors;
    }

    protected List<Date> getDates(boolean full) {
        List<Date> dates = new ArrayList<>();
        Date date = new Date("1999-12-31", DateType.ACCEPTED);
        if (full) {
            date.dateInformation = "Some date info";
        }
        dates.add(date);
        if (full) {
            Date other = new Date("2000-05-04", DateType.UPDATED);
            other.dateInformation = "More date info";
            dates.add(other);
        }
        return dates;
    }

    protected Language getLanguage() {
        return new Language("en-US");
    }

    protected List<RelatedIdentifier> getRelatedIdentifiers(boolean full) {
        List<RelatedIdentifier> identifiers = new ArrayList<>();
        RelatedIdentifier identifier = new RelatedIdentifier("Related identifier one",
                        RelatedIdentifierType.URL, RelationType.IS_PUBLISHED_IN);
        if (full) {
            identifier.resourceTypeGeneral = ResourceType.CONFERENCE_PAPER;
            identifier.relatedMetadataScheme = "Related Metadata Scheme one";
            identifier.schemeURI = URI.create("http://example.com");
            identifier.schemeType = "Scheme type one";
        }
        identifiers.add(identifier);
        if (full) {
            RelatedIdentifier other = new RelatedIdentifier("Related identifier two",
                    RelatedIdentifierType.ARK, RelationType.IS_REVIEWED_BY);
            other.resourceTypeGeneral = ResourceType.INTERACTIVE_RESOURCE;
            other.relatedMetadataScheme = "Related metadata scheme two";
            other.schemeURI = URI.create("http://example.com");
            other.schemeType = "Scheme type two";
            identifiers.add(other);
        }
        return identifiers;
    }

    protected List<Size> getSizes(boolean full) {
        List<Size> sizes = new ArrayList<>();
        sizes.add(new Size("1024 KB"));
        if (full) {
            sizes.add(new Size("43"));
        }
        return sizes;
    }

    protected List<Rights> getRightsList(boolean full) {
        List<Rights> rightsList = new ArrayList<>();
        rightsList.add(getRights(full));
        rightsList.add(getRights(full));
        return rightsList;
    }

    protected Rights getRights(boolean full) {
        Rights rights = new Rights("Rights");
        if (full) {
            rights.rightsURI = URI.create("http://example.com");
            rights.lang = "en-US";
        }
        return rights;
    }

    protected List<Description> getDescriptions(boolean full) {
        List<Description> descriptions = new ArrayList<>();
        Description description = new Description("Description one", DescriptionType.ABSTRACT);
        if (full) {
            description.lang = "en-US";
        }
        descriptions.add(description);
        if (full) {
            Description other = new Description("Description two", DescriptionType.OTHER);
            other.lang = "en-GB";
            descriptions.add(other);
        }
        return descriptions;
    }

    protected CreatorName getCreatorName(boolean full) {
        CreatorName creatorName = new CreatorName("Miller, Elizabeth");
        if (full) {
            creatorName.nameType = NameType.ORGANIZATIONAL;
        }
        return creatorName;
    }

    protected NameIdentifier getNameIdentifier(boolean full) {
        NameIdentifier nameIdentifier = new NameIdentifier("0000-0001-5000-0007", "ORCID");
        if (full) {
            nameIdentifier.schemeURI = URI.create("http://orcid.org/");
        }
        return nameIdentifier;
    }

    protected Affiliation getAffiliation(boolean full) {
        return new Affiliation("DataCite");
    }


}
