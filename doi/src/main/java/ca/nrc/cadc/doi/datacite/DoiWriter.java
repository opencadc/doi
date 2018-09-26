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
*  $Revision: 4 $
*
************************************************************************
*/

package ca.nrc.cadc.doi.datacite;

import ca.nrc.cadc.doi.datacite.Creator;
import ca.nrc.cadc.doi.datacite.CreatorName;
import ca.nrc.cadc.doi.datacite.Identifier;
import ca.nrc.cadc.doi.datacite.NameIdentifier;
import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.datacite.ResourceType;
import ca.nrc.cadc.doi.datacite.Title;
import java.util.List;

import org.apache.log4j.Logger;
import org.jdom2.Element;
import org.jdom2.Namespace;

/**
 * Writes a Resource instance to an output.
 * 
 * @author yeunga
 */
public class DoiWriter 
{
    private static Logger log = Logger.getLogger(DoiWriter.class);

    public DoiWriter() { }

    protected Element getRootElement(Resource resource)
    {
        Element root = getResourceElement(resource);
        root.addNamespaceDeclaration(resource.getNamespace());
        return root;
    }
    
    protected Element getResourceElement(Resource resource)
    {
        Namespace ns = resource.getNamespace();
        Element ret = new Element("resource", ns);

        // add identifier element
        Element identifierElement = getIdentifierElement(resource.getIdentifier(), ns);
        ret.addContent(identifierElement);
        
        // add creators element
        Element creatorsElement = getCreatorsElement(resource.getCreators(), ns);
        ret.addContent(creatorsElement);
        
        // add titles element
        Element titlesElement = getTitlesElement(resource.getTitles(), ns);
        ret.addContent(titlesElement);
        
        // add publisher element
        Element publisherElement = getPublisherElement(resource.getPublisher(), ns);
        ret.addContent(publisherElement);
        
        // add publication year element
        Element publicationYearElement = getPublicationYearElement(resource.getPublicationYear(), ns);
        ret.addContent(publicationYearElement);
        
        // add resource type element
        Element resourceTypeElement = getResourceTypeElement(resource.getResourceType(), ns);
        ret.addContent(resourceTypeElement);
        
        return ret;
    }
    
    protected Element getIdentifierElement(Identifier identifier, Namespace ns)
    {
        Element ret = new Element("identifier", ns);
        ret.setAttribute("identifierType", identifier.getIdentifierType());
        ret.setText(identifier.getText());
        return ret;
        
    }
    
    protected Element getCreatorsElement(List<Creator> creators, Namespace ns)
    {
        Element ret = new Element("creators", ns);
        for (Creator creator : creators)
        {
            Element creatorElement = getCreatorElement(creator, ns);
            ret.addContent(creatorElement);
        }
        return ret;
    }
    
    protected Element getCreatorElement(Creator creator, Namespace ns)
    {
        Element ret = new Element("creator", ns);
        
        // add creator name element
        Element creatorNameElement = getCreatorNameElement(creator.getCreatorName(), ns);
        ret.addContent(creatorNameElement);
        
        if (creator.givenName != null)
        {
            // add give name element
            Element givenNameElement = getGivenNameElement(creator.givenName, ns);
            ret.addContent(givenNameElement);
        }
        
        if (creator.familyName != null)
        {
            // add family name element
            Element familyNameElement = getFamilyNameElement(creator.familyName, ns);
            ret.addContent(familyNameElement);
        }
        
        if (creator.nameIdentifier != null)
        {
            // add name identifier element
            Element nameIdentifierElement = getNameIdentifierElement(creator.nameIdentifier, ns);
            ret.addContent(nameIdentifierElement);
        }
        
        if (creator.affiliation != null)
        {
            // add affiliation element
            Element affiliationElement = getAffiliationElement(creator.affiliation, ns);
            ret.addContent(affiliationElement);
        }
        
        return ret;
    }
    
    protected Element getCreatorNameElement(CreatorName creatorName, Namespace ns)
    {
        Element ret = new Element("creatorName", ns);
        ret.setText(creatorName.getText());
        
        if (creatorName.nameType != null)
        {
            // set name type attribute
            ret.setAttribute("nameType", creatorName.nameType);
        }
        
        return ret;
    }
    
    protected Element getGivenNameElement(String givenName, Namespace ns)
    {
        Element ret = new Element("givenName", ns);
        ret.setText(givenName);
        return ret;
    }
    
    protected Element getFamilyNameElement(String familyName, Namespace ns)
    {
        Element ret = new Element("familyName", ns);
        ret.setText(familyName);
        return ret;
    }
    
    protected Element getNameIdentifierElement(NameIdentifier nameIdentifier, Namespace ns)
    {
        Element ret = new Element("nameIdentifier", ns);
        ret.setAttribute("nameIdentifierScheme", nameIdentifier.getNameIdentifierScheme());
        ret.setText(nameIdentifier.getNameIdentifier());
        
        if (nameIdentifier.schemeURI != null)
        {
            // set scheme URI attribute
            ret.setAttribute("schemeURI", nameIdentifier.schemeURI.toString());
        }
        
        return ret;
    }
    
    protected Element getAffiliationElement(String affiliation, Namespace ns)
    {
        Element ret = new Element("affiliation", ns);
        ret.setText(affiliation);
        return ret;
    }
    
    protected Element getTitlesElement(List<Title> titles, Namespace ns)
    {
        Element ret = new Element("titles", ns);
        for (Title title : titles)
        {
            Element titleElement = getTitleElement(title, ns);
            ret.addContent(titleElement);
        }
        
        return ret;
    }
    
    protected Element getTitleElement(Title title, Namespace ns)
    {
        Element ret = new Element("title", ns);
        ret.setAttribute("lang", title.getLang(), Namespace.XML_NAMESPACE);
        ret.setText(title.getText());
        
        if (title.titleType != null)
        {
            // set title type attribute
            ret.setAttribute("titleType", title.titleType);
        }
        
        return ret;
    }
    
    protected Element getPublisherElement(String publisher, Namespace ns)
    {
        Element ret = new Element("publisher", ns);
        ret.setText(publisher);
        return ret;
    }
    
    protected Element getPublicationYearElement(String publicationYear, Namespace ns)
    {
        Element ret = new Element("publicationYear", ns);
        ret.setText(publicationYear);
        return ret;
    }
    
    protected Element getResourceTypeElement(ResourceType resourceType, Namespace ns)
    {
        Element ret = new Element("resourceType", ns);
        ret.setText(resourceType.getResourceType());
        ret.setAttribute("resourceTypeGeneral", resourceType.getResourceTypeGeneral());
        return ret;
    }
}
