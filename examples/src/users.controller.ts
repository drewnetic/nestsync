/* eslint-disable @typescript-eslint/no-unused-vars */
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateUserDto } from './users.dto';

@Controller('users')
export class UsersController {
  @Get()
  getUsers(@Query('role') role?: string): Promise<CreateUserDto[]> {
    return [] as any;
  }

  @Post(':id')
  updateUser(@Param('id') id: string, @Body() data: CreateUserDto): Promise<CreateUserDto> {
    return null as any;
  }
}
