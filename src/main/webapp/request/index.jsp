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

<c:set var="resourceCapabilitiesEndPoint" value="${baseURL}/reg/resource-caps" />
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
    <title>Data Publication</title>
  </head>

  <body>
    <c:import url="${baseURL}/canfar/includes/_application_header.shtml" />
    <div class="container-fluid fill">
      <div class="row fill">
        <div role="main" class="col-sm-12 col-md-12 main fill">
          <div class="inner fill">
            <section id="main_content" class="fill">

              <h3 class="doi-page-header">
                <a id="canfar-doi" class="anchor" href="#canfar-doi" aria-hidden="true">
                  <span aria-hidden="true" class="octicon octicon-link"></span>
                </a>Data Publication
              </h3>

              <div class="doi-authenticated">
                <div id="doi_metadata" class="panel panel-default doi-panel">
                  <div class="panel-heading doi-panel-heading">
                    <nav class="navbar navbar-expand-sm doi-header-navbar" id="navbar-functions">
                      <ul class="nav navbar-nav doi-header-navbar">
                        <li class="nav-item"><h4>DOI Information</h4></li>
                        <li class="nav-item pull-right doi-authenticated">
                          <button id="doi_request"
                                  class="btn btn-primary doi-listpage-header btn-sm hidden" >New</button>
                          <button type="delete"
                                  class="btn btn-danger doi-button doi-listpage-header btn-sm hidden"
                                  id="doi_delete_button">Delete</button>
                          <%--<!-- Javascript changes text here to be 'Mint Retry' where appropriate -->--%>
                          <button type="mint"
                                  class="btn btn-success doi-button doi-listpage-header btn-sm hidden"
                                  id="doi_mint_button">Mint</button>
                          <%--<!-- Context Help hooks -->--%>
                          <div id="doi_help_new"
                               class="citation-tooltip citation-btn-bar hidden"
                               data-contentkey="new_only_buttonbar"></div>
                          <div id="doi_help_update"
                               class="citation-tooltip citation-btn-bar hidden"
                               data-contentkey="update_buttonbar"></div>
                          <div id="doi_help_minted"
                               class="citation-tooltip citation-btn-bar hidden"
                               data-contentkey="locked_data_buttonbar"></div>
                          <div id="doi_help_minted"
                               class="citation-tooltip citation-btn-bar hidden"
                               data-contentkey="minted_buttonbar"></div>
                          <div id="doi_help_completed"
                               class="citation-tooltip citation-btn-bar hidden"
                               data-contentkey="completed_buttonbar"></div>
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

                    <div class="doi_not_authenticated hidden"><button type="submit" class="btn btn-primary" id="doi_login_button">
                      <i>Login Required...</i></button>
                    </div>
                    <!-- Form starts -->
                    <div class="doi-form-body hidden">
                      <form id="doi_request_form" class="form-horizontal">
                        <!-- Data DOI Number -->
                        <div class="form-group doi-form-group">
                          <label for="doi_number"
                                 class="col-sm-3 control-label"
                                 id="doi_number_label">Data DOI Reference<div id="data_doi_number"
                                                                              class="citation-tooltip"
                                                                              data-contentkey="data_doi_number"
                                                                              data-title="Data DOI Number"></div></label>
                          <div class="col-sm-3 doi-form">
                            <input type="text"
                                   class="form-control doi-form doi-form-input"
                                   id="doi_number"
                                   name="doiNumber"
                                   placeholder="Assigned when DOI requested"
                                   disabled="disabled" readonly />
                          </div>
                          <div class="col-sm-2 doi-display doi-number hidden">
                          </div>
                          <div class="col-sm-4  doi-status-badge pull-right hidden">

                            <div class="panel panel-success doi-minted hidden">
                              <div class="panel-body doi-panel-body ">
                                <div id="green_badge" class="doi-minted doi-msg-text">
                                  MINTED
                                </div>
                              </div>
                            </div>

                            <div class="panel panel-danger doi-warning hidden">
                              <div class="panel-body doi-panel-body ">
                                <div class="doi-warning doi-msg-text">
                                  Minting Error - Retry or contact a CADC administrator
                                </div>
                              </div>
                            </div>

                            <div class="panel panel-warning doi-working hidden">
                              <div class="panel-body doi-panel-body ">
                                <div class="doi-working doi-msg-text ">
                                  Minting in progress - Refresh page for new status
                                </div>
                              </div>
                            </div>

                            <div class="panel panel-primary doi-retry hidden">
                              <div class="panel-body doi-panel-body ">
                                <div class="doi-retry doi-msg-text">
                                  Click Retry to continue minting process
                                </div>
                              </div>
                            </div>

                          </div>  <!-- end doi-status-badge div -->
                        </div>  <!-- end form group -->

                        <!-- Publication Title -->
                        <div class="form-group">
                          <label for="doi_title"
                                 class="col-sm-3 control-label"
                                 id="doi_title_label">Publication Title <div id="publication_title"
                                                                            class="citation-tooltip"
                                                                            data-contentkey="publication_title"
                                                                            data-title="Publication Title"></div>
                          </label>
                          <div class="col-sm-6">
                            <input type="text" class="form-control doi-form doi-form-input" id="doi_title" name="title"
                                   placeholder="Title" tabindex="1" required/>
                            <div class="doi-display doi-title hidden">
                            </div>
                          </div>
                        </div>

                        <!-- Publication Language -->
                        <div class="form-group hidden">
                          <label for="doi_language" class="col-sm-3 control-label" id="doi_language_label">Language</label>
                          <div id="doi_language" class="col-sm-3">
                            <label class="radio-inline"><input type="radio" name="doiLanguage" value="en" checked>en</label>
                            <label class="radio-inline"><input type="radio" name="doiLanguage" value="fr">fr</label>
                          </div>
                        </div>

                        <div class="form-group">
                          <label for="doi_author"
                                 class="col-sm-3 control-label"
                                 id="doi_first_name_label">First Author <div id="first_author"
                                                                             class="citation-tooltip"
                                                                             data-contentkey="first_author"
                                                                             data-title="First Author"></div>
                          </label>
                            <div class="col-sm-6">
                              <input type="text" class="form-control doi-form doi-form-input" id="doi_author" name="firstAuthor"
                                     placeholder="Author or Group Name" tabindex="2" required/>
                              <div class="doi-display doi-author hidden">
                              </div>
                            </div>
                        </div>

                        <div class="form-group">
                          <label for="doi_additional_authors"
                                 class="col-sm-3 control-label"
                                 id="doi_addtl_authors_label">Additional Authors (<i>optional</i>)<div id="additional_authors"
                                                                                                       class="citation-tooltip"
                                                                                                       data-contentkey="additional_authors"></div></label>
                            <div class="col-sm-6">
                                <div id="doi_additional_authors" class="doi-form"></div>
                                <div id="doi_additional_authors_display" class="hidden"></div>
                                <div class="doi-form">
                                  <label for="doi_add_author" class="col-sm-2 control-label doi-vertical-align"><i>add author</i></label>
                                  <button type="button" class="btn btn-default doi-small-button glyphicon glyphicon-plus" id="doi_add_author" tabindex="5"></button>
                                </div>
                            </div>
                        </div>

                        <!-- Journal Reference - will appear on landing page -->
                        <div class="form-group">
                          <label for="doi_journal_ref"
                                 class="col-sm-3 control-label"
                                 id="doi_journal_ref_label">Journal Reference (<i>optional</i>) <div id="journal_reference"
                                                                                                     class="citation-tooltip"
                                                                                                     data-contentkey="journal_reference"></div></label>
                          <div class="col-sm-6">
                            <input type="text" class="form-control doi-form doi-form-input" id="doi_journal_ref" name="journalRef"
                                   placeholder="Journal  Reference" tabindex="3"/>
                            <div class="doi-display doi-journal-ref hidden">
                            </div>
                          </div>
                        </div>

                        <!-- Buttons -->
                        <div class="form-group">
                          <label for="doi_journal_ref" class="col-sm-3 control-label">
                            <div id="doi_request_help" class="citation-tooltip citation-btn-bar" data-contentkey="request_doi"></div>
                            <div id="doi_update_help" class="citation-tooltip citation-btn-bar hidden" data-contentkey="update_doi"></div>
                          </label>
                          <div class="col-sm-9">
                            <div class="button-group doi-button-group col-sm-4" role="group">
                              <!-- Javascript changes text here to be 'Update' button where appropriate -->
                              <button type="submit" class="doi_action_button btn btn-primary" id="doi_request_button" tabindex="5">Request</button>
                              <button type="submit" class="doi_action_button btn btn-primary hidden" id="doi_update_button" tabindex="5">Update</button>
                              <button class="btn btn-default doi-button" id="doi_form_reset_button" tabindex="6">Reset</button>
                             </div>
                            <div class="col-sm-4 doi-mint-info hidden"><i>Form information changed: Mint function will be available when Update is complete</i></div>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>

                <!-- DOI Metadata panel -->
                <div id="doi_related" class="panel panel-default doi-panel hidden">
                  <div class="panel-heading doi-panel-heading">
                    <h4>Related Information</h4>
                  </div>
                  <div id="related_panel" class="panel-body doi-panel-body">
                    <div class="row">
                      <label for="doi_status" class="col-sm-3 control-label text-right " id="doi_status_label">Status</label>
                      <div class="col-sm-5 doi-status">
                        <span id="doi_status"></span>
                      </div>
                    </div>

                    <div class="row">
                      <label for="doi_data_dir"
                             class="col-sm-3 control-label text-right"
                             id="doi_data_dir_label">Data Directory<div id="data_directory"
                                                                        class="citation-tooltip"
                                                                        data-contentkey="data_directory"></div></label>
                      <div class="col-sm-9">
                        <span id="doi_data_dir">data dir</span>
                        <div class="doi-data-locked glyphicon glyphicon-lock hidden">
                        </div>
                      </div>
                    </div>

                    <div class="row">
                      <label for="doi_landing_page" class="col-sm-3 control-label text-right" id="doi_landing_page_label">Landing Page URL</label>
                      <div class="col-sm-9">
                        <span id="doi_landing_page"><i>not available yet</i></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Info/Error Modal -->
              <div class="modal fade" id="info_modal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLongTitle" aria-hidden="true">
                <div class="modal-dialog" role="document">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title" id="infoModalLongTitle"></h5>
                    </div>
                    <div class="modal-body">
                      <span class="info-span"></span>
                      <span class="spinner-span glyphicon glyphicon-refresh fast-right-spinner"></span>
                    </div>
                    <div id="infoThanks" class="modal-footer">
                      <button type="button" class="hidden btn btn-default" data-dismiss="modal">Thanks</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Content ends -->
            </section>
          </div>
        </div>
      </div>
    </div>


    <script type="application/javascript" src="<c:out value=" ${baseURL}/canfar/javascript/cadc.contexthelp.js" />"></script>
    <script type="application/javascript" src="<c:out value=" ${baseURL}/citation/js/citation_page.js" />"></script>
    <script type="application/javascript" src="<c:out value=" ${baseURL}/citation/js/citation_request.js" />"></script>

    <script type="application/javascript">
      $(document).ready(function() {
        // Set up controller for Data Citation Request page
        request_js = new cadc.web.citation.CitationRequest({resourceCapabilitiesEndPoint: '${resourceCapabilitiesEndPoint}'})
        request_js.init()
      });

    </script>

  </body>

</html>

