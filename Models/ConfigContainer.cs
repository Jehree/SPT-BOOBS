namespace BOOBS.Models;

public class ConfigContainer
{
    public ConfigContainer(
        ModConfig config,
        Dictionary<string, List<AmmoBox>> ammoBoxDb,
        TiersDb tiersDbAmmoBoxes,
        Dictionary<string, Dictionary<string, string>> looseItemDb,
        TiersDb tiersDbLooseItems,
        BoxTypeInfoDb boxTypeInfoDb,
        Dictionary<string, string> mongoMappings
        )
    {
        Config = config;
        AmmoBoxDb = ammoBoxDb;
        TiersDbAmmoBoxes = tiersDbAmmoBoxes;
        LooseItemDb = looseItemDb;
        TiersDbLooseItems = tiersDbLooseItems;
        BoxTypeInfoDb = boxTypeInfoDb;
        MongoMappings = mongoMappings;
    }

    public ModConfig Config { get; set; }
    public Dictionary<string, List<AmmoBox>> AmmoBoxDb { get; set; }
    public TiersDb TiersDbAmmoBoxes { get; set; }
    public Dictionary<string, Dictionary<string, string>> LooseItemDb { get; set; }
    public TiersDb TiersDbLooseItems { get; set; }
    public BoxTypeInfoDb BoxTypeInfoDb { get; set; }
    public Dictionary<string, string> MongoMappings { get; set; }
}