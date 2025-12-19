using Boobs.Models;
using SPTarkov.DI.Annotations;

namespace Boobs.Services;

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
        List<TierCategory> allCats = [.. ConfigContainer.TiersDbAmmoBoxes.Categories, .. ConfigContainer.TiersDbLooseItems.Categories];
        Dictionary<string, double> itemWeights = [];

        foreach (TierCategory tierCat in allCats)
        {
            Dictionary<string, double> multipliers = GetWeightMultipliers(tierCat);
            double sumOfMultipliers = GetSumOfMultipliers(multipliers);
            double categoryWeightTotal = ConfigContainer.Config.CaliberWeightMultipliers[tierCat.Name] * 10000;

            foreach (var kvp in tierCat.Tiers)
            {
                string tierName = kvp.Key;
                List<string> itemsInTier = kvp.Value;

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

    private Dictionary<string, double> GetWeightMultipliers(TierCategory tierCat)
    {
        MultiplierContainer multiplierContainer = ConfigContainer.Config.CategoryWeightMultipliers.First(cat => cat.Type == tierCat.Type);
        Dictionary<string, double> multipliers = new(multiplierContainer.Multipliers);

        foreach (var kvp in tierCat.Tiers)
        {
            string tierName = kvp.Key;
            List<string> itemsInTier = kvp.Value;

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

        foreach (var mult in multipiers)
        {
            sum += mult.Value;
        }

        // Should this be limited to 4 decimal places? Not sure why I did that in the old TS version
        return sum;
    }
}
