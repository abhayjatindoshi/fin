import { z } from "zod";
import type { EntityTypeOf } from "./framework";
import { BaseEntity, createGetEntity, entityUtil, ref } from "./framework";

// Define schemas (compile-time extension requirement enforced)
const UserSchema = BaseEntity.extend({
    username: z.string().min(3),
})

const AccountSchema = BaseEntity.extend({
    balance: z.number().nonnegative(),
    userId: ref("User"),
})

// Build typed registry
const util = entityUtil
    .register("User", UserSchema)
    .register("Account", AccountSchema);

const entityNames = util.entityNames();

// Derive types from final util
type User = z.infer<typeof UserSchema>;
// type User = EntityTypeOf<typeof util, "User">;
type Account = EntityTypeOf<typeof util, "Account">;

// Get strongly-typed entity fetcher
const getEntity = createGetEntity(util);

// Usage examples
const user: User = getEntity(entityNames.User, { username: "alice" });
const account: Account = getEntity("Account", { balance: 100 });

// Demonstrate entityNames helper (keeps literal keys)
const names = util.entityNames();
const anotherUser = getEntity(names.User, { username: "bob" });

// Example log (will be tree-shaken in production if unused)
console.log(user, account, anotherUser);