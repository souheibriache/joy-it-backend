import { User } from 'src/user/entities';
import {} from '@nestjs/typeorm';
import { Column, Entity, OneToOne } from 'typeorm';
import { Company } from 'src/company/entities';

@Entity('client')
export class Client extends User {
  @OneToOne(() => Company, (company: Company) => company.client, {
    cascade: true,
  })
  company: Company;

  @Column({ type: 'boolean', name: 'is_verified', default: true })
  isVerified: boolean;
}
