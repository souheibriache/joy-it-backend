import { Combine } from '@app/common/utils/types'
import { RefreshToken } from '../entities/refresh-token.entity'
import { IUniqueIdentifier } from '@app/common/interfaces'

export type IRefreshToken = Combine<RefreshToken, IUniqueIdentifier>
