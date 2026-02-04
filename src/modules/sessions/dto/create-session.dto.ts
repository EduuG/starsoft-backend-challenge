import { IsInt, IsNotEmpty, IsString, IsDateString, Min } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  movieTitle: string;

  @IsDateString()
  startsAt: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsInt()
  @Min(16) // sets a minimum value of 16 seats
  seatCount: number;

  @IsInt()
  @Min(1) // ensures price is always positive
  price: number;
}