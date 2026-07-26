/**
 * Product-facing assistant metadata (UI stubs until platform exposes these fields).
 * Never surface provider/slot internals here.
 */
export type AssistantProfile = {
  characterPreset: string;
  activeSkills: number;
  knowledgeSources: number;
  brainLabel: string;
};

const DEFAULT_PROFILE: AssistantProfile = {
  characterPreset: 'Enterprise Closer',
  activeSkills: 6,
  knowledgeSources: 1,
  brainLabel: 'Ready',
};

const BY_ID: Record<string, Partial<AssistantProfile>> = {
  // Kaira Maria (DEFAULT_EMPLOYEE_ID)
  'a8a5fb9e-4c84-489f-9097-8245349b4348': {
    characterPreset: 'Enterprise Closer',
    brainLabel: 'Ready',
  },
};

export function getAssistantProfile(employeeId: string): AssistantProfile {
  return { ...DEFAULT_PROFILE, ...BY_ID[employeeId] };
}
