/*
************************************************************************
*******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
**************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
*
*  (c) 2018.                            (c) 2018.
*  Government of Canada                 Gouvernement du Canada
*  National Research Council            Conseil national de recherches
*  Ottawa, Canada, K1A 0R6              Ottawa, Canada, K1A 0R6
*  All rights reserved                  Tous droits réservés
*
*  NRC disclaims any warranties,        Le CNRC dénie toute garantie
*  expressed, implied, or               énoncée, implicite ou légale,
*  statutory, of any kind with          de quelque nature que ce
*  respect to the software,             soit, concernant le logiciel,
*  including without limitation         y compris sans restriction
*  any warranty of merchantability      toute garantie de valeur
*  or fitness for a particular          marchande ou de pertinence
*  purpose. NRC shall not be            pour un usage particulier.
*  liable in any event for any          Le CNRC ne pourra en aucun cas
*  damages, whether direct or           être tenu responsable de tout
*  indirect, special or general,        dommage, direct ou indirect,
*  consequential or incidental,         particulier ou général,
*  arising from the use of the          accessoire ou fortuit, résultant
*  software.  Neither the name          de l'utilisation du logiciel. Ni
*  of the National Research             le nom du Conseil National de
*  Council of Canada nor the            Recherches du Canada ni les noms
*  names of its contributors may        de ses  participants ne peuvent
*  be used to endorse or promote        être utilisés pour approuver ou
*  products derived from this           promouvoir les produits dérivés
*  software without specific prior      de ce logiciel sans autorisation
*  written permission.                  préalable et particulière
*                                       par écrit.
*
*  This file is part of the             Ce fichier fait partie du projet
*  OpenCADC project.                    OpenCADC.
*
*  OpenCADC is free software:           OpenCADC est un logiciel libre ;
*  you can redistribute it and/or       vous pouvez le redistribuer ou le
*  modify it under the terms of         modifier suivant les termes de
*  the GNU Affero General Public        la “GNU Affero General Public
*  License as published by the          License” telle que publiée
*  Free Software Foundation,            par la Free Software Foundation
*  either version 3 of the              : soit la version 3 de cette
*  License, or (at your option)         licence, soit (à votre gré)
*  any later version.                   toute version ultérieure.
*
*  OpenCADC is distributed in the       OpenCADC est distribué
*  hope that it will be useful,         dans l’espoir qu’il vous
*  but WITHOUT ANY WARRANTY;            sera utile, mais SANS AUCUNE
*  without even the implied             GARANTIE : sans même la garantie
*  warranty of MERCHANTABILITY          implicite de COMMERCIALISABILITÉ
*  or FITNESS FOR A PARTICULAR          ni d’ADÉQUATION À UN OBJECTIF
*  PURPOSE.  See the GNU Affero         PARTICULIER. Consultez la Licence
*  General Public License for           Générale Publique GNU Affero
*  more details.                        pour plus de détails.
*
*  You should have received             Vous devriez avoir reçu une
*  a copy of the GNU Affero             copie de la Licence Générale
*  General Public License along         Publique GNU Affero avec
*  with OpenCADC.  If not, see          OpenCADC ; si ce n’est
*  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
*                                       <http://www.gnu.org/licenses/>.
*
************************************************************************
*/

package ca.nrc.cadc.doi;

import ca.nrc.cadc.auth.AuthenticationUtil;
import ca.nrc.cadc.util.StringUtil;
import ca.nrc.cadc.vos.ContainerNode;
import ca.nrc.cadc.vos.Node;
import ca.nrc.cadc.vos.VOSURI;
import java.io.FileInputStream;
import java.net.URI;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import javax.security.auth.Subject;
import org.apache.log4j.Logger;
import org.jdom2.Document;
import org.jdom2.Element;

/**
 *
 */
public class GetAction extends DOIAction {

    private static final Logger log = Logger.getLogger(GetAction.class);

//    private static final String ILLEGAL_NAME_CHARS = "[~#@*+%{}<>\\[\\]|\"\\_^- \n\r\t]";

    public GetAction() {
        super();
    }

