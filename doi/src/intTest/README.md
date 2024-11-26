# doi service integration tests

The integration tests can run against a local `doi` service, and either a local or remove VOSpace service.

The integration tests expect the following entries in `intTest.properties` in the root of the doi module.
`doiResoruceID` is the resourceID of the doi service.
`vospaceParentUri` is the VOSURI of the DOI parent folder in the VOSpace service.

Client test certificates in the `$A/test-certificates/` directory are used to authenticate to the doi service.
The following certificates are expected.
- `doi-admin.pem` owns and has full permissions to a test DOI.
- `doi-auth.pem` has read-write permissions to a test DOI.
- `doi-noauth.pem` has read-only permissions to a test DOI.
