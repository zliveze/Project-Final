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
import { ProductInEventDto } from './dto/create-event.dto';

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

  @Get('stats')
  @UseGuards(JwtAdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get events statistics for dashboard (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Events statistics returned successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getEventStats() {
    return this.eventsService.getEventStats();
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

  @Post(':id/products')
  @UseGuards(JwtAdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add products to an event (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Products added to the event successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  addProductsToEvent(
    @Param('id') id: string,
    @Body() data: { products: ProductInEventDto[] }
  ) {
    return this.eventsService.addProductsToEvent(id, data.products);
  }

  @Delete(':id/products/:productId')
  @UseGuards(JwtAdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a product from an event (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Product removed from the event successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Event or product not found.' })
  removeProductFromEvent(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Query('variantId') variantId?: string,
    @Query('combinationId') combinationId?: string
  ) {
    return this.eventsService.removeProductFromEvent(id, productId, variantId, combinationId);
  }

  @Patch(':id/products/:productId')
  @UseGuards(JwtAdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product price in an event (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Product price updated in the event successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Event or product not found.' })
  updateProductPriceInEvent(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() data: { adjustedPrice: number, variantId?: string, combinationId?: string }
  ) {
    return this.eventsService.updateProductPriceInEvent(
      id,
      productId,
      data.adjustedPrice,
      data.variantId,
      data.combinationId
    );
  }
}