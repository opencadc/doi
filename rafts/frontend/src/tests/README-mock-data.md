# Mock Review Data for RAFTS

This directory contains mock data for testing the RAFTS review functionality.

## Files

- `raft-2025-07-23.json` - Sample RAFT submission structure
- `mock-review-data.json` - Multiple RAFT submissions in different review states

## Review States

The mock data includes RAFT submissions in the following states:

1. **review_ready** - Ready for Review (2 submissions)
   - Discovery of Asteroid 2025 XY1
   - Discovery of a Potential Supernova in M81

2. **under_review** - Under Review (1 submission)
   - Spectroscopic Analysis of Comet C/2025 Q2

3. **approved** - Approved (1 submission)
   - Optical Variability in the Active Galaxy NGC 4151 (includes DOI)

4. **rejected** - Rejected (1 submission)
   - Possible Detection of Exoplanet Transit (rejected due to insufficient data)

## Usage

To use this mock data:

1. Enable the review feature by setting `UI_REVIEW_ENABLED=true` in your `.env.local` file
2. Modify the `getReviewReadyRafts()` action to return this mock data during development
3. The review page will display these submissions filtered by status

## Data Structure

Each RAFT submission includes:

- Basic metadata (\_id, createdBy, timestamps)
- General information (title, status)
- Author information (corresponding author, contributing authors, collaborations)
- Observation details (topic, object name, abstract)
- Technical information (telescope, timing, identifiers)
- Measurement data (photometry, spectroscopy, astrometry)
- Miscellaneous information

## Testing Scenarios

This mock data allows testing of:

- Status filtering functionality
- Review workflow transitions
- Display of different observation types (asteroid, comet, AGN, supernova, exoplanet)
- Handling of approved submissions with DOIs
- Display of rejected submissions with reasons
