import Keycloak from "keycloak-js";

export const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? "http://localhost:8080",
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "paper-progress",
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "pp-frontend",
};

let instance: Keycloak | undefined;

/**
 * The shared Keycloak client. Created on first use rather than at import, so
 * modules that import this file can still be evaluated during server rendering.
 */
export function getKeycloak(): Keycloak {
  instance ??= new Keycloak(keycloakConfig);
  return instance;
}
