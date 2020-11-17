Last updated Nov 2020

How to compile:
Regular 'gradle clean build' works, with some pre-requisites needed.

Needed at build time:
- valid datacite.pass in your $A/etc folder. (This is copied into the resources folder at build time.)


How to run integration tests:
- need updated certs for cadcregtest, cadcregtest1, etc. in $A/test-certificates
- need valid doiadmin.pem file in $A/test-certificates (VOSpaceClient needs this to clean up in the minting tests.)


Deploying to vm:
- rsync doi.war over to a canfar vm.
- make sure ~servops/config/doi.properties file is there and matches (roughly) doi.properties here.

*NOTE* you will need to change the production datacite ref to mds.test.datacite.org - whatever plumbing
that might have once been imagined to support a proper switch between production and test deployments
of doi.war weren't completed. 
