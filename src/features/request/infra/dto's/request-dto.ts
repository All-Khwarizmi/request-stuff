import { DocumentData } from "firebase/firestore";
import {
  CreateRequest,
  RequestData,
} from "../../application/repositories/request-repository";

export default class RequestDto implements DTO<CreateRequest, DocumentData> {
  fromDomain({ data }: { data: RequestData }): void {
    throw new Error("Method not implemented.");
  }
  toDomain({ data }: { data: DocumentData }): CreateRequest {
    return {
      userId: data.userId,
      maxFileSize: data.maxFileSize,
      dateLimit: data.dateLimit,
      name: data.name,
      description: data.description,
      maxFiles: data.maxFiles,
      path: data.path,
    };
  }
}

export abstract class DTO<T, I = void, O = void> {
  abstract fromDomain({ data }: { data: T }): O;
  abstract toDomain({ data }: { data: I }): T;
}
