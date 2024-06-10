# Digital Object Identifier Web Service (doi)

This service allows a user to store data associated with a publication and assigns a DOI for the data storage. Data are stored in VOSpace. A user interacts with the service via a GUI. 

### configuration
The following configuration files must be available in the `/config` directory.

### catalina.properties
This file contains java system properties to configure the tomcat server and some of the java libraries used in the service.

See <a href="https://github.com/opencadc/docker-base/tree/master/cadc-tomcat">cadc-tomcat</a>
for system properties related to the deployment environment.

See <a href="https://github.com/opencadc/core/tree/master/cadc-util">cadc-util</a> for common system properties.

`doi` includes multiple IdentityManager implementations to support authenticated access:
- See <a href="https://github.com/opencadc/ac/tree/master/cadc-access-control-identity">cadc-access-control-identity</a> for CADC access-control system support.
- See <a href="https://github.com/opencadc/ac/tree/master/cadc-gms">cadc-gms</a> for OIDC token support.

### cadc-registry.properties
See <a href="https://github.com/opencadc/reg/tree/master/cadc-registry">cadc-registry</a>.

### doi.properties
The doi.properties configures the DataCite service used to register new DOI's.

```
# distinguished name for the doi admin user
ca.nrc.cadc.doi.adminDN = C=ca,O=hia,OU=cadc,CN=doiadmin_045

# prefix to DOI specific metadata file
ca.nrc.cadc.doi.metadataFilePrefix = CISTI_CADC_
 
# DOI landing page url
ca.nrc.cadc.doi.landingUrl = https://www.canfar.net/citation/landing

# path to the DOI parent folder
ca.nrc.cadc.doi.vault.doiParentPath = /AstroDataCitationDOI/CISTI.CANFAR

# CADC datacite prefix
ca.nrc.cadc.doi.datacite.prefix = 10.11570

# Datacite MDS REST endpoint
ca.nrc.cadc.doi.datacite.mdsUrl = https://mds.datacite.org

```
_adminDN_ is the distinguished name of the account used to administer DOI's stored in VOSpace.

_metadataPrefix_ is the prefix prepended to the DOI name to create the filename for the DOI specific metadata stored in VOSpace.

_landingUrl_ is the base URL used to compose URLs to individual DOI's.

_vault.doiParentPath_ is the path in the VOSpace service to the DOI parent folder.

_datacite.prefix_ is the registered prefix from Datacite for CADC account.

_datacite.url_ is the URL to the Datacite MDS rest endpoint used to create and update DOI's.

_testSuffix_ is appended to the DOI suffix to indicate test DOI's.



### datacite.pass
The datacite.pass contains the username and password for the DataCite service.

```
machine mds.datacite.org login [username] password [password]
machine mds.test.datacite.org login [username] password [password]
```

### cadcproxy.pem
This client certificate is used to make authenticated server-to-server calls for system-level A&A purposes.

### doiadmin.pem
This client certificate is used to make authenticated calls to a VOSpace service.

## building it
```
gradle clean build
docker build -t doi -f Dockerfile .
```

## checking it
```
docker run --rm -it doi:latest /bin/bash
```

## running it
```
docker run --rm --user tomcat:tomcat --volume=/path/to/external/config:/config:ro --name doi doi:latest
```

## Service lifecycle
Usage of this service can be divided into three distinct phases described below. The service does not impose a time limit on each phase.

### DOI creation
1. user enters metadata of a publication using a GUI
   - title
   - first auther
   - additional authors
   - journal reference
2. user submits the metdata
3. this service then:
   - validates the metadata 
   - assigns a DOI for the metadata 
   - creates a directory in VOSpace
   - stores a file, containing the metadata, in the directory
   - creates an empty data sub-directory
   - returns the metadata to the GUI, along with the freshly assigned DOI

### Data upload and DOI metadata update
At this point the metadata and the data sub-directory are available to the user only. The user can repeatedly:
  - upload data files to the data sub-directory
  - update metadata using the GUI

### Finalizing the DOI
After all data files have been uploaded and the metadata have been updated, the user can finalize the DOI using the GUI. The process to finalize a DOI is a bit involved. Please refer to the status table below for the possible status transitions. Finalizing a DOI results in the following work to be performed.
  - change the following to read only and make them publicly accessible:
    - data sub-directory
    - all directories and their sub-directories, and data files contained in the data sub-directory
  - register the DOI in DataCite
  - make the DOI findable in DataCite
  - returns the metadata to the GUI
   
## DOI metadata
The following top level DOI metadata are supported:
  - identifier
  - creators
  - titles
  - resourceType
  - publicationYear
  - publisher
  - rightList
  - contributors
  - dates
  - descriptions
  - sizes
  - language 
  - relatedIdentifiers 

### User editable DOI metadata:
Among the supported the DOI metadata, the following are user editable:
  - creators
  - titles
  - language 

### DOI metadata generated by the DOI web service:
  - identifier
  - resourceType
  - publicationYear
  - publisher
  - rightList
  - contributors
  - dates
  - descriptions

## DOI Status
A status is assigned to each DOI to indicate where it is in the service lifecycle. The following (incomplete) table associates the statuses with the service lifecylce.

 From Status        |  Action/Event  |  To Status
--------------------|----------------|--------------------
  (start)           | create DOI     | in progress
 in progress        | update DOI     | in progress
 in progress        | mint   DOI     | locking data
 locking data       | error          | error locking data
 error locking data | mint   DOI     | locking data
 locking data       | success        | locked data
 locked data        | mint   DOI     | registering
 registering        | error          | error registering
 error registering  | mint   DOI     | registering
 registering        | success        | minted
