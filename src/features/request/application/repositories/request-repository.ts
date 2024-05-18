import { FirebaseDatabase } from "@/common/data/firebase/firestore/firestore";
import { FirebaseStorageServiceInstance } from "@/features/file/infra/file-repository-impl";
import RequestDto from "../../infra/dto's/request-dto";
import {
  PrivateRequest,
  PublicRequest,
  Upload,
  UserUpload,
} from "../../domain/entities/request-types";
import { Either, isLeft, isRight, left, right } from "fp-ts/lib/Either";
import IDatabase from "@/common/interfaces/idatabase";
import IStorage, { FileSenderData } from "@/common/interfaces/istorage";
import { Failure } from "fp-ddd";
import test from "node:test";

export interface RequestRepositoryOptions {
  db: IDatabase;
  storage: IStorage;
}

export default class RequestRepository {
  private _db: RequestRepositoryOptions["db"];
  private _storage: RequestRepositoryOptions["storage"];

  constructor(options: RequestRepositoryOptions) {
    this._db = options.db;
    this._storage = options.storage;
  }

  //* Remove this method
  async uploadFileFromRequest({
    requestData,
    file,
    fileSenderData,
  }: {
    requestData: PublicRequest;
    file: File;
    fileSenderData: FileSenderData;
  }): Promise<string> {
    const path = `users/${requestData.userId}/requests/${requestData.id}/files/${file.name}`;
    console.log({ path, fileSenderData });
    const fileUrl = await this._storage.uploadFile({
      path,
      value: file,
      customMetadata: fileSenderData,
    });

    //* Update request entry
    await this.updatePublicRequestUploads({
      upload: {
        fileName: file.name,
        //! This is not the best way to handle this, but it's a quick fix for now
        senderHash: fileSenderData.senderName,
        date: new Date().toISOString(),
      },
      requestId: requestData.id,
    });

    //* Update user request entry
    await this.updateRequestInUserCollection({
      requestData,
      fileSenderData: {
        ...fileSenderData,
        fileUrl,
      },
    });
    return fileUrl;
  }

