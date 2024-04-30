import {
  Auth,
  UserCredential,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import firebase_app from "@/lib/firebase/config";
import { Failure } from "fp-ddd";
import { Either, left, right } from "fp-ts/lib/Either";
import { BASE_URL } from "@/common/constants";
import { IAuth } from "../application/repositories/types";


const auth = getAuth(firebase_app);
class AuthFirebase extends IAuth {
  private readonly _authProvider: Auth;
  constructor(authProvider: Auth) {
    super();

    this._authProvider = authProvider;
  }
  async signIn({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<Either<Failure<string>, string>> {
    try {
      let result: UserCredential | null = null, // Variable to store the sign-in result
        error = null; // Variable to store any error that occurs

      result = await signInWithEmailAndPassword(
        this._authProvider,
        email,
        password
      );
      if (!result) {
        // Display and log any sign-in errors
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

      const response = await fetch(`${BASE_URL}/api/logout`, {
        method: "POST",
      });
    } catch (error) {
      console.log("Could not sign out the user");
    }
  }
}

export const authFirebase = new AuthFirebase(auth);
