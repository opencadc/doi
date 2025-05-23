# doi service integration tests

The integration tests can run against two local `doi` service - one with basic configuration and one with alternate configuration, and either a local or remote VOSpace service.

## configuration
While running both the basic and alternate configuration tests, _groupPrefix_ property can be set to `TEST.DOI-` to differentiate the test groups. 

A file called `intTest.properties` can be in the classpath (in `src/intTest/resources`) to override properties.

### intTest.properties
```
doiResourceID={resourceID of the doi service}
doiVospaceParentUri={VOSURI to the DOI parent folder in the VOSpace service}
doiAltResourceID={resourceID of the doi service with alternate configuration}
doiAltVospaceParentUri={VOSURI to the Alt DOI parent folder in the VOSpace service}
doiAltIdentifierPrefix={prefix for the DOI Identifier}
```

**_doiVospaceParentUri_** must match `ca.nrc.cadc.doi.vospaceParentUri` configured in the doi service `doi.properties`.
**_doiAltVospaceParentUri_** must match `ca.nrc.cadc.doi.vospaceParentUri` configured in the Alternate doi service `doi.properties`.
**_doiAltIdentifierPrefix_** must match `doiIdentifierPrefix` configured in the Alternate doi service `doi.properties`.

### certificates
Client test certificates in the `$A/test-certificates/` directory are used to authenticate to the doi service.
The following certificates are expected.
- `doi-admin.pem` owns and has full permissions to the test DOI.
- `doi-auth.pem` is a member of a group that has read-write permissions to the test DOI.
- `doi-noauth.pem` is not a member of any group that has permissions to the test DOI, resulting in read-only permissions to the test DOI.
- `doi-publisher.pem` is a member of a group that has publish permissions to the test DOI.
