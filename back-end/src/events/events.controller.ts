import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto';
import { JwtAdminAuthGuard } from '../auth/guards/jwt-admin-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'The event has been successfully created.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events or filter by query' })
  @ApiResponse({
    status: 200,
    description: 'List of events returned successfully.',
  })
  findAll(@Query() query: any) {
    return this.eventsService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active events (current date between start and end date)' })
  @ApiResponse({
    status: 200,
    description: 'List of active events returned successfully.',
  })
  findActive() {
    return this.eventsService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({
    status: 200,
    description: 'The event has been found.',
  })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an event by ID (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The event has been successfully updated.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  @UseGuards(JwtAdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an event by ID (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The event has been successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get events by product ID' })
  @ApiResponse({
    status: 200,
    description: 'Events containing the product ID returned successfully.',
  })
  findByProductId(@Param('productId') productId: string) {
    return this.eventsService.findEventsByProductId(productId);
  }

  @Get('variant/:variantId')
  @ApiOperation({ summary: 'Get events by variant ID' })
  @ApiResponse({
    status: 200,
    description: 'Events containing the variant ID returned successfully.',
  })
  findByVariantId(@Param('variantId') variantId: string) {
    return this.eventsService.findEventsByVariantId(variantId);
  }
} 