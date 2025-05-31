import { Test, TestingModule } from '@nestjs/testing'
import { MailerService } from './mailer.service'
import { ConfigService } from '@app/config'
import * as sgMail from '@sendgrid/mail'
import { sendEmailDto, SendMultipleEmailsDto } from '../dto'

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
  sendMultiple: jest.fn(),
}))

describe('MailerService', () => {
  let service: MailerService
  let configService: ConfigService
  let sendgridClient: typeof sgMail

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mock-api-key'),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    service = module.get<MailerService>(MailerService)
    configService = module.get<ConfigService>(ConfigService)
    sendgridClient = sgMail
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should initialize with SendGrid API key', () => {
    expect(configService.get).toHaveBeenCalledWith('SENDGRID_API_KEY')
    expect(sendgridClient.setApiKey).toHaveBeenCalledWith('mock-api-key')
  })

  describe('sendSingle', () => {
    const mockSendEmailDto: sendEmailDto = {
      to: 'test@example.com',
      subject: 'Test Subject',
      content: [{ type: 'text/plain', value: 'Test Content' }],
      text: 'Test Text',
      attachments: [
        {
          content: 'test-content',
          filename: 'test.txt',
          type: 'text/plain',
          disposition: 'attachment',
        },
      ],
      templateId: 'test-template-id',
      dynamicTemplateData: { key: 'value' },
    }

    it('should send a single email successfully', async () => {
      const mockResponse = [
        {
          statusCode: 202,
          body: {},
          headers: {},
        },
      ]
      ;(sendgridClient.send as jest.Mock).mockResolvedValue(mockResponse)

      const result = await service.sendSingle(mockSendEmailDto)

      expect(result).toEqual(mockResponse)
      expect(sendgridClient.send).toHaveBeenCalledWith({
        to: mockSendEmailDto.to,
        from: {
          email: 'contact@joy-it.fr',
          name: 'Joy-it',
        },
        subject: mockSendEmailDto.subject,
        content: mockSendEmailDto.content,
        text: mockSendEmailDto.text,
        attachments: mockSendEmailDto.attachments,
        templateId: mockSendEmailDto.templateId,
        dynamicTemplateData: mockSendEmailDto.dynamicTemplateData,
      })
    })

    it('should handle SendGrid API errors for single email', async () => {
      const mockError = new Error('SendGrid API Error')
      ;(sendgridClient.send as jest.Mock).mockRejectedValue(mockError)

      await expect(service.sendSingle(mockSendEmailDto)).rejects.toThrow(
        'SendGrid API Error',
      )
    })
  })

  describe('sendMultiple', () => {
    const mockSendMultipleEmailsDto: SendMultipleEmailsDto = {
      to: ['test1@example.com', 'test2@example.com'],
      subject: 'Test Subject',
      content: [{ type: 'text/plain', value: 'Test Content' }],
      text: 'Test Text',
      attachments: [
        {
          content: 'test-content',
          filename: 'test.txt',
          type: 'text/plain',
          disposition: 'attachment',
        },
      ],
      template: 'test-template-id',
      customArgs: { key: 'value' },
    }

    it('should send multiple emails successfully', async () => {
      const mockResponse = [
        {
          statusCode: 202,
          body: {},
          headers: {},
        },
      ]
      ;(sendgridClient.sendMultiple as jest.Mock).mockResolvedValue(
        mockResponse,
      )

      const result = await service.sendMultiple(mockSendMultipleEmailsDto)

      expect(result).toEqual(mockResponse)
      expect(sendgridClient.sendMultiple).toHaveBeenCalledWith({
        to: mockSendMultipleEmailsDto.to,
        from: {
          email: 'contact@joy-it.fr',
          name: 'Joy-it',
        },
        subject: mockSendMultipleEmailsDto.subject,
        content: mockSendMultipleEmailsDto.content,
        text: mockSendMultipleEmailsDto.text,
        attachments: mockSendMultipleEmailsDto.attachments,
        templateId: mockSendMultipleEmailsDto.template,
        customArgs: mockSendMultipleEmailsDto.customArgs,
      })
    })

    it('should handle SendGrid API errors for multiple emails', async () => {
      const mockError = new Error('SendGrid API Error')
      ;(sendgridClient.sendMultiple as jest.Mock).mockRejectedValue(mockError)

      await expect(
        service.sendMultiple(mockSendMultipleEmailsDto),
      ).rejects.toThrow('SendGrid API Error')
    })

    it('should handle empty recipient list', async () => {
      const emptyRecipientsDto = {
        ...mockSendMultipleEmailsDto,
        to: [],
      }

      const mockResponse = [
        {
          statusCode: 202,
          body: {},
          headers: {},
        },
      ]
      ;(sendgridClient.sendMultiple as jest.Mock).mockResolvedValue(
        mockResponse,
      )

      const result = await service.sendMultiple(emptyRecipientsDto)

      expect(result).toEqual(mockResponse)
      expect(sendgridClient.sendMultiple).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [],
        }),
      )
    })
  })
})
