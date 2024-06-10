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
import ca.nrc.cadc.doi.datacite.Date;
import ca.nrc.cadc.doi.datacite.Description;
import ca.nrc.cadc.doi.datacite.ResourceType;
import ca.nrc.cadc.doi.datacite.Identifier;
import ca.nrc.cadc.doi.datacite.Language;
import ca.nrc.cadc.doi.datacite.NameIdentifier;
import ca.nrc.cadc.doi.datacite.PublicationYear;
import ca.nrc.cadc.doi.datacite.Publisher;
import ca.nrc.cadc.doi.datacite.RelatedIdentifier;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.datacite.Rights;
import ca.nrc.cadc.doi.datacite.Size;
import ca.nrc.cadc.doi.datacite.Title;
import ca.nrc.cadc.util.StringUtil;

import java.util.List;

import org.jdom2.Element;
import org.jdom2.Namespace;

/**
 * Writes a Resource instance to an output.
 * 
 * @author yeunga
 */
public class DoiWriter {

    public DoiWriter() {}

    protected Element getRootElement(Resource resource) {
        Element root = getResourceElement(resource);
        root.addNamespaceDeclaration(resource.getNamespace());
        return root;
    }

    protected Element getResourceElement(Resource resource) {
        Namespace ns = resource.getNamespace();
        Element element = new Element(Resource.NAME, ns);

        // required elements
        element.addContent(getIdentifierElement(resource.getIdentifier(), ns));
        element.addContent(getCreatorsElement(resource.getCreators(), ns));
        element.addContent(getTitlesElement(resource.getTitles(), ns));
        element.addContent(getPublisherElement(resource.getPublisher(), ns));
        element.addContent(getPublicationYearElement(resource.getPublicationYear(), ns));
        element.addContent(getDoiResourceTypeElement(resource.getResourceType(), ns));

        // optional elements
        if (resource.contributors != null) {
            element.addContent(getContributorsElement(resource.contributors, ns));
        }
        if (resource.rightsList != null) {
            element.addContent(getRightsListElement(resource.rightsList, ns));
        }
        if (resource.dates != null) {
            element.addContent(getDatesElement(resource.dates, ns));
        }
        if (resource.descriptions != null) {
            element.addContent(getDescriptionsElement(resource.descriptions, ns));
        }
        if (resource.sizes != null) {
            element.addContent(getSizesElement(resource.sizes, ns));
        }
        if (resource.language != null) {
            element.addContent(getLanguageElement(resource.language, ns));
        }
        if (resource.relatedIdentifiers != null) {
            element.addContent(getRelatedIdentifiersElement(resource.relatedIdentifiers, ns));
        }
        return element;
    }

    protected Element getIdentifierElement(Identifier identifier, Namespace ns) {
        Element element = new Element(Identifier.NAME, ns);
        element.setText(identifier.getValue());
        element.setAttribute(Identifier.IDENTIFIER_TYPE, identifier.getIdentifierType());
        return element;
    }

    protected Element getCreatorsElement(List<Creator> creators, Namespace ns) {
        Element element = new Element(DoiReader.CREATORS, ns);
        for (Creator creator : creators) {
            element.addContent(getCreatorElement(creator, ns));
        }
        return element;
    }

    protected Element getCreatorElement(Creator creator, Namespace ns) {
        Element element = new Element(Creator.NAME, ns);
        element.addContent(getCreatorNameElement(creator.getCreatorName(), ns));
        if (creator.givenName != null) {
            element.addContent(getElement(Creator.GIVEN_NAME, creator.givenName, ns));
        }
        if (creator.familyName != null) {
            element.addContent(getElement(Creator.FAMILY_NAME, creator.familyName, ns));
        }
        if (creator.nameIdentifier != null) {
            element.addContent(getNameIdentifierElement(creator.nameIdentifier, ns));
        }
        if (creator.affiliation != null) {
            element.addContent(getAffiliationElement(creator.affiliation, ns));
        }
        return element;
    }

    protected Element getCreatorNameElement(CreatorName creatorName, Namespace ns) {
        Element element = new Element(CreatorName.NAME, ns);
        element.setText(creatorName.getValue());
        if (creatorName.nameType != null) {
            element.setAttribute(CreatorName.NAME_TYPE, creatorName.nameType.getValue());
        }
        if (creatorName.lang != null) {
            element.setAttribute(CreatorName.LANG, creatorName.lang, Namespace.XML_NAMESPACE);
        }
        return element;
    }

    protected Element getNameIdentifierElement(NameIdentifier nameIdentifier, Namespace ns) {
        Element element = new Element(NameIdentifier.NAME, ns);
        element.setText(nameIdentifier.getValue());
        element.setAttribute(NameIdentifier.NAME_IDENTIFIER_SCHEME, nameIdentifier.getNameIdentifierScheme());
        if (nameIdentifier.schemeURI != null) {
            element.setAttribute(NameIdentifier.SCHEME_URI, nameIdentifier.schemeURI.toString());
        }
        return element;
    }

