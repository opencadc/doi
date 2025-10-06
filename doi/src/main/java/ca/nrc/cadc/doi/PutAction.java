package ca.nrc.cadc.doi;

import ca.nrc.cadc.doi.datacite.Resource;
import java.security.PrivilegedExceptionAction;
import javax.security.auth.Subject;
import org.apache.log4j.Logger;

public class PutAction extends DoiWriteAction {
    private static final Logger log = Logger.getLogger(PutAction.class);

    public PutAction() {
        super();
    }

    @Override
    public void doAction() throws Exception {
        super.init();
        authorize();

        // DOI Initialization does not require further authorization beyond identity check
        Subject.doAs(getAdminSubject(), (PrivilegedExceptionAction<Object>) () -> {
            Resource resource = (Resource) syncInput.getContent(DoiInlineContentHandler.CONTENT_KEY);
            createDOI(resource);
            return null;
        });
    }

}
