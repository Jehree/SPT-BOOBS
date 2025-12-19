using BOOBS.Models;
using BOOBS.Services;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers;
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
}
