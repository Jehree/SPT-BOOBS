"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mod = void 0;
const mod_helper_1 = require("./mod_helper");
const custom_item_service_1 = require("./custom_item_service");
const item_weight_service_1 = require("./item_weight_service");
const spawnpoint_processor_1 = require("./spawnpoint_processor");
const LogTextColor_1 = require("C:/snapshot/project/obj/models/spt/logging/LogTextColor");
class Mod {
    Helper = new mod_helper_1.ModHelper();
    MongoMapper;
    AmmoBoxDb;
    LooseItemDb;
    TiersDb;
    BoxBundleDb;
    Config;
    postDBLoad(container) {
        this.Helper.init(container, mod_helper_1.InitStage.ALL);
        this.MongoMapper = mod_helper_1.MongoMapperSingleton.getInstance(container);
        this.AmmoBoxDb = mod_helper_1.FileUtils.readJson("../db/ammo_boxes.json");
        this.LooseItemDb = mod_helper_1.FileUtils.readJson("../db/loose_items.json");
        this.TiersDb = mod_helper_1.FileUtils.readJson("../db/tiers.json");
        this.BoxBundleDb = mod_helper_1.FileUtils.readJson("../db/box_bundles.json");
        this.Config = mod_helper_1.FileUtils.readJson("../config.json");
        this.Helper.log("Loading...", LogTextColor_1.LogTextColor.MAGENTA);
        const validationSuccess = this.validate();
        if (!validationSuccess) {
            this.Helper.log("See errors above! BOOBS loading cancelled!", LogTextColor_1.LogTextColor.RED);
            return;
        }
        const customItemService = new custom_item_service_1.CustomItemService(this.Helper, this.MongoMapper, this.AmmoBoxDb, this.BoxBundleDb);
        customItemService.postDBLoad();
        const itemWeightService = new item_weight_service_1.ItemWeightService(this.TiersDb, this.Config);
        const itemWeights = itemWeightService.getItemWeights();
        const spawnpointProcessor = new spawnpoint_processor_1.SpawnpointProcessor(this.Helper, this.MongoMapper, this.Config, this.AmmoBoxDb, this.LooseItemDb);
        for (const mapKey in this.Helper.dbLocations) {
            const looseLootSpawnpoints = this.Helper.dbLocations[mapKey]?.looseLoot?.spawnpoints;
            if (looseLootSpawnpoints == undefined)
                continue;
            spawnpointProcessor.processMapSpawnpoints(looseLootSpawnpoints, itemWeights);
        }
        this.Helper.log("...Done!", LogTextColor_1.LogTextColor.MAGENTA);
    }
    validate() {
        let validationSuccess = true;
        for (const categoryName in this.TiersDb) {
            const tiers = this.TiersDb[categoryName];
            for (const tierName in tiers) {
                if (tierName === "type")
                    continue;
                const tier = tiers[tierName];
                for (const itemName of tier) {
                    if (!this.itemNameExists(itemName)) {
                        this.Helper.log(`ERROR: ITEM NAME TYPO IN TIERS DB: ${itemName}`, LogTextColor_1.LogTextColor.RED);
                        validationSuccess = false;
                    }
                }
            }
        }
        for (const categoryName in this.AmmoBoxDb) {
            const category = this.AmmoBoxDb[categoryName];
            for (const box of category) {
                if (!(box.bullet_id in this.Helper.dbItems)) {
                    this.Helper.log(`ERROR: BULLET ID ${box.bullet_id} IS NOT A VALID TEMPLATE ID`, LogTextColor_1.LogTextColor.RED);
                    validationSuccess = false;
                }
            }
        }
        return validationSuccess;
    }
    itemNameExists(name) {
        for (const categoryName in this.AmmoBoxDb) {
            const category = this.AmmoBoxDb[categoryName];
            for (const box of category) {
                if (box.box_id == name)
                    return true;
            }
        }
        for (const categoryName in this.LooseItemDb) {
            const category = this.LooseItemDb[categoryName];
            if (name in category)
                return true;
        }
        return false;
    }
}
exports.mod = new Mod();
//# sourceMappingURL=mod.js.map