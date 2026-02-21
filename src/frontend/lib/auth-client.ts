import { createAuthClient } from "better-auth/client"
import { adminClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    plugins: [
        adminClient() as any
    ]
})

// Export types for convenience
export type AuthClient = typeof authClient
