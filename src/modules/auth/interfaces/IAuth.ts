import type { FunctionComponent, SVGProps } from "react";
import type { IAuthFeatureHandler } from "./features/IAuthFeatureHandler";
import type { LoginButtonProps } from "./LoginButtonProps";

export interface IAuth {
    id: string;
    display: IAuthDisplay;
    features: IAuthFeature[];
}

export interface IAuthFeature {
    id: string;
    display?: Partial<IAuthDisplay>;
    handler: IAuthFeatureHandler;
}

export interface IAuthDisplay {
    name: string;
    icon: FunctionComponent<SVGProps<SVGSVGElement>>;
    button: React.FC<LoginButtonProps>;
}