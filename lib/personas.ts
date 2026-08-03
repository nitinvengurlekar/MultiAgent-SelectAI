import type { Persona, PersonaId } from "@/lib/types";

export const personas: Record<PersonaId, Persona> = {
  nisha: {
    id: "nisha",
    displayName: "Nisha",
    role: "Manager - Highly Privileged User",
    description: "Broader complaint visibility for leadership review.",
    envUserKey: "ORACLE_USER_NISHA",
    envPasswordKey: "ORACLE_PASSWORD_NISHA"
  },
  naveen: {
    id: "naveen",
    displayName: "Naveen",
    role: "Caseworker",
    description: "Limited complaint visibility based on assigned access.",
    envUserKey: "ORACLE_USER_NAVEEN",
    envPasswordKey: "ORACLE_PASSWORD_NAVEEN"
  }
};

export function getPersona(id: string | null | undefined): Persona | null {
  if (id === "nisha" || id === "naveen") {
    return personas[id];
  }
  return null;
}
