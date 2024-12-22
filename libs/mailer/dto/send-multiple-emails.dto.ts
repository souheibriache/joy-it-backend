import { MailContent } from '@sendgrid/helpers/classes/mail'
import { AttachmentData } from './send-email.dto'

export class SendMultipleEmailsDto {
  to?: string[]
  subject?: string
  text?: string
  content?: MailContent[]
  attachments?: AttachmentData[]
  template?: string
  customArgs?: any
}
