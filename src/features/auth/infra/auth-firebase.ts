import {
  Auth,
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  getAuth,
  getIdToken,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import firebase_app from "@/common/data/firebase/config";
import { Failure } from "fp-ddd";
import { Either, left, right, tryCatch } from "fp-ts/lib/Either";
import { BASE_URL } from "@/common/constants";
import { IAuth } from "../application/repositories/types";
import { UserInfra } from "../domain/types/user";
import { FirebaseError } from "firebase/app";
export interface AuthUser {}
export interface AuthFirebaseOptions {
  authProvider: Auth;
}
class AuthFirebase extends IAuth {
  private readonly _authProvider: Auth;
  constructor(options: AuthFirebaseOptions) {
    super();

    this._authProvider = options.authProvider;
  }
  async createUserWithEmailAndPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<Either<Failure<string>, UserInfra>> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this._authProvider,
        email,
        password
      );
      const user: UserInfra = {
        displayName: userCredential.user.displayName,
        email: userCredential.user.email,
        id: userCredential.user.uid,
        phoneNumber: userCredential.user.phoneNumber,
        photoURL: userCredential.user.photoURL,
        providerId: userCredential.user.providerId,
        metadata: { ...userCredential.user.metadata },
      };
      return right(user);
    } catch (error) {
      return left(
        Failure.invalidValue({
          invalidValue: error,
          message: "Could not create user with email and password",
        })
      );
    }
  }

  async signIn({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<Either<Failure<string>, string>> {
    try {
      let result: UserCredential | null | FirebaseError = null, // Variable to store the sign-in result
        error = null; // Variable to store any error that occurs

      try {
        result = await signInWithEmailAndPassword(
          this._authProvider,
          email,
          password
        );
      } catch (error) {
        return left(
          Failure.invalidValue({
            invalidValue: result,
            message: "Could not log in the user",
          })
        );
      }

      if (!result) {
        // Display and log any sign-in errors
        result = error;
        console.log("No result returned from signIn");
        return left(
          Failure.invalidValue({
            invalidValue: result,
            message: "Could not log in the user",
          })
        );
      }
      const idToken = await result.user.getIdToken();
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        return left(
          Failure.invalidValue({
            invalidValue: await response.json(),
            message: "Could not set session cookie in backend",
          })
        );
      }

      return right(idToken);
    } catch (error) {
      console.log({ error });
      return left(
        Failure.invalidValue({
          invalidValue: error,
          message: "An unexpected error happened while sing in the user",
        })
      );
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this._authProvider);

      await fetch(`${BASE_URL}/api/logout`, {
        method: "POST",
      });
    } catch (error) {
      console.log("Could not sign out the user");
    }
  }

  async getAuthUserToken({
    user,
  }: {
    user: User;
  }): Promise<Either<Failure<string>, string>> {
    const idToken = await getIdToken(user);
    if (!idToken) {
      return left(
        Failure.invalidValue({
          invalidValue: idToken,
          message: "Could not retrieve the id token",
        })
      );
    }
    return right(idToken);
  }

  async getAuthUser(): Promise<Either<Failure<string>, User>> {
    const user = this._authProvider.currentUser;
    if (!user) {
      return left(
        Failure.invalidValue({
          invalidValue: user,
          message: "Could not retrieve the current user",
        })
      );
    }
    return right(user);
  }
}

export const authInstance = getAuth(firebase_app);
export const FirebaseAuth = new AuthFirebase({ authProvider: authInstance });
