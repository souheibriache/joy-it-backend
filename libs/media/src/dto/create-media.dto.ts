import { ResourceTypeEnum } from '../enums/resource-type.enum'

export class CreateMediaDto {
  fullUrl: string

  name: string

  originalName: string

  placeHolder: string

  resourceType?: ResourceTypeEnum
}
