export class CreateUserDto {
  /** The user's full legal name */
  nome!: string;
  email!: string;
  age?: number;
  phone!: string;
}
