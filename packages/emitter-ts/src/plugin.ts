import { MethodDefinition, ServiceDefinition } from '@nestsync/analyzer';

export interface TransportPlugin {
  name: string;

  generateImports(): string;

  generateCoreClient?(): string;

  getConfigType(): string;

  generateMethodBody(method: MethodDefinition, fullPath: string, hasQuery: boolean): string;

  generateExtra?(services: ServiceDefinition[]): string;
}
