import { FileSenderData } from "@/features/file/application/repositories/file-repository";
import { Request, RequestBase } from "../../domain/entities/request-types";
import { Either } from "fp-ts/lib/Either";

export default abstract class RequestRepository {
  abstract addRequestToPublic({
    props,
  }: {
    props: RequestBase;
  }): Promise<Either<Error, void>>;
  //! Remove infra return type
  abstract getRequest({
    requestId,
  }: {
    requestId: string;
  }): Promise<RequestBase | null>;

  abstract uploadFileFromRequest({
    requestData,
    file,
    fileSenderData,
  }: {
    requestData: RequestBase;
    file: File;
    fileSenderData?: FileSenderData;
  }): Promise<void>;

  abstract addRequestToUser({
    path,
    userId,
    request
  }: {
    path: string;
    userId: string;
    request: Request;
  }): Promise<Either<Error, void>>;

  abstract getRequests({ userId }: { userId: string }): Promise<RequestBase[]>;
  abstract updateRequest(): Promise<void>;
  abstract deleteRequest(): Promise<void>;
}
