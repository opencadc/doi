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
import ca.nrc.cadc.doi.datacite.Title;

import java.lang.reflect.Field;
import java.net.URI;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import org.apache.log4j.Logger;
import org.jdom2.Attribute;
import org.jdom2.Document;
import org.jdom2.Element;
import org.jdom2.Namespace;

/**
 * Constructs a Resource instance from a Document instance.
 *
 * @author yeunga
 */
public class DoiReader
{
    private static final Logger log = Logger.getLogger(DoiReader.class);

    /**
     * Constructor.
     */
    public DoiReader() { }
    
    // methods to assign to private field in Identity
    public static void assignIdentifier(Object ce, String identifier) {
        try {
            Field f = Identifier.class.getDeclaredField("text");
            f.setAccessible(true);
            f.set(ce, identifier);
        } catch (NoSuchFieldException fex) {
            throw new RuntimeException("BUG", fex);
        } catch (IllegalAccessException bug) {
            throw new RuntimeException("BUG", bug);
        }
    }
    
    protected Resource buildResource(Document doc) throws DoiParsingException
    {
        Element root = doc.getRootElement();
        Namespace ns = root.getNamespace();
        
        log.debug("namespace uri: " + ns.getURI());
        log.debug("namespace prefix: " + ns.getPrefix());
        
        // for now, we only support the following elements
        Identifier id = buildIdentifier(root);
        List<Creator> creators = buildCreators(root);
        List<Title> titles = buildTitles(root);

        String publicationYear = "";
        if (root.getChild("publicationYear", ns) == null)
        {
            publicationYear = new SimpleDateFormat("yyyy").format(new Date());
        } else {
            publicationYear = root.getChild("publicationYear", ns).getText();
        }
        
        Resource resource = new Resource(ns, id, creators, titles, publicationYear);
        
        // the following are optional elements that we support
        resource.contributors = buildContributors(root);
        resource.rightsList = buildRightsList(root);
        resource.dates = buildDates(root);
        resource.descriptions = buildDescriptions(root);
        resource.sizes = buildSizes(root);
        resource.language = buildLanguage(root);
        return resource;
    }
    
    protected Identifier buildIdentifier(Element root)
    {
        Namespace ns = root.getNamespace();
        Element identifierElement = root.getChild("identifier", ns);
        String text = identifierElement.getText();
        String identifierType = identifierElement.getAttributeValue("identifierType");
        Identifier id = new Identifier(identifierType);
        assignIdentifier(id, text);
        return id;
    }
    
    protected List<Creator> buildCreators(Element root) throws DoiParsingException
    {
        List<Creator> creators = new ArrayList<Creator>();
        
        Namespace ns = root.getNamespace();
        List<Element> creatorElements = root.getChild("creators", ns).getChildren();
        for (Element creatorElement : creatorElements)
        {
            // creatorName is mandatory
            Element creatorNameElement = creatorElement.getChild("creatorName", ns);
            String name = creatorNameElement.getText();
            CreatorName creatorName = new CreatorName(name);
            
            // nameType attribute is optional
            String nameType = creatorNameElement.getAttributeValue("nameType");
            if (nameType != null)
            {
                creatorName.nameType = NameType.toValue(nameType);
            }
            
            Creator creator = new Creator(creatorName);

            // get optional nameIdentifier
            Element nameIdentifierElement = creatorElement.getChild("nameIdentifier", ns);
            if (nameIdentifierElement != null)
            {
                String identifier = nameIdentifierElement.getText();
                String nameIdentifierScheme = nameIdentifierElement.getAttributeValue("nameIdentifierScheme");
                NameIdentifier nameIdentifier = new NameIdentifier(nameIdentifierScheme, identifier);
                String schemeURI = nameIdentifierElement.getAttributeValue("schemeURI");
                if (schemeURI != null)
                {
                    nameIdentifier.schemeURI = URI.create(schemeURI);
                }
                
                creator.nameIdentifier = nameIdentifier;
            }
            
            Element givenNameElement = creatorElement.getChild("givenName", ns);
            String givenName = null;
            if (givenNameElement != null)
            {
                givenName = givenNameElement.getText();
                creator.givenName = givenName;
            }
            
            Element familyNameElement = creatorElement.getChild("familyName", ns);
            String familyName = null;
            if (familyNameElement != null)
            {
                familyName = familyNameElement.getText();
                creator.familyName = familyName;
            }
            
            Element affiliationElement = creatorElement.getChild("affiliation", ns);
            String affiliation = null;
            if (affiliationElement != null)
            {
                affiliation = affiliationElement.getText();
                creator.affiliation = affiliation;
            }

            creators.add(creator);
        }
        
        return creators;
    }
    
