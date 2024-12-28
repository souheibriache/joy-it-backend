import { Controller, Post, Req, Res } from '@nestjs/common'
import { ConfigService } from '@app/config'
import Stripe from 'stripe'
import { SubscriptionService } from 'src/subscription/subscription.service'

@Controller('webhook')
export class StripeController {
  constructor(
    private readonly configService: ConfigService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post()
  async handleStripeWebhook(@Req() req, @Res() res) {
    console.log({ reqBody: req })

    const stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2024-12-18.acacia',
      },
    )

    console.log({ stripe })
    const endpointSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    )
    console.log({ endpointSecret })

    const signature = req.headers['stripe-signature']

    console.log({ signature })

    let event
    try {
      event = stripe.webhooks.constructEvent(
        Buffer.from(JSON.stringify(req.body)),
        signature,
        endpointSecret,
      )

      console.log({ event })
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    console.log(`Received event: ${event.type}`)

    // Handle event types
    switch (event.type) {
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        console.log(`Invoice paid: ${invoice.id}`)
        await this.subscriptionService.handleInvoicePaid(
          invoice.subscription as string,
        )
        break
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        console.log(`Invoice payment failed: ${failedInvoice.id}`)
        await this.subscriptionService.handleSubscriptionCanceled(
          failedInvoice.id,
        )
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.status(200).send('Event received')
  }
}
