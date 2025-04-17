import { Combine } from '@app/common/utils/types'
import { Support } from '../entities'
import { IUniqueIdentifier } from '@app/common/interfaces'

export type ISupport = Combine<Support, IUniqueIdentifier>
