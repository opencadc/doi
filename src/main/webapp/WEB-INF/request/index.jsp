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
              href="<c:out value=" ${baseURL}/cadcVOTV/css/jquery-ui-1.11.4.min.css " />" media="screen"
        />

        <!-- Located in ROOT.war -->
        <script type="application/javascript" src="${baseURL}/citation/js/jquery-2.2.4.min.js"></script>
        <script type="application/javascript" ${baseURL}/citation/js/bootstrap.min.js"></script>


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

                  <h2>
                    <a id="canfar-doi" class="anchor" href="#canfar-doi" aria-hidden="true">
                      <span aria-hidden="true" class="octicon octicon-link"></span>
                    </a>Data Citation
                  </h2>

                    <div class="doi-form-body">
                      <form id="doi_request_form" class="form-horizontal">
                        <!-- DOI Number -->
                        <!-- will need to be read only for GET display -->
                        <div class="form-group">
                          <label for="doi_number" class="col-sm-2 control-label" id="doi_number_label">DOI Number</label>
                          <div class="col-sm-10">
                            <input type="text" class="form-control" id="doi_number" name="doi-number" placeholder="YY.####" tabindex="1"
                            />
                          </div>
                        </div>
                        <!-- First Author -->
                        <!-- TODO: consider how to add multiples of this set of info to the form for author list -->
                        <div class="form-group">
                          <div class="col-sm-1"></div>
                          <div class="col-sm-10"><em>Author's Information</em></div>
                        </div>
                        <div class="form-group">
                          <label for="doi_first_name" class="col-sm-2 control-label" id="doi_first_name_label">Given</label>
                          <div class="col-sm-10">
                            <input type="text" class="form-control" id="doi_first_name" name="givenName" placeholder="given name" tabindex="2"
                            />
                          </div>
                        </div>
                        <div class="form-group">
                          <label for="doi_last_name" class="col-sm-2 control-label" id="doi_last_name_label">Family</label>
                          <div class="col-sm-10">
                            <input type="text" class="form-control" id="doi_last_name" name="familyName" placeholder="family name" tabindex="3"
                            />
                          </div>
                        </div>
                        <%--<div class="form-group">--%>
                          <%--<label for="doi_orcid" class="col-sm-2 control-label" id="doi_orcid_label">ORCID ID</label>--%>
                          <%--<div class="col-sm-10">--%>
                            <%--<input type="text" class="form-control" id="doi_orcid" name="orcidID" placeholder="" tabindex="4"--%>
                            <%--/>--%>
                          <%--</div>--%>
                        <%--</div>--%>
                        <%--<div class="form-group">--%>
                          <%--<label for="doi_affiliation" class="col-sm-2 control-label" id="doi_aff_label">Affiliation</label>--%>
                          <%--<div class="col-sm-10">--%>
                            <%--<input type="text" class="form-control" id="doi_affiliation" name="affiliation" placeholder="" tabindex="5"--%>
                            <%--/>--%>
                          <%--</div>--%>
                        <%--</div>--%>
                        <div class="form-group">
                          <div class="col-sm-1"></div>
                          <div class="col-sm-10"><em>Publication Information</em></div>
                        </div>
                        <!-- Publication Title -->
                        <div class="form-group">
                          <label for="doi_title" class="col-sm-2 control-label" id="doi_title_label">Title</label>
                          <div class="col-sm-10">
                            <input type="text" class="form-control" id="doi_title" name="title" placeholder="title" tabindex="6"/>
                          </div>
                        </div>
                        <!-- Publisher -->
                        <div class="form-group">
                          <label for="doi_publisher" class="col-sm-2 control-label" id="doi_publisher_label">Publisher</label>
                          <div class="col-sm-10">
                            <input type="text" class="form-control" id="doi_publisher" name="publisher" placeholder="publisher name or DOI" tabindex="7"/>
                          </div>
                        </div>
                        <!-- Publication Date -->
                        <div class="form-group">
                          <label for="doi_publish_year" class="col-sm-2 control-label" id="doi_publish_year_label">Publication Year</label>
                          <div class="col-sm-10">
                            <input type="text" class="form-control" id="doi_publish_year" name="publicationYear" placeholder="yyyy" tabindex="8"/>
                          </div>
                        </div>

                        <!-- Buttons -->
                        <%--<button type="submit" class="btn btn-primary" id="add_group_update_button">Submit</button>--%>
                        <div class="form-group">
                          <div class="col-sm-offset-2 col-sm-10">
                            <div class="btn-group" role="group">
                              <button type="submit" class="btn btn-primary" id="add_group_update_button">Submit</button>
                              <%--<input type="reset" class="btn btn-default" id="add_group_reset_button" />--%>
                            </div>
                          </div>
                        </div>
                      </form>

                  </div>

                  <!-- Content ends -->

                </section>
              </div>
            </div>
          </div>
        </div>

        <script type="application/javascript" src="<c:out value=" ${baseURL}/cadcVOTV/javascript/jquery-ui-1.11.4.min.js " />"></script>
        <script type="application/javascript" src="<c:out value=" ${baseURL}/cadcVOTV/javascript/jquery.event.drag-2.2.min.js
          " />"></script>
        <script type="application/javascript" src="<c:out value=" ${baseURL}/cadcVOTV/javascript/jquery.csv-0.71.min.js " />"></script>
        <script type="application/javascript" src="<c:out value=" ${baseURL}/citation/js/citation.js" />"></script>


        <script type="application/javascript">
          $(document).ready(function() {

            citation_js = new ca.nrc.cadc.Citation();
            $("#doi_request_form").submit(citation_js.handleDoiRequest);

          });
        </script>

      </body>

      </html>

