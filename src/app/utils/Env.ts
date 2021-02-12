import { environment } from "../../environments/environment";

export class Env {
  static getApiEndpoint() {
    return environment.apiEndpoint
  }
}
