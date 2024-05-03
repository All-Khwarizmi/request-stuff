import RequestRepository, {
  requestRepository,
} from "../repositories/request-repository-impl";
import { RequestBase } from "../../domain/entities/request-types";
import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { FileSenderData } from "@/common/interfaces/istorage";
import AuthUsecases, {
  authUsecases,
} from "@/features/auth/application/usecases/auth-usecases";
import { Failure } from "fp-ddd";
import { convertKbToMb } from "@/common/utils/from-kb-to-mb";

export interface RequestUsecasesOptions {
  requestRepository: RequestRepository;
  auth: AuthUsecases;
}
export default class RequestUsecases {
  private _requestRepository: RequestUsecasesOptions["requestRepository"];
  private _auth: RequestUsecasesOptions["auth"];

  constructor(options: RequestUsecasesOptions) {
    this._requestRepository = options.requestRepository;
    this._auth = options.auth;
  }

  async createRequest({
    props,
  }: {
    props: RequestBase;
  }): Promise<Either<Error, void>> {
    const pathForUserCollection = `users/${props.userId}/requests`;
    const batch = await Promise.allSettled([
      this._requestRepository.addRequestToPublic({ props }),
      this._requestRepository.addRequestToUser({
        path: pathForUserCollection,
        userId: props.userId,
        request: { ...props, numberOfUploads: 0, uploads: [] },
      }),
    ]);

    //! This is not handling the case of a request being added to the public collection but not to the user collection or viceversa.
    const isAnyError = batch.some((asyncResult) => {
      if (asyncResult.status === "rejected") {
        return true;
      }
      return isLeft(asyncResult.value);
    });
    if (isAnyError) {
      return left(new Error("Error while batching request creations promises"));
    }
    return right(undefined);
  }

  async getRequest({ requestId }: { requestId: string }) {
    return this._requestRepository.getRequest({ requestId });
  }

  async getPublicRequests({ userId }: { userId: string }) {
    return this._requestRepository.getPublicRequests({ userId });
  }
  async getRequestsByUser({ userId }: { userId: string }) {
    return this._requestRepository.getRequestsByUser({ userId });
  }

  async uploadFileFromRequest({
    requestId,
    file,
    fileSenderData,
  }: {
    requestId: string;
    file: File;
    fileSenderData: FileSenderData;
  }): Promise<Either<Failure<string>, string>> {
    try {
      const requestPayload = await this._requestRepository.getRequest({
        requestId,
      });
      if (!requestPayload) {
        return left(
          Failure.invalidValue({
            invalidValue: requestPayload,
            message: "Could not get request",
          })
        );
      }

      //! Check if  request date limit is later than runtime and file size is less than request max file size
      const fileSizeInMb = file.size / 1024 ** 2;
      if (fileSizeInMb > requestPayload?.maxFileSize!) {
        return left(
          Failure.invalidValue({
            invalidValue: requestPayload,
            message: `File is too large. It should be less than ${requestPayload.maxFileSize}`,
          })
        );
      }
      const dateLimitFormatted = new Date(requestPayload?.dateLimit!).getTime();
      if (Date.now() > dateLimitFormatted) {
        return left(
          Failure.invalidValue({
            invalidValue: requestPayload.dateLimit,
            message: `Request date limit exceeded. ${new Date(
              requestPayload.dateLimit!
            ).toLocaleDateString()}`,
          })
        );
      }

      //* Once we have data of the request, we need to find out if the user has enough ressources (subscription plan, storage available)
      const eitherUser = await this._auth.getUser({
        userId: requestPayload.userId,
      });

      if (isLeft(eitherUser)) {
        return left(
          Failure.invalidValue({
            invalidValue: eitherUser,
            message: "Could not add file to request beacuse could not get user",
          })
        );
      }

      const user = eitherUser.right.getOrCrash();
      const userSpaceAvailable = user.maxStorage - user.currentStorage;
      if (fileSizeInMb > userSpaceAvailable) {
        return left(
          Failure.invalidValue({
            invalidValue: userSpaceAvailable,
            message: `Space available insuficient ${userSpaceAvailable}`,
          })
        );
      }
      const fileUrl = await this._requestRepository.uploadFileFromRequest({
        requestData: requestPayload,
        file,
        fileSenderData,
      });

      //! Update user after uploading file

      return right(fileUrl);
    } catch (error) {
      return left(
        Failure.invalidValue({
          invalidValue: error,
          message: "An unknown error happend",
        })
      );
    }
  }
}

export const requestUsecases = new RequestUsecases({
  requestRepository: requestRepository,
  auth: authUsecases,
});
