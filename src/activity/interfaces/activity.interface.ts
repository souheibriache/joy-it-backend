import { Combine } from '@app/common/utils/types'
import { Activity } from '../entities'
import { IUniqueIdentifier } from '@app/common/interfaces'

export type IActivity = Combine<Activity, IUniqueIdentifier>
