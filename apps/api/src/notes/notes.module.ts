import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController, AllNotesController } from './notes.controller';

@Module({
  controllers: [NotesController, AllNotesController],
  providers: [NotesService],
})
export class NotesModule {}
