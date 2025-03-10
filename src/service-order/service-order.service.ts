import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ServiceOrder } from './entities'
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  LessThanOrEqual,
  Repository,
} from 'typeorm'
import { PricingService } from 'src/pricing/pricing.service'
import Stripe from 'stripe'
import { CreateServiceOrderDto } from './dto'
import { ActivityType } from 'src/activity/enums/activity-type.enum'
import { CompanyService } from 'src/company/company.service'
import { Company } from 'src/company/entities'
import { ServiceOrderStatus } from './enums/service-order-status.enum'
import { CalculatePricingDto } from 'src/pricing/dto/calculate-pricing.dto'

@Injectable()
export class ServiceOrderService {
  constructor(
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
    private readonly pricingService: PricingService,
    private readonly companyService: CompanyService,
    @Inject('STRIPE_CLIENT') private readonly stripeClient: Stripe,
  ) {}

  async create(
    createServiceOrderDto: CreateServiceOrderDto,
    clientId: string,
  ): Promise<ServiceOrder> {
    const { participants, duration, details } = createServiceOrderDto

    const pricingParameters: CalculatePricingDto = {
      numberOfParticipants: participants,
      months: duration,
      snacking: details.some((d) => d.serviceType === ActivityType.NOURRITURE),
      wellBeing: details.some((d) => d.serviceType === ActivityType.BIEN_ETRE),
      teambuilding: details.some(
        (d) => d.serviceType === ActivityType.TEAM_BUILDING,
      ),
      snackingFrequency:
        details.find((d) => d.serviceType === ActivityType.NOURRITURE)
          ?.frequency || 0,
      wellBeingFrequency:
        details.find((d) => d.serviceType === ActivityType.BIEN_ETRE)
          ?.frequency || 0,
    }

    // Use the calculatePricing function
    const totalCost =
      await this.pricingService.calculatePricing(pricingParameters)

    const company = await this.companyService.findOne({
      where: { client: { id: clientId } },
      relations: { serviceOrders: { details: true }, client: true },
    })

    const serviceOrderDetails = createServiceOrderDto.details.map(
      (serviceOrderDetail) => {
        return {
          ...serviceOrderDetail,
          allowedBooking: this.calculateAllowedBookings(
            serviceOrderDetail.frequency,
            createServiceOrderDto.duration,
          ),
        }
      },
    )

    const order = this.serviceOrderRepository.create({
      participants,
      totalCost,
      duration: createServiceOrderDto.duration,
      details: serviceOrderDetails,
      company: company as Pick<Company, 'id'>,
    })

    const savedOrder = await this.serviceOrderRepository.save(order)

    company.serviceOrders.push(savedOrder)
    await company.save()

    return savedOrder
  }

  async findOne(
    where?: FindOptionsWhere<ServiceOrder>,
    relations?: FindOptionsRelations<ServiceOrder>,
  ): Promise<ServiceOrder> {
    const order = await this.serviceOrderRepository.findOne({
      where,
      relations,
    })
    if (!order) throw new NotFoundException('Service Order not found')
    return order
  }

  async createCheckoutSession(
    orderId: string,
    userId: any,
  ): Promise<Stripe.Checkout.Session> {
    const company = await this.companyService.findOne({
      where: { client: { id: userId } },
    })
    const order = await this.findOne({ id: orderId })
    const session = await this.stripeClient.checkout.sessions.create({
      payment_method_types: ['card', 'pay_by_bank'],
      mode: 'payment',
      customer: company.stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Service Order ${order.id}`,
              description: `Order covering multiple services.`,
            },
            unit_amount: Math.round(order.totalCost * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_HOST}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_HOST}/payment-canceled`,
      metadata: { orderId: order.id },
    })
    order.stripeCheckoutSession = session.id
    await this.serviceOrderRepository.save(order)
    return session
  }

  async confirmPayment(orderId: string): Promise<ServiceOrder> {
    const order = await this.findOne({ id: orderId })
    order.status = ServiceOrderStatus.ACTIVE

    const now = new Date()
    order.startDate = now

    const endDate = now.setMonth(now.getMonth() + order.duration)
    order.endDate = new Date(endDate)

    await order.save()
    console.log({ order })
    return order
  }

  async getSessionById(sessionId: string) {
    const session =
      await this.stripeClient.checkout.sessions.retrieve(sessionId)
    return session
  }

  private calculateAllowedBookings(
    frequency: number,
    duration: number,
  ): number {
    return frequency * duration
  }

  async hasPermissionToSchedule(companyId: string, activityType: ActivityType) {
    const serviceOrders = await this.serviceOrderRepository.find({
      where: {
        company: { id: companyId },
        status: ServiceOrderStatus.ACTIVE,
        endDate: LessThanOrEqual(new Date()),
      },
      relations: { details: true },
    })

    serviceOrders.forEach((serviceOrder) => {
      serviceOrder.details.forEach((detail) => {
        if (
          detail.serviceType === activityType &&
          detail.bookingsUsed < detail.allowedBookings
        )
          return true
      })
    })

    return false
  }

  async updateUsedTimes(
    companyId: string,
    activityType: ActivityType,
    offset: number,
  ) {
    const serviceOrders = await this.serviceOrderRepository.findOne({
      where: {
        company: { id: companyId },
        status: ServiceOrderStatus.ACTIVE,
        endDate: LessThanOrEqual(new Date()),
      },
      relations: { details: true },
    })

    const serviceOrderDetail = serviceOrders.details.find(
      (detail) => detail.serviceType === activityType,
    )
    if (!serviceOrderDetail) return

    serviceOrderDetail.bookingsUsed === serviceOrderDetail.bookingsUsed + offset

    await serviceOrderDetail.save()
    return true
  }

  async find(
    where?: FindOptionsWhere<ServiceOrder>,
    relations?: FindOptionsRelations<ServiceOrder>,
    order?: FindOptionsOrder<ServiceOrder>,
  ) {
    return await this.serviceOrderRepository.find({ where, relations, order })
  }
}
