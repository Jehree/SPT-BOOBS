using BOOBS.Models;
using BOOBS.Services;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Utils;
using SPTarkov.Server.Core.Services;
using System.Reflection;
using Path = System.IO.Path;

namespace BOOBS.Core;

[Injectable(TypePriority = OnLoadOrder.PostDBModLoader + 1)]
public class Mod(
    ISptLogger<Mod> logger,
    ModHelper modHelper,
    DatabaseService databaseService,
    AmmoBoxGenerator ammoBoxGenerator,
    ItemWeightService itemWeightService,
    LooseLootPointProcessor looseLootPointProcessor)
    : IOnLoad
{
    public required ConfigContainer ConfigContainer { get; set; }

    public Task OnLoad()
    {
        string pathToMod = modHelper.GetAbsolutePathToModFolder(Assembly.GetExecutingAssembly());

        ConfigContainer = new(
            modHelper.GetJsonDataFromFile<ModConfig>(pathToMod, "config.json"),
            modHelper.GetJsonDataFromFile<Dictionary<string, List<AmmoBox>>>(pathToMod, Path.Combine("db", "ammo_boxes.json")),
            modHelper.GetJsonDataFromFile<TiersDb>(pathToMod, Path.Combine("db", "tiers_ammo_boxes.json")),
            modHelper.GetJsonDataFromFile<Dictionary<string, Dictionary<string, string>>>(pathToMod, Path.Combine("db", "loose_items.json")),
            modHelper.GetJsonDataFromFile<TiersDb>(pathToMod, Path.Combine("db", "tiers_loose_items.json")),
            modHelper.GetJsonDataFromFile<BoxTypeInfoDb>(pathToMod, Path.Combine("db", "box_type_info.json")),
            modHelper.GetJsonDataFromFile<Dictionary<string, string>>(pathToMod, Path.Combine("db", "mongo_mappings.json")));

        if (!SuccessfulDbValidation())
        {
            logger.Error("See errors above! BOOBS loading cancelled!");
            return Task.CompletedTask;
        }

        ammoBoxGenerator.InitConfigs(ConfigContainer);
        ammoBoxGenerator.PushAmmoBoxesToDb();

        itemWeightService.InitConfigs(ConfigContainer);
        Dictionary<string, double> itemWeights = itemWeightService.GetItemWeights();

        looseLootPointProcessor.InitConfigs(ConfigContainer);
        looseLootPointProcessor.ProcessSpawnpoints(itemWeights);

#if DEBUG
        PrintMissingAmmos();
#endif

        return Task.CompletedTask;
    }

    public bool SuccessfulDbValidation()
    {
        bool success = true;
        List<TierCategory> allTierCategories = [.. ConfigContainer.TiersDbAmmoBoxes.Categories, .. ConfigContainer.TiersDbLooseItems.Categories];

        foreach (TierCategory cat in allTierCategories)
        {
            foreach (List<string> tier in cat.Tiers.Values)
            {
                foreach (string itemName in tier)
                {
                    if (ItemNameExists(itemName)) continue;

                    logger.Error($"ERROR: ITEM NAME TYPO IN TIERS DB: ${itemName}");
                    success = false;
                }
            }
        }

        foreach (var boxList in ConfigContainer.AmmoBoxDb)
        {
            foreach (AmmoBox box in boxList.Value)
            {
                if (databaseService.GetItems().Any(item => item.Value.Id == box.BulletId)) continue;

                logger.Error($"ERROR: BULLET ID ${box.BulletId} IS NOT A VALID ITEM ID");
                success = false;
            }
        }

        return success;
    }

    public bool ItemNameExists(string name)
    {
        foreach (List<AmmoBox> category in ConfigContainer.AmmoBoxDb.Values)
        {
            foreach (AmmoBox box in category)
            {
                if (box.BoxId == name) return true;
            }
        }

        foreach (Dictionary<string, string> category in ConfigContainer.LooseItemDb.Values)
        {
            foreach (string looseItem in category.Keys)
            {
                if (looseItem == name) return true;
            }
        }

        return false;
    }

    public void PrintMissingAmmos()
    {
        logger.Warning("Missing ammo:");
        foreach (var (_, item) in databaseService.GetItems().Where(i => i.Value.Parent == BaseClasses.AMMO))
        {
            bool itemPresentInDb = false;

            foreach (List<AmmoBox> category in ConfigContainer.AmmoBoxDb.Values)
            {
                foreach (AmmoBox box in category)
                {
                    if (item.Id == box.BulletId)
                    {
                        itemPresentInDb = true;
                    }
                }
            }

            foreach (Dictionary<string, string> category in ConfigContainer.LooseItemDb.Values)
            {
                foreach (string itemId in category.Values)
                {
                    if (item.Id ==  itemId)
                    {
                        itemPresentInDb = true;
                    }
                }
            }

            if (!itemPresentInDb)
            {
                logger.Warning(item.Name!);
                logger.Warning(item.Id);
            }
        }
    }
}

/*
Missing ammo per 4.0 update:
patron_20x70_slug_ap
660137d8481cc6907a0c5cda   20x70_TSSSLUG
patron_20x70_slug_dg
660137ef76c1b56143052be8   20x70_DANGEROUSGAMESLUG
patron_20x70_flechette
6601380580e77cfd080e3418   20x70_FLECHETTE

patron_762x51_m80a1
6768c25aa7b238f14a08d3f6   7_62x51_M80A1

patron_127x99_hp
67d41936f378a36c4706eeb9   50bmg_HP
patron_127x99_m21
67dc212493ce32834b0fa446   50bmg_M21
patron_127x99_m33
67dc255ee3028a8b120efc48   50bmg_M33
patron_127x99_m903
67dc2648ba5b79876906a166   50bmg_M903

flares:
patron_rsp_newyear
675ea4891b2579e8fe0250aa   RSP-30_FIREWORK


STUFF WE ARE OMITTING:

shrapnel
5943d9c186f7745a13413ac9
shrapnel_RGD5
5996f6cb86f774678763a6ca
shrapnel_F1
5996f6d686f77467977ba6cc
shrapnel_m67
5996f6fc86f7745e585b4de3
shrapnel_F1_new
63b35f281745dd52341e5da7
shrapnel_mine_om_82
66ec2aa6daf127599c0c31f1
shrapnel_v40
67654a6759116d347b0bfb86
shrapnel_vog30
67ade494d748873e5f0161df

not real:
patron_6mm_airsoft
6241c316234b593b5676b637
patron_23x75_wave_r
5f647fd3f6e4ab66c82faed6
patron_23x75_cheremukha_7m
5e85aac65505fa48730d8af2
patron_40x46_m716
5ede47641cf3836a88318df1

unused flares (old / deprecated):
patron_rsp_yellow
624c09e49b98e019a3315b66
patron_rsp_green
624c0570c9b794431568f5d5
patron_rsp_red
624c09cfbc2e27219346d955
patron_rsp_white
624c09da2cec124eb67c1046
patron_rsp_yellow
624c09e49b98e019a3315b66

enplacement ammo:
patron_30x29_vog_30
5d70e500a4b9364de70d38ce
patron_127x108
5cde8864d7f00c0010373be1
patron_127x108_bzt
5d2f2ab648f03550091993ca
*/
