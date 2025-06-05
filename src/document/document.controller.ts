import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  NotFoundException,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Request as ExpressRequest } from 'express';
import { User } from '../user/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return this.documentService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    const doc = await this.documentService.findById(id);
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() body: CreateDocumentDto, @Request() req: ExpressRequest) {
    if (!req.user) throw new UnauthorizedException();
    return this.documentService.create(body, req.user as User);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateDocumentDto,
    @Request() req: ExpressRequest,
  ) {
    if (!req.user) throw new UnauthorizedException();
    return this.documentService.update(id, body, req.user as User);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: ExpressRequest,
  ) {
    if (!req.user) throw new UnauthorizedException();
    await this.documentService.remove(id, req.user as User);
    return { message: 'Document deleted successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return { fileUrl: `/uploads/${file.filename}` };
  }
}
