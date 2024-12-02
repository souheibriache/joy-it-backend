import { BaseEntity } from '@app/base-entity';
import { Company } from 'src/company/entities';
import { Plan } from 'src/plan/entities';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

@Entity('subscription')
export class Subscription extends BaseEntity {
  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id', referencedColumnName: 'id' })
  plan: Plan;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id', referencedColumnName: 'id' })
  company: Company;

  @Column({ type: 'timestamptz', name: 'start_date', default: new Date() })
  startDate: Date;

  @Column({ type: 'timestamptz', name: 'end_date', default: new Date() })
  endDate: Date;
}
