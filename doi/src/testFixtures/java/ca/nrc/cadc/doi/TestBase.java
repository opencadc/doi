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
import ca.nrc.cadc.doi.datacite.DataCiteResourceType;
import ca.nrc.cadc.doi.datacite.Date;
import ca.nrc.cadc.doi.datacite.DateType;
import ca.nrc.cadc.doi.datacite.Description;
import ca.nrc.cadc.doi.datacite.DescriptionType;
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
import java.io.File;
import java.net.URI;
import java.nio.file.Path;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.jdom2.Namespace;
import org.junit.Assert;

/**
 *
 */
public class TestBase {

    List<Path> getTestFiles(final String path) {
        if (path == null) {
            throw new IllegalArgumentException("path is null");
        }
        File testDir = new File(path);
        if (!testDir.isDirectory()) {
            throw new IllegalArgumentException(path + " is not a directory");
        }
        return Stream.of(testDir.listFiles()).filter(file -> !file.isDirectory()).map(File::toPath).collect(Collectors.toList());
    }


    /**
     * Methods to build a resource for testing.
     * <resource xmlns="http://datacite.org/schema/kernel-4">
     *   <identifier identifierType="DOI">10.80791/6mtxj-tqwh1.test</identifier>
     *   <creators>
     *     <creator>
     *       <creatorName nameType="Organizational" xml:lang="en-GB">One, Foo</creatorName>
     *       <givenName>Jill</givenName>
     *       <familyName>Smith</familyName>
     *       <nameIdentifier nameIdentifierScheme="ORCID" schemeURI="http://orcid.org/">0000-0001-5000-0007</nameIdentifier>
     *       <affiliation affiliationIdentifier="https://ror.org/04wxnsj81" affiliationIdentifierScheme="ROR" schemeURI="https://ror.org">DataCite</affiliation>
     *     </creator>
     *   </creators>
     *   <titles>
     *     <title titleType="Subtitle">Test title One</title>
     *   </titles>
     *   <publisher>CADC</publisher>
     *   <publicationYear>1999</publicationYear>
     *   <resourceType resourceTypeGeneral="Dataset">XML</resourceType>
     *   <dates>
     *     <date dateType="Created">2024-07-02</date>
     *   </dates>
     * </resource>
     */
    Resource getTestResource(boolean optionalProperties, boolean optionalAttributes, boolean intTestProperties) {

        Namespace namespace = getNamespace();
        Identifier identifier = getIdentifier();
        List<Creator> creators = getCreators(optionalProperties, optionalAttributes);
        List<Title> titles = getTitles(optionalProperties, optionalAttributes);
        Publisher publisher = getPublisher(optionalProperties);
        PublicationYear publicationYear = getPublicationYear();
        ResourceType resourceType = getResourceType();

        Resource resource =  new Resource(namespace, identifier, creators, titles, publisher, publicationYear, resourceType);

        if (optionalProperties) {
            resource.contributors = getContributors(optionalAttributes);
            resource.dates = getDates(optionalAttributes);
            resource.sizes = getSizes(optionalAttributes);
            resource.language = getLanguage();
            resource.relatedIdentifiers = getRelatedIdentifiers(optionalAttributes);
            resource.rightsList = getRightsList(optionalAttributes);
            resource.descriptions = getDescriptions(optionalAttributes);
            if (!intTestProperties) {

            }
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

    protected List<Creator> getCreators(boolean optionalProperties, boolean optionalAttributes) {
        List<Creator> creators = new ArrayList<>();
        Creator creatorOne = new Creator(getCreatorName("One, Foo", optionalAttributes));
        if (optionalAttributes) {
            creatorOne.givenName = "Jill";
            creatorOne.familyName = "Smith";
            creatorOne.nameIdentifier = getNameIdentifier(optionalAttributes);
            creatorOne.affiliation = getAffiliation(optionalAttributes);
        }
        creators.add(creatorOne);
        if (optionalProperties) {
            Creator creatorTwo = new Creator(getCreatorName("Two, Foo", optionalAttributes));
            if (optionalAttributes) {
                creatorTwo.givenName = "Jack";
                creatorTwo.familyName = "Jones";
                creatorTwo.nameIdentifier = getNameIdentifier(optionalAttributes);
                creatorTwo.affiliation = getAffiliation(optionalAttributes);
            }
            creators.add(creatorTwo);
        }
        return creators;
    }

    protected CreatorName getCreatorName(String value, boolean optionalAttributes) {
        CreatorName creatorName = new CreatorName(value);
        if (optionalAttributes) {
            creatorName.nameType = NameType.ORGANIZATIONAL;
            creatorName.lang = "en-GB";
        }
        return creatorName;
    }

    protected List<Title> getTitles(boolean optionalProperties, boolean optionalAttributes) {
        List<Title> titles = new ArrayList<>();
        Title titleOne = new Title("Test title One");
        if (optionalAttributes) {
            titleOne.titleType = TitleType.SUBTITLE;
        }
        titles.add(titleOne);
        if (optionalProperties) {
            Title other = new Title("Test title Two");
            if (optionalAttributes) {
                other.titleType = TitleType.ALTERNATIVE_TITLE;
            }
            titles.add(other);
        }
        return titles;
    }

    protected Publisher getPublisher(boolean optionalAttributes) {
        Publisher publisher = new CADCPublisher();
        if (optionalAttributes) {
            publisher.publisherIdentifier = "https://ror.org/04z8jg394";
            publisher.publisherIdentifierScheme = "ROR";
            publisher.schemeURI = URI.create("https://ror.org/");
            publisher.lang = "en";
        }
        return publisher;
    }

    protected PublicationYear getPublicationYear() {
        return new PublicationYear("1999");
    }

    protected ResourceType getResourceType() {
        ResourceType resourceType = new CADCResourceType();
        resourceType.value = "XML";
        return resourceType;
    }

    // optional
    protected List<Contributor> getContributors(boolean optionalAttributes) {
        List<Contributor> contributors = new ArrayList<>();
        ContributorName contributorNameOne = new ContributorName("Test ContributorName One");
        if (optionalAttributes) {
            contributorNameOne.nameType = NameType.ORGANIZATIONAL;
        }
        Contributor contributorOne = new Contributor(contributorNameOne, ContributorType.RESEARCHER);
        if (optionalAttributes) {
            contributorOne.givenName = "Given Name One";
            contributorOne.familyName = "Family Name One";
            contributorOne.nameIdentifier = getNameIdentifier(optionalAttributes);
            contributorOne.affiliation = getAffiliation(optionalAttributes);
        }
        contributors.add(contributorOne);
        ContributorName contributorNameTwo = new ContributorName("Test ContributorName Two");
        if (optionalAttributes) {
            contributorNameTwo.nameType = NameType.ORGANIZATIONAL;
        }
        Contributor contributorTwo = new Contributor(contributorNameTwo, ContributorType.RESEARCHER);
        if (optionalAttributes) {
            contributorTwo.givenName = "Given Name Two";
            contributorTwo.familyName = "Family Name Two";
            contributorTwo.nameIdentifier = getNameIdentifier(optionalAttributes);
            contributorTwo.affiliation = getAffiliation(optionalAttributes);
        }
        contributors.add(contributorTwo);
        return contributors;
    }

    protected List<Date> getDates(boolean optionalAttributes) {
        List<Date> dates = new ArrayList<>();
        String createdDate = new SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date());
        Date date = new Date(createdDate, DateType.CREATED);
        if (optionalAttributes) {
            date.dateInformation = "Date Info One";
        }
        dates.add(date);
        Date other = new Date("2000-05-02", DateType.UPDATED);
        if (optionalAttributes) {
            other.dateInformation = "Date Info Two";
        }
        dates.add(other);
        return dates;
    }

    protected Language getLanguage() {
        return new Language("en-US");
    }

    protected List<RelatedIdentifier> getRelatedIdentifiers(boolean optionalAttributes) {
        List<RelatedIdentifier> identifiers = new ArrayList<>();
        RelatedIdentifier identifier = new RelatedIdentifier("Related Identifier One",
                RelatedIdentifierType.URL, RelationType.IS_PUBLISHED_IN);
        if (optionalAttributes) {
            identifier.resourceTypeGeneral = DataCiteResourceType.CONFERENCE_PAPER;
            identifier.relatedMetadataScheme = "Related Metadata Scheme One";
            identifier.schemeURI = URI.create("http://example.com/one");
            identifier.schemeType = "Scheme Type One";
        }
        identifiers.add(identifier);
        if (optionalAttributes) {
            RelatedIdentifier other = new RelatedIdentifier("Related Identifier Two",
                    RelatedIdentifierType.ARK, RelationType.IS_REVIEWED_BY);
            other.resourceTypeGeneral = DataCiteResourceType.INTERACTIVE_RESOURCE;
            other.relatedMetadataScheme = "Related Metadata Scheme Two";
            other.schemeURI = URI.create("http://example.com/two");
            other.schemeType = "Scheme Type Two";
            identifiers.add(other);
        }
        return identifiers;
    }

    protected List<Size> getSizes(boolean optionalAttributes) {
        List<Size> sizes = new ArrayList<>();
        sizes.add(new Size("1024 KB"));
        if (optionalAttributes) {
            sizes.add(new Size("43"));
        }
        return sizes;
    }

    protected List<Rights> getRightsList(boolean optionalAttributes) {
        List<Rights> rightsList = new ArrayList<>();
        rightsList.add(getRights("One", optionalAttributes));
        rightsList.add(getRights("Two", optionalAttributes));
        return rightsList;
    }

    protected Rights getRights(String value, boolean optionalAttributes) {
        Rights rights = new Rights(value);
        if (optionalAttributes) {
            rights.rightsURI = URI.create("https://creativecommons.org/licenses/by/4.0/" + value);
            rights.rightsIdentifier = "CC-BY-4.0-" + value;
            rights.rightsIdentifierScheme = "ROR-" + value;
            rights.schemeURI = URI.create("https://spdx.org/licenses/" + value);
            rights.lang = "en-US";
        }
        return rights;
    }

    protected List<Description> getDescriptions(boolean optionalAttributes) {
        List<Description> descriptions = new ArrayList<>();
        Description descriptionOne = new Description("Description One", DescriptionType.ABSTRACT);
        if (optionalAttributes) {
            descriptionOne.lang = "en-US";
        }
        descriptions.add(descriptionOne);
        if (optionalAttributes) {
            Description descriptionTwo = new Description("Description Two", DescriptionType.OTHER);
            descriptionTwo.lang = "en-GB";
            descriptions.add(descriptionTwo);
        }
        return descriptions;
    }

    protected NameIdentifier getNameIdentifier(boolean optionalAttributes) {
        NameIdentifier nameIdentifier = new NameIdentifier("0000-0001-5000-0007", "ORCID");
        if (optionalAttributes) {
            nameIdentifier.schemeURI = URI.create("http://orcid.org/");
        }
        return nameIdentifier;
    }

    protected Affiliation getAffiliation(boolean optionalAttributes) {
        Affiliation affiliation = new Affiliation("DataCite");
        if (optionalAttributes) {
            affiliation.affiliationIdentifier = "https://ror.org/04wxnsj81";
            affiliation.affiliationIdentifierScheme = "ROR";
            affiliation.schemeURI = URI.create("https://ror.org");
        }
        return affiliation;
    }

    /*
     * Method to update a resource from another resource.
     *
     * Resource resource =  new Resource(namespace, identifier, creators, titles, publisher, publicationYear, resourceType);

        if (optionalProperties) {
            resource.contributors = getContributors(optionalAttributes);
            resource.dates = getDates(optionalAttributes);
            resource.sizes = getSizes(optionalAttributes);
            resource.language = getLanguage();
            resource.relatedIdentifiers = getRelatedIdentifiers(optionalAttributes);
            resource.rightsList = getRightsList(optionalAttributes);
            resource.descriptions = getDescriptions(optionalAttributes);
        }
     */
    void updateResource(Resource destination, Resource source) {

    }

    /*
     * Methods to compare resource children.
     */
    void compareResource(Resource expected, Resource actual) {
        compareResource(expected, actual,true);
    }

    void compareResource(Resource expected, Resource actual, boolean compareIdentifier) {
        // required
        compareNamespace(expected.getNamespace(), actual.getNamespace());
        if (compareIdentifier) {
            compareIdentifier(expected.getIdentifier(), actual.getIdentifier());
        }
        compareCreators(expected.getCreators(), actual.getCreators());
        compareTitles(expected.getTitles(), actual.getTitles());
        comparePublisher(expected.getPublisher(), actual.getPublisher());
        comparePublicationYear(expected.getPublicationYear(), actual.getPublicationYear());
        compareResourceType(expected.getResourceType(),actual.getResourceType());

        // optional
        compareContributors(expected.contributors, actual.contributors);
        compareDates(expected.dates, actual.dates);
        compareLanguage(expected.language, actual.language);
        compareRelatedIdentifiers(expected.relatedIdentifiers, actual.relatedIdentifiers);
        compareSizes(expected.sizes, actual.sizes);
        compareRightsList(expected.rightsList, actual.rightsList);
        compareDescriptions(expected.descriptions, actual.descriptions);
    }

    void compareNamespace(Namespace expected, Namespace actual) {
        Assert.assertNotNull("expected Namespace is null", expected);
        Assert.assertNotNull("actual Namespace is null", actual);
        Assert.assertEquals(expected.getPrefix(), actual.getPrefix());
        Assert.assertEquals(expected.getURI(), actual.getURI());
    }

    void compareIdentifier(Identifier expected, Identifier actual) {
        Assert.assertNotNull("expected Identifier is null", expected);
        Assert.assertNotNull("actual Identifier is null", actual);
        Assert.assertEquals(expected.getValue(), actual.getValue());
        Assert.assertEquals(expected.getIdentifierType(), actual.getIdentifierType());
    }

    void compareCreators(List<Creator> expected, List<Creator> actual) {
        Assert.assertNotNull("expected Creator's list is null", expected);
        Assert.assertNotNull("actual Creator's list is null", actual);
        Assert.assertFalse("expected Creator's list is empty", expected.isEmpty());
        Assert.assertFalse("actual Creator's list is empty", actual.isEmpty());
        Assert.assertEquals("list sizes are not equal", expected.size(), actual.size());
        for (int i = 0; i < expected.size(); i++) {
            compareCreator(expected.get(i), actual.get(i));
        }
    }

    void compareCreator(Creator expected, Creator actual) {
        Assert.assertNotNull("expected Creator is null", expected);
        Assert.assertNotNull("actual Creator is null", actual);
        compareCreatorName(expected.getCreatorName(), actual.getCreatorName());
        Assert.assertEquals(expected.givenName, actual.givenName);
        Assert.assertEquals(expected.familyName, actual.familyName);
        Assert.assertEquals(expected.lang, actual.lang);
        compareNameIdentifier(expected.nameIdentifier, actual.nameIdentifier);
        compareAffiliation(expected.affiliation, actual.affiliation);
    }

    void compareCreatorName(CreatorName expected, CreatorName actual) {
        Assert.assertNotNull("expected CreatorName is null", expected);
        Assert.assertNotNull("actual CreatorName is null", actual);
        Assert.assertEquals(expected.getValue(), actual.getValue());
        Assert.assertEquals(expected.nameType, actual.nameType);
        Assert.assertEquals(expected.lang, actual.lang);
    }

    void compareTitles(List<Title> expected, List<Title> actual) {
        Assert.assertNotNull("expected Title's is null", expected);
        Assert.assertNotNull("actual Title's is null", actual);
        Assert.assertFalse("expected Title's list is empty", expected.isEmpty());
        Assert.assertFalse("actual Title's list is empty", actual.isEmpty());
        Assert.assertEquals("list sizes are not equal", expected.size(), actual.size());
        for (int i = 0; i < expected.size(); i++) {
            compareTitle(expected.get(i), actual.get(i));
        }
    }

    void compareTitle(Title expected, Title actual) {
        Assert.assertEquals(expected.getValue(), actual.getValue());
        Assert.assertEquals(expected.titleType, actual.titleType);
        Assert.assertEquals(expected.lang, actual.lang);
    }

    void comparePublisher(Publisher expected, Publisher actual) {
        Assert.assertNotNull("expected Publisher is null", expected);
        Assert.assertNotNull("actual Publisher is null", actual);
        Assert.assertEquals(expected.getValue(), actual.getValue());
        Assert.assertEquals(expected.publisherIdentifier, actual.publisherIdentifier);
        Assert.assertEquals(expected.publisherIdentifierScheme, actual.publisherIdentifierScheme);
        Assert.assertEquals(expected.schemeURI, actual.schemeURI);
        Assert.assertEquals(expected.lang, actual.lang);
    }

    void comparePublicationYear(PublicationYear expected, PublicationYear actual) {
        Assert.assertNotNull("expected PublicationYear is null", expected);
        Assert.assertNotNull("actual PublicationYear is null", actual);
        Assert.assertEquals(expected.getValue(), actual.getValue());
    }

    void compareResourceType(ResourceType expected, ResourceType actual) {
        Assert.assertNotNull("expected ResourceType is null", expected);
        Assert.assertNotNull("actual ResourceType is null", actual);
        Assert.assertEquals(expected.getResourceTypeGeneral(), actual.getResourceTypeGeneral());
        Assert.assertEquals(expected.value, actual.value);
    }

    void compareContributors(List<Contributor> expected, List<Contributor> actual) {
        if (isNull(expected, actual, "Dates")) {
            return;
        }
        Assert.assertEquals("list sizes are not equal", expected.size(), actual.size());
        for (int i = 0; i < expected.size(); i++) {
            compareContributor(expected.get(i), actual.get(i));
        }
    }

    void compareContributor(Contributor expected, Contributor actual) {
        Assert.assertNotNull("expected Contributor is null", expected);
        Assert.assertNotNull("actual Contributor is null", actual);
        compareContributorName(expected.getContributorName(), actual.getContributorName());
        compareContributorType(expected.getContributorType(), actual.getContributorType());
        Assert.assertEquals(expected.givenName, actual.givenName);
        Assert.assertEquals(expected.familyName, actual.familyName);
        compareNameIdentifier(expected.nameIdentifier, actual.nameIdentifier);
        compareAffiliation(expected.affiliation, actual.affiliation);
    }

    void compareContributorName(ContributorName expected, ContributorName actual) {
        Assert.assertNotNull("expected ContributorName is null", expected);
        Assert.assertNotNull("actual ContributorName is null", actual);
        Assert.assertEquals(expected.getValue(), actual.getValue());
        Assert.assertEquals(expected.nameType, actual.nameType);
        Assert.assertEquals(expected.lang, actual.lang);
    }

    void compareContributorType(ContributorType expected, ContributorType actual) {
        Assert.assertNotNull("expected ContributorType is null", expected);
        Assert.assertNotNull("actual ContributorType is null", actual);
        Assert.assertEquals(expected, actual);
    }

    void compareDates(List<Date> expected, List<Date> actual) {
        if (isNull(expected, actual, "Dates")) {
            return;
        }
        Assert.assertEquals("list sizes are not equal", expected.size(), actual.size());
        for (int i = 0; i < expected.size(); i++) {
            compareDate(expected.get(i), actual.get(i));
        }
    }

    void compareDate(Date expected, Date actual) {
        Assert.assertEquals(expected.getValue(), actual.getValue());
        Assert.assertEquals(expected.getDateType(), actual.getDateType());
        Assert.assertEquals(expected.dateInformation, actual.dateInformation);
    }

    void compareLanguage(Language expected, Language actual) {
        if (isNull(expected, actual, "RelatedIdentifiers")) {
            return;
        }
        Assert.assertEquals(expected.getValue(), actual.getValue());
    }

    void compareRelatedIdentifiers(List<RelatedIdentifier> expected, List<RelatedIdentifier> actual) {
        if (isNull(expected, actual, "RelatedIdentifiers")) {
            return;
        }
        Assert.assertEquals("list sizes are not equal", expected.size(), actual.size());
        for (int i = 0; i < expected.size(); i++) {
            compareRelatedIdentifier(expected.get(i), actual.get(i));
        }
    }

    void compareRelatedIdentifier(RelatedIdentifier expected, RelatedIdentifier actual) {
        Assert.assertEquals(expected.getValue(), actual.getValue());
        Assert.assertEquals(expected.getRelatedIdentifierType(), actual.getRelatedIdentifierType());
        Assert.assertEquals(expected.getRelationType(), actual.getRelationType());
        Assert.assertEquals(expected.resourceTypeGeneral, actual.resourceTypeGeneral);
        Assert.assertEquals(expected.relatedMetadataScheme, actual.relatedMetadataScheme);
        Assert.assertEquals(expected.schemeURI, actual.schemeURI);
        Assert.assertEquals(expected.schemeType, actual.schemeType);
    }

    void compareSizes(List<Size> expected, List<Size> actual) {
        if (isNull(expected, actual, "Sizes")) {
            return;
        }
        Assert.assertEquals("list sizes are not equal", expected.size(), actual.size());
        for (int i = 0; i < expected.size(); i++) {
            compareSize(expected.get(i), actual.get(i));
        }
    }

    void compareSize(Size expected, Size actual) {
        Assert.assertEquals(expected.getValue(), actual.getValue());
    }

    void compareRightsList(List<Rights> expected, List<Rights> actual) {
        if (isNull(expected, actual, "Rights")) {
            return;
        }
        Assert.assertEquals("list sizes are not equal", expected.size(), actual.size());
        for (int i = 0; i < expected.size(); i++) {
            compareRights(expected.get(i), actual.get(i));
        }
    }

    void compareRights(Rights expected, Rights actual) {
        Assert.assertEquals(expected.getValue(), actual.getValue());
        Assert.assertEquals(expected.rightsURI, actual.rightsURI);
        Assert.assertEquals(expected.rightsIdentifier, actual.rightsIdentifier);
        Assert.assertEquals(expected.rightsIdentifierScheme, actual.rightsIdentifierScheme);
        Assert.assertEquals(expected.schemeURI, actual.schemeURI);
        Assert.assertEquals(expected.lang, actual.lang);
    }

    void compareDescriptions(List<Description> expected, List<Description> actual) {
        if (isNull(expected, actual, "Descriptions")) {
            return;
        }
        Assert.assertEquals("list sizes are not equal", expected.size(), actual.size());
        for (int i = 0; i < expected.size(); i++) {
            compareDescription(expected.get(i), actual.get(i));
        }
    }

    void compareDescription(Description expected, Description actual) {
        Assert.assertEquals(expected.getValue(), actual.getValue());
        Assert.assertEquals(expected.getDescriptionType(), actual.getDescriptionType());
        Assert.assertEquals(expected.lang, actual.lang);
    }

    void compareNameIdentifier(NameIdentifier expected, NameIdentifier actual) {
        if (isNull(expected, actual, "NameIdentifier")) {
            return;
        }
        Assert.assertEquals(expected.getValue(), actual.getValue());
        Assert.assertEquals(expected.getNameIdentifierScheme(), actual.getNameIdentifierScheme());
        Assert.assertEquals(expected.schemeURI, actual.schemeURI);
    }

    void compareAffiliation(Affiliation expected, Affiliation actual) {
        if (isNull(expected, actual, "Affiliation")) {
            return;
        }
        Assert.assertEquals(expected.getValue(), actual.getValue());
        Assert.assertEquals(expected.affiliationIdentifier, actual.affiliationIdentifier);
        Assert.assertEquals(expected.affiliationIdentifierScheme, actual.affiliationIdentifierScheme);
        Assert.assertEquals(expected.schemeURI, actual.schemeURI);
    }

    boolean isNull(Object expected, Object actual, String name) {
        if (expected == null && actual == null) {
            return true;
        }
        if (expected == null) {
            Assert.fail(String.format("%s expected is null, actual: %s", name, actual));
        }
        if (actual == null) {
            Assert.fail(String.format("%s actual is null, expected: %s", name, expected));
        }
        return false;
    }

}
