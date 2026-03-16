import { ClassDeclaration, Node, Type } from 'ts-morph';
import { ModelDefinition, PropertyDefinition } from './types';

export class TypeResolver {
  private models: Record<string, ModelDefinition> = {};

  public getRegistry() {
    return this.models;
  }

  public resolveType(tsType: Type): string {
    // 1. Unwrap Promises
    if (tsType.getSymbol()?.getName() === 'Promise') {
      const typeArgs = tsType.getTypeArguments();
      if (typeArgs.length > 0) {
        return this.resolveType(typeArgs[0]);
      }
    }

    // 2. Handle arrays
    if (tsType.isArray()) {
      const elementType = tsType.getArrayElementTypeOrThrow();
      const resolvedName = this.resolveType(elementType);
      return `${resolvedName}[]`;
    }

    // 3. Handle Primitives and "Any/Unknown"
    if (
      tsType.isString() ||
      tsType.isNumber() ||
      tsType.isBoolean() ||
      tsType.isAny() ||
      tsType.isUnknown()
    ) {
      return tsType.getText();
    }

    // 4. Handle Date (usually converted to ISO string in JSON APIs)
    if (tsType.getSymbol()?.getName() === 'Date') {
      return 'string'; // Pode retornar 'Date' se o seu client http lidar com instâncias
    }

    // 5. Handle Utility Types like Record<string, any>
    const aliasSymbol = tsType.getAliasSymbol();
    if (aliasSymbol && aliasSymbol.getName() === 'Record') {
      return tsType.getText(); // Vai retornar literalmente "Record<string, any>"
    }

    const symbol = tsType.getSymbol() || aliasSymbol;
    if (!symbol) return 'any';

    const typeName = symbol.getName();

    // 6. Block anonymous AST types from generating empty interfaces
    if (typeName === '__type') {
      return 'any';
    }

    // 7. Handle Complex DTO classes
    if (this.models[typeName]) {
      return typeName;
    }

    this.models[typeName] = { name: typeName, properties: [] };

    const declaration = symbol.getDeclarations()?.[0];

    if (declaration && Node.isClassDeclaration(declaration)) {
      this.models[typeName].properties = this.extractClassProperties(declaration);
    }

    return typeName;
  }

  private extractClassProperties(classDecl: ClassDeclaration): PropertyDefinition[] {
    const propertiesMap = new Map<string, PropertyDefinition>();

    let currentClass: ClassDeclaration | undefined = classDecl;

    while (currentClass) {
      currentClass.getProperties().forEach(prop => {
        const propName = prop.getName();

        if (propertiesMap.has(propName)) return;

        const propType = prop.getType();
        const isOptional = prop.hasQuestionToken() || prop.getDecorator('IsOptional') !== undefined;

        const resolvedTypeName = this.resolveType(propType);

        const jsDocs = prop.getJsDocs();
        let description = undefined;

        if (jsDocs.length > 0) {
          description = jsDocs[0].getInnerText().trim();
        }

        propertiesMap.set(propName, {
          name: propName,
          type: resolvedTypeName.replace('[]', ''),
          isArray: propType.isArray(),
          isOptional,
          description,
        });
      });

      currentClass = currentClass.getBaseClass();
    }

    return Array.from(propertiesMap.values());
  }
}
