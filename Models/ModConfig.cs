namespace BOOBS.Models;

public class ModConfig
{
    public required List<string> SpawnpointItemBlacklist { get; set; }

    public required int GlobalSpawnChanceMultiplier { get; set; }

    public required List<MultiplierContainer> CategoryWeightMultipliers { get; set; }
    public required Dictionary<string, double> CaliberWeightMultipliers { get; set; }
}

public class MultiplierContainer
{
    public required string Type { get; set; }
    public required Dictionary<string, double> Multipliers { get; set; }
}