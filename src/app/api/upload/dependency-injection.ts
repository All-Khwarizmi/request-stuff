import { FirebaseAdminDatabase } from "@/common/data/firebase/admin-database";
import ServerAdapter from "@/features/server/application/adapters/server-adapter";
import ServerUsecases from "@/features/server/application/usecases/server-usecases";
import ServerRepository from "@/features/server/application/repositories/server-repository";
import { container } from "tsyringe";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";

const options = {
  storage: getStorage(),
  firestore: getFirestore(),
};
// Register the database options and other dependecy for injection
container.register("firebaseDatabaseAdminOptions", { useValue: options });
export const serverDatabase = container.resolve(FirebaseAdminDatabase);
container.register("serverRepository", { useClass: ServerRepository });
container.register("serverRepositoryOptions", {
  useValue: { database: serverDatabase },
});
container.register("serverUsecases", { useClass: ServerUsecases });
export const serverAdapter = container.resolve(ServerAdapter);
