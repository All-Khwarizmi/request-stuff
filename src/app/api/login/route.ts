import { customInitApp } from "@/common/data/firebase/admin-config";
import { auth } from "firebase-admin";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Init the Firebase SDK every time the server is called
customInitApp();

export async function POST(request: NextRequest, response: NextResponse) {
  try {
    const authorization = headers().get("Authorization");
    if (authorization?.startsWith("Bearer ")) {
      const idToken = authorization.split("Bearer ")[1];
      const decodedToken = await auth().verifyIdToken(idToken);

      if (decodedToken) {
        //Generate session cookie
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await auth().createSessionCookie(idToken, {
          expiresIn,
        });
        const options = {
          name: "session",
          value: sessionCookie,
          maxAge: expiresIn,
          httpOnly: true,
          secure: true,
        };

        //Add the cookie to the browser
        cookies().set(options);

        return NextResponse.json(
          { session: options, error: false },
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      {
        error: true,
        message: "Error creating session cookie",
      },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json({ error }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = cookies().get("session")?.value || "";
    //Validate if the cookie exist in the request
    if (!session) {
      return NextResponse.json({ isLogged: false }, { status: 401 });
    }

    //Use Firebase Admin to validate the session cookie
    let decodedClaims: DecodedIdToken;
    try {
      decodedClaims = await auth().verifySessionCookie(session, true);
    } catch (error) {
      return NextResponse.json({ isLogged: false }, { status: 401 });
    }

    // Get user id
    const userId = decodedClaims?.uid;

    if (!decodedClaims) {
      return NextResponse.json({ isLogged: false }, { status: 401 });
    }

    return NextResponse.json({ isLogged: true, userId }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ isLogged: false }, { status: 401 });
  }
}
