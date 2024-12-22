import { Combine } from '@app/common/utils/types'
import { Company } from '../entities'
import { IUniqueIdentifier } from '@app/common/interfaces'

export type ICompany = Combine<Company, IUniqueIdentifier>
