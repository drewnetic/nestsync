import { ServiceDefinition } from '@nestsync/analyzer';
import { TransportPlugin } from '../plugin';
import { FetchPlugin } from './fetch';

export const ReactQueryPlugin: TransportPlugin = {
  name: 'react-query',

  generateImports: () => {
    let imports = FetchPlugin.generateImports();
    imports += `import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';\n`;
    return imports;
  },

  generateCoreClient: FetchPlugin.generateCoreClient,

  getConfigType: () => FetchPlugin.getConfigType(),
  generateMethodBody: FetchPlugin.generateMethodBody,

  generateExtra: (services: ServiceDefinition[]) => {
    let hooksCode = ``;

    for (const svc of services) {
      const svcName = svc.name.replace('Controller', '').toLowerCase();

      for (const method of svc.methods) {
        const isGet = method.verb === 'GET';

        // Capitalize first letter for the hook name (e.g., getUsers -> useGetUsersQuery)
        const capitalizedMethodName = method.name.charAt(0).toUpperCase() + method.name.slice(1);

        if (isGet) {
          // --- Generate useQuery Hook ---
          const hookName = `use${capitalizedMethodName}Query`;
          const queryArgType =
            method.query.length > 0
              ? `{ ${method.query.map(q => `${q.name}${q.isOptional ? '?' : ''}: ${q.type}`).join(', ')} }`
              : `void`;

          // If there are path params, they become part of the query key and function args
          const pathArgs = method.params.map(p => `${p.name}: ${p.type}`).join(', ');
          const pathArgsCall = method.params.map(p => p.name).join(', ');

          // Build function signature
          const args = [];
          if (pathArgs) args.push(pathArgs);
          if (method.query.length > 0) args.push(`query: ${queryArgType}`);
          args.push(
            `options?: Omit<UseQueryOptions<${method.returnType}, Error, ${method.returnType}, any>, 'queryKey' | 'queryFn'>`,
          );

          const callArgs = [];
          if (pathArgsCall) callArgs.push(pathArgsCall);
          if (method.query.length > 0) callArgs.push(`query`);

          // The unique query key for caching
          const queryKey = `['${svcName}', '${method.name}'${pathArgsCall ? `, ${pathArgsCall}` : ''}${method.query.length > 0 ? `, query` : ''}]`;

          hooksCode += `export const ${hookName} = (${args.join(', ')}) => {\n`;
          hooksCode += `  return useQuery({\n`;
          hooksCode += `    queryKey: ${queryKey},\n`;
          hooksCode += `    queryFn: () => sdk.${svcName}.${method.name}(${callArgs.join(', ')}),\n`;
          hooksCode += `    ...options,\n`;
          hooksCode += `  });\n`;
          hooksCode += `};\n\n`;
        } else {
          // --- Generate useMutation Hook ---
          const hookName = `use${capitalizedMethodName}Mutation`;

          const variableProps: string[] = [];
          const callArgs: string[] = [];

          // 1. Map Path Params (e.g., id: string)
          if (method.params.length > 0) {
            method.params.forEach(p => {
              variableProps.push(`${p.name}: ${p.type}`);
              callArgs.push(`variables.${p.name}`); // Maps to sdk.users.updateUser(variables.id, ...)
            });
          }

          // 2. Map Query Params
          if (method.query.length > 0) {
            const queryInterface = method.query
              .map(q => `${q.name}${q.isOptional ? '?' : ''}: ${q.type}`)
              .join(', ');
            variableProps.push(`query: { ${queryInterface} }`);
            callArgs.push(`variables.query`);
          }

          // 3. Map Body Data
          const hasBody = method.bodyType && method.bodyType !== 'undefined';
          if (hasBody) {
            variableProps.push(`data: ${method.bodyType}`);
            callArgs.push(`variables.data`);
          }

          // Determine the final payload type for the mutation
          let mutationPayloadType = 'void';
          let mutationFnBody = `sdk.${svcName}.${method.name}()`;

          if (
            variableProps.length === 1 &&
            hasBody &&
            method.params.length === 0 &&
            method.query.length === 0
          ) {
            // Fast-path: If the endpoint ONLY needs a body (e.g., standard POST /users), keep it simple
            mutationPayloadType = method.bodyType as string;
            mutationFnBody = `sdk.${svcName}.${method.name}(variables)`;
          } else if (variableProps.length > 0) {
            // Complex-path: Multiple arguments require a composite variables object
            mutationPayloadType = `{ ${variableProps.join(', ')} }`;
            mutationFnBody = `sdk.${svcName}.${method.name}(${callArgs.join(', ')})`;
          }

          // Write the hook
          hooksCode += `export const ${hookName} = (options?: UseMutationOptions<${method.returnType}, Error, ${mutationPayloadType}>) => {\n`;
          hooksCode += `  return useMutation({\n`;
          hooksCode += `    mutationFn: (variables: ${mutationPayloadType}) => ${mutationFnBody},\n`;
          hooksCode += `    ...options,\n`;
          hooksCode += `  });\n`;
          hooksCode += `};\n\n`;
        }
      }
    }

    return hooksCode;
  },
};
