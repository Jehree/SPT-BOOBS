namespace Boobs.Models;

public class BoxTypeInfoDb
{
    public required List<BoxTypeInfo> Types { get; set; }
}

public class BoxTypeInfo
{
    public required string Type { get; set; }
    public required string BundlePath { get; set; }
    public required int SizeH { get; set; }
    public required int SizeV { get; set; }

}