    protected List<Title> buildTitles(Element root) throws DoiParsingException
    {
        List<Title> titles = new ArrayList<Title>();
        
        List<Element> titleElements = root.getChild("titles", root.getNamespace()).getChildren();
        for (Element titleElement : titleElements)
        {
            // get the title text
            String text = titleElement.getText();
            String lang = null;
            String titleType = null;
            
            // get the attributes and build a title instance
            List<Attribute> attributes = titleElement.getAttributes();
            for (Attribute attr : attributes)
            {
                String key = attr.getName();
                if ("lang".equals(key))
                {
                    lang = attr.getValue();
                }
                else
                {
                    titleType = attr.getValue();
                }
            }
            
            // the titleType attribute is optional
            Title title = new Title(lang, text);
            if (titleType != null)
            {
                title.titleType = TitleType.toValue(titleType);
            }
            
            titles.add(title);
        }
        
        return titles;
    }
    
    protected List<Contributor> buildContributors(Element root) throws DoiParsingException
    {
        List<Contributor> contributors = null;
        
        Namespace ns = root.getNamespace();
        if (root.getChild("contributors", ns) != null) 
        {
            contributors = new ArrayList<Contributor>();
            List<Element> contributtorElements = root.getChild("contributors", ns).getChildren();
            for (Element contributorElement : contributtorElements)
            {
                // contributorName is mandatory
                Element contributorNameElement = contributorElement.getChild("contributorName", ns);
                String name = contributorNameElement.getText();
                ContributorName contributorName = new ContributorName(name);
                
                // nameType attribute is optional
                String nameType = contributorNameElement.getAttributeValue("nameType");
                if (nameType != null)
                {
                    contributorName.nameType = NameType.toValue(nameType);
                }
                // contributorType is mandatory
                String contributorTypeString = contributorElement.getAttributeValue("contributorType");
                ContributorType contributorType = ContributorType.toValue(contributorTypeString);
                Contributor contributor = new Contributor(contributorName, contributorType);
    
                // get optional nameIdentifier
                Element nameIdentifierElement = contributorElement.getChild("nameIdentifier", ns);
                if (nameIdentifierElement != null)
                {
                    String identifier = nameIdentifierElement.getText();
                    String nameIdentifierScheme = nameIdentifierElement.getAttributeValue("nameIdentifierScheme");
                    NameIdentifier nameIdentifier = new NameIdentifier(nameIdentifierScheme, identifier);
                    String schemeURI = nameIdentifierElement.getAttributeValue("schemeURI");
                    if (schemeURI != null)
                    {
                        nameIdentifier.schemeURI = URI.create(schemeURI);
                    }
                    
                    contributor.nameIdentifier = nameIdentifier;
                }
                
                Element givenNameElement = contributorElement.getChild("givenName", ns);
                String givenName = null;
                if (givenNameElement != null)
                {
                    givenName = givenNameElement.getText();
                    contributor.givenName = givenName;
                }
                
                Element familyNameElement = contributorElement.getChild("familyName", ns);
                String familyName = null;
                if (familyNameElement != null)
                {
                    familyName = familyNameElement.getText();
                    contributor.familyName = familyName;
                }
                
                Element affiliationElement = contributorElement.getChild("affiliation", ns);
                String affiliation = null;
                if (affiliationElement != null)
                {
                    affiliation = affiliationElement.getText();
                    contributor.affiliation = affiliation;
                }
    
                contributors.add(contributor);
            }
        }
        
        return contributors;
    }
    
