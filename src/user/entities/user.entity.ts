import { BaseEntity } from "@app/base-entity"
import { RefreshToken } from "src/auth/entities/refresh-token.entity"
import { Column, Entity, OneToMany } from "typeorm"


@Entity({ name: 'users' })
export class User extends BaseEntity{

    @Column({ name: 'user_name' })
    userName: string

    @Column({ type: String, nullable: true, select: false })
    password: string

    @Column({ type: String, nullable: false })
    email: string

    @Column({ name: 'first_name' })
    firstName: string

    @Column({ name: 'last_name' })
    lastName: string

    @OneToMany(() => RefreshToken, refreshToken => refreshToken.user, { cascade: true, onDelete: 'CASCADE' })
    refreshTokens: RefreshToken[];
}