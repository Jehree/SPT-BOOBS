import { DependencyContainer } from "tsyringe";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { FileUtils, InitStage, ModHelper, MongoMapperSingleton } from "./mod_helper";
import { AmmoBoxDb, BoxBundleDb, Config, LooseItemDb, TiersDb } from "./types";
import { CustomItemService } from "./custom_item_service";
import { ItemWeightService } from "./item_weight_service";
import { SpawnpointProcessor } from "./spawnpoint_processor";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";

class Mod implements IPostDBLoadMod {
    public Helper: ModHelper = new ModHelper();
    public MongoMapper: MongoMapperSingleton;
    public AmmoBoxDb: AmmoBoxDb;
    public LooseItemDb: LooseItemDb;
    public TiersDb: TiersDb;
    public BoxBundleDb: BoxBundleDb;
    public Config: Config;

    public postDBLoad(container: DependencyContainer): void {
        this.Helper.init(container, InitStage.ALL);
        this.MongoMapper = MongoMapperSingleton.getInstance(container);
        this.AmmoBoxDb = FileUtils.readJson<AmmoBoxDb>("../db/ammo_boxes.json");
        this.LooseItemDb = FileUtils.readJson<LooseItemDb>("../db/loose_items.json");
        this.TiersDb = FileUtils.readJson<TiersDb>("../db/tiers.json");
        this.BoxBundleDb = FileUtils.readJson<BoxBundleDb>("../db/box_bundles.json");
        this.Config = FileUtils.readJson<Config>("../config.json");

        this.Helper.log("Loading...", LogTextColor.MAGENTA);

        const validationSuccess = this.validate();
        if (!validationSuccess) {
            this.Helper.log("See errors above! BOOBS loading cancelled!", LogTextColor.RED);
            return;
        }

        const customItemService = new CustomItemService(this.Helper, this.MongoMapper, this.AmmoBoxDb, this.BoxBundleDb);
        customItemService.postDBLoad();

        const itemWeightService = new ItemWeightService(this.TiersDb, this.Config);
        const itemWeights: Record<string, number> = itemWeightService.getItemWeights();

        const spawnpointProcessor = new SpawnpointProcessor(this.Helper, this.MongoMapper, this.Config, this.AmmoBoxDb, this.LooseItemDb);

        for (const mapKey in this.Helper.dbLocations) {
            const looseLootSpawnpoints = this.Helper.dbLocations[mapKey]?.looseLoot?.spawnpoints;
            if (looseLootSpawnpoints == undefined) continue;

            spawnpointProcessor.processMapSpawnpoints(looseLootSpawnpoints, itemWeights);
        }
        this.Helper.log("...Done!", LogTextColor.MAGENTA);
    }

    public validate(): boolean {
        let validationSuccess: boolean = true;

        for (const categoryName in this.TiersDb) {
            const tiers = this.TiersDb[categoryName];

            for (const tierName in tiers) {
                if (tierName === "type") continue;
                const tier: string[] = tiers[tierName];

                for (const itemName of tier) {
                    if (!this.itemNameExists(itemName)) {
                        this.Helper.log(`ERROR: ITEM NAME TYPO IN TIERS DB: ${itemName}`, LogTextColor.RED);
                        validationSuccess = false;
                    }
                }
            }
        }

        for (const categoryName in this.AmmoBoxDb) {
            const category = this.AmmoBoxDb[categoryName];

            for (const box of category) {
                if (!(box.bullet_id in this.Helper.dbItems)) {
                    this.Helper.log(`ERROR: BULLET ID ${box.bullet_id} IS NOT A VALID TEMPLATE ID`, LogTextColor.RED);
                    validationSuccess = false;
                }
            }
        }

        return validationSuccess;
    }

    public itemNameExists(name: string) {
        for (const categoryName in this.AmmoBoxDb) {
            const category = this.AmmoBoxDb[categoryName];

            for (const box of category) {
                if (box.box_id == name) return true;
            }
        }
        for (const categoryName in this.LooseItemDb) {
            const category = this.LooseItemDb[categoryName];

            if (name in category) return true;
        }
        return false;
    }
}

export const mod = new Mod();
