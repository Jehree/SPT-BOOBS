using BOOBS.Models;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Services;

namespace BOOBS.Services;

[Injectable]
public class LooseLootPointProcessor(DatabaseService databaseService)
{
    public required ConfigContainer ConfigContainer { get; set; }

    public void InitConfigs(ConfigContainer configContainer)
    {
        ConfigContainer = configContainer;
    }

    public void ProcessSpawnpoints(Dictionary<string, double> itemWeights)
    {
        foreach (var (locationId, location) in databaseService.GetLocations().GetDictionary())
        {
            if (location.LooseLoot is null) continue;

            location.LooseLoot.AddTransformer(looseLootData =>
            {
                if (looseLootData?.Spawnpoints is null) return looseLootData;

                ProcessMapSpawnpoints(looseLootData.Spawnpoints, itemWeights);

                return looseLootData;
            });
        }
    }

    private void ProcessMapSpawnpoints(IEnumerable<Spawnpoint> spawnpoints, Dictionary<string, double> itemWeights)
    {
        foreach (Spawnpoint point in spawnpoints)
        {
            if (!SpawnpointIsTarget(point)) continue;
            if (point.Template is null) continue;

            point.Probability *= ConfigContainer.Config.GlobalSpawnChanceMultiplier;
            
            List<SptLootItem> pointItems = [];
            List<LooseLootItemDistribution> itemDistribution = [];

            foreach (var (caliberName, boxes) in ConfigContainer.AmmoBoxDb)
            {
                foreach (AmmoBox box in boxes)
                {
                    pointItems.AddRange(BuildSpawnpointItems(box, out MongoId pointId));
                    itemDistribution.Add(BuildItemDistribution(pointId, itemWeights[box.BoxId]));
                }
            }

            foreach (var (categoryName, looseItems) in ConfigContainer.LooseItemDb)
            {
                foreach (var (itemName, itemId) in looseItems)
                {
                    pointItems.AddRange(BuildSpawnpointItems(itemId, out MongoId pointId));
                    itemDistribution.Add(BuildItemDistribution(pointId, itemWeights[itemName]));
                }
            }

            point.Template.Items = pointItems;
            point.ItemDistribution = itemDistribution;
        }
    }

    private LooseLootItemDistribution BuildItemDistribution(MongoId pointId, double weight)
    {
        return new LooseLootItemDistribution
        {
            ComposedKey = new ComposedKey
            {
                Key = pointId,
            },
            RelativeProbability = weight
        };
    }

    private List<SptLootItem> BuildSpawnpointItems(AmmoBox box, out MongoId pointId)
    {
        pointId = new();

        return
        [
            new SptLootItem
            {
                Id = pointId,
                ComposedKey = pointId,
                Template = ConfigContainer.MongoMappings[box.BoxId],
            },
            new SptLootItem
            {
                Id = new MongoId(),
                ParentId = pointId,
                ComposedKey = pointId,
                Template = box.BulletId,
                SlotId = "cartridges",
                Upd = new Upd
                {
                    StackObjectsCount = box.BulletCount
                }
            }
        ];
    }

    private List<SptLootItem> BuildSpawnpointItems(MongoId itemId, out MongoId pointId)
    {
        pointId = new();

        return
        [
            new SptLootItem
            {
                Id = pointId,
                ComposedKey = pointId,
                Template = itemId
            }
        ];
    }

    private bool SpawnpointIsTarget(Spawnpoint spawnpoint)
    {
        if (spawnpoint.Template is null) return false;
        bool spawnsAmmo = false;

        IEnumerable<SptLootItem>? items = spawnpoint.Template.Items;
        if (items is null) return false;

        foreach (SptLootItem item in items)
        {
            MongoId parentId = databaseService.GetItems().First(i => i.Value.Id == item.Template).Value.Parent;
            if (ConfigContainer.Config.SpawnpointItemBlacklist.Contains(item.Template)) return false;
            if (ConfigContainer.Config.SpawnpointItemBlacklist.Contains(parentId)) return false;

            if (parentId == BaseClasses.AMMO_BOX)
            {
                spawnsAmmo = true;
            }
        }

        return spawnsAmmo;
        // In order for a spawnpoint to be a target, it must:
        // Be able to spawn an ammo box normally
        // NOT be able to spawn any items on the blacklist, or any children of any items on the blacklist
    }
}