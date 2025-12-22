using BOOBS.Models;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Spt.Mod;
using SPTarkov.Server.Core.Models.Utils;
using SPTarkov.Server.Core.Services;
using SPTarkov.Server.Core.Services.Mod;

namespace BOOBS.Services;

[Injectable]
public class AmmoBoxGenerator(
    CustomItemService customItemService,
    DatabaseService databaseService,
    LocaleService localeService,
    ISptLogger<AmmoBoxGenerator> logger)
{
    public required ConfigContainer ConfigContainer { get; set; }

    public void InitConfigs(ConfigContainer configContainer)
    {
        ConfigContainer = configContainer;
    }

    public void PushAmmoBoxesToDb()
    {
        foreach (List<AmmoBox> category in ConfigContainer.AmmoBoxDb.Values)
        {
            foreach (AmmoBox box in category)
            {
                CreateAmmoBox(box);
            }
        }
    }

    private void CreateAmmoBox(AmmoBox box)
    {
        Dictionary<string, string> locales = localeService.GetLocaleDb();
        string caliberName = locales[$"{box.BulletId} Name"].Split(" ")[0].Replace("mm", "");
        string bulletShortName = locales[$"{box.BulletId} ShortName"];
        string bulletName = locales![$"{box.BulletId} Name"];
        string mongoId = ConfigContainer.MongoMappings[box.BoxId];
        string boxDescription = $"Carboard box holding {bulletName} rounds.";
        string boxShortName = $"{bulletShortName} - {caliberName}";
        if (box.BoxId == "Disk")
        {
            boxDescription += " The disk ammo box is incredibly rare! You should probably keep it as a collectors item...";
        }

        BoxTypeInfo boxTypeInfo = ConfigContainer.BoxTypeInfoDb.Types.First(b => b.Type == box.BoxType);

        NewItemFromCloneDetails itemCloneDetails = new() 
        {
            ItemTplToClone = ItemTpl.AMMOBOX_545X39_BP_30RND,
            ParentId = "543be5cb4bdc2deb348b4568",
            NewId = mongoId,

            HandbookParentId = "5b47574386f77428ca22b33c",
            HandbookPriceRoubles = 0,
            FleaPriceRoubles = 0,

            Locales = new Dictionary<string, LocaleDetails>
            {
                {
                    "en", new LocaleDetails
                    {
                        Name = boxDescription,
                        ShortName = boxShortName,
                        Description = boxDescription
                    }
                }
            },

            OverrideProperties = new TemplateItemProperties
            {
                Width = boxTypeInfo.SizeH,
                Height = boxTypeInfo.SizeV,
                Name = box.BoxId,
            },
        };

        customItemService.CreateItemFromClone(itemCloneDetails);

        // further edit item's properties directly (couldn't do all of this with the clone details):
        TemplateItem templateItem = databaseService.GetItems().First(i => i.Value.Id == mongoId).Value;

        templateItem.Properties!.Prefab!.Path = boxTypeInfo.BundlePath;

        List<StackSlot> stackSlots = templateItem.Properties.StackSlots!.ToList();
        stackSlots[0].Parent = mongoId;
        stackSlots[0].MaxCount = box.BulletCount;

        List<SlotFilter> filters = stackSlots[0].Properties!.Filters!.ToList();
        filters[0].Filter = [box.BulletId];

        stackSlots[0].Properties!.Filters = filters;
        templateItem.Properties!.StackSlots = stackSlots;
    }
}