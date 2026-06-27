import { Module } from '@nestjs/common';
import { CursorService } from './cursor.service';
import { ProfilesController } from './profiles.controller';

@Module({
  controllers: [ProfilesController],
  providers: [CursorService],
})
export class AppModule {}
