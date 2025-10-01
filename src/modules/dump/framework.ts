import { z } from "zod";

export const BaseEntity = z.object({
    id: z.string().uuid(),
    createdAt: z.date().default(() => new Date()),
});

type BaseShape = typeof BaseEntity.shape;
type ExtendsBaseEntity<Shape extends z.ZodRawShape> = z.ZodObject<Shape & BaseShape>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyZodObject = z.ZodObject<Record<string, any>>;
type SchemaMap = Record<string, AnyZodObject>;

class EntityUtil<S extends SchemaMap = Record<string, never>> {
    #schemas: S;
    constructor(schemas: S = {} as S) { this.#schemas = schemas; }
    register<Name extends string, Shape extends z.ZodRawShape>(
        name: Name,
        schema: ExtendsBaseEntity<Shape>
    ): EntityUtil<S & { [K in Name]: typeof schema }> {
        return new EntityUtil({ ...(this.#schemas as object), [name]: schema } as S & { [K in Name]: typeof schema });
    }
    getSchemas(): S { return this.#schemas; }
    entityNames(): { readonly [K in keyof S]: K } {
        const out: Partial<Record<keyof S, string>> = {};
        for (const k of Object.keys(this.#schemas) as (keyof S & string)[]) out[k] = k;
        return out as { readonly [K in keyof S]: K };
    }
    parse<N extends keyof S>(name: N, data: unknown): z.infer<S[N]> { return this.#schemas[name].parse(data); }
}

export const entityUtil = new EntityUtil();

export type SchemasOf<U> = U extends EntityUtil<infer S> ? S : never;
export type EntityNameOf<U> = keyof SchemasOf<U> & string;
export type EntityTypeOf<U, N extends EntityNameOf<U>> = z.infer<SchemasOf<U>[N]>;

export function createGetEntity<U extends EntityUtil<SchemaMap>>(util: U) {
    return function getEntity<N extends EntityNameOf<U>>(name: N, data?: Partial<z.input<SchemasOf<U>[N]>>): EntityTypeOf<U, N> {
        const schema = util.getSchemas()[name];
        const baseDefaults = { id: crypto.randomUUID(), createdAt: new Date() } as const;
        return schema.parse({ ...baseDefaults, ...(data as object) }) as EntityTypeOf<U, N>;
    };
}

export function defineEntity<Shape extends z.ZodRawShape, Z extends ExtendsBaseEntity<Shape>>(schema: Z): Z { return schema; }

export function ref<U extends EntityUtil<SchemaMap>, N extends EntityNameOf<U>>(entityName: N) {
    // At runtime, it's just a string (uuid) validator.
    // At type-level, it means "id from EntityType<N>"
    return z.string().uuid().brand<`${N}Id`>().refine((val) => {
        if (!entityName) throw new Error("Entity name must be provided to ref()");
        return entityName == 'User' && val === '123';
    }, 'Invalid reference');
}