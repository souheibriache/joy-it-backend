import { User } from 'src/user/entities'
import { SupportSubjectEnum } from '../enums'
import { SupportCategory } from '../enums/support-category.enum'

export class CreateSupportQuestionDto {
  question: string
  subject: string
  email: string
  firstName: string
  lastName: string
  askedBy?: User
  category: SupportCategory
  questionAttachments?: Express.Multer.File[]
}
