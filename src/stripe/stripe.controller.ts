import { Controller, Post, Req, Res } from '@nestjs/common'
import { ConfigService } from '@app/config'
import Stripe from 'stripe'
import { ServiceOrderService } from 'src/service-order/service-order.service'

@Controller('webhook')
export class StripeController {
  constructor(
    private readonly configService: ConfigService,
    private readonly serviceOrderService: ServiceOrderService,
  ) {}

  @Post()
  async handleStripeWebhook(@Req() req, @Res() res) {
    const stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      { apiVersion: '2025-01-27.acacia' },
    )
    console.log('stripee')
    const endpointSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    )

    const signature = req.headers['stripe-signature']

    let event
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret,
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // Handle event types
    switch (event.type) {
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata.orderId
        await this.serviceOrderService.confirmPayment(orderId)
        console.log(`Order ${orderId} confirmed and activated.`)

        break
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        console.log(`Invoice payment failed: ${failedInvoice.id}`)
        // await this.subscriptionService.handleSubscriptionCanceled(
        //   failedInvoice.id,
        // )
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.status(200).send('Event received')
  }
}
