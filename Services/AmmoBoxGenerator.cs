using Boobs.Models;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Spt.Mod;
using SPTarkov.Server.Core.Services;
using SPTarkov.Server.Core.Services.Mod;

namespace Boobs.Services;

[Injectable]
public class AmmoBoxGenerator(
    CustomItemService customItemService,
    DatabaseService databaseService,
    LocaleService localeService)
{
    public required ConfigContainer ConfigContainer { get; set; }

    public void InitConfigs(ConfigContainer configContainer)
    {
        ConfigContainer = configContainer;
    }

    public void PushAmmoBoxesToDb()
    {
        foreach (var cat in ConfigContainer.AmmoBoxDb)
        {
            foreach (AmmoBox box in cat.Value)
            {
                CreateAmmoBox(box);
            }
        }
    }

    private void CreateAmmoBox(AmmoBox box)
    {
        string mongoId = ConfigContainer.MongoMappings[box.BoxId];
        string bulletShortName = "";
        string bulletName = "";

        Dictionary<string, string> locales = localeService.GetLocaleDb();
        bulletShortName = locales[$"{box.BulletId} ShortName"];
        bulletName = locales![$"{box.BulletId} Name"];

        string boxDescription = $"Carboard box holding ${bulletShortName} rounds.";
        if (box.BoxId == "Disk")
        {
            boxDescription += " The disk ammo box is incredibly rare! You should probably keep it as a collectors item...";
        }

        BoxTypeInfo boxTypeInfo = ConfigContainer.BoxTypeInfoDb.Types.First(b => b.Type == box.BoxType);

        var item = new NewItemFromCloneDetails
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
                        Name = $"Carboard box holding ${bulletName} rounds",
                        ShortName = bulletShortName,
                        Description = boxDescription
                    }
                }
            },

            OverrideProperties = new TemplateItemProperties
            {
                Width = boxTypeInfo.SizeH,
                Height = boxTypeInfo.SizeV,
                Name = box.BoxId
            }
        };

        customItemService.CreateItemFromClone(item);

        TemplateItem dbItem = databaseService.GetItems().First(i => i.Value.Id == mongoId).Value;

        dbItem.Properties!.Prefab!.Path = boxTypeInfo.BundlePath;

        List<StackSlot> stackSlots = dbItem.Properties!.StackSlots!.ToList();
        stackSlots[0].Parent = mongoId;
        stackSlots[0].MaxCount = box.BulletCount;

        List<SlotFilter> filters = stackSlots[0].Properties!.Filters!.ToList();
        filters[0].Filter = [box.BulletId];
        stackSlots[0].Properties!.Filters = filters;

        dbItem.Properties!.StackSlots = stackSlots;
    }
}