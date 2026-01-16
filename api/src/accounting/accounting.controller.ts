import { Controller, Get } from '@nestjs/common';
import { AccountingService } from './accounting.service';

@Controller('accounting')
export class AccountingController {
    constructor(private readonly accountingService: AccountingService) { }

    @Get('stats')
    getStats() {
        return this.accountingService.getStats();
    }
}
