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

import ca.nrc.cadc.doi.datacite.Affiliation;
import ca.nrc.cadc.doi.datacite.Contributor;
import ca.nrc.cadc.doi.datacite.ContributorName;
import ca.nrc.cadc.doi.datacite.ContributorType;
import ca.nrc.cadc.doi.datacite.Creator;
import ca.nrc.cadc.doi.datacite.CreatorName;
import ca.nrc.cadc.doi.datacite.DoiResourceType;
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
import ca.nrc.cadc.util.StringUtil;
import java.net.URI;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;
import org.apache.log4j.Logger;
import org.jdom2.Document;
import org.jdom2.Element;
import org.jdom2.Namespace;

/**
 * Constructs a Resource instance from a Document instance.
 *
 * @author yeunga
 */
public class DoiReader {
    private static final Logger log = Logger.getLogger(DoiReader.class);

    public static final String CONTRIBUTORS = "contributors";
    public static final String CREATORS = "creators";
    public static final String DATES = "dates";
    public static final String DESCRIPTIONS = "descriptions";
    public static final String RELATED_IDENTIFIERS = "relatedIdentifiers";
    public static final String RIGHTS_LIST = "rightsList";
    public static final String SIZES = "sizes";
    public static final String TITLES = "titles";

    /**
     * DoiReader Constructor.
     */
    public DoiReader() {
    }

    protected Resource buildResource(Document doc) throws DoiParsingException {
        Element root = doc.getRootElement();
        Namespace ns = root.getNamespace();
        log.debug("namespace uri: " + ns.getURI());
        log.debug("namespace prefix: " + ns.getPrefix());

        // supported elements
        Identifier id = buildIdentifier(root, ns);
        List<Creator> creators = buildCreators(root, ns);
        List<Title> titles = buildTitles(root, ns);
        Publisher publisher = buildPublisher(root, ns);
        PublicationYear publicationYear = buildPublicationYear(root, ns);
        DoiResourceType resourceType = buildDoiResourceType(root, ns);

        Resource resource = new Resource(ns, id, creators, titles, publisher, publicationYear, resourceType);

        // supported optional elements
        resource.contributors = buildContributors(root, ns);
        resource.rightsList = buildRightsList(root, ns);
        resource.dates = buildDates(root, ns);
        resource.descriptions = buildDescriptions(root, ns);
        resource.sizes = buildSizes(root, ns);
        resource.language = buildLanguage(root, ns);
        resource.relatedIdentifiers = buildRelatedIdentifiers(root, ns);
        return resource;
    }

    protected Identifier buildIdentifier(Element root, Namespace ns)
            throws DoiParsingException {
        Element identifierElement = root.getChild(Identifier.NAME, ns);
        if (identifierElement == null) {
            throw new DoiParsingException(String.format("required element '%s' not found",
                    Identifier.NAME));
        }
        String text = identifierElement.getText();
        if (text.isEmpty()) {
            throw new DoiParsingException("Identifier element is empty");
        }
        String identifierType = identifierElement.getAttributeValue(Identifier.IDENTIFIER_TYPE);
        if (identifierType == null) {
            throw new DoiParsingException(String.format("Identifier missing required attribute: %s",
                    Identifier.IDENTIFIER_TYPE));
        }
        return new Identifier(text, identifierType);
    }

    protected List<Creator> buildCreators(Element root, Namespace ns)
            throws DoiParsingException {
        Element creatersElement = root.getChild(CREATORS, ns);
        if (creatersElement == null) {
            throw new DoiParsingException(String.format("required element '%s' not found", CREATORS));
        }

        List<Element> creatorElements = creatersElement.getChildren();
        if (creatorElements.isEmpty()) {
            throw new DoiParsingException(String.format("%s must have at least one %s child element",
                    CREATORS, Creator.NAME));
        }

        List<Creator> creators = new ArrayList<>();
        for (Element creatorElement : creatorElements) {
            creators.add(buildCreator(creatorElement, ns));
        }
        return creators;
    }