    protected List<Rights> buildRightsList(Element root) throws DoiParsingException
    {
        List<Rights> rightsList = null;
        
        if (root.getChild("rights", root.getNamespace()) != null)
        {
            rightsList = new ArrayList<Rights>();
            List<Element> rightsElements = root.getChild("rights", root.getNamespace()).getChildren();
            for (Element rightsElement : rightsElements)
            {
                // get the rights text
                String text = rightsElement.getText();
                String lang = null;
                String rightsURIString = null;
                
                // get the attributes and build a rights instance
                List<Attribute> attributes = rightsElement.getAttributes();
                for (Attribute attr : attributes)
                {
                    String key = attr.getName();
                    if ("lang".equals(key))
                    {
                        lang = attr.getValue();
                    }
                    else
                    {
                        rightsURIString = attr.getValue();
                    }
                }
                
                // the rightsURI attribute is optional
                Rights rights = new Rights(lang, text);
                if (rightsURIString != null)
                {
                    rights.rightsURI = URI.create(rightsURIString);
                }
                
                rightsList.add(rights);
            }
        }
        
        return rightsList;
    }
   
    protected List<DoiDate> buildDates(Element root) throws DoiParsingException
    {
        List<DoiDate> dates = null;
        
        if (root.getChild("datess", root.getNamespace()) != null)
        {
            dates = new ArrayList<DoiDate>();
            List<Element> dateElements = root.getChild("datess", root.getNamespace()).getChildren();
            for (Element dateElement : dateElements)
            {
                // get the date text
                String text = dateElement.getText();
                DateType dateType = null;
                String dateInformation = null;
                
                // get the attributes and build a rights instance
                List<Attribute> attributes = dateElement.getAttributes();
                for (Attribute attr : attributes)
                {
                    String key = attr.getName();
                    if ("dateType".equals(key))
                    {
                        dateType = DateType.toValue(attr.getValue());
                    }
                    else
                    {
                        dateInformation = attr.getValue();
                    }
                }
                
                // the dateInformation attribute is optional
                DoiDate date = new DoiDate(text, dateType);
                date.dateInformation = dateInformation;
                
                dates.add(date);
            }
        }
        return dates;
    }
    
    protected List<Description> buildDescriptions(Element root) throws DoiParsingException
    {
        List<Description> descriptions = null;
        
        if (root.getChild("descriptions", root.getNamespace()) != null)
        {
            descriptions = new ArrayList<Description>();
            List<Element> descriptionElements = root.getChild("descriptions", root.getNamespace()).getChildren();
            for (Element descriptionElement : descriptionElements)
            {
                // get the description text
                String text = descriptionElement.getText();
                String lang = null;
                String descriptionTypeString = null;
                DescriptionType descriptionType = null;
                
                // get the attributes and build a description instance
                List<Attribute> attributes = descriptionElement.getAttributes();
                for (Attribute attr : attributes)
                {
                    String key = attr.getName();
                    if ("lang".equals(key))
                    {
                        lang = attr.getValue();
                    }
                    else
                    {
                        descriptionTypeString = attr.getValue();
                    }
                }
                
                if (descriptionTypeString != null)
                {
                    descriptionType = DescriptionType.toValue(descriptionTypeString);
                }
                
                
                Description description = new Description(lang, text, descriptionType);
                descriptions.add(description);
            }
        }
        
        return descriptions;
    }

    protected List<String> buildSizes(Element root) throws DoiParsingException
    {
        List<String> sizes = null;

        if (root.getChild("sizes", root.getNamespace()) != null)
        {
            sizes = new ArrayList<String>();
            List<Element> sizeElements = root.getChild("sizes", root.getNamespace()).getChildren();
            for (Element sizeElement : sizeElements)
            {
                // get the size String
                String size = sizeElement.getText();
                sizes.add(size);
            }
        }

        return sizes;
    }

    protected String buildLanguage(Element root)
    {
        Namespace ns = root.getNamespace();
        Element languageElement = root.getChild("language", ns);
        String text = null;
        if (languageElement != null) {
            text = languageElement.getText();
        }
        return text;
    }
}
