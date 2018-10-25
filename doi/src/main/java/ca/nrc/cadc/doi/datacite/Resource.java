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
*  with OpenCADC.  If not, see          OpenCADC ; si ce n’esties(serverNode);

            // return the node in xml format
            NodeWriter nodeWriter = new NodeWriter();
            return new NodeActionResult(new N
*  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
*                                       <http://www.gnu.org/licenses/>.
*
*  $Revision: 4 $
*
************************************************************************
*/

package ca.nrc.cadc.doi.datacite;

import java.util.List;

import org.apache.log4j.Logger;
import org.jdom2.Namespace;
import org.springframework.util.StringUtils;

/**
 * Root business object for DOI metadata.
 * 
 * @author yeunga
 *
 */
public class Resource
{
    private static Logger log = Logger.getLogger(Resource.class);

    private static String RIGHTS_STMT = "Public: If you make use of these data products we request that you acknowledge their origin and cite the paper below and cite this DOI and the DOI of the paper.";
    // first %s is the publication title,
    // second %2 is last name of first author
    // third %s is the journal reference
    private static String DESCRIPTION_TEMPLATE = "This contains data and other information related to the publication '%s ' by %s et al., %s ";

    private Namespace namespace;
    private Identifier identifier;
    private List<Creator> creators;
    private List<Title> titles;
    private String publisher;
    private String publicationYear;
    private ResourceType resourceType;
    public List<Rights> rightsList;
    public List<Contributor> contributors;
    public List<DoiDate> dates;
    public List<Description> descriptions;
    public List<String> sizes;  // Unstructures size information about the resource.
    

    public Resource(Namespace namespace, Identifier identifier, List<Creator> creators, List<Title> titles, 
        String publisher, String publicationYear, ResourceType resourceType) 
    { 
        if (namespace == null || identifier == null || creators.isEmpty() || titles.isEmpty() || 
            !StringUtils.hasText(publisher) || !StringUtils.hasText(publicationYear) ||
            resourceType == null)
        {
            String msg = "namespace, identifier, creator, title, publisher, publicationYear and resourceType must be specified.";
            throw new IllegalArgumentException(msg);
        }
        
        this.namespace = namespace;
        this.identifier = identifier;
        this.creators = creators;
        this.titles = titles;
        this.publisher = publisher;
        this.publicationYear = publicationYear;
        this.resourceType = resourceType;
    }

    public Namespace getNamespace()
    {
        return this.namespace;
    }
    
    public Identifier getIdentifier()
    {
        return this.identifier;
    }
    
    public List<Creator> getCreators()
    {
        return this.creators;
    }
    
    public List<Title> getTitles()
    {
        return this.titles;
    }
    
    public String getPublisher()
    {
        return this.publisher;
    }
    
    public String getPublicationYear()
    {
        return this.publicationYear;
    }
    
    public ResourceType getResourceType()
    {
        return this.resourceType;
    }
}
