import { MethodDefinition, ServiceDefinition } from '../../analyzer/src/types';

export interface TransportPlugin {
  name: string;

  generateImports(): string;

  generateCoreClient?(): string;

  getConfigType(): string;

  generateMethodBody(method: MethodDefinition, fullPath: string, hasQuery: boolean): string;

  generateExtra?(services: ServiceDefinition[]): string;
}
