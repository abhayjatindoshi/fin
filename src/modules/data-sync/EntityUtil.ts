import * as z from "zod";
import type { EntitySchema } from "./interfaces/Entity";
import type { SchemaMap } from "./interfaces/types";
import { MetadataSchema } from "./Metadata";

type BaseShape = typeof EntitySchema.shape;
type ExtendsBaseEntity<Shape extends z.ZodRawShape> = z.ZodObject<Shape & BaseShape>;

export class EntityUtil<S extends SchemaMap = Record<string, never>> {
    #schemas: S;

    constructor(schemas: S = {} as S) {
        this.#schemas = schemas;
    }

    register<Name extends string, Shape extends z.ZodRawShape>(
        name: Name,
        schema: ExtendsBaseEntity<Shape>
    ): EntityUtil<S & { [K in Name]: typeof schema }> {
        return new EntityUtil({ ...(this.#schemas as object), [name]: schema } as S & { [K in Name]: typeof schema });
    }

    getSchemas(): S {
        return this.#schemas;
    }

    entityNames(): { readonly [K in keyof S]: K } {
        const out: Partial<Record<keyof S, string>> = {};
        for (const k of Object.keys(this.#schemas) as (keyof S & string)[]) out[k] = k;
        return out as { readonly [K in keyof S]: K };
    }

    parse<N extends keyof S>(name: N, data: unknown): z.infer<S[N]> {
        return this.#schemas[name].parse(data);
    }
}

export const EU = new EntityUtil()
    .register("Metadata", MetadataSchema);
