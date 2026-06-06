// Shared in-memory stores — module-level singletons persist across requests in the same process
export const memApplications = new Map<string, unknown[]>()
export const memProfiles = new Map<string, unknown>()
export const memScholarships = new Map<string, unknown>()
export const memSaved = new Map<string, Set<string>>()
