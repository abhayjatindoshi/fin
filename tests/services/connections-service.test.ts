import { describe, it, expect, afterEach, vi } from "vitest"
import type { FyreDb } from "@fyre-db/core"
import { createTestFyreDb } from "../helpers/test-fyredb"
import { ConnectionsService } from "@/services/connections-service"
import { connectionEntity } from "@/entities"
import type { Connection } from "@/entities"
import {
  emailImportSettingEntity,
} from "@/entities/email-import-setting"
import type { EmailImportSetting } from "@/entities/email-import-setting"
import { FEATURE_CREDS_KEY } from "@shared/providers"

// `ConnectionsService` imports `clientAuth` from the app bootstrap module; mock
// it so `connectGoogle` / `connectMicrosoft` route to spy `login`s without
// pulling in the real OAuth client (and its heavy plugin graph).
const { googleLogin, microsoftLogin } = vi.hoisted(() => ({
  googleLogin: vi.fn(),
  microsoftLogin: vi.fn(),
}))
vi.mock("@/providers/fyredb-config", () => ({
  clientAuth: {
    supportedAuths: () => [
      { name: "google", login: googleLogin },
      { name: "microsoft", login: microsoftLogin },
    ],
  },
}))

const EMAIL_ACCOUNT: Connection = {
  provider: "google",
  feature: "email",
  userId: "user-1",
  email: "jane@example.com",
  name: "Jane Doe",
  picture: "https://example.com/jane.png",
  refreshToken: "super-secret-token",
}

function setting(connectionId: string): EmailImportSetting {
  return {
    connectionId,
    paused: false,
    importState: { lastImportAt: 1700000000000 },
  }
}

/** The constructor consumes one-shot OAuth creds from sessionStorage; the
 *  web-storage setup file makes that read a harmless no-op in node. */

