import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Subscription } from './entities'
import { Repository } from 'typeorm'
import { CompanyService } from 'src/company/company.service'
import { PlanService } from 'src/plan/plan.service'
import Stripe from 'stripe'
import { SubscriptionStatusEnum } from './enums/subscription-status.enum'
import { ConfigService } from '@app/config'

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly companyService: CompanyService,
    private readonly planService: PlanService,
    @Inject('STRIPE_CLIENT') private stripeClient: Stripe,
    private readonly configService: ConfigService,
  ) {}

  async createSubscription(
    customerId: string,
    priceId: string,
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripeClient.subscriptions.create(
      {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      },
      { idempotencyKey: `subscription-${customerId}-${priceId}` },
    )

    return subscription
  }

  async handleInvoicePaid(subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeId: subscriptionId },
      relations: { company: true, plan: true },
    })

    if (subscription) {
      subscription.status = SubscriptionStatusEnum.PAID
      await this.subscriptionRepository.save(subscription)

      subscription.company.credit += subscription.plan.credit
      await this.companyService.update(
        { credit: subscription.company.credit },
        { id: subscription.company.id },
      )
    } else {
      console.warn(
        `Subscription with ID ${subscriptionId} not found for invoice payment.`,
      )
    }
  }

  async handleSubscriptionCanceled(subscriptionStripeId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeId: subscriptionStripeId },
    })

    if (subscription) {
      subscription.status = SubscriptionStatusEnum.CANCELLED
      await subscription.save()
    } else {
      console.warn(
        `Subscription with Stripe ID ${subscriptionStripeId} not found`,
      )
    }
  }

  async createCheckoutSession(
    planId: string,
    clientId: string,
  ): Promise<Stripe.Checkout.Session> {
    const company = await this.companyService.findOne({
      where: { client: { id: clientId } },
      relations: { client: true },
      select: { stripeCustomerId: true, id: true },
    })
    const plan = await this.planService.findOne(
      { id: planId },
      {},
      {},
      { id: true, stripePriceId: true },
    )
    try {
      const session = await this.stripeClient.checkout.sessions.create({
        customer: company.stripeCustomerId,
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${this.configService.get<string>('FRONTEND_HOST')}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get<string>('FRONTEND_HOST')}/cancel`,
      })
      return session
    } catch (error) {
      console.error('Error creating checkout session:', error.message)
      throw new Error('Failed to create checkout session')
    }
  }

  async cancelSubscription(subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      select: { id: true, stripeId: true },
    })
    if (!subscription) throw new NotFoundException('Subscription not found!')

    await this.stripeClient.subscriptions.cancel(subscription.stripeId)
    subscription.status = SubscriptionStatusEnum.CANCELLED
    return await this.subscriptionRepository.save(subscription)
  }

  async create(planId: string, clientId: string) {
    const company = await this.companyService.findOne({
      where: {
        client: { id: clientId },
      },
      relations: { client: true },
      select: { credit: true, id: true, stripeCustomerId: true },
    })

    const plan = await this.planService.findOne(
      { id: planId },
      {},
      {},
      { stripePriceId: true, id: true },
    )

    if (!company?.stripeCustomerId) {
      company.stripeCustomerId =
        await this.companyService.createStripeCustomer(company)
    }

    const stripeSubscription = await this.createSubscription(
      company.stripeCustomerId,
      plan.stripePriceId,
    )

    const subscription = this.subscriptionRepository.create({
      plan,
      company,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      stripeId: stripeSubscription.id,
      status: SubscriptionStatusEnum.CREATED,
    })

    return await this.subscriptionRepository.save(subscription)
  }

  async createByAdmin(planId: string, companyId: string) {
    const company = await this.companyService.findOne({
      where: {
        id: companyId,
      },
      relations: { client: true },
    })
    const plan = await this.planService.findOne({ id: planId })

    return await this.create(plan.id, company.client.id)
  }
}
