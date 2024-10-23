# doi service integration tests

The integration tests run against a local doi instance defined by the `ivo://opencadc.org/doi` resourceID, 
and a vault service defined by the `ivo://opencadc.org/vault` resourceID'.

Client test certificates in the `$A/test-certificates/` directory are used to authenticate to the doi service.
The following certificates are expected.
- `doiadmin.pem` owns and has full access to a test DOI.
- `doi-auth.pem` has read-write access to a test DOI.
- `doi-noauth.pem` has read-only access to a test DOI.

The integration tests expect the following entries in `doi.properties`.

`ca.nrc.cadc.doi.test.randomName = true` to create random DOI names for testing.

`ca.nrc.cadc.doi.test.groupUri = {group URI}` to specify the group URI that will have read/write permissions to a test DOI.
The `doi-auth.pem` user is a member of this group, giving this user read/write access to a test DOI.
The `doi-noauth.pem` user is not a member of this group, giving this user read-only access to a test DOI.