    protected Creator buildCreator(Element element, Namespace ns)
            throws DoiParsingException {
        Creator creator = new Creator(buildCreatorName(element, ns));

        // optional elements
        Element givenNameElement = element.getChild(Creator.GIVEN_NAME, ns);
        if (givenNameElement != null) {
            creator.givenName = givenNameElement.getText();
        }
        Element familyNameElement = element.getChild(Creator.FAMILY_NAME, ns);
        if (familyNameElement != null) {
            creator.familyName = familyNameElement.getText();
        }
        creator.nameIdentifier = buildNameIdentifier(element, ns);
        creator.affiliation = buildAffiliation(element, ns);
        return creator;
    }

    protected CreatorName buildCreatorName(Element element, Namespace ns)
            throws DoiParsingException {
        Element creatorNameElement = element.getChild(CreatorName.NAME, ns);
        if (creatorNameElement == null) {
            throw new DoiParsingException("required 'CreatorName' element not found");
        }
        String text = creatorNameElement.getText();
        if (text.isEmpty()) {
            throw new DoiParsingException("CreatorName element is empty");
        }
        CreatorName creatorName = new CreatorName(text);

        // optional attributes
        String nameType = creatorNameElement.getAttributeValue(CreatorName.NAME_TYPE);
        if (nameType != null) {
            creatorName.nameType = NameType.toValue(nameType);
        }
        creatorName.lang = creatorNameElement.getAttributeValue(CreatorName.LANG, Namespace.XML_NAMESPACE);
        return creatorName;
    }

    protected List<Title> buildTitles(Element root, Namespace ns)
            throws DoiParsingException {
        Element titlesElement = root.getChild(TITLES, ns);
        if (titlesElement == null) {
            throw new DoiParsingException("required 'titles' element not found");
        }

        List<Element> titleElements = titlesElement.getChildren();
        if (titleElements.isEmpty()) {
            throw new DoiParsingException(String.format("%s must have at least one %s child element",
                    TITLES, Title.NAME));
        }

        List<Title> titles = new ArrayList<>();
        for (Element titleElement : titleElements) {
            titles.add(buildTitle(titleElement));
        }
        return titles;
    }

    protected Title buildTitle(Element element)
            throws DoiParsingException {
        String text = element.getText();
        if (text.isEmpty()) {
            throw new DoiParsingException("Title element is empty");
        }
        Title title = new Title(text);

        // optional
        String titleType = element.getAttributeValue(Title.TITLE_TYPE);
        if (titleType != null) {
            title.titleType = TitleType.toValue(titleType);
        }
        title.lang = element.getAttributeValue(Title.LANG, Namespace.XML_NAMESPACE);
        return title;
    }

    protected Publisher buildPublisher(Element parentElement, Namespace ns)
            throws DoiParsingException {
        Element publisherElement = parentElement.getChild(Publisher.NAME, ns);
        if (publisherElement == null) {
            throw new DoiParsingException(String.format("required '%s' element not found",
                    Publisher.NAME));
        }
        String text = publisherElement.getText();
        if (text.isEmpty()) {
            throw new DoiParsingException("Publisher element is empty");
        }
        Publisher publisher = new Publisher(text);

        // optional attributes
        publisher.publisherIdentifier = publisherElement.getAttributeValue(Publisher.PUBLISHER_IDENTIFIER);
        publisher.publisherIdentifierScheme = publisherElement.getAttributeValue(Publisher.PUBLISHER_IDENTIFIER_SCHEME);
        publisher.lang = publisherElement.getAttributeValue(Publisher.LANG, Namespace.XML_NAMESPACE);
        String schemeUri = publisherElement.getAttributeValue(Publisher.SCHEME_URI);
        if (schemeUri != null) {
            publisher.schemeURI = URI.create(schemeUri);
        }
        return publisher;
    }

    protected PublicationYear buildPublicationYear(Element parentElement, Namespace ns) {
        Element publicationYearElement = parentElement.getChild(PublicationYear.NAME, ns);
        String text;
        if (publicationYearElement != null) {
            text = publicationYearElement.getText();
        } else {
            // TODO should a default date be set?
            text = new SimpleDateFormat("yyyy").format(new java.util.Date());
        }
        return new PublicationYear(text);
    }

