import { FileUtils } from "./mod_helper";
import { Tiers, Multipliers, TiersDb, Config } from "./types";

export class ItemWeightService {
    public TiersDb: TiersDb;
    public Config: Config;

    constructor(tiersDb: TiersDb, config: Config) {
        this.TiersDb = tiersDb;
        this.Config = config;
    }

    getItemWeights(): Record<string, number> {
        const itemWeights: Record<string, number> = {};

        for (const tierCategory in this.TiersDb) {
            const tiers = this.TiersDb[tierCategory];
            const multipliers = this.getWeightMultipliers(tiers);
            const multipiersSum = this.getSumOfMultipliers(multipliers);
            const categoryWeightTotal = this.Config.weight_multipliers.CATEGORIES[tierCategory] * 10000;

            for (const tierKey in tiers) {
                if (tierKey === "type") continue;
                const tier: string[] = tiers[tierKey];
                if (tier.length == 0) continue;

                const tierMultiplier: number = multipliers[tierKey];
                const tierWeight: number = (tierMultiplier / multipiersSum) * categoryWeightTotal;
                const itemWeight: number = tierWeight / tier.length;

                for (const itemName of tier) {
                    itemWeights[itemName] = itemWeight;
                }
            }
        }

        return itemWeights;
    }

    getWeightMultipliers(tiers: Tiers): Multipliers {
        const multipliers = FileUtils.jsonClone<Multipliers>(this.Config.weight_multipliers[tiers.type]);

        for (const tierKey in tiers) {
            if (tierKey === "type") continue;
            const tier: string[] = tiers[tierKey];

            if (tier.length === 0) {
                multipliers[tierKey] = 0;
            }
        }

        return multipliers;
    }

    getSumOfMultipliers(multipiers: Multipliers): number {
        const multiplierNumbers: number[] = Object.values(multipiers);
        let sum: number = 0;
        for (const num of multiplierNumbers) {
            sum += num;
        }
        return +sum.toFixed(4);
    }
}
