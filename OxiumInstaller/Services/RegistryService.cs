using System;
using System.IO;
using Microsoft.Win32;
using OxiumInstaller.Models;

namespace OxiumInstaller.Services
{
    public class RegistryService
    {
        public void RegisterApplication(InstallerConfig config, string installPath)
        {
            try
            {
                using var key = Registry.LocalMachine.CreateSubKey(config.RegistryKeyPath);
                if (key == null) return;

                key.SetValue("InstallPath", installPath);
                key.SetValue("Version", config.Version);
                key.SetValue("Publisher", config.Publisher);
                key.SetValue("DisplayName", config.AppName);

                var uninstallExe = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.System),
                    "cmd.exe");
                var uninstallArgs = $"/c \"{Path.Combine(installPath, "uninstall.bat")}\"";

                using var uninstallKey = Registry.LocalMachine.CreateSubKey(
                    config.UninstallRegistryPath);
                if (uninstallKey == null) return;

                uninstallKey.SetValue("DisplayName", config.AppName);
                uninstallKey.SetValue("DisplayVersion", config.Version);
                uninstallKey.SetValue("Publisher", config.Publisher);
                uninstallKey.SetValue("InstallLocation", installPath);
                uninstallKey.SetValue("UninstallString",
                    $"\"{uninstallExe}\" {uninstallArgs}");
                uninstallKey.SetValue("DisplayIcon",
                    Path.Combine(installPath, config.AppExecutable));
                uninstallKey.SetValue("NoModify", 1);
                uninstallKey.SetValue("NoRepair", 1);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Trace.WriteLine(
                    $"Failed to register application: {ex.Message}");
            }
        }

        public void UnregisterApplication(InstallerConfig config)
        {
            try
            {
                Registry.LocalMachine.DeleteSubKeyTree(
                    config.RegistryKeyPath, false);
            }
            catch { }

            try
            {
                Registry.LocalMachine.DeleteSubKeyTree(
                    config.UninstallRegistryPath, false);
            }
            catch { }
        }
    }
}
