import { MethodDefinition } from '../../../analyzer/src/types';
import { TransportPlugin } from '../plugin';

export const FetchPlugin: TransportPlugin = {
  name: 'fetch',

  generateImports: () => {
    return `// Usando Fetch API Nativa (Sem dependências)\n`;
  },

  generateCoreClient: () => {
    return `
export const NestSyncConfig = {
  baseUrl: '',
  defaultHeaders: {} as Record<string, string>,
  getToken: async (): Promise<string | null> => null,
};

export const setNestSyncConfig = (config: Partial<typeof NestSyncConfig>) => {
  Object.assign(NestSyncConfig, config);
};

// Internal Core Fetcher
async function coreFetch(path: string, options: RequestInit) {
  const url = \`\${NestSyncConfig.baseUrl}\${path}\`;
  
  const headers = new Headers({
    ...NestSyncConfig.defaultHeaders,
    ...(options.headers as Record<string, string>),
  });

  const token = await NestSyncConfig.getToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', \`Bearer \${token}\`);
  }

  const finalOptions = { ...options, headers };
  const res = await fetch(url, finalOptions);
  
  if (!res.ok) {
    throw new Error(\`HTTP error! status: \${res.status} - \${res.statusText}\`);
  }
  
  return res.json();
}
`;
  },

  getConfigType: () => 'RequestInit',

  generateMethodBody: (method: MethodDefinition, fullPath: string, hasQuery: boolean) => {
    let code = `      const options: RequestInit = { method: '${method.verb}', ...config };\n`;

    const hasBody = method.bodyType && method.bodyType !== 'undefined';
    if (hasBody && method.verb !== 'GET' && method.verb !== 'DELETE') {
      code += `      options.body = JSON.stringify(data);\n`;
      code += `      options.headers = { ...options.headers, 'Content-Type': 'application/json' };\n`;
    }

    if (hasQuery) {
      code += `      const queryString = new URLSearchParams(query as Record<string, string>).toString();\n`;
      code += `      const path = queryString ? \`${fullPath}?\${queryString}\` : \`${fullPath}\`;\n`;
    } else {
      code += `      const path = \`${fullPath}\`;\n`;
    }

    code += `      return coreFetch(path, options);\n`;

    return code;
  },
};
