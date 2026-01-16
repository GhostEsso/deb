import { Controller, Post, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Post()
    create(@Body() body: CreateBookingDto & { userId: string }) {
        const { userId, ...dto } = body;
        return this.bookingsService.create(userId, dto);
    }

    @Get('user/:userId')
    findByUser(
        @Param('userId') userId: string,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20'
    ) {
        return this.bookingsService.findByUser(userId, parseInt(page), parseInt(limit));
    }

    @Get('booked-slots/:date')
    getBookedSlots(@Param('date') date: string) {
        return this.bookingsService.getBookedSlots(date);
    }

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20'
    ) {
        return this.bookingsService.findAll(parseInt(page), parseInt(limit));
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() body: { status: 'ACCEPTED' | 'REFUSED' | 'CANCELLED' | 'COMPLETED', cancellationReason?: string }
    ) {
        return this.bookingsService.updateStatus(id, body.status, body.cancellationReason);
    }
}
