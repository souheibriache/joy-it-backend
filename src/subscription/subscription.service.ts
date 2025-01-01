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

  async handleInvoicePaid(subscriptionStripeId: string) {
    const stripeSubscription =
      await this.stripeClient.subscriptions.retrieve(subscriptionStripeId)
    const plan = await this.planService.findOne({
      stripePriceId: stripeSubscription.items.data[0].price.id,
    })

    let subscription = await this.subscriptionRepository.findOne({
      where: { stripeId: stripeSubscription.id },
      relations: { company: true, plan: true },
    })

    if (!subscription) {
      // If the subscription doesn't exist, create a new entry
      const company = await this.companyService.findOne({
        where: {
          stripeCustomerId: stripeSubscription.customer as string,
        },
      })
      subscription = this.subscriptionRepository.create({
        stripeId: stripeSubscription.id,
        plan,
        company,
        startDate: new Date(stripeSubscription.start_date * 1000),
        endDate: new Date(stripeSubscription.current_period_end * 1000),
        status: SubscriptionStatusEnum.PAID,
      })
    }

    // Update the subscription status
    subscription.status = SubscriptionStatusEnum.PAID
    subscription.startDate = new Date()
    subscription.endDate = new Date(
      stripeSubscription.current_period_end * 1000,
    )
    await this.subscriptionRepository.save(subscription)

    // Update the company's credit
    subscription.company.credit += subscription.plan.credit
    await this.companyService.update(
      { credit: subscription.company.credit },
      { id: subscription.company.id },
    )
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

    if (!company.stripeCustomerId) {
      company.stripeCustomerId =
        await this.companyService.createStripeCustomer(company)
    }

    const existingSubscription = await this.subscriptionRepository.findOne({
      where: {
        company: { id: company.id },
        plan: { id: plan.id },
        status: SubscriptionStatusEnum.CREATED,
      },
      select: { stripeId: true, id: true, stripeCheckoutSession: true },
    })

    if (existingSubscription?.stripeCheckoutSession) {
      return this.stripeClient.checkout.sessions.retrieve(
        existingSubscription.stripeCheckoutSession,
      )
    }

    const session = await this.stripeClient.checkout.sessions.create({
      customer: company.stripeCustomerId,
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${this.configService.get<string>('FRONTEND_HOST')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get<string>('FRONTEND_HOST')}/cancel`,
    })

    if (existingSubscription) {
      existingSubscription.stripeCheckoutSession = session.id
      await existingSubscription.save()
    } else {
      const subscription = this.subscriptionRepository.create({
        stripeId: null,
        plan,
        company,
        stripeCheckoutSession: session.id,
        startDate: new Date(),
        endDate: null,
        status: SubscriptionStatusEnum.CREATED,
      })
      await this.subscriptionRepository.save(subscription)
    }

    return session
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

  async create(planId: string, clientId: string): Promise<{ url: string }> {
    return this.createCheckoutSession(planId, clientId)
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