    protected DoiResourceType buildDoiResourceType(Element parentElement, Namespace ns)
            throws DoiParsingException {
        Element resourceTypeElement = parentElement.getChild(DoiResourceType.NAME, ns);
        if (resourceTypeElement == null) {
            throw new DoiParsingException(String.format("required '%s' element not found",
                    DoiResourceType.NAME));
        }
        String resourceTypeGeneral = resourceTypeElement.getAttributeValue(DoiResourceType.RESOURCE_TYPE_GENERAL);
        if (resourceTypeGeneral == null) {
            throw new DoiParsingException(String.format("ResourceType missing required attribute: %s",
                    DoiResourceType.RESOURCE_TYPE_GENERAL));
        }
        ResourceType resourceType = ResourceType.toValue(resourceTypeGeneral);
        DoiResourceType doiResourceType =  new DoiResourceType(resourceType);
        doiResourceType.text = resourceTypeElement.getText();
        return doiResourceType;
    }

    protected List<Contributor> buildContributors(Element root, Namespace ns)
            throws DoiParsingException {
        Element contributorsElement = root.getChild(CONTRIBUTORS, ns);
        if (contributorsElement == null) {
            return null;
        }

        List<Contributor> contributors = new ArrayList<>();
        for (Element contributorElement : contributorsElement.getChildren()) {
            contributors.add(buildContributor(contributorElement, ns));
        }
        return contributors;
    }

    protected Contributor buildContributor(Element element, Namespace ns)
            throws DoiParsingException {
        ContributorName contributorName = buildContributorName(element, ns);

        String contributorTypeString = element.getAttributeValue(ContributorType.NAME);
        if (contributorTypeString == null) {
            throw new DoiParsingException(String.format("required attribute '%s' not found",
                    ContributorType.NAME));
        }
        ContributorType contributorType = ContributorType.toValue(contributorTypeString);

        Contributor contributor = new Contributor(contributorName, contributorType);

        // optional attributes
        Element givenNameElement = element.getChild(Contributor.GIVEN_NAME, ns);
        if (givenNameElement != null) {
            contributor.givenName = givenNameElement.getText();
        }
        Element familyNameElement = element.getChild(Contributor.FAMILY_NAME, ns);
        if (familyNameElement != null) {
            contributor.familyName = familyNameElement.getText();
        }
        contributor.nameIdentifier = buildNameIdentifier(element, ns);
        contributor.affiliation = buildAffiliation(element, ns);
        return contributor;
    }

    protected ContributorName buildContributorName(Element element, Namespace ns)
            throws DoiParsingException {
        Element contributorNameElement = element.getChild(ContributorName.NAME, ns);
        if (contributorNameElement == null) {
            throw new DoiParsingException(String.format("required element '%s' not found",
                    ContributorName.NAME));
        }
        String text = contributorNameElement.getText();
        if (text.isEmpty()) {
            throw new DoiParsingException("ContributorName element is empty");
        }
        ContributorName contributorName = new ContributorName(text);

        // optional ContributorName attributes
        String nameType = contributorNameElement.getAttributeValue(ContributorName.NAME_TYPE);
        if (nameType != null) {
            contributorName.nameType = NameType.toValue(nameType);
        }
        contributorName.lang = element.getAttributeValue(ContributorName.LANG, Namespace.XML_NAMESPACE);
        return contributorName;
    }

    protected List<Rights> buildRightsList(Element root, Namespace ns)
            throws DoiParsingException {
        Element rightsListElement = root.getChild(RIGHTS_LIST, ns);
        if (rightsListElement == null) {
            return null;
        }

        List<Element> rightsElements = rightsListElement.getChildren();
        if (rightsElements.isEmpty()) {
            throw new DoiParsingException(String.format("%s must have at least one %s child element",
                    RIGHTS_LIST, Rights.NAME));
        }

        List<Rights> rightsList = new ArrayList<>();
        for (Element rightsElement : rightsElements) {
            rightsList.add(buildRights(rightsElement));
        }
        return rightsList;
    }

