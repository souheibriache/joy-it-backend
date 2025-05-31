import { Test, TestingModule } from '@nestjs/testing'
import { StripeController } from './stripe.controller'
import { ConfigService } from '@app/config'
import { ServiceOrderService } from 'src/service-order/service-order.service'
import { Request, Response } from 'express'
import Stripe from 'stripe'

describe('StripeController', () => {
  let controller: StripeController
  let configService: ConfigService
  let serviceOrderService: ServiceOrderService
  let stripe: Stripe

  const mockConfigService = {
    get: jest.fn(),
  }

  const mockServiceOrderService = {
    confirmPayment: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ServiceOrderService,
          useValue: mockServiceOrderService,
        },
      ],
    }).compile()

    controller = module.get<StripeController>(StripeController)
    configService = module.get<ConfigService>(ConfigService)
    serviceOrderService = module.get<ServiceOrderService>(ServiceOrderService)

    // Reset mock implementations
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'STRIPE_SECRET_KEY':
          return 'sk_test_123'
        case 'STRIPE_WEBHOOK_SECRET':
          return 'whsec_123'
        default:
          return undefined
      }
    })

    // Initialize Stripe instance
    stripe = new Stripe('sk_test_123', {
      apiVersion: '2025-02-24.acacia',
    })
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('handleStripeWebhook', () => {
    const mockRequest = {
      body: JSON.stringify({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: {
              orderId: 'order_123',
            },
          },
        },
      }),
      headers: {
        'stripe-signature': 'test_signature',
      },
    } as unknown as Request

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response

    it('should handle checkout.session.completed event', async () => {
      const mockSession = {
        id: 'cs_test_123',
        object: 'checkout.session',
        amount_total: 1000,
        currency: 'usd',
        customer: 'cus_123',
        metadata: {
          orderId: 'order_123',
        },
        payment_intent: 'pi_123',
        payment_status: 'paid',
        status: 'complete',
        livemode: false,
        client_reference_id: null,
        created: Math.floor(Date.now() / 1000),
        mode: 'payment',
        payment_method_types: ['card'],
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        url: null,
        after_expiration: null,
        allow_promotion_codes: null,
        amount_subtotal: 1000,
        automatic_tax: { enabled: false, status: null },
        billing_address_collection: null,
        cancel_url: 'http://localhost:3000/cancel',
        consent_collection: null,
        currency_conversion: null,
        custom_fields: [],
        custom_text: null,
        customer_creation: null,
        customer_details: null,
        customer_email: null,
        invoice: null,
        invoice_creation: null,
        line_items: null,
        locale: null,
        payment_method_collection: 'always',
        payment_method_options: null,
        phone_number_collection: null,
        recovered_from: null,
        setup_intent: null,
        shipping_address_collection: null,
        shipping_cost: null,
        shipping_details: null,
        shipping_options: [],
        submit_type: null,
        subscription: null,
        success_url: 'http://localhost:3000/success',
        total_details: null,
        ui_mode: 'hosted',
      } as unknown as Stripe.Checkout.Session

      const constructEventSpy = jest.spyOn(Stripe.webhooks, 'constructEvent')
      constructEventSpy.mockImplementation(() => ({
        id: 'evt_123',
        object: 'event',
        api_version: '2025-02-24.acacia',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: mockSession,
        },
        livemode: false,
        pending_webhooks: 0,
        request: {
          id: null,
          idempotency_key: null,
        },
        type: 'checkout.session.completed',
      }))

      mockServiceOrderService.confirmPayment.mockResolvedValue({
        id: 'order_123',
        status: 'ACTIVE',
      })

      await controller.handleStripeWebhook(mockRequest, mockResponse)

      expect(mockServiceOrderService.confirmPayment).toHaveBeenCalledWith(
        'order_123',
      )
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.send).toHaveBeenCalledWith('Event received')
    })

    it('should handle payment_intent.payment_failed event', async () => {
      const mockPaymentIntent = {
        id: 'pi_failed_123',
        object: 'payment_intent',
        amount: 1000,
        currency: 'usd',
        customer: 'cus_123',
        metadata: {
          orderId: 'order_123',
        },
        status: 'requires_payment_method',
        last_payment_error: {
          code: 'card_declined',
          message: 'Your card was declined.',
          type: 'card_error',
        },
        livemode: false,
        created: Math.floor(Date.now() / 1000),
        canceled_at: null,
        cancellation_reason: null,
        client_secret: 'pi_123_secret_456',
        amount_capturable: 0,
        amount_received: 0,
        application: null,
        application_fee_amount: null,
        automatic_payment_methods: null,
        capture_method: 'automatic',
        confirmation_method: 'automatic',
        payment_method: null,
        payment_method_types: ['card'],
        processing: null,
        receipt_email: null,
        setup_future_usage: null,
        shipping: null,
        source: null,
        statement_descriptor: null,
        statement_descriptor_suffix: null,
        transfer_data: null,
        transfer_group: null,
      } as unknown as Stripe.PaymentIntent

      const constructEventSpy = jest.spyOn(Stripe.webhooks, 'constructEvent')
      constructEventSpy.mockImplementation(() => ({
        id: 'evt_123',
        object: 'event',
        api_version: '2025-02-24.acacia',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: mockPaymentIntent,
        },
        livemode: false,
        pending_webhooks: 0,
        request: {
          id: null,
          idempotency_key: null,
        },
        type: 'payment_intent.payment_failed',
      }))

      await controller.handleStripeWebhook(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.send).toHaveBeenCalledWith('Event received')
    })

    it('should handle unhandled event types', async () => {
      const mockSubscription = {
        id: 'sub_123',
        object: 'subscription',
        customer: 'cus_123',
        status: 'active',
        items: {
          object: 'list',
          data: [
            {
              id: 'si_123',
              object: 'subscription_item',
              price: {
                id: 'price_123',
                object: 'price',
                active: true,
                currency: 'usd',
                product: 'prod_123',
                unit_amount: 1000,
                billing_scheme: 'per_unit',
                created: Math.floor(Date.now() / 1000),
                livemode: false,
                lookup_key: null,
                metadata: {},
                nickname: null,
                product_data: null,
                recurring: null,
                tax_behavior: 'unspecified',
                tiers_mode: null,
                transform_quantity: null,
                type: 'one_time',
              },
              quantity: 1,
            },
          ],
          has_more: false,
          total_count: 1,
          url: '/v1/subscription_items?subscription=sub_123',
        },
        metadata: {},
        created: Math.floor(Date.now() / 1000),
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        days_until_due: null,
        default_payment_method: null,
        livemode: false,
        application: null,
        application_fee_percent: null,
        automatic_tax: { enabled: false },
        billing_cycle_anchor: Math.floor(Date.now() / 1000),
        billing_thresholds: null,
        cancel_at: null,
        cancel_at_period_end: false,
        canceled_at: null,
        collection_method: 'charge_automatically',
        default_source: null,
        default_tax_rates: [],
        discount: null,
        ended_at: null,
        latest_invoice: null,
        next_pending_invoice_item_invoice: null,
        pause_collection: null,
        pending_invoice_item_interval: null,
        pending_setup_intent: null,
        pending_update: null,
        schedule: null,
        start_date: Math.floor(Date.now() / 1000),
        transfer_data: null,
        trial_end: null,
        trial_start: null,
      } as unknown as Stripe.Subscription

      const constructEventSpy = jest.spyOn(Stripe.webhooks, 'constructEvent')
      constructEventSpy.mockImplementation(() => ({
        id: 'evt_123',
        object: 'event',
        api_version: '2025-02-24.acacia',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: mockSubscription,
        },
        livemode: false,
        pending_webhooks: 0,
        request: {
          id: null,
          idempotency_key: null,
        },
        type: 'customer.subscription.created',
      }))

      await controller.handleStripeWebhook(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.send).toHaveBeenCalledWith('Event received')
    })

    it('should handle signature verification failure', async () => {
      const constructEventSpy = jest.spyOn(Stripe.webhooks, 'constructEvent')
      constructEventSpy.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      await controller.handleStripeWebhook(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.send).toHaveBeenCalledWith(
        'Webhook Error: Invalid signature',
      )
    })

    it('should use correct Stripe configuration', async () => {
      const mockSession = {
        id: 'cs_test_123',
        object: 'checkout.session',
        amount_total: 1000,
        currency: 'usd',
        customer: 'cus_123',
        metadata: {
          orderId: 'order_123',
        },
        payment_intent: 'pi_123',
        payment_status: 'paid',
        status: 'complete',
        livemode: false,
        client_reference_id: null,
        created: Math.floor(Date.now() / 1000),
        mode: 'payment',
        payment_method_types: ['card'],
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        url: null,
        after_expiration: null,
        allow_promotion_codes: null,
        amount_subtotal: 1000,
        automatic_tax: { enabled: false, status: null },
        billing_address_collection: null,
        cancel_url: 'http://localhost:3000/cancel',
        consent_collection: null,
        currency_conversion: null,
        custom_fields: [],
        custom_text: null,
        customer_creation: null,
        customer_details: null,
        customer_email: null,
        invoice: null,
        invoice_creation: null,
        line_items: null,
        locale: null,
        payment_method_collection: 'always',
        payment_method_options: null,
        phone_number_collection: null,
        recovered_from: null,
        setup_intent: null,
        shipping_address_collection: null,
        shipping_cost: null,
        shipping_details: null,
        shipping_options: [],
        submit_type: null,
        subscription: null,
        success_url: 'http://localhost:3000/success',
        total_details: null,
        ui_mode: 'hosted',
      } as unknown as Stripe.Checkout.Session

      const constructEventSpy = jest.spyOn(Stripe.webhooks, 'constructEvent')
      constructEventSpy.mockImplementation(() => ({
        id: 'evt_123',
        object: 'event',
        api_version: '2025-02-24.acacia',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: mockSession,
        },
        livemode: false,
        pending_webhooks: 0,
        request: {
          id: null,
          idempotency_key: null,
        },
        type: 'checkout.session.completed',
      }))

      await controller.handleStripeWebhook(mockRequest, mockResponse)

      expect(configService.get).toHaveBeenCalledWith('STRIPE_SECRET_KEY')
      expect(configService.get).toHaveBeenCalledWith('STRIPE_WEBHOOK_SECRET')
    })
  })
})
