import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getDuration = new Trend('get_duration', true);
export const RateContentOK = new Rate('content_OK');

// CONFIGURAÇÕES DO TESTE
export const options = {
  thresholds: {
    http_req_failed: ['rate<0.25'],
    get_duration: ['p(90)<6800'],
    content_OK: ['rate>0.95']
  },

  stages: [
    { duration: '30s', target: 7 },
    { duration: '2m', target: 92 },
    { duration: '1m', target: 92 },
    { duration: '30s', target: 0 }
  ]
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const OK = 200;
  const baseUrl = 'https://jsonplaceholder.typicode.com/users';

  const response = http.get(baseUrl);

  getDuration.add(response.timings.duration);
  RateContentOK.add(response.status === OK);

  check(response, {
    'Status 200': () => response.status === OK,
    'Resposta é array': () =>
      response.status === OK &&
      response.headers['Content-Type']?.includes('application/json') &&
      Array.isArray(response.json())
  });
}
