import { MethodDefinition } from '@nestsync/analyzer';
import { TransportPlugin } from '../plugin';

export const AxiosPlugin: TransportPlugin = {
  name: 'axios',

  generateImports: () => {
    return `import axios, { AxiosRequestConfig } from 'axios';\n`;
  },

  getConfigType: () => 'AxiosRequestConfig',

  generateMethodBody: (method: MethodDefinition, fullPath: string, hasQuery: boolean) => {
    const axiosParams: string[] = [];

    const hasBody = method.bodyType && method.bodyType !== 'undefined';
    if (hasBody && method.verb !== 'GET' && method.verb !== 'DELETE') {
      axiosParams.push(`data`);
    }

    if (hasQuery) {
      axiosParams.push(`{ ...config, params: query }`);
    } else {
      axiosParams.push(`config`);
    }

    let code = ``;
    if (method.verb === 'GET' || method.verb === 'DELETE') {
      const getArgs = hasQuery ? `{ ...config, params: query }` : `config`;
      code += `      const res = await axios.${method.verb.toLowerCase()}(\`${fullPath}\`, ${getArgs});\n`;
    } else {
      code += `      const res = await axios.${method.verb.toLowerCase()}(\`${fullPath}\`, ${axiosParams.join(', ')});\n`;
    }

    code += `      return res.data;\n`;
    return code;
  },
};
