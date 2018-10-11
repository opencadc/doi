<%@ page language="java" contentType="text/html; charset=UTF-8" session="false" pageEncoding="UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<c:set var="baseURL" value='<%= System.getenv("CANFAR_WEB_HOST") %>' />

<!-- Default to current host. -->
<c:if test="${empty baseURL}">
  <c:set var="req" value="${pageContext.request}" />
  <c:set var="url">${req.requestURL}</c:set>
  <c:set var="uri" value="${req.requestURI}" />
  <c:set var="baseURL" value="${fn:substring(url, 0, fn:length(url) - fn:length(uri))}" />
</c:if>

<%-- Set this by configuration in the future. --%>
<%--<c:set var="resourceCapabilitiesEndPoint" value="http://apps.canfar.net/reg/resource-caps" />--%>
<c:set var="resourceCapabilitiesEndPoint" value="http://jeevesh.cadc.dao.nrc.ca/reg/resource-caps" />
<c:set var="contextPath" value="${pageContext.request.contextPath}" />

<!DOCTYPE html>
<html lang="en">

  <head>
    <meta charset='utf-8'>
    <meta http-equiv="X-UA-Compatible" content="chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <base href="${fn:substring(url, 0, fn:length(url) - fn:length(uri))}${req.contextPath}/" />

    <c:import url="${baseURL}/canfar/includes/_page_top_styles.shtml" />
    <link rel="stylesheet" type="text/css"
          href="<c:out value=" ${baseURL}/citation/css/datatables.css " />" media="screen"
    />
    <link rel="stylesheet" type="text/css"
          href="<c:out value=" ${baseURL}/citation/css/citation.css " />" media="screen"
    />
    <link rel="stylesheet" type="text/css"
          href="<c:out value=" ${baseURL}/cadcVOTV/css/jquery-ui-1.11.4.min.css " />" media="screen"
    />

    <!-- Located in ROOT.war -->
    <script type="application/javascript" src="${baseURL}/canfar/javascript/jquery-2.2.4.min.js"></script>
    <script type="application/javascript" src="${baseURL}/canfar/javascript/bootstrap.min.js"></script>

    <!--[if lt IE 9]>
        <script src="/html5shiv.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
    <title>Data Citation</title>
  </head>

  <body>
    <c:import url="${baseURL}/canfar/includes/_application_header.shtml" />
    <div class="container-fluid fill">
      <div class="row fill">
        <div role="main" class="col-sm-12 col-md-12 main fill">
          <div class="inner fill">
            <section id="main_content" class="fill">

              <h2 class="doi-page-header">
                <a id="canfar-doi" class="anchor" href="#canfar-doi" aria-hidden="true">
                  <span aria-hidden="true" class="octicon octicon-link"></span>
                </a>Data Citation
              </h2>

              <div class="doi-authenticated hidden">
                <div class="panel panel-default doi-panel">
                  <div class="panel-heading doi-panel-heading">

                    <nav class="navbar navbar-expand-sm doi-header-navbar" id="navbar-functions">
                      <ul class="nav navbar-nav doi-header-navbar">
                        <li class="nav-item"><h4>DOI Listing</h4></li>
                        <li class="nav-item pull-right">
                          <button class="btn btn-light doi_refresh doi-listpage-header btn-sm">Refresh list</button>
                        </li>
                        <li class="nav-item pull-right">
                          <button id="doi_request" class="btn btn-primary doi-listpage-header btn-sm">New DOI</button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                  <div class="progress doi-progress-bar-container">
                    <div class="progress-bar progress-bar-success doi-progress-bar"
                         role="progressbar" aria-valuenow="100" aria-valuemin="100" aria-valuemax="100">
                    </div>
                  </div>
                  <div class="panel-body doi-panel-body">

                    <!-- Noficiation and Alert bars -->
                    <div class="alert alert-danger hidden">
                      <strong id="status_code">444</strong>&nbsp;&nbsp;<span id="error_msg">Server error</span>
                    </div>

                    <div class="alert alert-success hidden">
                      <span id="alert_msg"></span>
                    </div>

                    <!-- Table starts -->

                    <table id="doi_table" class="table table-sm table-hover table-responsive-md dataTable">
                      <thead>
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <td>Title</td>
                        <th>Data Directory</th>
                        <th>Actions</th>
                      </tr>
                      </thead>
                      <tbody>
                      </tbody>
                    </table>

                  </div>
                </div>


              </div>

              <div class="doi-anonymous">
                <div class="info-panel card panel-default">
                  <div class="card-body">
                    <span class="info-span"></span>
                  </div>
                </div>
              </div>


              <!-- Content ends -->
            </section>
          </div>
        </div>
      </div>
    </div>

    <script type="text/javascript" src="http://apps.canfar.net/cadcJS/javascript/org.opencadc.js"></script>
    <script type="text/javascript" src="http://apps.canfar.net/cadcJS/javascript/cadc.uri.js"></script>
    <script type="text/javascript" src="http://apps.canfar.net/canfar/javascript/cadc.user.js"></script>
    <script type="application/javascript" src="<c:out value=" ${baseURL}/cadcJS/javascript/cadc.registry-client.js" />"></script>
    <script type="application/javascript" src="<c:out value=" ${baseURL}/citation/js/datatables.js" />"></script>
    <script type="application/javascript" src="<c:out value=" ${baseURL}/citation/js/citation_page.js" />"></script>
    <script type="application/javascript" src="<c:out value=" ${baseURL}/citation/js/citation.js" />"></script>

    <script type="application/javascript">
      $(document).ready(function() {

        userManager = new cadc.web.UserManager();

        // From cadc.user.js. Listens for when user logs in
        userManager.subscribe(cadc.web.events.onUserLoad,
            function (event, data)
            {
              // Check to see if user is logged in or not
              if (typeof(data.error) != "undefined") {
                var errorMsg = "";
                if (data.errorStatus === 401) {
                  errorMsg = "<em>" + data.errorStatus + " " + data.error + "</em>. Please log in to use this service.";
                } else {
                  errorMsg = "Unable to access Data Citation Listing Service " + data.errorStatus + " " + data.error ;
                }
                citation_js.setNotAuthenticated(errorMsg);
              } else {
                citation_js.setAuthenticated();
              }
            });

        // This function is in cadc.user.js, will throw the event
        // in the userManager.subscribe above...
        userManager.loadCurrent();

        // Instantiate controller for Data Citation List page
        citation_js = new cadc.web.citation.Citation({resourceCapabilitiesEndPoint: '${resourceCapabilitiesEndPoint}'});

    }); // end body onReady function

    </script>

  </body>

</html>

