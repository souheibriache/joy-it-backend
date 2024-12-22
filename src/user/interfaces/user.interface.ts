import { IUniqueIdentifier } from '@app/common/interfaces'
import { User } from '../entities'
import { Combine } from '@app/common/utils/types'

export type IUser = Combine<User, IUniqueIdentifier>