    protected Element getAffiliationElement(Affiliation affiliation, Namespace ns) {
        Element element = new Element(Affiliation.NAME, ns);
        element.setText(affiliation.getValue());
        if (affiliation.affiliationIdentifier != null) {
            element.setAttribute(Affiliation.AFFILIATION_IDENTIFIER, affiliation.affiliationIdentifier);
        }
        if (affiliation.affiliationIdentifierScheme != null) {
            element.setAttribute(Affiliation.AFFILIATION_IDENTIFIER_SCHEME, affiliation.affiliationIdentifierScheme);
        }
        if (affiliation.schemeURI != null) {
            element.setAttribute(Affiliation.SCHEME_URI, affiliation.schemeURI.toString());
        }
        return element;
    }

    protected Element getTitlesElement(List<Title> titles, Namespace ns) {
        Element element = new Element(DoiReader.TITLES, ns);
        for (Title title : titles) {
            element.addContent(getTitleElement(title, ns));
        }
        return element;
    }

    protected Element getTitleElement(Title title, Namespace ns) {
        Element element = new Element(Title.NAME, ns);
        element.setText(title.getValue());
        if (title.titleType != null) {
            element.setAttribute(Title.TITLE_TYPE, title.titleType.getValue());
        }
        if (title.lang != null) {
            element.setAttribute(Title.LANG, title.lang, Namespace.XML_NAMESPACE);
        }
        return element;
    }

    protected Element getPublisherElement(Publisher publisher, Namespace ns) {
        Element element = new Element(Publisher.NAME, ns);
        element.setText(publisher.getValue());
        if (publisher.publisherIdentifier != null) {
            element.setAttribute(Publisher.PUBLISHER_IDENTIFIER, publisher.publisherIdentifier);
        }
        if (publisher.publisherIdentifierScheme != null) {
            element.setAttribute(Publisher.PUBLISHER_IDENTIFIER_SCHEME, publisher.publisherIdentifierScheme);
        }
        if (publisher.schemeURI != null) {
            element.setAttribute(Publisher.SCHEME_URI, publisher.schemeURI.toString());
        }
        if (publisher.lang != null) {
            element.setAttribute(Publisher.LANG, publisher.lang, Namespace.XML_NAMESPACE);
        }
        return element;
    }

    protected Element getPublicationYearElement(PublicationYear publicationYear, Namespace ns) {
        Element element = new Element(PublicationYear.NAME, ns);
        element.setText(String.valueOf(publicationYear.getValue()));
        return element;
    }

    protected Element getDoiResourceTypeElement(ResourceType resourceType, Namespace ns) {
        Element element = new Element(ResourceType.NAME, ns);
        element.setText(resourceType.text);
        element.setAttribute(ResourceType.RESOURCE_TYPE_GENERAL, resourceType.getResourceTypeGeneral().getValue());
        return element;
    }

    protected Element getContributorsElement(List<Contributor> contributors, Namespace ns) {
        Element element = new Element(DoiReader.CONTRIBUTORS, ns);
        for (Contributor contributor : contributors) {
            element.addContent(getContributorElement(contributor, ns));
        }
        return element;
    }

    protected Element getContributorElement(Contributor contributor, Namespace ns) {
        Element element = new Element(Contributor.NAME, ns);
        element.addContent(getContributorNameElement(contributor.getContributorName(), ns));
        element.setAttribute(ContributorType.NAME, contributor.getContributorType().getValue());
        if (contributor.givenName != null) {
            element.addContent(getElement(Contributor.GIVEN_NAME, contributor.givenName, ns));
        }
        if (contributor.familyName != null) {
            element.addContent(getElement(Contributor.FAMILY_NAME, contributor.familyName, ns));
        }
        if (contributor.nameIdentifier != null) {
            element.addContent(getNameIdentifierElement(contributor.nameIdentifier, ns));
        }
        if (contributor.affiliation != null) {
            element.addContent(getAffiliationElement(contributor.affiliation, ns));
        }
        return element;
    }

    protected Element getContributorNameElement(ContributorName contributorName, Namespace ns) {
        Element element = new Element(ContributorName.NAME, ns);
        element.setText(contributorName.getValue());
        if (contributorName.nameType != null) {
            element.setAttribute(ContributorName.NAME_TYPE, contributorName.nameType.getValue());
        }
        if (contributorName.lang != null) {
            element.setAttribute(ContributorName.LANG, contributorName.lang, Namespace.XML_NAMESPACE);
        }
        return element;
    }

    protected Element getRightsListElement(List<Rights> rightsList, Namespace ns) {
        Element element = new Element(DoiReader.RIGHTS_LIST, ns);
        for (Rights rights : rightsList) {
            element.addContent(getRightsElement(rights, ns));
        }
        return element;
    }

