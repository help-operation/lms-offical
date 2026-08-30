import { Module } from '@nestjs/common';
import { CodeSnippetsController } from './code-snippets.controller';
import { CodeSnippetsService } from './code-snippets.service';

@Module({
  controllers: [CodeSnippetsController],
  providers:   [CodeSnippetsService],
})
export class CodeSnippetsModule {}
