export enum BoxType {
    DEFAULT = "DEFAULT",
    SMALL = "SMALL",
    MEDIUM = "MEDIUM",
    LARGE = "LARGE",
    SHELL = "SHELL",
    LAPUA = "LAPUA",
}

export enum TierType {
    DEFAULT = "DEFAULT",
    SHELL = "SHELL",
    LOOSE_ITEM = "LOOSE_ITEM",
}

export type BoxBundleDb = {
    [key: string]: {
        bundle_path: string;
        size_h: number;
        size_v: number;
    };
};

export type AmmoBox = {
    box_id: string;
    box_type: BoxType;
    bullet_id: string;
    bullet_count: number;
};

export type AmmoBoxDb = {
    [key: string]: AmmoBox[];
};

export type LooseItemDb = {
    [key: string]: Record<string, string>;
};

export type Tiers = {
    type: TierType;
    low?: string[];
    medium?: string[];
    high?: string[];
    crap?: string[];
    flesh_medium?: string[];
    flesh_high?: string[];
    pen_medium?: string[];
    pen_high?: string[];
    pen_veryhigh?: string[];
    util?: string[];
};

export type TiersDb = {
    GRENADES?: Tiers;
    UGL?: Tiers;
    FLARES?: Tiers;
} & { [key: string]: Tiers };

export type Config = {
    spawnpoint_item_blacklist: string[];
    weight_multipliers: WeightMultipliers;
    global_spawn_chance_multiplier: number;
};

export type WeightMultipliers = {
    LOOSE_ITEMS: Multipliers;
    SHELLS: Multipliers;
    DEFAULT: Multipliers;
    CATEGORIES: Multipliers;
};

export type Multipliers = {
    low?: number;
    medium?: number;
    high?: number;
    crap?: number;
    pen_medium?: number;
    flesh_medium?: number;
    flesh_high?: number;
    pen_high?: number;
    util?: number;
    pen_veryhigh?: number;
} & { [key: string]: number };
