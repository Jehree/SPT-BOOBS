import { AmmoBox, AmmoBoxDb, LooseItemDb, Tiers, TiersDb, TierType } from "./types";
import OldBoxDb from "../db/old/old_boxes.json";
import OldTiersDb from "../db/old/old_tiers.json";
import { FileUtils, ModHelper } from "./mod_helper";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";

export class Debug {
    public static logBulletsNotPlacedInAnyTier(helper: ModHelper, boxDb: AmmoBoxDb, tiersDb: TiersDb) {
        for (const calKey in boxDb) {
            const cal = boxDb[calKey];

            for (const boxId in cal) {
                const box = cal[boxId];
                let nameFound = false;

                for (const tierCalKey in tiersDb) {
                    const tierCal = tiersDb[tierCalKey];

                    for (const k in tierCal) {
                        if (k === "type") continue;
                        if (tierCal[k].includes(box.box_id)) {
                            nameFound = true;
                        }
                    }
                }

                if (!nameFound) {
                    helper.log(box.box_id, LogTextColor.YELLOW, true);
                }
            }
        }

        /*
        [BOOBS]: 9x21_7N42
        [BOOBS]: 9x21_7U4
        [BOOBS]: 9x39_FMJ
        [BOOBS]: 6_8x51_HYBRID
        [BOOBS]: 6_8x51_FMJ
        [BOOBS]: 50ae_FMJ
        [BOOBS]: 50ae_JHP
        [BOOBS]: 50ae_COPPERSOLID
        [BOOBS]: 50ae_HAWK
        [BOOBS]: disk
        */
    }

    public static generateNewAmmoTiersJson(): void {
        let newTiersDb: TiersDb = {};
        for (const calKey in OldTiersDb) {
            const oldTiers = OldTiersDb[calKey];

            if (calKey === "GRENADES" || calKey == "UGL" || calKey == "FLARES") {
                const looseItemTiers: Tiers = {
                    type: TierType.LOOSE_ITEM,
                    low: [...oldTiers.low.map(this.processString)],
                    medium: [...oldTiers.medium.map(this.processString)],
                    high: [...oldTiers.high.map(this.processString)],
                };
                newTiersDb[calKey] = looseItemTiers;
                continue;
            }

            let type = TierType.DEFAULT;
            if (oldTiers?.type === "SHOTGUNS") type = TierType.SHELL;

            const ammoTiers: Tiers = {
                type: type,
                crap: [...oldTiers.crap.map(this.processString)],
                flesh_medium: [...oldTiers.flesh_medium.map(this.processString)],
                flesh_high: [...oldTiers.flesh_high.map(this.processString)],
                pen_medium: [...oldTiers.pen_medium.map(this.processString)],
                pen_high: [...oldTiers.pen_high.map(this.processString)],
                pen_veryhigh: [...oldTiers.pen_veryhigh.map(this.processString)],
            };

            if (oldTiers.util) ammoTiers["util"] = [...oldTiers.util.map(this.processString)];

            newTiersDb[this.processString(calKey)] = ammoTiers;
        }
        FileUtils.writeJson(newTiersDb, "../db/ammo_tiers.json");
    }

    public static logMissingAmmoIds(helper: ModHelper, boxDb: AmmoBoxDb, looseItemDb: LooseItemDb): void {
        for (const itemId in helper.dbItems) {
            const item = helper.dbItems[itemId];
            if (item._parent != "5485a8684bdc2da71d8b4567") continue;
            if (this.ammoIsMissing(item._id, boxDb, looseItemDb)) {
                helper.log(`"` + item._id + `"` + ",", LogTextColor.YELLOW, true);
            }
        }

        /*
        const missingAmmoIds: string[] = [
            "6529243824cbe3c74a05e5c1", // NEW 6_8x51 Hybrind
            "6529302b8c26af6326029fb7", // NEW 6_8x51 FMJ
            "6576f4708ca9c4381d16cd9d", // NEW 9x21 7N42
            "6576f93989f0062e741ba952", // NEW 9x21 7U4
            "6576f96220d53a5b8f3e395e", // NEW 9x39 FMJ
            "6601546f86889319850bd566", // disk
            "668fe62ac62660a5d8071446", // NEW 50 ae fmj
            "66a0d1c87d0d369e270bb9de", // NEW 50 ae jhp
            "66a0d1e0ed648d72fe064d06", // NEW 50 ae copper solid
            "66a0d1f88486c69fce00fdf6", // NEW 50 ae hawk jsp
            "66d97834d2985e11480d5c1e", // NEW signal flare blue
            "66d9f3047b82b9a9aa055d81", // NEW signal flare special yellow
        ];
        */
    }

    public static ammoIsMissing(ammoId: string, boxDb: AmmoBoxDb, looseItemDb: LooseItemDb) {
        for (const calKey in boxDb) {
            const cal = boxDb[calKey];

            for (const boxKey in cal) {
                const box = cal[boxKey];
                if (box.bullet_id === ammoId) return false;
            }
        }
        for (const loosItemCategoryName in looseItemDb) {
            const category = looseItemDb[loosItemCategoryName];
            for (const looseItemName in category) {
                const looseItemId = category[looseItemName];

                if (looseItemId === ammoId) return false;
            }
        }
        return true;
    }

    public static processString(text: string): string {
        let newString = text.replace(".", "_");
        if (newString[0] === "_") {
            newString = newString.slice(1);
        }
        return newString;
    }

    public static printCalKeys(): void {
        const calKeys: string[] = Object.keys(OldBoxDb["BOXES"]);
        for (const key of calKeys) {
            console.log(`"${this.processString(key)}": Record<string, AmmoBox>`);
        }
    }
}
