import { Project } from 'ts-morph';
import { TypeResolver } from './resolver';
import { IR, MethodDefinition, PropertyDefinition, ServiceDefinition } from './types';

export function analyzeProject(globPath: string): IR {
  // Enforce return type here!
  const project = new Project();
  project.addSourceFilesAtPaths(globPath);

  const resolver = new TypeResolver();
  const services: ServiceDefinition[] = [];

  const controllers = project
    .getSourceFiles()
    .flatMap(s => s.getClasses())
    .filter(c => c.getDecorator('Controller'));

  for (const ctrl of controllers) {
    // Fix 1: Fallback if class name is undefined
    const ctrlName = ctrl.getName() || 'UnnamedController';

    const basePathArg = ctrl.getDecorator('Controller')?.getArguments()[0];
    const basePath = basePathArg ? basePathArg.getText().replace(/['"]/g, '') : '';

    const methods: MethodDefinition[] = ctrl.getMethods().map(method => {
      // 1. Extract the HTTP Verb and Sub-path (e.g., @Post(':id'))
      let verb: MethodDefinition['verb'] = 'GET';
      let subPath = '';

      const httpDecorator = method
        .getDecorators()
        .find(d => ['Get', 'Post', 'Put', 'Delete', 'Patch'].includes(d.getName()));

      if (httpDecorator) {
        verb = httpDecorator.getName().toUpperCase() as MethodDefinition['verb'];
        const pathArg = httpDecorator.getArguments()[0];
        subPath = pathArg ? pathArg.getText().replace(/['"]/g, '') : '';
      }

      // 2. Extract Parameters (@Param, @Query, @Body)
      const params: PropertyDefinition[] = [];
      const query: PropertyDefinition[] = [];
      let bodyType: string | undefined = undefined;

      for (const param of method.getParameters()) {
        const paramName = param.getName();
        const resolvedType = resolver.resolveType(param.getType());

        if (param.getDecorator('Param')) {
          // Handle @Param('id') vs @Param()
          const decArg = param.getDecorator('Param')?.getArguments()[0];
          const routeParamName = decArg ? decArg.getText().replace(/['"]/g, '') : paramName;

          params.push({
            name: routeParamName,
            type: resolvedType,
            isArray: param.getType().isArray(),
            isOptional: param.isOptional(),
          });
        } else if (param.getDecorator('Query')) {
          const decArg = param.getDecorator('Query')?.getArguments()[0];
          const queryName = decArg ? decArg.getText().replace(/['"]/g, '') : paramName;

          query.push({
            name: queryName,
            type: resolvedType,
            isArray: param.getType().isArray(),
            isOptional: param.isOptional(),
          });
        } else if (param.getDecorator('Body')) {
          bodyType = resolvedType;
        }
      }

      // 3. Extract Return Type (e.g., Promise<UserDto> -> UserDto)
      const returnTsType = method.getReturnType();
      const returnType = resolver.resolveType(returnTsType);

      // Return a strictly typed MethodDefinition object
      return {
        name: method.getName(),
        verb,
        path: subPath ? `/${subPath}` : '', // Ensure leading slash
        params,
        query,
        bodyType,
        returnType,
      };
    });

    // Ensure leading slash for base path
    services.push({ name: ctrlName, basePath: `/${basePath}`, methods });
  }

  return {
    services,
    models: resolver.getRegistry(),
  };
}

export * from './types';
