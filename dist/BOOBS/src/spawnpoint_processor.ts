import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";
import { ModHelper, MongoMapperSingleton } from "./mod_helper";
import { AmmoBox, AmmoBoxDb, Config, LooseItemDb } from "./types";

export class SpawnpointProcessor {
    public Helper: ModHelper;
    public MongoMapper: MongoMapperSingleton;
    public Config: Config;
    public AmmoBoxDb: AmmoBoxDb;
    public LooseItemDb: LooseItemDb;

    constructor(helper: ModHelper, mongoMapper: MongoMapperSingleton, config: Config, ammoBoxDb: AmmoBoxDb, looseItemDb: LooseItemDb) {
        this.Helper = helper;
        this.MongoMapper = mongoMapper;
        this.Config = config;
        this.AmmoBoxDb = ammoBoxDb;
        this.LooseItemDb = looseItemDb;
    }

    processMapSpawnpoints(spawnpoints: any[], itemWeights: Record<string, number>): void {
        const x = [
            [
                {
                    _id: "6761e33c93b7b5599c00082b",
                    _tpl: "6761e1c8f9a4367b80000097",
                },
                {
                    _id: "6761e33c93b7b5599c00082c",
                    _tpl: "5d6e6a5fa4b93614ec501745",
                    parentId: "6761e33c93b7b5599c00082b",
                    slotId: "cartridges",
                    upd: {
                        StackObjectsCount: 30,
                    },
                },
            ],
            {
                composedKey: {
                    key: "6761e33c93b7b5599c00082b",
                },
            },
        ];

        for (const point of spawnpoints) {
            if (!this.spawnpointIsTarget(point)) continue;

            point.probability *= this.Config.global_spawn_chance_multiplier;
            point.template.Items = [];
            point.itemDistribution = [];

            for (const categoryName in this.AmmoBoxDb) {
                const category = this.AmmoBoxDb[categoryName];

                for (const box of category) {
                    const items = this.getAmmoBoxSpawnpointTemplateItems(box);
                    point.template.Items.push(...items);
                    const itemDistribution = this.getItemDistribution(items[0]._id, itemWeights[box.box_id]);
                    point.itemDistribution.push(itemDistribution);
                }
            }
            for (const categoryName in this.LooseItemDb) {
                const category: Record<string, string> = this.LooseItemDb[categoryName];

                for (const itemName in category) {
                    const itemId = category[itemName];

                    const items = this.getLooseItemSpawnpointTemplateItems(itemId);
                    point.template.Items.push(...items);
                    point.itemDistribution.push(this.getItemDistribution(items[0]._id, itemWeights[itemName]));
                }
            }
        }
    }

    getItemDistribution(spawnpointInstanceId: string, itemWeight: number): Record<string, any> {
        return {
            composedKey: {
                key: spawnpointInstanceId,
            },
            relativeProbability: itemWeight,
        };
    }

    getAmmoBoxSpawnpointTemplateItems(box: AmmoBox): Record<string, any>[] {
        const pointInstanceId: string = this.Helper.hashUtil.generate();
        const x = "5f0596629e22f464da6bbdd9";
        return [
            {
                _id: pointInstanceId,
                _tpl: this.MongoMapper.getMongoId(box.box_id),
            },
            {
                _id: this.Helper.hashUtil.generate(),
                _tpl: box.bullet_id,
                parentId: pointInstanceId,
                slotId: "cartridges",
                upd: { StackObjectsCount: box.bullet_count },
            },
        ];
    }

    getLooseItemSpawnpointTemplateItems(itemId: string): Record<string, any>[] {
        return [
            {
                _id: this.Helper.hashUtil.generate(),
                _tpl: itemId,
            },
        ];
    }

    spawnpointIsTarget(spawnpoint): boolean {
        const items = spawnpoint.template?.Items;
        let spawnsAmmo = false;

        for (const key in items) {
            const itemId: string = items[key]?._tpl;
            const parentId: string = this.Helper.dbItems[itemId]?._parent;
            if (this.Config.spawnpoint_item_blacklist.includes(parentId)) return false;
            if (this.Config.spawnpoint_item_blacklist.includes(itemId)) return false;
            if (parentId === "543be5cb4bdc2deb348b4568") {
                spawnsAmmo = true;
            }
        }

        return spawnsAmmo;
        // ALWAYS false if spawnpoint contains an item id or parent id that is on the blacklist
        // ALWAYS false if spawnpoint cannot spawn an ammo box
        // true in all other cases
    }
}
