import { Injectable } from '@nestjs/common'
import { v2 as cloudinary } from 'cloudinary'
import * as streamifier from 'streamifier'
import { CloudinaryResponse } from './types/cloudinary-response.type'

@Injectable()
export class UploadService {
  private uploadFile(
    file: Express.Multer.File,
    filderName?: string,
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `${process.env.JOYIT_ROOT_FOLDER}/${filderName}` },
        (error, result) => {
          if (error) return reject(error)
          resolve(result)
        },
      )

      streamifier.createReadStream(file.buffer).pipe(uploadStream)
    })
  }

  async upload(
    file: Express.Multer.File,
    folderName?: string,
  ): Promise<CloudinaryResponse> {
    return await this.uploadFile(file, folderName)
  }

  async uploadMany(
    files: Express.Multer.File[],
    folderName?: string,
  ): Promise<CloudinaryResponse[]> {
    const promises = []
    for (const file of files) {
      promises.push(this.uploadFile(file, folderName))
    }
    return await Promise.all(promises)
  }
}