  async uploadFileFromRequestServerCall({
    requestData,
    file,
    fileSenderData,
  }: {
    requestData: PublicRequest;
    file: File;
    fileSenderData: FileSenderData;
  }): Promise<Either<Failure<string>, string>> {
    try {
      //! Call backend to send all the data and manage the file upload
      const form = new FormData();
      form.append("file", file);
      form.append("requestData", JSON.stringify(requestData));
      form.append("fileSenderData", JSON.stringify(fileSenderData));
      const response = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      const data = await response.json();

      if (data.error === true) {
        return left(
          Failure.invalidValue({
            message: data.message,
            invalidValue: data,
          })
        );
      }
      return right(data.fileUrl);
    } catch (error) {
      return left(
        Failure.invalidValue({
          message: "Error uploading file",
          invalidValue: error,
        })
      );
    }
  }
  //! Add To Backend Service
  //? user related
  async updateRequestInUserCollection({
    requestData,
    fileSenderData,
  }: {
    requestData: PublicRequest;
    fileSenderData: FileSenderData;
  }): Promise<void> {
    const path = `users/${requestData.userId}/requests`;
    const data: UserUpload = {
      fileName: fileSenderData.fileName,
      fileUrl: fileSenderData.fileUrl,
      fileSenderData: {
        ...fileSenderData,
      },
    };
    console.log({ path, requestId: requestData.id, requestData });
    await this._db.updateArrayInDocument({
      collection: path,
      field: "uploads",
      data,
      id: requestData.id,
      incrementNumber: "numberOfUploads",
    });
    return;
  }
  //! Add To Backend Service
  //~ request related
  async addPublicRequest({
    props,
  }: {
    props: PublicRequest;
  }): Promise<Either<Error, void>> {
    try {
      const id = await this._db.addDocument(props.path, props, props.id);
      return right(undefined);
    } catch (error) {
      return left(new Error("Error adding request to public collection"));
    }
  }
  async getPublicRequest({
    requestId,
  }: {
    requestId: string;
  }): Promise<Either<Failure<string>, PublicRequest>> {
    const requestInfra = await this._db.getDocument("requests", requestId);
    console.log({ requestInfra, test: "test" });
    if (isLeft(requestInfra)) {
      return left(
        Failure.invalidValue({
          invalidValue: requestInfra,
          message: "Could not get the request",
        })
      );
    }
    const requestDto = new RequestDto();

    const request = requestDto.toDomain({ data: requestInfra.right });

    if (isLeft(request)) {
      return left(
        Failure.invalidValue({
          invalidValue: request,
          message: "Could not get the request. Invalid request.",
        })
      );
    }
    return right(request.right);
  }
  async getPublicRequests({
    userId,
  }: {
    userId: string;
  }): Promise<PrivateRequest[]> {
    const rawRequests = await this._db.queryWhere({
      a: "userId",
      b: userId,
      operand: "==",
      ref: "requests",
    });
    if (isLeft(rawRequests)) return [];
    const requests = rawRequests.right;
    const requestDto = new RequestDto();
    const parsedrequests: PrivateRequest[] = [];
    for (const req of requests) {
      const eihterRequest = requestDto.toDomain({ data: req });
      if (isRight(eihterRequest)) {
        parsedrequests.push(eihterRequest.right);
      }
    }

    return parsedrequests;
  }
  //! Add To Backend Service
  //? user related
  async getRequestsByUser({
    userId,
  }: {
    userId: string;
  }): Promise<Either<Failure<string>, PrivateRequest[]>> {
    const path = `users/${userId}/requests`;
    const rawRequests = await this._db.getCollection(path);
    if (isLeft(rawRequests)) {
      console.log({ requestInRepo: rawRequests.left, path });
      return left(
        Failure.invalidValue({
          message: rawRequests.left.message,
          invalidValue: userId,
        })
      );
    }
    const requests = rawRequests.right;
    const requestDto = new RequestDto();
    const parsedrequests: PrivateRequest[] = [];
    for (const req of requests) {
      const eihterRequest = requestDto.toDomain({ data: req });
      if (isRight(eihterRequest)) {
        parsedrequests.push(eihterRequest.right);
      }
    }

    return right(parsedrequests);
  }
  //! Add To Backend Service
  //? user related
  async addRequestToUser({
    path,
    userId,
    request,
  }: {
    path: string;
    userId: string;
    request: PrivateRequest;
  }): Promise<Either<Error, void>> {
    try {
      await this._db.addDocument(path, request, request.id);
      return right(undefined);
    } catch (error) {
      return left(new Error("Error adding request to user collection"));
    }
  }
  //! Add To Backend Service
  //~ request related
  async updatePublicRequest({
    request,
  }: {
    request: PublicRequest;
  }): Promise<void> {
    const path = `requests`;
    await this._db.updateDocument(path, request.id, request);
  }
  //! Add To Backend Service
  //~ request related
  async updatePublicRequestUploads({
    upload,
    requestId,
  }: {
    upload: Upload;
    requestId: string;
  }): Promise<void> {
    const path = `requests`;
    await this._db.updateArrayInDocument({
      collection: path,
      field: "uploads",
      data: upload,
      id: requestId,
    });
  }

  //! Add To Backend Service
  //~ request related
  async deletePublicRequest({
    requestId,
  }: {
    requestId: string;
  }): Promise<Either<Failure<string>, void>> {
    try {
      await this._db.deleteDocument("requests", requestId);
      return right(undefined);
    } catch (error) {
      return left(
        Failure.invalidValue({
          message: "Request not found nor deleted in public collection",
          invalidValue: requestId,
        })
      );
    }
  }
  //! Add To Backend Service
  //? user related
  async deleteRequestFromUserCollection({
    userId,
    requestId,
  }: {
    userId: string;
    requestId: string;
  }): Promise<Either<Failure<string>, void>> {
    try {
      const path = `users/${userId}/requests`;
      await this._db.deleteDocument(path, requestId);
      return right(undefined);
    } catch (error) {
      return left(
        Failure.invalidValue({
          message: "Request not found nor deleted in user collection",
          invalidValue: requestId,
        })
      );
    }
  }
  //! Add To Backend Service
  async deleteRequest({
    userId,
    requestId,
  }: {
    userId: string;
    requestId: string;
  }): Promise<Either<Failure<string>, void>> {
    //! Recursively delete all files in the request storage

    const eitherDeleted = await this._storage.deleteFolder({
      path: `users/${userId}/requests/${requestId}`,
    });
    if (isLeft(eitherDeleted)) {
      return left(eitherDeleted.left);
    }

    //! Delete the request from the public collection
    const eitherDeletedPublic = await this.deletePublicRequest({ requestId });
    if (isLeft(eitherDeletedPublic)) {
      return left(eitherDeletedPublic.left);
    }

    //! Delete the request from the user collection
    const eitherDeletedUser = await this.deleteRequestFromUserCollection({
      userId,
      requestId,
    });
    if (isLeft(eitherDeletedUser)) {
      return left(eitherDeletedUser.left);
    }

    return right(undefined);
  }
}

export const requestRepository = new RequestRepository({
  db: FirebaseDatabase,
  storage: FirebaseStorageServiceInstance,
});
