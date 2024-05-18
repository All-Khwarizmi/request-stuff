import { PATHS } from "@/common/constants";
import IServerDatabase from "@/common/interfaces/Iserver-database";
import { UserOptions } from "@/features/auth/domain/entities/user-entity";
import {
  PublicRequest,
  Upload,
  UserUpload,
} from "@/features/request/domain/entities/request-types";
import { DocumentData } from "firebase/firestore";
import { Failure } from "fp-ddd";
import { Either } from "fp-ts/lib/Either";
import { inject, injectable } from "tsyringe";

export interface ServerRepositoryOptions {
  readonly database: IServerDatabase;
}
@injectable()
export default class ServerRepository {
  private readonly _options: ServerRepositoryOptions;
  constructor(
    @inject("serverRepositoryOptions")
    serverRepositoryOptions: ServerRepositoryOptions
  ) {
    this._options = serverRepositoryOptions;
  }

  async verifyIdToken({
    idToken,
  }: {
    idToken: string;
  }): Promise<Either<Failure<string>, string>> {
    return this._options.database.verifyIdToken(idToken);
  }

  async createSessionCookie({
    userId,
    expiresIn,
  }: {
    userId: string;
    expiresIn?: number;
  }): Promise<Either<Failure<string>, string>> {
    return this._options.database.createSessionCookie(userId, expiresIn);
  }

  async getUser({
    userId,
  }: {
    userId: string;
  }): Promise<Either<Failure<string>, DocumentData>> {
    return this._options.database.getDocument("users", userId);
  }

  async uploadFile({
    file,
    userId,
    requestId,
  }: {
    file: File;
    userId: string;
    requestId: string;
  }): Promise<Either<Failure<string>, string>> {
    const path = PATHS.USER_REQUEST_FILE({
      userId,
      requestId,
      fileName: file.name,
    });
    return this._options.database.uploadFile(file, path);
  }

  async addUploadToPublicRequest({
    request,
    upload,
  }: {
    request: PublicRequest;
    upload: Upload;
  }): Promise<Either<Failure<string>, void>> {
    return this._options.database.updateArray({
      collection: "requests",
      id: request.id,
      field: "uploads",
      data: {
        ...upload,
      },
      updateRest: true,
      rest: {
        numberOfUploads: request.numberOfUploads + 1,
      },
    });
  }
  async addUploadToUserRequest({
    userId,
    request,
    upload,
  }: {
    userId: string;
    request: PublicRequest;
    upload: UserUpload;
  }): Promise<Either<Failure<string>, void>> {
    const path = PATHS.USERS_REQUESTS({
      userId,
    });
    return this._options.database.updateArray({
      collection: path,
      id: request.id,
      field: "uploads",
      data: {
        ...upload,
      },
      updateRest: true,
      rest: {
        numberOfUploads: request.numberOfUploads + 1,
      },
    });
  }

  async updateUserCurrentStorage({
    user,
    newCurrentStorage,
  }: {
    user: UserOptions;
    newCurrentStorage: number;
  }): Promise<Either<Failure<string>, void>> {
    return await this._options.database.updateDocument(PATHS.USERS(), user.id, {
      currentStorage: newCurrentStorage,
    });
  }

  async useDeleteFile({
    userId,
    requestId,
    fileName,
  }: {
    userId: string;
    requestId: string;
    fileName: string;
  }): Promise<Either<Failure<string>, void>> {
    const path = PATHS.USER_DELETE_FILE({
      userId,
      requestId,
      fileName,
    });
    return this._options.database.deleteFile(path);
  }
}
