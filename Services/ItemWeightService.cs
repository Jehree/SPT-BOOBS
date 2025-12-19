using BOOBS.Models;
using SPTarkov.DI.Annotations;

namespace BOOBS.Services;

[Injectable]
public class ItemWeightService()
{
    public required ConfigContainer ConfigContainer { get; set; }

    public void InitConfigs(ConfigContainer configContainer)
    {
        ConfigContainer = configContainer;
    }

    public Dictionary<string, double> GetItemWeights()
    {
        List<TierCategory> allCategories = [.. ConfigContainer.TiersDbAmmoBoxes.Categories, .. ConfigContainer.TiersDbLooseItems.Categories];
        Dictionary<string, double> itemWeights = [];

        foreach (TierCategory category in allCategories)
        {
            Dictionary<string, double> multipliers = GetWeightMultipliers(category);
            double sumOfMultipliers = GetSumOfMultipliers(multipliers);
            double categoryWeightTotal = ConfigContainer.Config.CaliberWeightMultipliers[category.Name] * 10000;

            foreach (var (tierName, itemsInTier) in category.Tiers)
            {
                if (itemsInTier.Count == 0) continue;

                double tierMultiplier = multipliers[tierName];
                double tierWeight = (tierMultiplier / sumOfMultipliers) * categoryWeightTotal;
                double itemWeight = tierWeight / itemsInTier.Count;

                foreach (string itemName in itemsInTier)
                {
                    itemWeights[itemName] = itemWeight;
                }
            }
        }

        return itemWeights;
    }

    private Dictionary<string, double> GetWeightMultipliers(TierCategory tierCategory)
    {
        MultiplierContainer multiplierContainer = ConfigContainer.Config.CategoryWeightMultipliers.First(tc => tc.Type == tierCategory.Type);
        Dictionary<string, double> multipliers = new(multiplierContainer.Multipliers);

        foreach (var (tierName, itemsInTier) in tierCategory.Tiers)
        {
            if (itemsInTier.Count == 0)
            {
                multipliers[tierName] = 0;
            }
        }

        return multipliers;
    }

    private double GetSumOfMultipliers(Dictionary<string, double> multipiers)
    {
        double sum = 0;

        foreach (double multiplier in multipiers.Values)
        {
            sum += multiplier;
        }

        // Should this be limited to 4 decimal places? Not sure why I did that in the old TS version
        return sum;
    }
}
