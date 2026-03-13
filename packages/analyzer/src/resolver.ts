import { ClassDeclaration, Node, Type } from 'ts-morph';
import { ModelDefinition, PropertyDefinition } from './types';

export class TypeResolver {
  // Our central registry
  private models: Record<string, ModelDefinition> = {};

  // Get the complete registry when we are done analyzing
  public getRegistry() {
    return this.models;
  }

  public resolveType(tsType: Type): string {
    // Unwrap Promises (e.g., Promise<UserDto> -> UserDto)
    if (tsType.getSymbol()?.getName() === 'Promise') {
      const typeArgs = tsType.getTypeArguments();
      if (typeArgs.length > 0) {
        return this.resolveType(typeArgs[0]); // Recursively resolve the inner type
      }
    }

    // 1. Handle arrays (e.g., CreateUserDto[])
    if (tsType.isArray()) {
      const elementType = tsType.getArrayElementTypeOrThrow();
      const resolvedName = this.resolveType(elementType);
      return `${resolvedName}[]`;
    }

    if (tsType.isString() || tsType.isNumber() || tsType.isBoolean()) {
      return tsType.getText();
    }

    // 3. Handle complex DTO classes
    const symbol = tsType.getSymbol() || tsType.getAliasSymbol();
    if (!symbol) return 'unknown';

    const typeName = symbol.getName();

    // Prevent infinite loops in self-referencing DTOs (e.g., a User containing a generic Node)
    if (this.models[typeName]) {
      return typeName;
    }

    // Mark as "currently parsing" to handle self-referencing trees
    this.models[typeName] = { name: typeName, properties: [] };

    // Find the actual class declaration in the AST
    const declaration = symbol.getDeclarations()[0];

    if (Node.isClassDeclaration(declaration)) {
      this.models[typeName].properties = this.extractClassProperties(declaration);
    }

    return typeName;
  }

  private extractClassProperties(classDecl: ClassDeclaration): PropertyDefinition[] {
    return classDecl.getProperties().map(prop => {
      const propType = prop.getType();

      const isOptional = prop.hasQuestionToken() || prop.getDecorator('IsOptional') !== undefined;

      const resolvedTypeName = this.resolveType(propType);

      const jsDocs = prop.getJsDocs();
      let description = undefined;

      if (jsDocs.length > 0) {
        // Get the inner text of the first JSDoc block
        description = jsDocs[0].getInnerText().trim();
      }

      return {
        name: prop.getName(),
        type: resolvedTypeName.replace('[]', ''),
        isArray: propType.isArray(),
        isOptional,
        description, // <-- Pass it to the IR
      };
    });
  }
}
