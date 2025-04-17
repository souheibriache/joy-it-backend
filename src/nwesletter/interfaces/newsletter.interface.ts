import { Combine } from '@app/common/utils/types'
import { IUniqueIdentifier } from '@app/common/interfaces'
import { Newsletter } from '../entities'

export type INewsLetter = Combine<Newsletter, IUniqueIdentifier>
