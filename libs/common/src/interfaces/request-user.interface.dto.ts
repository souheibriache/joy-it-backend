import { Request } from 'express'
import { Combine } from '../utils/types'
import { User } from 'src/user/entities'

type PayloadUser = {
  user: User
}

export type IRequestWithUser = Combine<Request, PayloadUser>
