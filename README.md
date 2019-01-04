# CANFAR Data Citation
### V 1.0
UI for generating and managing Digital Object Identifiers (DOIs) for research datasets archived with CANFAR. 

## Description
This CANFAR service is intended to simplify the process of publishing and reviewing research data, 
reducing the amount of "paperwork" necessary to register datasets associated with a publication. 

It provides a pre-publication data repository, a service to generate DOI metadata and publish it with DataCite, 
and a landing page facility to support DOIs registered with DataCite through the service.

Currently the service will:
- create a draft DOI metadata document using the minimal information necessary
- generate a VOSpace directory for the dataset to be housed and later archived when the DOI is minted
- register the DOI with DataCite when the DOI is minted
- allow requesters to view and manage their current set of DOIs
- allow requesters to view the landing page associated with their unminted DOIs
- allow anonymous access to landing pages associated with minted DOIs 


## Endpoint locations
All endpoints require authorized access, EXCEPT the landing pages.

Data DOI Listing and Management page:
http://www.canfar.net/citation

Data DOI Request page:
http://www.canfar.net/citation/request

View Single Data DOI:
http://www.canfar.net/citation/request?doi=<YY.####>

Data DOI Landing page:
http://www.canfar.net/citation/landing?doi=<YY.####>


## CANFAR Data Digital Object Identifier (DOI) Workflow
The CANFAR Data DOI workflow has several distinct phases. No time limit is imposed on any phase.
- Create Draft DOI
- Upload dataset
- Mint DOI

### Create Draft DOI
On the Data DOI Request page:

1. Fill in form with the following:
     - Publication Title
     - First Author
     - Additional Authors (optional)
     - Journal Reference (optional)
2. Submit the form
3. Once created, the DOI number will be displayed in the form. 
4. A directory link will be provided where Datasets for the publication can be uploaded

### Delete Draft DOI
Note: This step can NOT be completed on Minted or Completed DOIs.

From the Data DOI Request page, or the DOI Listing and Management page, select the 'Delete' button associated 
with the DOI to be removed. There will be a confirmation panel displayed. Status of the deletion will be
displayed after the function completes.

### Upload dataset
At this point the metadata and the data sub-directory are available to the user only. The user can repeatedly:
  - upload data files to the data sub-directory using either the User Storage UI or the VOSpace CLI
 
### Updating a DOI 
After creation and prior to minting, DOI metadata can be updated at any time through the Data DOI Request page.  

### Minting the DOI 
After all data files have been uploaded and the metadata has been verfied, the user can mint a DOI.
At this point, the service will:
- lock the DOI data directory and any associated files so they can't be altered further
- set all DOI files to be publicly readable
- submit the DOI metadata and landing page URL information to DataCite

Minting can be completed through the Data DOI Request page or the Data DOI Listing and Management page. Select the 'Mint' 
button on either page corresponding with the DOI you want to act on. 
 
### Viewing a Data DOI
Once a DOI has been created, it can be accessed using the DOI List page:

http://www.canfar.net/citation

Authorised users will have access to their DOIs, and can click through to the request page where they can view
the DOI, and continue with the workflow. Example URL:

http://www.canfar.net/citation/request?doi=18.0001

### Viewing a Data DOI Landing page
When a DOI is submitted for minting, a landing page URL is provided to DataCite. After minting, a search for the DOI 
number at data doi.org will forward to a URL similar to this:

http://www.canfar.net/landing?doi=<YY.####>

Minted DOIs will have anonymous access through the landing page.


## Data DOI States
A DOI managed through the CANFAR services has 2 states:
- In progress
- Minted

#### In Progress DOIs
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
