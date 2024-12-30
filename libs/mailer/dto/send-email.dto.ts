import { MailContent } from '@sendgrid/helpers/classes/mail'

export declare type AttachmentData = {
  content: string
  filename: string
  type?: string
  disposition?: string
  contentId?: string
}

export class sendEmailDto {
  to?: string
  subject?: string
  text?: string
  content?: MailContent[]
  attachments?: AttachmentData[]
  templateId?: string
  dynamicTemplateData?: any
}
