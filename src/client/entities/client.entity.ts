import { User } from 'src/user/entities'
import {} from '@nestjs/typeorm'
import { ChildEntity, Column, JoinColumn, OneToOne } from 'typeorm'
import { Company } from 'src/company/entities'
import { UserRoles } from 'src/user/enums/user-roles.enum'

@ChildEntity(UserRoles.CLIENT)
export class Client extends User {
  @OneToOne(() => Company, (company: Company) => company.client, {
    cascade: true,
  })
  @JoinColumn({ name: 'company_id', referencedColumnName: 'id' })
  company: Company

  @Column({ type: 'boolean', name: 'is_verified', default: false })
  isVerified: boolean

  @Column({ type: 'timestamptz', nullable: true })
  verificationSentAt: Date
}
