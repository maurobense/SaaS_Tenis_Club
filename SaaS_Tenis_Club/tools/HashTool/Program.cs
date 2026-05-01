if (args.Length >= 2 && args[0] == "verify")
{
    Console.WriteLine(BCrypt.Net.BCrypt.Verify(args[1], args[2]));
    return;
}

Console.WriteLine(BCrypt.Net.BCrypt.HashPassword(args.Length > 0 ? args[0] : "Admin123!", workFactor: 12));
