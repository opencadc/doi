import { http, HttpResponse } from 'msw'

export const handlers = [
  // Health check endpoint
  http.get('*/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),

  // DOI status mock
  http.get('*/doi/instances', () => {
    return HttpResponse.xml(`
      <?xml version="1.0" encoding="UTF-8"?>
      <doiStatuses>
        <doistatus>
          <identifier identifierType="DOI">25.0047</identifier>
          <title xml:lang="en">Test RAFT</title>
          <status>draft</status>
        </doistatus>
      </doiStatuses>
    `)
  }),

  // CANFAR auth mock
  http.post('*/ac/login', () => {
    return new HttpResponse('mock-token', {
      headers: { 'Content-Type': 'text/plain' },
    })
  }),

  // CANFAR whoami mock
  http.get('*/ac/whoami', () => {
    return HttpResponse.json({
      userid: 'testuser',
      groups: ['platform-users'],
    })
  }),

  // VOSpace file upload mock
  http.post('*/vault/synctrans', () => {
    return new HttpResponse(null, {
      status: 303,
      headers: {
        Location: 'https://mock-vault/jobs/123/results/transferDetails',
      },
    })
  }),

  // VOSpace file list mock
  http.get('*/vault/files/*', () => {
    return HttpResponse.xml(`
      <?xml version="1.0" encoding="UTF-8"?>
      <vos:node xmlns:vos="http://www.ivoa.net/xml/VOSpace/v2.0">
        <vos:properties />
        <vos:nodes />
      </vos:node>
    `)
  }),
]
