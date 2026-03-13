import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { TypeResolver } from './resolver';

describe('AST Analyzer & TypeResolver', () => {
  it('should correctly resolve a basic DTO', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    
    project.createSourceFile('test.ts', `
      import { IsOptional } from 'class-validator';
      
      export class UserDto {
        name!: string;
        @IsOptional()
        age?: number;
      }
    `);

    const sourceFile = project.getSourceFileOrThrow('test.ts');
    const classDecl = sourceFile.getClassOrThrow('UserDto');

    const resolver = new TypeResolver();
    resolver.resolveType(classDecl.getType());
    const registry = resolver.getRegistry();

    expect(registry['UserDto']).toBeDefined();
    expect(registry['UserDto'].properties).toEqual([
      { name: 'name', type: 'string', isOptional: false, isArray: false, description: undefined },
      { name: 'age', type: 'number', isOptional: true, isArray: false, description: undefined }
    ]);
  });
});