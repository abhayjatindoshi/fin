import { z } from "zod";

// Generic reference creator
const reference = (entityName: string) =>
    z.string().brand<`${typeof entityName}Id`>();

const makeReference = <T extends z.ZodTypeAny>(
    entityName: string,
    idSchema: T,
    existsFn: (id: z.infer<T>) => boolean
) => idSchema.refine(
    (id) => existsFn(id),
    { message: `${entityName} with given id does not exist` }
);

const PostSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    authorId: reference("User"),
    userId: makeReference(
        "User",
        z.string().uuid(),
        (id) => id === "123e4567-e89b-12d3-a456-426614174000" // Example existence check
    ),
});

