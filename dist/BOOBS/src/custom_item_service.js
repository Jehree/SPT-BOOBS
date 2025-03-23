"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomItemService = void 0;
const mod_helper_1 = require("./mod_helper");
class CustomItemService {
    Helper;
    AmmoBoxDb;
    BoxBundleDb;
    MongoMapper;
    constructor(helper, mongoMapper, ammoBoxDb, boxBundleDb) {
        this.Helper = helper;
        this.AmmoBoxDb = ammoBoxDb;
        this.BoxBundleDb = boxBundleDb;
        this.MongoMapper = mongoMapper;
    }
    postDBLoad() {
        this.pushAmmoBoxesToDB();
    }
    pushAmmoBoxesToDB() {
        const locales = this.Helper.dbLocales.global;
        for (const categoryName in this.AmmoBoxDb) {
            const category = this.AmmoBoxDb[categoryName];
            for (const box of category) {
                const ammoBoxItem = this.createAmmoBox(box);
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
                    let description = `Carboard box holding ${locale[`${box.bullet_id} Name`]} rounds.`;
                    if (box.box_id === "disk") {
                        description += " The disk ammo box is incredibly rare! You should probably keep it as a collectors item...";
                    }
                    locale[`${ammoBoxItem._id} Description`] = description;
                }
            }
        }
    }
    createAmmoBox(box) {
        const boxItem = mod_helper_1.FileUtils.jsonClone(this.Helper.dbItems["5737330a2459776af32363a1"]);
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
exports.CustomItemService = CustomItemService;
//# sourceMappingURL=custom_item_service.js.map