describe("ConnectionsService", () => {
  let fyredb: FyreDb
  let svc: ConnectionsService

  afterEach(async () => {
    svc.dispose()
    await fyredb.dispose().catch(() => {})
    sessionStorage.clear()
    googleLogin.mockClear()
    microsoftLogin.mockClear()
  })

  async function setup(): Promise<void> {
    fyredb = await createTestFyreDb()
    svc = new ConnectionsService(fyredb)
  }

  it("joins an email account with its import setting into a token-free view", async () => {
    await setup()
    const id = fyredb.repo(connectionEntity).save(EMAIL_ACCOUNT)
    fyredb.repo(emailImportSettingEntity).save(setting(id))

    // The global partitions project on a later tick; poll until they settle.
    await vi.waitFor(() => {
      expect(svc.connections$.value).toHaveLength(1)
    })
    const views = svc.connections$.value
    expect(views[0].email).toBe("jane@example.com")
    expect(views[0].provider).toBe("google")
    expect(views[0].lastSyncedAt).toBe(1700000000000)
    // The refresh token must never reach the UI view.
    expect(JSON.stringify(views[0])).not.toContain("super-secret-token")
  })

  it("excludes auth accounts whose feature is not email", async () => {
    await setup()
    fyredb.repo(connectionEntity).save({ ...EMAIL_ACCOUNT, feature: "drive" })

    await vi.waitFor(() => {
      expect(svc.connections$.value).toHaveLength(0)
    })
  })

  it("reveals the full row including the token via the on-demand reader", async () => {
    await setup()
    const id = fyredb.repo(connectionEntity).save(EMAIL_ACCOUNT)

    expect(svc.getConnection(id)?.refreshToken).toBe("super-secret-token")
  })

  it("deletes the auth account and its import setting on disconnect", async () => {
    await setup()
    const id = fyredb.repo(connectionEntity).save(EMAIL_ACCOUNT)
    const settingId = fyredb.repo(emailImportSettingEntity).save(setting(id))

    // Wait for the joined view to populate before disconnecting.
    await vi.waitFor(() => {
      expect(svc.connections$.value).toHaveLength(1)
    })
    svc.disconnect(id)

    expect(fyredb.repo(connectionEntity).get(id)).toBeUndefined()
    expect(fyredb.repo(emailImportSettingEntity).get(settingId)).toBeUndefined()
  })

  it("connectGoogle logs in via the google auth adapter", async () => {
    await setup()
    svc.connectGoogle()
    expect(googleLogin).toHaveBeenCalledExactlyOnceWith("email")
    expect(microsoftLogin).not.toHaveBeenCalled()
  })

  it("connectMicrosoft logs in via the microsoft auth adapter", async () => {
    await setup()
    svc.connectMicrosoft()
    expect(microsoftLogin).toHaveBeenCalledExactlyOnceWith("email")
    expect(googleLogin).not.toHaveBeenCalled()
  })

  /** Seed one-shot feature creds carrying the server-resolved profile. */
  function seedCreds(provider: string, profile?: Record<string, string>): void {
    sessionStorage.setItem(
      FEATURE_CREDS_KEY,
      JSON.stringify({ provider, feature: "email", accessToken: "at", refreshToken: "rt", profile }),
    )
  }

  it("materialises a saved Connection from the feature creds profile on construction", async () => {
    fyredb = await createTestFyreDb()
    seedCreds("google", { provider: "google", userId: "g-1", email: "g@example.com", name: "G User", picture: "p.png" })

    svc = new ConnectionsService(fyredb)
    // The projection to connections$ settles on a later tick; poll for the row.
    await vi.waitFor(() => {
      expect(svc.connections$.value).toHaveLength(1)
    })

    const rows = fyredb.repo(connectionEntity).query()
    expect(rows).toHaveLength(1)
    expect(rows[0].email).toBe("g@example.com")
    expect(rows[0].name).toBe("G User")
    expect(rows[0].picture).toBe("p.png")
    expect(rows[0].refreshToken).toBe("rt")
    expect(sessionStorage.getItem(FEATURE_CREDS_KEY)).toBeNull() // consumed
  })

  it("carries every profile field from the creds onto the saved row", async () => {
    fyredb = await createTestFyreDb()
    seedCreds("microsoft", { provider: "microsoft", userId: "m-1", email: "m@example.com", name: "M User", picture: "" })

    svc = new ConnectionsService(fyredb)
    await vi.waitFor(() => {
      expect(svc.connections$.value).toHaveLength(1)
    })

    const row = fyredb.repo(connectionEntity).query()[0]
    expect(row.provider).toBe("microsoft")
    expect(row.userId).toBe("m-1")
    expect(row.email).toBe("m@example.com")
    expect(row.name).toBe("M User")
  })

  it("disconnect removes the auth account even when no import setting exists", async () => {
    await setup()
    const id = fyredb.repo(connectionEntity).save(EMAIL_ACCOUNT)

    svc.disconnect(id) // no email-import-setting was ever saved for this account

    expect(fyredb.repo(connectionEntity).get(id)).toBeUndefined()
  })

  it("is a no-op when no feature creds are present", async () => {
    fyredb = await createTestFyreDb()
    svc = new ConnectionsService(fyredb)

    // No creds → the constructor returns synchronously without saving.
    expect(fyredb.repo(connectionEntity).query()).toHaveLength(0)
  })

  it("does not save when the creds carry no profile", async () => {
    fyredb = await createTestFyreDb()
    seedCreds("google") // no profile folded in by the server

    svc = new ConnectionsService(fyredb)

    // No profile → nothing is saved, but the creds are still consumed.
    expect(fyredb.repo(connectionEntity).query()).toHaveLength(0)
    expect(sessionStorage.getItem(FEATURE_CREDS_KEY)).toBeNull()
  })

  it("does not save when the profile lacks an identity (no userId)", async () => {
    fyredb = await createTestFyreDb()
    seedCreds("google", { provider: "google", userId: "", email: "no-id@example.com", name: "", picture: "" })

    svc = new ConnectionsService(fyredb)

    // Profile carries no stable id → nothing is saved.
    expect(fyredb.repo(connectionEntity).query()).toHaveLength(0)
  })

  it("is a no-op when the feature creds are not valid JSON", async () => {
    fyredb = await createTestFyreDb()
    sessionStorage.setItem(FEATURE_CREDS_KEY, "{not json")

    svc = new ConnectionsService(fyredb)

    // Invalid JSON is consumed and rejected synchronously, before any save.
    expect(fyredb.repo(connectionEntity).query()).toHaveLength(0)
    expect(sessionStorage.getItem(FEATURE_CREDS_KEY)).toBeNull() // still consumed
  })
})
