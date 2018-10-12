# data-citation
### V 1.0

UI for creating and displaying Digital Object Identifiers (DOIs) for research datasets archived with CANFAR. 

## Location
DOI List page:
http://apps.canfar.net/citation

DOI Request page:
http://apps.canfar.net/citation/request

## Description
CANFAR provides a service to create, view and mint DOIs for researchers, reducing the amount of paperwork necessary to 
register datasets associated with a publications. 

Currently the service will:
- take a minimal amount of information in to create a draft DOI document that can then be later submitted to DataCite
- generate a VOSpace directory for the dataset to be housed and later archived when the DOI is minted
- allow owners to view their current set of DOIs


## CANFAR Digital Object Identifier (DOI) Workflow
The CANFAR DOI workflow has three distinct phases. No time limit is imposed on any phase.
- Create Draft DOI
- Upload dataset
- Finalize DOI


### Create Draft DOI
On Data Citation web page, on the DOI Request form:

1. Fill in form with the following:
     - Title
     - Author list (a list of last name, first name)
     - Publication Name or DOI
     - Publication Year
2. Submit the form
3. Once created, the DOI number will be displayed in the form. 
4. A directory link will be provided where Datasets for the publication can be uploaded

### Upload dataset
At this point the metadata and the data sub-directory are available to the user only. The user can repeatedly:
  - upload data files to the data sub-directory using either the User Storage UI or the VOSpace CLI
 
### Updating a DOI 
After creation and prior to minting, the metadata can be updated at any time through the DOI Request form.  

### Finalizing the DOI (Not yet Implemented)
After all data files have been uploaded and the metadata has been verfied, the user can finalize (mint) a DOI.
At this point, the service will:
- lock the DOI data directory and any associated files so they can't be altered further
- set all DOI files to be publicly readable
- submit the DOI metadata and landing page URL information to Data Cite
 
## Viewing a CANFAR DOI
Once a DOI has been created, it can be accessed using the DOI List page:

http://apps.canfar.net/citation

Authorised users will have access to their DOIs, and can click through to the request page where they can view
the DOI, and continue with the workflow. Example URL:

http://apps.canfar.net/citation/request?doi=18.0001

  
### DOI States
A DOI managed through the CANFAR services has 2 states:
- Draft
- Minted

#### Draft DOIs
- can be edited
- can be deleted from the system
- are not publicly available
- can have data uploaded to their data directory
- have not been registered with Data Cite

#### Minted DOIs
- can not be edited or deleted from the system
- have their data directory locked and persisted
- are publicly available
- have been registered with DataCite.org
- are findable through doi.org and other DOI search engines
