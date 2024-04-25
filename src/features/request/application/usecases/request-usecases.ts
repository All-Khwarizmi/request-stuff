import { FileSenderData } from "@/features/file/application/repositories/file-repository";
import { requestRepository } from "../../infra/request-repository-impl";
import RequestRepository, { Request } from "../repositories/request-repository";

export default class RequestUsecases {
  private requestRepository: RequestRepository;

  constructor({ requestRepository }: { requestRepository: RequestRepository }) {
    this.requestRepository = requestRepository;
  }

  async createRequest({
    props,
  }: {
    props: Request;
  }): Promise<string | undefined> {
    return await this.requestRepository.createRequest({ props });
  }

  async getRequest({ requestId }: { requestId: string }) {
    return this.requestRepository.getRequest({ requestId });
  }

  async getRequests({ userId }: { userId: string }) {
    return this.requestRepository.getRequests({ userId });
  }

  async uploadFileFromRequest({
    requestId,
    file,
    fileSenderData,
  }: {
    requestId: string;
    file: File;
    fileSenderData: FileSenderData;
  }) {
    const requestPayload = await this.requestRepository.getRequest({
      requestId,
    });
    if (!requestPayload) {
      throw new Error("Request not found");
    }
    
    await this.requestRepository.uploadFileFromRequest({
      requestData: requestPayload,
      file,
      fileSenderData,
    });
  }
}

export const requestUsecases = new RequestUsecases({
  requestRepository: requestRepository,
});

