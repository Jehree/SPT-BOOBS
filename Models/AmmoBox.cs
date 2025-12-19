namespace BOOBS.Models;

public class AmmoBox
{
    public required string BoxId { get; set; }
    public required string BoxType { get; set; }
    public required string BulletId { get; set; }
    public required int BulletCount { get; set; }
}