    protected Element getRightsElement(Rights rights, Namespace ns) {
        Element element = new Element(Rights.NAME, ns);
        element.setText(rights.getValue());
        if (rights.rightsURI != null) {
            element.setAttribute(Rights.RIGHTS_URI, rights.rightsURI.toString());
        }
        if (rights.rightsIdentifier != null) {
            element.setAttribute(Rights.RIGHTS_IDENTIFIER, rights.rightsIdentifier);
        }
        if (rights.rightsIdentifierScheme != null) {
            element.setAttribute(Rights.RIGHTS_IDENTIFIER_SCHEME, rights.rightsIdentifierScheme);
        }
        if (rights.schemeURI != null) {
            element.setAttribute(Rights.SCHEME_URI, rights.schemeURI.toString());
        }
        if (rights.lang != null) {
            element.setAttribute(Rights.LANG, rights.lang, Namespace.XML_NAMESPACE);
        }
        return element;
    }

    protected Element getDatesElement(List<Date> dates, Namespace ns) {
        Element element = new Element(DoiReader.DATES, ns);
        for (Date date : dates) {
            element.addContent(getDateElement(date, ns));
        }
        return element;
    }

    protected Element getDateElement(Date date, Namespace ns) {
        Element element = new Element(Date.NAME, ns);
        element.setText(date.getValue());
        element.setAttribute(Date.DATE_TYPE, date.getDateType().getValue());
        if (date.dateInformation != null) {
            element.setAttribute(Date.DATE_INFORMATION, date.dateInformation);
        }
        return element;
    }

    protected Element getDescriptionsElement(List<Description> descriptions, Namespace ns) {
        Element element = new Element(DoiReader.DESCRIPTIONS, ns);
        for (Description description : descriptions) {
            element.addContent(getDescriptionElement(description, ns));
        }
        return element;
    }

    protected Element getDescriptionElement(Description description, Namespace ns) {
        Element element = new Element(Description.NAME, ns);
        element.addContent(description.getValue());
        element.setAttribute(Description.DESCRIPTION_TYPE, description.getDescriptionType().getValue());
        if (description.lang != null) {
            element.setAttribute(Description.LANG, description.lang, Namespace.XML_NAMESPACE);
        }
        return element;
    }

    protected Element getSizesElement(List<Size> sizes, Namespace ns) {
        Element element = new Element(DoiReader.SIZES, ns);
        for (Size size : sizes) {
            Element sizeElement = new Element(Size.NAME, ns);
            sizeElement.setText(size.getValue());
            element.addContent(sizeElement);
        }
        return element;
    }

    protected Element getLanguageElement(Language language, Namespace ns) {
        Element languageEl = new Element(Language.NAME, ns);
        languageEl.setText(language.getValue());
        return languageEl;
    }

    protected Element getRelatedIdentifiersElement(List<RelatedIdentifier> relatedIdentifiers, Namespace ns) {
        Element element = new Element(DoiReader.RELATED_IDENTIFIERS, ns);
        for (RelatedIdentifier relatedIdentifier : relatedIdentifiers) {
            element.addContent(getRelatedIdentifierElement(relatedIdentifier, ns));
        }
        return element;
    }

    protected Element getRelatedIdentifierElement(RelatedIdentifier relatedIdentifier, Namespace ns) {
        Element element = new Element(RelatedIdentifier.NAME, ns);
        element.setText(relatedIdentifier.getValue());
        element.setAttribute(RelatedIdentifier.RELATED_IDENTIFIER_TYPE, relatedIdentifier.getRelatedIdentifierType().getValue());
        element.setAttribute(RelatedIdentifier.RELATION_TYPE, relatedIdentifier.getRelationType().getValue());
        if (relatedIdentifier.dataCiteResourceTypeGeneral != null) {
            element.setAttribute(RelatedIdentifier.RESOURCE_TYPE_GENERAL, relatedIdentifier.dataCiteResourceTypeGeneral.getValue());
        }
        if (StringUtil.hasText(relatedIdentifier.relatedMetadataScheme)) {
            element.setAttribute(RelatedIdentifier.RELATED_METADATA_SCHEME, relatedIdentifier.relatedMetadataScheme);
        }
        if (relatedIdentifier.schemeURI != null) {
            element.setAttribute(RelatedIdentifier.SCHEME_URI, relatedIdentifier.schemeURI.toString());
        }
        if (StringUtil.hasText(relatedIdentifier.schemeType)) {
            element.setAttribute(RelatedIdentifier.SCHEME_TYPE, relatedIdentifier.schemeType);
        }
        return element;
    }

    protected Element getElement(String name, String text, Namespace ns) {
        Element element = new Element(name, ns);
        element.setText(text);
        return element;
    }

}
