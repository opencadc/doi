/*
 ************************************************************************
 *******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
 **************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
 *
 *  (c) 2026.                            (c) 2026.
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
 *  the GNU Affero General Public        la "GNU Affero General Public
 *  License as published by the          License" telle que publiée
 *  Free Software Foundation,            par la Free Software Foundation
 *  either version 3 of the              : soit la version 3 de cette
 *  License, or (at your option)         licence, soit (à votre gré)
 *  any later version.                   toute version ultérieure.
 *
 *  OpenCADC is distributed in the       OpenCADC est distribué
 *  hope that it will be useful,         dans l'espoir qu'il vous
 *  but WITHOUT ANY WARRANTY;            sera utile, mais SANS AUCUNE
 *  without even the implied             GARANTIE : sans même la garantie
 *  warranty of MERCHANTABILITY          implicite de COMMERCIALISABILITÉ
 *  or FITNESS FOR A PARTICULAR          ni d'ADÉQUATION À UN OBJECTIF
 *  PURPOSE.  See the GNU Affero         PARTICULIER. Consultez la Licence
 *  General Public License for           Générale Publique GNU Affero
 *  more details.                        pour plus de détails.
 *
 *  You should have received             Vous devriez avoir reçu une
 *  a copy of the GNU Affero             copie de la Licence Générale
 *  General Public License along         Publique GNU Affero avec
 *  with OpenCADC.  If not, see          OpenCADC ; si ce n'est
 *  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
 *                                       <http://www.gnu.org/licenses/>.
 *
 ************************************************************************
 */

// Properties
export const PROP_TITLE = 'title'
export const PROP_CORRESPONDING_AUTHOR = 'correspondingAuthor'
export const PROP_CONTRIBUTING_AUTHORS = 'contributingAuthors'
export const PROP_COLLABORATIONS = 'collaborations'
export const PROP_GENERAL_INFO = 'generalInfo'
export const PROP_AUTHOR_INFO = 'authorInfo'
export const PROP_OBSERVATION_INFO = 'observationInfo'
export const PROP_TOPIC = 'topic'
export const PROP_OBJECT_NAME = 'objectName'
export const PROP_ABSTRACT = 'abstract'
export const PROP_ACKNOWLEDGEMENTS = 'acknowledgements'
export const PROP_PREVIOUS_RAFTS = 'relatedPublishedRafts'
export const PROP_FIGURE = 'figure'

// Author Properties
export const PROP_AUTHOR_FIRST_NAME = 'firstName'
export const PROP_AUTHOR_LAST_NAME = 'lastName'
export const PROP_AUTHOR_ORCID = 'authorORCID'
export const PROP_AUTHOR_AFFILIATION = 'affiliation'
export const PROP_AUTHOR_EMAIL = 'email'

// Machine Readable Table Properties
export const PROP_TECHNICAL_INFO = 'technical'
export const PROP_MPC_ID = 'mpcId'
export const PROP_ALERT_ID = 'alertId'
export const PROP_INSTRUMENT = 'instrument'
export const PROP_MJD = 'mjd'
export const PROP_TIME_OBSERVED = 'timeObserved'
export const PROP_TELESCOPE = 'telescope'

// Measurement Properties
export const PROP_MEASUREMENT_INFO = 'measurementInfo'
export const PROP_POSITION = 'position'
export const PROP_FLUX = 'flux'
export const PROP_PHOTOMETRY = 'photometry'
export const PROP_WAVELENGTH = 'wavelength'
export const PROP_BRIGHTNESS = 'brightness'
export const PROP_ERRORS = 'errors'

// Optional Properties
export const PROP_EPHEMERIS = 'ephemeris'
export const PROP_ORBITAL_ELEMENTS = 'orbitalElements'
export const PROP_SPECTROSCOPY = 'spectroscopy'
export const PROP_ASTROMETRY = 'astrometry'
export const PROP_MISC_INFO = 'miscInfo'
export const PROP_MISC = 'misc'
export const PROP_MISC_KEY = 'miscKey'
export const PROP_MISC_VALUE = 'miscValue'
export const PROP_MISC_TYPE = 'miscType'