    protected Rights buildRights(Element element)
            throws DoiParsingException {
        String text = element.getText();
        if (text.isEmpty()) {
            throw new DoiParsingException("Rights element is empty");
        }
        Rights rights = new Rights(text);

        // optional attributes
        String rightUri = element.getAttributeValue(Rights.RIGHTS_URI);
        if (rightUri != null) {
            rights.rightsURI = URI.create(rightUri);
        }
        String schemeUri = element.getAttributeValue(Rights.SCHEME_URI);
        if (schemeUri != null) {
            rights.schemeURI = URI.create(schemeUri);
        }
        rights.rightsIdentifier = element.getAttributeValue(Rights.RIGHTS_IDENTIFIER);
        rights.rightsIdentifierScheme = element.getAttributeValue(Rights.RIGHTS_IDENTIFIER_SCHEME);
        rights.lang = element.getAttributeValue(Rights.LANG, Namespace.XML_NAMESPACE);
        return rights;
    }

    protected List<Date> buildDates(Element root, Namespace ns)
            throws DoiParsingException {
        Element datesElement = root.getChild(DATES, ns);
        if (datesElement == null) {
            return null;
        }

        List<Date> dates = new ArrayList<>();
        for (Element dateElement : datesElement.getChildren()) {
            dates.add(buildDate(dateElement));
        }
        return dates;
    }

    protected Date buildDate(Element element)
            throws DoiParsingException {
        String text = element.getText();
        if (text.isEmpty()) {
            throw new DoiParsingException("Date element is empty");
        }
        String dateType = element.getAttributeValue(Date.DATE_TYPE);
        if (dateType == null) {
            throw new DoiParsingException(String.format("Date missing required attribute: %s",
                    Date.DATE_TYPE));
        }
        Date date = new Date(text, DateType.toValue(dateType));

        // optional attribute
        date.dateInformation = element.getAttributeValue(Date.DATE_INFORMATION);
        return date;
    }

    protected List<Description> buildDescriptions(Element root, Namespace ns)
            throws DoiParsingException {
        Element descriptionsElement = root.getChild(DESCRIPTIONS, ns);
        if (descriptionsElement == null) {
            return null;
        }

        List<Description> descriptions = new ArrayList<>();
        for (Element descriptionElement : descriptionsElement.getChildren()) {
            descriptions.add(buildDescription(descriptionElement));
        }
        return descriptions;
    }

    protected Description buildDescription(Element element)
            throws DoiParsingException {
        String text = element.getText();
        if (text.isEmpty()) {
            throw new DoiParsingException("Description element is empty");
        }
        String type = element.getAttributeValue(Description.DESCRIPTION_TYPE);
        if (type == null) {
            throw new DoiParsingException(String.format("Description missing required attribute: %s",
                    Description.DESCRIPTION_TYPE));
        }
        DescriptionType descriptionType = DescriptionType.toValue(type);
        Description description = new Description(text, descriptionType);
        description.lang = element.getAttributeValue(Description.LANG, Namespace.XML_NAMESPACE);
        return description;
    }

    protected List<Size> buildSizes(Element root, Namespace ns)
            throws DoiParsingException {
        Element sizesElement = root.getChild(SIZES, ns);
        if (sizesElement == null) {
            return null;
        }
        List<Size> sizes = new ArrayList<>();
        for (Element sizeElement : sizesElement.getChildren()) {
            String text = sizeElement.getText();
            if (text.isEmpty()) {
                throw new DoiParsingException("Size element is empty");
            }
            sizes.add(new Size(sizeElement.getText()));
        }
        return sizes;
    }

    protected Language buildLanguage(Element root, Namespace ns)
            throws DoiParsingException {
        Element languageElement = root.getChild(Language.NAME, ns);
        if (languageElement == null) {
            return null;
        }
        String text = languageElement.getText();
        if (text.isEmpty()) {
            throw new DoiParsingException("Language element is empty");
        }
        return new Language(languageElement.getText());
    }
    
    protected List<RelatedIdentifier> buildRelatedIdentifiers(Element root, Namespace ns)
            throws DoiParsingException {
        Element relatedIdentifiersElement = root.getChild(RELATED_IDENTIFIERS, ns);
        if (relatedIdentifiersElement == null) {
            return null;
        }

        List<RelatedIdentifier> relatedIdentifiers = new ArrayList<>();
        for (Element relatedIdentifierElement : relatedIdentifiersElement.getChildren()) {
            relatedIdentifiers.add(buildRelatedIdentifier(relatedIdentifierElement));
        }
        return relatedIdentifiers;
    }

