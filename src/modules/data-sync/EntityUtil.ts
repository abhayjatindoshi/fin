import * as z from "zod";
import { MetadataSchema } from "./entities/Metadata";
import { TenantSchema } from "./entities/Tenant";
import type { ExtendsEntity, SchemaMap } from "./interfaces/types";

export class EntityUtil<S extends SchemaMap = Record<string, never>> {
    #schemas: S;

    constructor(schemas: S = {} as S) {
        this.#schemas = schemas;
    }

    register<Name extends string>(
        name: Name, schema: ExtendsEntity
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
    .register("Metadata", MetadataSchema)
    .register("Tenant", TenantSchema)
