import { ArrayMinSize, IsArray, IsInt, IsString, IsUUID, Min } from "class-validator";

export class CreateReservationDto {
  @IsUUID()
  sessionId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  seatNumbers: number[];

  // Currently identified by a unique username string (not ideal)
  @IsString()
  userId: string;
}