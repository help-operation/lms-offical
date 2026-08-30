import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { NotesService } from './notes.service';

@Controller('student/lessons/:lessonId/notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT', 'GUEST')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @Message('Note created')
  create(
    @CurrentUser() user: RequestUser,
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() body: { content: string; videoTimestamp?: number },
  ) {
    return this.notesService.create(
      user.userId,
      lessonId,
      body.content,
      body.videoTimestamp ?? 0,
    );
  }

  @Get()
  @Message('Notes fetched')
  findAll(
    @CurrentUser() user: RequestUser,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    return this.notesService.findByLesson(user.userId, lessonId);
  }

  @Patch(':noteId')
  @Message('Note updated')
  update(
    @CurrentUser() user: RequestUser,
    @Param('noteId', ParseIntPipe) noteId: number,
    @Body() body: { content: string },
  ) {
    return this.notesService.update(user.userId, noteId, body.content);
  }

  @Delete(':noteId')
  @Message('Note deleted')
  remove(
    @CurrentUser() user: RequestUser,
    @Param('noteId', ParseIntPipe) noteId: number,
  ) {
    return this.notesService.remove(user.userId, noteId);
  }
}

@Controller('student/notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT', 'GUEST')
export class AllNotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @Message('Notes fetched')
  findAll(@CurrentUser() user: RequestUser) {
    return this.notesService.findAllForUser(user.userId);
  }
}