    @Override
    public void doActionImpl() throws Exception {

        if (DOINumInputStr.equals("")) {
            requestType = GET_ALL_REQUEST;
            String nextDOI = getNextDOI();
            log.info("Next DOI is: " + nextDOI);
        }
        else {
            requestType = GET_ONE_REQUEST;

            // Get DOI number from input
//            String doiSuffix = getDOISuffix(DOINumInputStr);
            String doiSuffix = DOINumInputStr;
            String doiFilename = getDOIFilename(doiSuffix);

            // Construct URI for node
            String doiDatafileName = getDoiFolderPath(doiSuffix) + getDOIFilename(doiSuffix);

            getDoiDocFromVospace(doiDatafileName);

            // Write XML to output
            writeDoiDocToSyncOutput();
        }
    }


    /*
     * Confirm that required information is provided
     */
    private void validateDOIMetadata(String name) {
        if (!StringUtil.hasText(name)) {
            throw new IllegalArgumentException("name must have a value");
        }
        if (!name.matches("[A-Za-z0-9\\-]+")) {
            throw new IllegalArgumentException("name can only contain alpha-numeric chars and '-'");
        }
        // Required:
        // author
        // title
    }


    /*
     * Generate next DOI, format: YY.####
     */
    private String getNextDOI() {
        // Check VOSpace folder names under AstroDaaCititationDOI, get the 'largest' of the current year
        // 'YY' is a 2 digit year
        DateFormat df = new SimpleDateFormat("yy"); // Just the year, with 2 digits
        String formattedDate = df.format(Calendar.getInstance().getTime());
        return formattedDate + "####";
    }
    
//    private void injectProxyCert(final Subject subject, String userid, String imageID)
//            throws PrivilegedActionException, IOException, InterruptedException {
//
//        // creating cert home dir
//        execute(new String[] {"docker", "exec", "--user", "root", imageID, "mkdir", "-p", "/home/guest/.ssl"});
//
//        // get the proxy cert
//        Subject opsSubject = CredUtil.createOpsSubject();
//        String proxyCert = Subject.doAs(opsSubject, new PrivilegedExceptionAction<String>() {
//            @Override
//            public String run() throws Exception {
//                ByteArrayOutputStream out = new ByteArrayOutputStream();
//                String userid = subject.getPrincipals(HttpPrincipal.class).iterator().next().getName();
//                HttpDownload download = new HttpDownload(
//                        new URL("https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/cred/priv/userid/" + userid), out);
//                download.run();
//                String proxyCert = out.toString();
//
//                return proxyCert;
//            }
//        });
//        log.debug("Proxy cert: " + proxyCert);
//        // inject the proxy cert
//        log.debug("Running docker exec to insert cert");
//
//        String tmpFileName = stageFile(proxyCert);
//        String[] injectCert = new String[] {"docker", "cp",  tmpFileName, imageID + ":/home/guest/.ssl/cadcproxy.pem"};
//        execute(injectCert);
//        execute(new String[] {"docker", "exec", "--user", "root", imageID, "chown", "-R", "guest:guest", "/home/guest"});
//    }
//
//    private String stageFile(String data) throws IOException {
//        String tmpFileName = "/tmp/" + UUID.randomUUID();
//        File file = new File(tmpFileName);
//        if (!file.setExecutable(true, false)) {
//            log.warn("Failed to set execution permssion on file " + tmpFileName);
//        }
//        BufferedWriter writer = new BufferedWriter(new FileWriter(file));
//        writer.write(data + "\n");
//        writer.flush();
//        writer.close();
//        return tmpFileName;
//    }
//
//    private String getSoftwareScript(String dockerID) {
//        return
//            "#!/bin/bash\n" +
//            "TARGET_IP=`hostname --ip-address`\n" +
//            "/opt/shibboleth/bin/curl -v -L -k -E /home/guest/.ssl/cadcproxy.pem " +
//            "-d \"target-ip=$TARGET_IP\" -d \"software=" + dockerID + "\" " +
//            "https://" + server + "/quarry/session/" + sessionID + "/app";
//    }
//
//    private String getKillSessionScript() {
//        return
//            "#!/bin/bash\n" +
//            "/opt/shibboleth/bin/curl -v -L -k -E /home/guest/.ssl/cadcproxy.pem " +
//            "-X DELETE " +
//            "https://" + server + "/quarry/session/" + sessionID;
//    }
//
//    private String getDesktopEntry(String name, String categories) {
//        return
//            "[Desktop Entry]\n" +
//            "Version=1.0\n" +
//            "Name=" + name + "\n" +
//            "Comment=" + name + "\n" +
//            "Keywords=" + name + "\n" +
//            "Exec=/usr/local/bin/" + name + ".sh\n" +
//            "Terminal=false\n" +
//            "X-MultipleArgs=false\n" +
//            "Type=Application\n" +
//            "Categories=" + categories;
//    }
//
//    private void confirmSoftware(String software) {
//        PropertiesReader pr = new PropertiesReader("software-containers.properties");
//        MultiValuedProperties mp = pr.getAllProperties();
//        Set<String> names = mp.keySet();
//        Iterator<String> it = names.iterator();
//        while (it.hasNext()) {
//            String value = mp.getProperty(it.next()).get(0);
//            if (value.equals(software)) {
//                return;
//            }
//        }
//        throw new IllegalArgumentException("Software with ID " + software + " is not available.");
//    }
//
//    private void injectSoftware(String imageID) throws IOException, InterruptedException {
//
//        PropertiesReader pr = new PropertiesReader("software-containers.properties");
//        MultiValuedProperties mp = pr.getAllProperties();
//        Set<String> names = mp.keySet();
//        if (names.isEmpty()) {
//            log.warn("No softare configured in ~/config/software-containers.properties");
//            return;
//        }
//        for (String name : names) {
//            String dockerID = mp.getProperty(name).get(0);
//
//            String script = getSoftwareScript(dockerID);
//            String stagedScript = stageFile(script);
//            String[] addExec = new String[] {"docker", "cp", stagedScript, imageID + ":/usr/local/bin/" + name + ".sh"};
//            execute(addExec);
//            execute(new String[] {"docker", "exec", "--user", "root", imageID, "chmod", "755", "/usr/local/bin/" + name + ".sh"});
//
//            String desktopEntry = getDesktopEntry(name, "CANFAR;");
//            String stagedDesktopEntry = stageFile(desktopEntry);
//            String[] addMenuEntry = new String[] {"docker", "cp", stagedDesktopEntry,
//                    imageID + ":/usr/share/applications/" + name + ".desktop"};
//            execute(addMenuEntry);
//            execute(new String[] {"docker", "exec", "--user", "root", imageID, "chmod", "755", "/usr/share/applications/" + name + ".desktop"});
//
//            log.debug("Added software container link: " + name + "->" + dockerID);
//
//            // add xterm to the desktop too...
//            if (name.equals("xterm")) {
//                String[] addDesktopEntry = new String[] {"docker", "cp", stagedDesktopEntry,
//                        imageID + ":/headless/Desktop/" + name + ".desktop"};
//                execute(addDesktopEntry);
//                execute(new String[] {"docker", "exec", "--user", "root", imageID, "chmod", "755", "/headless/Desktop/" + name + ".desktop"});
//            }
//        }
//
//        String killScript = getKillSessionScript();
//        String stagedScript = stageFile(killScript);
//        String[] addExec = new String[] {"docker", "cp", stagedScript, imageID + ":/usr/local/bin/kill-session.sh"};
//        execute(addExec);
//        execute(new String[] {"docker", "exec", "--user", "root", imageID, "chmod", "755", "/usr/local/bin/kill-session.sh"});
//
//        String desktopEntry = getDesktopEntry("kill-session", "CANFAR;");
//        String stagedDesktopEntry = stageFile(desktopEntry);
//        String[] addMenuEntry = new String[] {"docker", "cp", stagedDesktopEntry,
//                imageID + ":/usr/share/applications/kill-session.desktop"};
//        execute(addMenuEntry);
//        execute(new String[] {"docker", "exec", "--user", "root", imageID, "chmod", "755", "/usr/share/applications/kill-session.desktop"});
//
//        // wildcards don't work with docker exec
//        //
////        execute(new String[] {"docker", "exec", imageID, "chmod", "+x", "/usr/local/bin/*.sh"});
////        execute(new String[] {"docker", "exec", imageID, "chmod", "+x", "/headless/Desktop/*.desktop"});
//
//    }
}
