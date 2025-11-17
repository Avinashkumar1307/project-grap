import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

export interface CreateOrderDto {
  amount: number; // Amount in INR
  currency?: string;
  receipt?: string;
  notes?: any;
}

export interface VerifyPaymentDto {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay;

  constructor(private configService: ConfigService) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
    });
  }

  /**
   * Create a Razorpay order
   */
  async createOrder(createOrderDto: CreateOrderDto) {
    const options = {
      amount: Math.round(createOrderDto.amount * 100), // Razorpay expects amount in paise
      currency: createOrderDto.currency || 'INR',
      receipt: createOrderDto.receipt || `receipt_${Date.now()}`,
      notes: createOrderDto.notes || {},
    };

    try {
      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      throw new Error(`Failed to create Razorpay order: ${error.message}`);
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(verifyPaymentDto: VerifyPaymentDto): boolean {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verifyPaymentDto;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', this.configService.get('RAZORPAY_KEY_SECRET'))
      .update(sign.toString())
      .digest('hex');

    return expectedSign === razorpay_signature;
  }

  /**
   * Fetch payment details
   */
  async getPayment(paymentId: string) {
    try {
      return await this.razorpay.payments.fetch(paymentId);
    } catch (error) {
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }
  }

  /**
   * Fetch order details
   */
  async getOrder(orderId: string) {
    try {
      return await this.razorpay.orders.fetch(orderId);
    } catch (error) {
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  /**
   * Capture payment
   */
  async capturePayment(paymentId: string, amount: number, currency: string = 'INR') {
    try {
      return await this.razorpay.payments.capture(paymentId, Math.round(amount * 100), currency);
    } catch (error) {
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  }

  /**
   * Create refund
   */
  async createRefund(paymentId: string, amount?: number) {
    try {
      const options: any = {};
      if (amount) {
        options.amount = Math.round(amount * 100);
      }
      return await this.razorpay.payments.refund(paymentId, options);
    } catch (error) {
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }

  /**
   * Get refund details
   */
  async getRefund(refundId: string) {
    try {
      return await this.razorpay.refunds.fetch(refundId);
    } catch (error) {
      throw new Error(`Failed to fetch refund: ${error.message}`);
    }
  }
}
