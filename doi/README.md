# Digital Object Identifier Web Service

This service allows a user to store data associated with a publication and assigns a DOI for the data storage. Data are stored in VOSpace. A user interacts with the service via a GUI. 

## Service lifecycle
Usage of this service can be divided into three distinct phases described below. The service does not impose a time limit on each phase.

### DOI creation
1. user enters metadata of a publication using a GUI
   - example metadata:
     - creator name
     - given name
     - family
     - affiliation
     - title
     - publisher
     - publication year
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
After all data files have been uploaded and the metadata have been updated, the user can finalize the DOI using the GUI. On reception of the finalize request, the DOI service performs the following:
  - change the following to read only and make them publicly accessible:
    - data sub-directory
    - all data files contained in the data sub-directory
    - the xml file containing the DOI metadata stored at the same level as the data sub-directory
  - returns the metadata to the GUI
   
   