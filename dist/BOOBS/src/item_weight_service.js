"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemWeightService = void 0;
const mod_helper_1 = require("./mod_helper");
class ItemWeightService {
    TiersDb;
    Config;
    constructor(tiersDb, config) {
        this.TiersDb = tiersDb;
        this.Config = config;
    }
    getItemWeights() {
        const itemWeights = {};
        for (const tierCategory in this.TiersDb) {
            const tiers = this.TiersDb[tierCategory];
            const multipliers = this.getWeightMultipliers(tiers);
            const multipiersSum = this.getSumOfMultipliers(multipliers);
            const categoryWeightTotal = this.Config.weight_multipliers.CATEGORIES[tierCategory] * 10000;
            for (const tierKey in tiers) {
                if (tierKey === "type")
                    continue;
                const tier = tiers[tierKey];
                if (tier.length == 0)
                    continue;
                const tierMultiplier = multipliers[tierKey];
                const tierWeight = (tierMultiplier / multipiersSum) * categoryWeightTotal;
                const itemWeight = tierWeight / tier.length;
                for (const itemName of tier) {
                    itemWeights[itemName] = itemWeight;
                }
            }
        }
        return itemWeights;
    }
    getWeightMultipliers(tiers) {
        const multipliers = mod_helper_1.FileUtils.jsonClone(this.Config.weight_multipliers[tiers.type]);
        for (const tierKey in tiers) {
            if (tierKey === "type")
                continue;
            const tier = tiers[tierKey];
            if (tier.length === 0) {
                multipliers[tierKey] = 0;
            }
        }
        return multipliers;
    }
    getSumOfMultipliers(multipiers) {
        const multiplierNumbers = Object.values(multipiers);
        let sum = 0;
        for (const num of multiplierNumbers) {
            sum += num;
        }
        return +sum.toFixed(4);
    }
}
exports.ItemWeightService = ItemWeightService;
//# sourceMappingURL=item_weight_service.js.map