    protected RelatedIdentifier buildRelatedIdentifier(Element element)
            throws DoiParsingException {
        String text = element.getText();
        if (text.isEmpty()) {
            throw new DoiParsingException("RelatedIdentifier element is empty");
        }

        String identType = element.getAttributeValue(RelatedIdentifier.RELATED_IDENTIFIER_TYPE);
        if (identType == null) {
            throw new DoiParsingException(String.format("RelatedIdentifier missing required attribute: %s",
                    RelatedIdentifier.RELATED_IDENTIFIER_TYPE));
        }
        RelatedIdentifierType relatedIdentifierType = RelatedIdentifierType.toValue(identType);

        String relType = element.getAttributeValue(RelatedIdentifier.RELATION_TYPE);
        if (relType == null) {
            throw new DoiParsingException(String.format("RelatedIdentifier missing required attribute: %s",
                    RelatedIdentifier.RELATION_TYPE));
        }
        RelationType relationType = RelationType.toValue(relType);
        RelatedIdentifier relatedIdentifier = new RelatedIdentifier(text, relatedIdentifierType, relationType);

        // optional attributes
        String resourceTypeGeneral = element.getAttributeValue(RelatedIdentifier.RESOURCE_TYPE_GENERAL);
        if (resourceTypeGeneral != null) {
            relatedIdentifier.resourceTypeGeneral = ResourceType.toValue(resourceTypeGeneral);
        }
        String schemeURI = element.getAttributeValue(RelatedIdentifier.SCHEME_URI);
        if (schemeURI != null) {
            relatedIdentifier.schemeURI = URI.create(schemeURI);
        }
        relatedIdentifier.relatedMetadataScheme = element.getAttributeValue(RelatedIdentifier.RELATED_METADATA_SCHEME);
        relatedIdentifier.schemeType = element.getAttributeValue(RelatedIdentifier.SCHEME_TYPE);
        return relatedIdentifier;
    }

    protected NameIdentifier buildNameIdentifier(Element parentElement, Namespace ns)
            throws DoiParsingException {
        Element nameIdentifierElement = parentElement.getChild(NameIdentifier.NAME, ns);
        if (nameIdentifierElement == null) {
            return null;
        }

        String text = nameIdentifierElement.getText();
        if (text.isEmpty()) {
            throw new DoiParsingException("NamedIdentifier element is empty");
        }

        String nameIdentifierScheme = nameIdentifierElement.getAttributeValue(NameIdentifier.NAME_IDENTIFIER_SCHEME);
        if (nameIdentifierScheme == null) {
            throw new DoiParsingException(String.format("NamedIdentifier missing required attribute: %s",
                    NameIdentifier.NAME_IDENTIFIER_SCHEME));
        }
        NameIdentifier nameIdentifier = new NameIdentifier(text, nameIdentifierScheme);

        // optional attribute
        String schemeUri = nameIdentifierElement.getAttributeValue(NameIdentifier.SCHEME_URI);
        if (schemeUri != null) {
            nameIdentifier.schemeURI = URI.create(schemeUri);
        }
        return nameIdentifier;
    }

    protected Affiliation buildAffiliation(Element parentElement, Namespace ns)
            throws DoiParsingException {
        Element affiliationElement = parentElement.getChild(Affiliation.NAME, ns);
        if (affiliationElement == null) {
            return null;
        }
        String text = affiliationElement.getText();
        if (text.isEmpty()) {
            throw new DoiParsingException("Affiliation element is empty");
        }
        Affiliation affiliation = new Affiliation(text);

        // optional attributes
        String affiliationIdentifier = affiliationElement.getAttributeValue(Affiliation.AFFILIATION_IDENTIFIER);
        if (affiliationIdentifier != null) {
            affiliation.affiliationIdentifier = affiliationIdentifier;
        }
        String affiliationIdentifierScheme = affiliationElement.getAttributeValue(Affiliation.AFFILIATION_IDENTIFIER_SCHEME);
        if (affiliationIdentifierScheme != null) {
            affiliation.affiliationIdentifierScheme = affiliationIdentifierScheme;
        }
        String schemeUri = affiliationElement.getAttributeValue(Affiliation.SCHEME_URI);
        if (schemeUri != null) {
            affiliation.schemeURI = URI.create(schemeUri);
        }
        return affiliation;
    }

}
