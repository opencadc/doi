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
# Vault Service resourceID
ca.nrc.cadc.doi.vaultResourceID = {vault service resourceID}

# Group Management Service (GMS) resourceID
ca.nrc.cadc.doi.gmsResourceID = {GMS service resourceID}

# Path in vault to the parent folder containing the DOI's.
ca.nrc.cadc.doi.parentPath = {DOI parent folder path}

# Prefix to the DOI metadata file
ca.nrc.cadc.doi.metadataFilePrefix = {file prefix}
 
# DOI landing page url
ca.nrc.cadc.doi.landingUrl = {landing page url}

# DataCite MDS REST endpoint
ca.nrc.cadc.doi.datacite.mdsUrl = {MDS url}

# DataCite account prefix
ca.nrc.cadc.doi.datacite.accountPrefix = {account prefix}

# DataCite account username
ca.nrc.cadc.doi.datacite.username = {username}

# DataCite account password
ca.nrc.cadc.doi.datacite.password = {password}
```

_vaultResourceID_ the resourceID to the vault service used to store the DOI metadata and files.

_gmsResourceID_ the resourceID to the GMS service used for authentication and authorization.

_parentPath_ is the path in the vault service to the DOI parent folder.

_metadataFilePrefix_ is the prefix prepended to the DOI name to create the filename for the DOI specific metadata stored in VOSpace.

_landingUrl_ is the base URL used to compose URLs to individual DOI's.

_mdsUrl_ is the URL to the Datacite MDS rest endpoint used to create and update DOI's.

_accountPrefix_ is the registered prefix for the DataCite account.

_username_ is the DataCite account username.

_password_ is the DataCite account password.

### Optional properties useful for integration testing.
```
# (optional) Create a random DOI name for testing
ca.nrc.cadc.doi.test.randomName = {true|false}

# (optional) Group URI that will own test DOI's
ca.nrc.cadc.doi.test.groupUri = {group URI}
```

### doiadmin.pem
This client certificate is used to make authenticated calls to a VOSpace service.

### cadcproxy.pem
This client certificate is used to make authenticated server-to-server calls for system-level A&A purposes.

### cadc-log.properties (optional)
See <a href="https://github.com/opencadc/core/tree/master/cadc-log">cadc-log</a> for common
dynamic logging control.

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
