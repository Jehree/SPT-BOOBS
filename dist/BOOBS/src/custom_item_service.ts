import { ITemplateItem } from "@spt/models/eft/common/tables/ITemplateItem";
import { FileUtils, ModHelper, MongoMapperSingleton } from "./mod_helper";
import { AmmoBox, AmmoBoxDb, BoxBundleDb, LooseItemDb } from "./types";

export class CustomItemService {
    public Helper: ModHelper;
    public AmmoBoxDb: AmmoBoxDb;
    public BoxBundleDb: BoxBundleDb;
    public MongoMapper: MongoMapperSingleton;

    constructor(helper: ModHelper, mongoMapper: MongoMapperSingleton, ammoBoxDb: AmmoBoxDb, boxBundleDb: BoxBundleDb) {
        this.Helper = helper;
        this.AmmoBoxDb = ammoBoxDb;
        this.BoxBundleDb = boxBundleDb;
        this.MongoMapper = mongoMapper;
    }

    public postDBLoad() {
        this.pushAmmoBoxesToDB();
    }

    private pushAmmoBoxesToDB(): void {
        const locales = this.Helper.dbLocales.global;

        for (const categoryName in this.AmmoBoxDb) {
            const category = this.AmmoBoxDb[categoryName];

            for (const box of category) {
                const ammoBoxItem: ITemplateItem = this.createAmmoBox(box);
                this.Helper.dbItems[ammoBoxItem._id] = ammoBoxItem;

                this.Helper.dbHandbook.Items.push({
                    Id: ammoBoxItem._id,
                    ParentId: "5b47574386f77428ca22b33c",
                    Price: 0,
                });

                for (const langKey in locales) {
                    const locale = locales[langKey];
                    locale[`${ammoBoxItem._id} Name`] = `Carboard box holding ${locale[`${box.bullet_id} Name`]} rounds`;
                    locale[`${ammoBoxItem._id} ShortName`] = locale[`${box.bullet_id} ShortName`];

                    let description: string = `Carboard box holding ${locale[`${box.bullet_id} Name`]} rounds.`;
                    if (box.box_id === "disk") {
                        description += " The disk ammo box is incredibly rare! You should probably keep it as a collectors item...";
                    }

                    locale[`${ammoBoxItem._id} Description`] = description;
                }
            }
        }
    }

    private createAmmoBox(box: AmmoBox): ITemplateItem {
        const boxItem: ITemplateItem = FileUtils.jsonClone<ITemplateItem>(this.Helper.dbItems["5737330a2459776af32363a1"]);
        const mongoId = this.MongoMapper.getMongoId(box.box_id);
        const bundlePath = this.BoxBundleDb[box.box_type].bundle_path;

        boxItem._id = mongoId;
        boxItem._name = box.box_id;
        boxItem._props.Name = box.box_id;
        boxItem._props.ShortName = box.box_id;
        boxItem._props.Description = box.box_id;
        boxItem._props.Width = this.BoxBundleDb[box.box_type].size_h ?? 1;
        boxItem._props.Height = this.BoxBundleDb[box.box_type].size_v ?? 1;
        boxItem._props.StackSlots[0]._parent = mongoId;
        boxItem._props.StackSlots[0]._props.filters[0].Filter = [box.bullet_id];
        boxItem._props.StackSlots[0]._max_count = box.bullet_count;
        boxItem._props.Prefab.path = bundlePath;

        return boxItem;
    }
}
