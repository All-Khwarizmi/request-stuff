import { FileSenderData } from "@/features/file/application/repositories/file-repository";
import { DocumentData } from "firebase/firestore";
import { RequestBase } from "../../domain/entities/request-types";

export default abstract class RequestRepository {
  abstract createRequest({
    props,
  }: {
    props: RequestBase;
  }): Promise<string | undefined>;
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

  abstract getRequests({ userId }: { userId: string }): Promise<RequestBase[]>;
  abstract updateRequest(): Promise<void>;
  abstract deleteRequest(): Promise<void>;
}
