// Shared in-process SSE subscriber registry.
// Key format: "{tenantId}:{agentId}" -> send function
// For multi-instance production, replace with Redis pub/sub.
export const SSE_SUBSCRIBERS = new Map<string, (data: string) => void>();
