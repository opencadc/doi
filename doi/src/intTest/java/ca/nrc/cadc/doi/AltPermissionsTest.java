package ca.nrc.cadc.doi;

import ca.nrc.cadc.doi.datacite.Resource;
import ca.nrc.cadc.doi.io.DoiParsingException;
import ca.nrc.cadc.doi.io.DoiXmlReader;
import ca.nrc.cadc.doi.status.DoiStatus;
import ca.nrc.cadc.doi.status.DoiStatusListXmlReader;
import ca.nrc.cadc.doi.status.Status;
import ca.nrc.cadc.net.HttpDelete;
import ca.nrc.cadc.net.HttpGet;
import ca.nrc.cadc.net.HttpPost;
import ca.nrc.cadc.util.Log4jInit;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.junit.Assert;
import org.junit.Test;
import org.opencadc.vospace.ContainerNode;

import javax.security.auth.Subject;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringReader;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.PrivilegedActionException;
import java.security.PrivilegedExceptionAction;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class AltPermissionsTest extends LifecycleTest {

    private static final Logger log = Logger.getLogger(AltPermissionsTest.class);

    static {
        Log4jInit.setLevel("ca.nrc.cadc.doi", Level.INFO);
    }

    /*
     * Test Case 1:
     *   cadc user:
     *       create a DOI - success
     *       Update it - success
     *       Mint it - fail with 403 status
     *       get all DOI Statuses - should find the recently created DOI
     *       search DOIStatus with 'status = draft' filter - success
     *   Publisher user:
     *       get DOI - success
     *       get all DOI Statuses - should find the recently created DOI
     *       get status of it - success
     *       update it - fail with 403 status
     *       mint it - success
     *       get all DOI Statuses - should not find the recently minted DOI
     *       search DOIStatus with 'status = minted' filter - should find the recently minted DOI
     *       search DOIStatus with 'role = owner' filter - should not find the recently minted DOI
     *   cadc user:
     *       get all DOI Statuses - should find the recently minted DOI
     *       search DOIStatus with 'status = minted' filter - should find the recently minted DOI
     *   Non LoggedIn User:
     *       get all DOI Statuses - should find the recently minted DOI
     * */
    @Test
    public void testDOILifecycleWithAlternateSettings() throws Exception {
        log.debug("Test DOI lifecycle with Alternate Settings");

        // Create a new DOI
        Resource expected = getTestResource(true, true, true);

        String doiSuffix = Subject.doAs(readWriteSubject, (PrivilegedExceptionAction<String>) () -> {

            // create a new DOI - success expected
            Resource actual = create(expected, DOISettingsType.ALT_DOI);
            String doiID = getDOISuffix(actual.getIdentifier().getValue());
            Assert.assertNotNull(doiID);
            Assert.assertTrue(doiID.startsWith(TestUtil.DOI_ALT_IDENTIFIER_PREFIX));

            ContainerNode doiNode = getContainerNode(doiID, doiAltParentPathURI, doiAltVosClient);
            Assert.assertNotNull(doiNode);
            Assert.assertEquals(2, doiNode.getReadOnlyGroup().size());
            Assert.assertEquals(2, doiNode.getReadWriteGroup().size());
            log.debug("readWriteSubject - DOI created successfully: " + doiID);

            // update - success expected
            update(actual, doiID, doiAltServiceURL);
            log.debug("readWriteSubject - DOI updated successfully: " + doiID);

            // publish: failure expected
            mintDOI403Expected(doiID);
            log.debug("readWriteSubject - DOI minting failed successfully: " + doiID);

            // get doi status list
            List<DoiStatus> doiStatusList = getDoiStatuses();
            long draftDOICount = doiStatusList.stream().filter(e -> e.getStatus().equals(Status.DRAFT)).count();
            Assert.assertTrue(draftDOICount > 0);
            log.debug("readWriteSubject - found draft DOI instances: Count = " + draftDOICount);

            Optional<DoiStatus> createdDOIStatus = doiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(doiID)).findFirst();
            Assert.assertTrue(createdDOIStatus.isPresent());
            log.debug("readWriteSubject - found recently created DOI's Status Object = " + doiID);

            // verify draft DOI status in search
            Map<String, Object> draftSearchFilter = new HashMap<>();
            draftSearchFilter.put("status", "in progress");
            List<DoiStatus> draftDoiStatusList = searchDOIStatuses(draftSearchFilter);
            long draftDOIsCount = draftDoiStatusList.stream().filter(e -> e.getStatus().equals(Status.DRAFT)).count();
            Assert.assertEquals(draftDoiStatusList.size(), draftDOIsCount);
            return doiID;
        });

        Subject.doAs(publisherSubject, (PrivilegedExceptionAction<String>) () -> {
            URL doiURL = new URL(String.format("%s/%s", doiAltServiceURL, doiSuffix));

            // Get DOI : Success expected
            Resource actual = getDOI(doiURL, doiSuffix);
            log.debug("publisherSubject - get DOI success for DOI ID : " + doiSuffix);

            // get all DOIs - publisher should find the created draft DOI
            List<DoiStatus> doiStatusList = getDoiStatuses();
            Optional<DoiStatus> createdDOIStatus = doiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(doiSuffix)).findFirst();
            Assert.assertTrue(createdDOIStatus.isPresent());
            log.debug("publisherSubject - get All DOI Status success");

            // Get DOI status : Success expected
            URL getStatusURL = new URL(doiURL + "/" + DoiAction.STATUS_ACTION);
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            HttpGet get = new HttpGet(getStatusURL, bos);
            get.setRequestProperty("Accept", XML);
            get.run();

            Assert.assertNull(get.getThrowable());
            Assert.assertEquals(200, get.getResponseCode());
            log.debug("publisherSubject - get DOI status success for DOI ID : " + doiSuffix);

            //publish DOI : Success expected
            publish(actual, doiSuffix, DOISettingsType.ALT_DOI);

            doiStatusList = getDoiStatuses();
            Optional<DoiStatus> optionalDOIStatus = doiStatusList.stream().filter(e -> getDOISuffix(e.getIdentifier().getValue()).equals(doiSuffix)).findFirst();
            Assert.assertTrue(optionalDOIStatus.isPresent());
            log.debug("publisherSubject - DOI minting Successful for DOI ID: " + doiSuffix);

            // verify minted DOI status in search
            Map<String, Object> mintedSearchFilter = new HashMap<>();
            mintedSearchFilter.put("status", "minted");
            List<DoiStatus> mintedDoiStatusList = searchDOIStatuses(mintedSearchFilter);
            long draftDOIsCount = mintedDoiStatusList.stream().filter(e -> e.getStatus().equals(Status.MINTED)).count();
            Assert.assertEquals(mintedDoiStatusList.size(), draftDOIsCount);

            // verify owned DOI in search
            Map<String, Object> ownedDOIsSearchFilter = new HashMap<>();
            ownedDOIsSearchFilter.put("role", "owner");
            List<DoiStatus> ownedDOIsStatusList = searchDOIStatuses(ownedDOIsSearchFilter);
            Optional<DoiStatus> mintedDoiStatus = ownedDOIsStatusList.stream().filter(e -> getDOISuffix(e.getIdentifier().getValue()).equals(doiSuffix)).findFirst();
            Assert.assertTrue(mintedDoiStatus.isEmpty());
            return doiSuffix;
        });

        Subject.doAs(readWriteSubject, (PrivilegedExceptionAction<String>) () -> {
            List<DoiStatus> doiStatusList = getDoiStatuses();

            long publishedDOICount = doiStatusList.stream().filter(e -> e.getStatus().equals(Status.MINTED)).count();
            Assert.assertTrue(publishedDOICount > 0);

            Optional<DoiStatus> createdDOIStatus = doiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(doiSuffix)).findFirst();
            Assert.assertTrue(createdDOIStatus.isPresent());
            log.debug("readWriteSubject - get All DOI Status success with the recently minted DOI : " + doiSuffix);

            // verify minted DOI status in search
            Map<String, Object> mintedSearchFilter = new HashMap<>();
            mintedSearchFilter.put("status", "minted");
            List<DoiStatus> mintedDoiStatusList = searchDOIStatuses(mintedSearchFilter);
            long mintedDOIsCount = mintedDoiStatusList.stream().filter(e -> e.getStatus().equals(Status.MINTED)).count();
            Assert.assertEquals(mintedDoiStatusList.size(), mintedDOIsCount);
            return doiSuffix;
        });

        // A check for non loggedIn user:
        List<DoiStatus> doiStatusList = getDoiStatuses();

        long mintedDOIsCount = doiStatusList.stream().filter(doiStatus -> doiStatus.getStatus().equals(Status.MINTED)).count();
        Assert.assertEquals(doiStatusList.size(), mintedDOIsCount);

        Optional<DoiStatus> createdDOIStatus = doiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(doiSuffix)).findFirst();
        Assert.assertTrue(createdDOIStatus.isPresent());
        log.debug("Non LoggedIn User - get All DOI Status success with the recently minted DOI : " + doiSuffix);

    }

    /*
    *  Test Case 2:
    *   cadc user:
    *       create a DOI - success
    *       delete it - success
    * */
    @Test // creator of DOI can delete it
    public void testDeleteDOIByDOIOwner() throws Exception {
        // Create a new DOI
        Resource expected = getTestResource(true, true, true);

        String doiId = Subject.doAs(readWriteSubject, (PrivilegedExceptionAction<String>) () -> {

            // create a new DOI
            Resource actual = create(expected, DOISettingsType.ALT_DOI);
            String doiID = getDOISuffix(actual.getIdentifier().getValue());
            log.debug("readWriteSubject - DOI created successfully: " + doiID);

            // Delete DOI - Success expected
            deleteDOI(doiID);
            log.debug("readWriteSubject - DOI deleted successfully: " + doiID);
            return doiID;
        });
    }

    /*
     *  Test Case 3:
     *   cadc user:
     *       create a DOI - success
     *   publisher user:
     *       delete it - success
     * */
    @Test // publisher can delete a DOI
    public void testDeleteDOIByPublisher() throws Exception {
        // Create a new DOI
        Resource expected = getTestResource(true, true, true);

        String doiId = Subject.doAs(readWriteSubject, (PrivilegedExceptionAction<String>) () -> {
            // create a new DOI
            Resource actual = create(expected, DOISettingsType.ALT_DOI);
            String doiSuffix = getDOISuffix(actual.getIdentifier().getValue());
            log.debug("readWriteSubject - DOI created successfully: " + doiSuffix);
            return doiSuffix;
        });

        // Delete DOI - Success expected
        Subject.doAs(publisherSubject, (PrivilegedExceptionAction<String>) () -> {
            deleteDOI(doiId);
            log.debug("publisherSubject - DOI deleted successfully: " + doiId);
            return doiId;
        });
    }

    /*
     *  Test Case 4:
     *   publisher user:
     *      create a DOI - success
     *      Mint it - fail with 403 status
     *      get all DOI statuses - created DOI is still accessible
     *      search DOIStatus with 'role = owner' filter - should find the recently created DOI
     *      search DOIStatus with 'role = publisher' filter - should not find the recently minted DOI
     *   cadc user:
     *      get all DOI statuses - should not find the recently created DOI
     *      get DOI status - Access denied for DOI created by other user(if user is not publisher/doi admin)
     *   publisher user:
     *      delete it - success
     * */
    @Test // If publisher is the owner of a DOI, he can not mint it.
    public void testPublisherAsDOIOwnerForMintAction() throws PrivilegedActionException {
        Resource expected = getTestResource(true, true, true);
        String doiId = Subject.doAs(publisherSubject, (PrivilegedExceptionAction<String>) () -> {
            Resource actual = create(expected, DOISettingsType.ALT_DOI);
            String doiID = getDOISuffix(actual.getIdentifier().getValue());
            log.debug("publisherSubject - DOI created successfully: " + doiID);

            mintDOI403Expected(doiID);
            log.debug("publisherSubject - DOI minting failed successfully: " + doiID);

            // verify that the created DOI is still accessible and status is DRAFT
            List<DoiStatus> doiStatusList = getDoiStatuses();

            Optional<DoiStatus> createdDOIStatus = doiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(doiID) && doiStatus.getStatus().equals(Status.DRAFT)).findFirst();
            Assert.assertTrue(createdDOIStatus.isPresent());
            log.debug("publisherSubject - DOI's DRAFT status verified: " + doiID);

            // verify DOI in search as an owner
            Map<String, Object> ownedDOIsSearchFilter = new HashMap<>();
            ownedDOIsSearchFilter.put("role", "owner");
            List<DoiStatus> ownedDOIsStatusList = searchDOIStatuses(ownedDOIsSearchFilter);
            Optional<DoiStatus> mintedDoiStatus = ownedDOIsStatusList.stream().filter(e -> getDOISuffix(e.getIdentifier().getValue()).equals(doiID)).findFirst();
            Assert.assertTrue(mintedDoiStatus.isPresent());

            // verify DOI in search as publisher
            Map<String, Object> publisherDOIsSearchFilter = new HashMap<>();
            publisherDOIsSearchFilter.put("role", "publisher");
            List<DoiStatus> filteredDOIStatusList = searchDOIStatuses(publisherDOIsSearchFilter);
            Optional<DoiStatus> optionalDoiStatus = filteredDOIStatusList.stream().filter(e -> getDOISuffix(e.getIdentifier().getValue()).equals(doiID)).findFirst();
            Assert.assertTrue(optionalDoiStatus.isEmpty());
            return doiID;
        });

        Subject.doAs(readWriteSubject, (PrivilegedExceptionAction<String>) () -> {
            List<DoiStatus> doiStatusList = getDoiStatuses();
            Optional<DoiStatus> createdDOIStatus = doiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(doiId)).findFirst();
            Assert.assertFalse(createdDOIStatus.isPresent());

            URL doiURL = new URL(String.format("%s/%s", doiAltServiceURL, doiId));
            URL getStatusURL = new URL(doiURL + "/" + DoiAction.STATUS_ACTION);
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            HttpGet get = new HttpGet(getStatusURL, bos);
            get.setRequestProperty("Accept", XML);
            get.run();

            Assert.assertNotNull(get.getThrowable());
            Assert.assertEquals(403, get.getResponseCode());
            return doiId;
        });

        Subject.doAs(publisherSubject, (PrivilegedExceptionAction<String>) () -> {
            deleteDOI(doiId);
            log.debug("publisherSubject - DOI deleted successfully: " + doiId);
            return doiId;
        });
    }

    @Test
    public void testDOISearchEndpoint() throws PrivilegedActionException, DoiParsingException, IOException {
        Resource expected = getTestResource(true, true, true);

        String mintedDOIId = Subject.doAs(readWriteSubject, (PrivilegedExceptionAction<String>) () -> {

            // create DOI
            Resource actual = create(expected, DOISettingsType.ALT_DOI);
            String doiID = getDOISuffix(actual.getIdentifier().getValue());
            Assert.assertNotNull(doiID);
            return doiID;
        });

        Subject.doAs(publisherSubject, (PrivilegedExceptionAction<String>) () -> {
            URL doiURL = new URL(String.format("%s/%s", doiAltServiceURL, mintedDOIId));
            Resource actual = getDOI(doiURL, mintedDOIId);

            publish(actual, mintedDOIId, DOISettingsType.ALT_DOI);

            return mintedDOIId;
        });

        String draftDOIId = Subject.doAs(readWriteSubject, (PrivilegedExceptionAction<String>) () -> {

            // create DOI
            Resource actual = create(expected, DOISettingsType.ALT_DOI);
            String doiID = getDOISuffix(actual.getIdentifier().getValue());
            Assert.assertNotNull(doiID);
            return doiID;
        });

        String publisherOwnedDOIId = Subject.doAs(publisherSubject, (PrivilegedExceptionAction<String>) () -> {

            // create DOI
            Resource actual = create(expected, DOISettingsType.ALT_DOI);
            String doiID = getDOISuffix(actual.getIdentifier().getValue());
            Assert.assertNotNull(doiID);
            return doiID;
        });

        Subject.doAs(readWriteSubject, (PrivilegedExceptionAction<String>) () -> {
            // fetch all draft DOIs
            Map<String, Object> searchFilter = new HashMap<>();
            searchFilter.put("status", "in progress");

            List<DoiStatus> draftDoiStatusList = searchDOIStatuses(searchFilter);

            long draftDOIsCount = draftDoiStatusList.stream().filter(e -> e.getStatus().equals(Status.DRAFT)).count();
            Assert.assertEquals(draftDoiStatusList.size(), draftDOIsCount);

            Optional<DoiStatus> draftDOIStatus = draftDoiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(draftDOIId)).findFirst();
            Assert.assertTrue(draftDOIStatus.isPresent());

            Optional<DoiStatus> nonDraftDOIStatus = draftDoiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(mintedDOIId)).findFirst();
            Assert.assertFalse(nonDraftDOIStatus.isPresent());

            // fetch all minted DOIs
            searchFilter = new HashMap<>();
            searchFilter.put("status", "minted");

            List<DoiStatus> publishedDoiStatusList = searchDOIStatuses(searchFilter);

            long publishedDOIsCount = publishedDoiStatusList.stream().filter(e -> e.getStatus().equals(Status.MINTED)).count();
            Assert.assertEquals(publishedDoiStatusList.size(), publishedDOIsCount);

            Optional<DoiStatus> mintedDOIStatus = publishedDoiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(mintedDOIId)).findFirst();
            Assert.assertTrue(mintedDOIStatus.isPresent());

            Optional<DoiStatus> nonMintedDOIStatus = publishedDoiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(draftDOIId)).findFirst();
            Assert.assertFalse(nonMintedDOIStatus.isPresent());

            // fetch all Own DOIs
            searchFilter = new HashMap<>();
            searchFilter.put("role", "owner");

            List<DoiStatus> ownDoiStatusList = searchDOIStatuses(searchFilter);

            long ownDOIsCount = ownDoiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(mintedDOIId) || getDOISuffix(doiStatus.getIdentifier().getValue()).equals(draftDOIId)).count();
            Assert.assertEquals(2, ownDOIsCount); // both should be present

            // fetch all DOIs which user has access to publish
            searchFilter = new HashMap<>();
            searchFilter.put("role", "publisher");

            List<DoiStatus> publisherDoiStatusList = searchDOIStatuses(searchFilter);
            Assert.assertTrue(publisherDoiStatusList.isEmpty());
            return null;
        });

        Subject.doAs(publisherSubject, (PrivilegedExceptionAction<String>) () -> {

            // fetch all draft DOIs
            Map<String, Object> searchFilter = new HashMap<>();
            searchFilter.put("status", "in progress");

            List<DoiStatus> draftDoiStatusList = searchDOIStatuses(searchFilter);

            long draftDOIsCount = draftDoiStatusList.stream().filter(e -> e.getStatus().equals(Status.DRAFT)).count();
            Assert.assertEquals(draftDoiStatusList.size(), draftDOIsCount);

            draftDOIsCount = draftDoiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(publisherOwnedDOIId) || getDOISuffix(doiStatus.getIdentifier().getValue()).equals(draftDOIId)).count();
            Assert.assertEquals(2, draftDOIsCount);

            // fetch all Own DOIs
            searchFilter = new HashMap<>();
            searchFilter.put("role", "owner");

            List<DoiStatus> ownDoiStatusList = searchDOIStatuses(searchFilter);

            long ownDOIsCount = ownDoiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(publisherOwnedDOIId) || getDOISuffix(doiStatus.getIdentifier().getValue()).equals(draftDOIId)).count();
            Assert.assertEquals(1, ownDOIsCount);

            Optional<DoiStatus> ownDOIStatus = ownDoiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(publisherOwnedDOIId)).findFirst();
            Assert.assertTrue(ownDOIStatus.isPresent());

            Optional<DoiStatus> notOwnedDOIStatus = ownDoiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(draftDOIId)).findFirst();
            Assert.assertFalse(notOwnedDOIStatus.isPresent());

            // fetch all DOIs which user has access to publish
            searchFilter = new HashMap<>();
            searchFilter.put("role", "publisher");

            List<DoiStatus> publisherDoiStatusList = searchDOIStatuses(searchFilter);

            long publisherDOIsCount = publisherDoiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(publisherOwnedDOIId) || getDOISuffix(doiStatus.getIdentifier().getValue()).equals(draftDOIId)).count();
            Assert.assertEquals(1, publisherDOIsCount);

            ownDOIStatus = publisherDoiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(publisherOwnedDOIId)).findFirst();
            Assert.assertFalse(ownDOIStatus.isPresent());

            notOwnedDOIStatus = publisherDoiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(draftDOIId)).findFirst();
            Assert.assertTrue(notOwnedDOIStatus.isPresent());

            // cleanup
            deleteDOI(draftDOIId);
            deleteDOI(publisherOwnedDOIId);
            return null;
        });
    }

    private Resource getDOI(URL doiURL, String doiSuffix) throws DoiParsingException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();

        HttpGet get = new HttpGet(doiURL, bos);
        get.setRequestProperty("Accept", XML);
        get.run();
        Assert.assertNull(get.getThrowable());
        Assert.assertEquals(200, get.getResponseCode());

        DoiXmlReader reader = new DoiXmlReader();
        Resource actual = reader.read(bos.toString(StandardCharsets.UTF_8));
        Assert.assertEquals(doiSuffix, getDOISuffix(actual.getIdentifier().getValue()));
        return actual;
    }

    private void mintDOI403Expected(String doiID) throws MalformedURLException {
        URL doiURL = new URL(String.format("%s/%s", doiAltServiceURL, doiID));
        URL mintURL = new URL(doiURL + "/" + DoiAction.MINT_ACTION);

        HttpPost post = new HttpPost(mintURL, new HashMap<>(), true);
        post.run();
        Assert.assertNotNull(post.getThrowable());
        Assert.assertEquals(403, post.getResponseCode());
    }

    private void deleteDOI(String doiId) throws IOException, DoiParsingException {
        HttpDelete delete = new HttpDelete(new URL(String.format("%s/%s", doiAltServiceURL, doiId)), false);
        delete.run();
        Assert.assertNull(delete.getThrowable());
        Assert.assertEquals(200, delete.getResponseCode());

        // verify that DOI is deleted
        List<DoiStatus> doiStatusList = getDoiStatuses();

        Optional<DoiStatus> createdDOIStatus = doiStatusList.stream().filter(doiStatus -> getDOISuffix(doiStatus.getIdentifier().getValue()).equals(doiId)).findFirst();
        Assert.assertFalse(createdDOIStatus.isPresent());
        log.debug("verified deleted DOI " + doiId);
    }

    private static List<DoiStatus> getDoiStatuses() throws DoiParsingException, IOException {
        URL doiURL = new URL(String.format("%s", doiAltServiceURL));
        ByteArrayOutputStream bos = new ByteArrayOutputStream();

        HttpGet get = new HttpGet(doiURL, bos);
        get.setRequestProperty("Accept", XML);
        get.run();
        Assert.assertNull(get.getThrowable());
        Assert.assertEquals(200, get.getResponseCode());

        DoiStatusListXmlReader reader = new DoiStatusListXmlReader();
        return reader.read(new StringReader(bos.toString(StandardCharsets.UTF_8)));
    }

    public List<DoiStatus> searchDOIStatuses(Map<String, Object> params) throws IOException, DoiParsingException {
        URL doiURL = new URL(String.format("%s", doiSearchServiceURL));
        ByteArrayOutputStream bos = new ByteArrayOutputStream();

        HttpPost post = new HttpPost(doiURL, params, bos);
        post.run();

        Assert.assertNull(post.getThrowable());
        Assert.assertEquals(200, post.getResponseCode());

        DoiStatusListXmlReader reader = new DoiStatusListXmlReader();
        return reader.read(new StringReader(bos.toString(StandardCharsets.UTF_8)));
    }

}
