import { defineConfig } from 'orval'

export default defineConfig({
  softtrack: {
    input: {
      target: '../backend/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/generated/endpoints',
      schemas: 'src/api/generated/models',
      client: 'react-query',
      httpClient: 'axios',
      baseUrl: false,
      override: {
        mutator: {
          path: 'src/api/client.ts',
          name: 'apiClient',
        },
      },
    },
  },
})