// Review
export const PROP_STATUS = 'status'
export const PROP_POST_OPT_OUT = 'postOptOut'
export const OPTION_DRAFT = 'draft'
export const OPTION_REVIEW = 'review_ready'
export const OPTION_UNDER_REVIEW = 'under_review'
export const OPTION_APPROVED = 'approved'
export const OPTION_REJECTED = 'rejected'
export const OPTION_PUBLISHED = 'published'
// Backend status values — re-exported from single source of truth
// Use BACKEND_STATUS from '@/shared/backendStatus' for new code
export { BACKEND_STATUS } from './backendStatus'
export const OPTION_IN_PROGRESS = 'in progress' as const
export const OPTION_IN_REVIEW = 'in review' as const
export const OPTION_MINTED = 'minted' as const
export const STATUS_OPTIONS = [
  OPTION_DRAFT,
  OPTION_REVIEW,
  OPTION_UNDER_REVIEW,
  OPTION_APPROVED,
  OPTION_REJECTED,
  OPTION_PUBLISHED,
  OPTION_IN_PROGRESS,
  OPTION_IN_REVIEW,
  OPTION_MINTED,
] as const
// Topic Options
export const OPTION_COMET = 'comet'
export const OPTION_NEA = 'near_earth_object'
export const OPTION_TNO = 'trans_neptunian_object'
export const OPTION_ASTEROID = 'asteroid'
export const OPTION_PHA = 'potentially_hazardous_asteroid'
export const OPTION_ISO = 'interstellar_object'
export const OPTION_TCEO = 'temporarily_captured_earth_orbiter'
export const OPTION_ACTIVE = 'active_object'
export const OPTION_OUTBURST = 'outburst'
export const OPTION_MULTI_COMPONENT = 'multi_component_system'
export const OPTION_UNUSUAL_ROTATION = 'unusual_rotation_properties'
export const OPTION_UNUSUAL_SPECTRA = 'unusual_colour_spectra'
export const OPTION_NON_DETECTION = 'non_detection'
export const OPTION_NON_GRAVITATIONAL = 'non_gravitational_perturbations'
export const OPTION_ERRATA = 'errata'
export const OPTION_RETRACTION = 'retraction'
export const OPTION_OTHER = 'other'
export const OPTION_TROJANS = 'trojans'
export const OPTION_CENTAURS = 'centaurs'
export const OPTION_SATELLITES = 'satellites'

export const TOPIC_OPTIONS = [
  OPTION_COMET,
  OPTION_NEA,
  OPTION_TNO,
  OPTION_ASTEROID,
  OPTION_PHA,
  OPTION_ISO,
  OPTION_TCEO,
  OPTION_ACTIVE,
  OPTION_OUTBURST,
  OPTION_MULTI_COMPONENT,
  OPTION_UNUSUAL_ROTATION,
  OPTION_UNUSUAL_SPECTRA,
  OPTION_NON_DETECTION,
  OPTION_NON_GRAVITATIONAL,
  OPTION_TROJANS,
  OPTION_CENTAURS,
  OPTION_SATELLITES,
  OPTION_ERRATA,
  OPTION_RETRACTION,
  OPTION_OTHER,
] as const

export const FORM_SECTIONS = [
  PROP_AUTHOR_INFO,
  PROP_OBSERVATION_INFO,
  PROP_TECHNICAL_INFO,
  PROP_MISC_INFO,
] as const
// Brightness Unit Options
export const OPTION_BRIGHTNESS_AB_MAG = 'AB mag'
export const OPTION_BRIGHTNESS_VEGA_MAG = 'Vega mag'
export const OPTION_BRIGHTNESS_MJY = 'mJy'
export const OPTION_BRIGHTNESS_ERGS = 'ergs/s/cm^2/Å'

export const ORCID_REGEX = /^(\d{4}-){3}\d{3}[\dX]$/

// User
export const ROLE_REVIEWER = 'reviewer'
export const ROLE_CONTRIBUTOR = 'contributor'
export const USER_ROLES = [ROLE_REVIEWER, ROLE_CONTRIBUTOR] as const
