// export type Household = {
//     id: string;
//     name: string;
//     location: {
//         space: CloudSpace,
//         folder?: CloudFile,
//     }
// }

import type { Household } from "../../entities/Household";

export type Config = {
    households: Household[];
}

export type Space = {
    id: string;
    displayName: string;
}

export type Folder = {
    id: string;
    displayName: string;
}

export type DriveEntry = {
    id: string;
    displayName: string;
    isFolder: boolean;
    mimeType: string;
}

export type CloudFile = {
    id: string;
    name: string;
    type?: string;
    isFolder: boolean;
    modifiedTime?: Date;
}

export type CloudSpace = {
    id: string;
    displayName: string;
}