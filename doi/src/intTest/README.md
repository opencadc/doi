# doi service integration tests

The integration tests can run against a local `doi` service, and either a local or remote VOSpace service.

## configuration
A file called `intTest.properties` can be in the classpath (in `src/intTest/resources`) to override properties.

### intTest.properties
```
doiResourceID={resourceID of the doi service}
vospaceParentUri={VOSURI to the DOI parent folder in the VOSpace service}
```

**_vospaceParentUri_** must match `ca.nrc.cadc.doi.vospaceParentUri` configured in the doi service `doi.properties`.

### certificates
Client test certificates in the `$A/test-certificates/` directory are used to authenticate to the doi service.
The following certificates are expected.
- `doi-admin.pem` owns and has full permissions to the test DOI.
- `doi-auth.pem` is a member of a group that has read-write permissions to the test DOI.
- `doi-noauth.pem` is not a member of any group that has permissions to the test DOI, resulting in read-only permissions to the test DOI.
- `doi-publisher.pem` is a member of a group that has publish permissions to the test DOI.
