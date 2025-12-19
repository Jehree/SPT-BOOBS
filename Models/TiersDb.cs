namespace Boobs.Models;

public class TiersDb
{
    public required List<TierCategory> Categories { get; set; }
}

public class TierCategory
{
    public required string Name { get; set; }
    public required string Type { get; set; }
    public required Dictionary<string, List<string>> Tiers { get; set; }
}
