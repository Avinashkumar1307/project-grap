import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionStatus, TransactionType } from './entities/transaction.entity';
import { RazorpayService } from '../payment/razorpay.service';
import { ProjectsService } from '../projects/projects.service';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly razorpayService: RazorpayService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createTransactionDto: CreateTransactionDto, @Request() req) {
    return this.transactionsService.create(createTransactionDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req) {
    const isAdmin = req.user.role === 'admin';
    return this.transactionsService.findAll(req.user.id, isAdmin);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats(@Request() req) {
    const isAdmin = req.user.role === 'admin';
    return this.transactionsService.getStats(isAdmin ? undefined : req.user.id);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  getHistory(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.transactionsService.getTransactionHistory(
      req.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('by-status/:status')
  @UseGuards(JwtAuthGuard)
  findByStatus(@Param('status') status: TransactionStatus) {
    return this.transactionsService.findByStatus(status);
  }

  @Get('my-transactions')
  @UseGuards(JwtAuthGuard)
  getMyTransactions(@Request() req) {
    return this.transactionsService.findByUser(req.user.id);
  }

  @Get('project/:projectId')
  @UseGuards(JwtAuthGuard)
  findByProject(@Param('projectId') projectId: string) {
    return this.transactionsService.findByProject(projectId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: TransactionStatus; failureReason?: string },
  ) {
    return this.transactionsService.updateStatus(id, body.status, body.failureReason);
  }

  // Razorpay Payment Integration Endpoints

  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  async createPaymentOrder(
    @Body() body: { projectId: string; customRequestId?: string },
    @Request() req,
  ) {
    let amount: number;
    let description: string;

    if (body.projectId) {
      const project = await this.projectsService.findOne(body.projectId);
      amount = Number(project.price);
      description = `Purchase of ${project.title}`;
    } else if (body.customRequestId) {
      // Get custom request amount (you'll need to implement this)
      throw new BadRequestException('Custom request payment not yet implemented');
    } else {
      throw new BadRequestException('Either projectId or customRequestId is required');
    }

    // Create Razorpay order
    const order = await this.razorpayService.createOrder({
      amount,
      receipt: `order_${Date.now()}`,
      notes: {
        userId: req.user.id,
        projectId: body.projectId,
        customRequestId: body.customRequestId,
      },
    });

    // Create transaction record
    const transaction = await this.transactionsService.create(
      {
        projectId: body.projectId,
        customRequestId: body.customRequestId,
        type: body.projectId ? TransactionType.PROJECT_PURCHASE : TransactionType.CUSTOM_REQUEST_PAYMENT,
        amount,
        description,
      },
      req.user.id,
    );

    // Update transaction with order ID
    await this.transactionsService.update(transaction.id, {
      paymentGatewayOrderId: order.id,
      status: TransactionStatus.PENDING,
    });

    return {
      orderId: order.id,
      amount: Number(order.amount) / 100, // Convert paise to INR
      currency: order.currency,
      transactionId: transaction.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  @Post('verify-payment')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(
    @Body()
    body: {
      transactionId: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
    @Request() req,
  ) {
    // Verify signature
    const isValid = this.razorpayService.verifyPaymentSignature({
      razorpay_order_id: body.razorpay_order_id,
      razorpay_payment_id: body.razorpay_payment_id,
      razorpay_signature: body.razorpay_signature,
    });

    if (!isValid) {
      // Update transaction as failed
      await this.transactionsService.updateStatus(
        body.transactionId,
        TransactionStatus.FAILED,
        'Invalid payment signature',
      );
      throw new BadRequestException('Invalid payment signature');
    }

    // Get payment details from Razorpay
    const payment = await this.razorpayService.getPayment(body.razorpay_payment_id);

    // Update transaction
    const transaction = await this.transactionsService.update(body.transactionId, {
      paymentGatewayPaymentId: body.razorpay_payment_id,
      status: TransactionStatus.COMPLETED,
      metadata: payment,
    });

    // If it's a project purchase, increment sales count
    if (transaction.projectId) {
      await this.projectsService.incrementSales(transaction.projectId);
    }

    return {
      success: true,
      message: 'Payment verified successfully',
      transaction,
    };
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    // Razorpay webhook handler
    // You should verify the webhook signature here
    const event = body.event;

    switch (event) {
      case 'payment.captured':
        // Handle payment captured
        break;
      case 'payment.failed':
        // Handle payment failed
        break;
      case 'refund.created':
        // Handle refund created
        break;
      default:
        break;
    }

    return { status: 'ok' };
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  async createRefund(@Param('id') id: string, @Body() body: { amount?: number }) {
    const transaction = await this.transactionsService.findOne(id);

    if (!transaction.paymentGatewayPaymentId) {
      throw new BadRequestException('No payment found for this transaction');
    }

    // Create refund in Razorpay
    const refund = await this.razorpayService.createRefund(
      transaction.paymentGatewayPaymentId,
      body.amount,
    );

    // Update transaction status
    await this.transactionsService.updateStatus(id, TransactionStatus.REFUNDED);

    return {
      success: true,
      refund,
    };
  }
}
