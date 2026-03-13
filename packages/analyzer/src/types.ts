/**
 * Represents the intermediate schema of a full NestJS application.
 * This decoupled registry is used by transport plugins to generate the final SDK.
 */
export interface IR {
  /** Array of parsed NestJS controllers and their endpoints. */
  services: ServiceDefinition[];
  /** Central registry of all parsed DTOs to avoid infinite recursion. */
  models: Record<string, ModelDefinition>;
}

/**
 * Represents a single NestJS Controller.
 */
export interface ServiceDefinition {
  /** The sanitized name of the controller (e.g., 'Users'). */
  name: string;
  /** The base route of the controller (e.g., '/users'). */
  basePath: string;
  /** All HTTP endpoints mapped inside this controller. */
  methods: MethodDefinition[];
}

/**
 * Represents a single HTTP endpoint inside a Controller.
 */
export interface MethodDefinition {
  /** The name of the class method. */
  name: string;
  /** The HTTP verb extracted from the decorator (e.g., @Get, @Post). */
  verb: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** The sub-path of the endpoint (e.g., '/:id'). */
  path: string;
  /** Parameters extracted from @Param decorators. */
  params: PropertyDefinition[];
  /** Parameters extracted from @Query decorators. */
  query: PropertyDefinition[];
  /** The type of the body payload, extracted from the @Body decorator. */
  bodyType?: string;
  /** The return type of the method (unwrapped from Promises). */
  returnType: string;
}

/**
 * Represents a parsed NestJS DTO class.
 */
export interface ModelDefinition {
  /** The exact name of the DTO class. */
  name: string;
  /** The properties belonging to this DTO. */
  properties: PropertyDefinition[];
}

/**
 * Represents a single property inside a DTO or a route parameter.
 */
export interface PropertyDefinition {
  /** The exact name of the property. */
  name: string;
  /** The primitive type or the name of a referenced DTO. */
  type: string;
  /** Whether the property has a '?' token or an @IsOptional decorator. */
  isOptional: boolean;
  /** Whether the property is an array. */
  isArray: boolean;
  /** JSDoc extracted from the backend DTO to be carried over to the SDK. */
  description?: string;
}
