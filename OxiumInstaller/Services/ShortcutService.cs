using System;
using System.IO;

namespace OxiumInstaller.Services
{
    public class ShortcutService
    {
        public void CreateStartMenuShortcut(
            string installPath,
            string startMenuFolder,
            string appName,
            string exePath)
        {
            try
            {
                var programsPath = Environment.GetFolderPath(
                    Environment.SpecialFolder.CommonPrograms);
                var shortcutDir = Path.Combine(programsPath, startMenuFolder);
                Directory.CreateDirectory(shortcutDir);

                var shortcutPath = Path.Combine(shortcutDir, $"{appName}.lnk");
                CreateShortcut(shortcutPath, exePath, installPath, appName);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Trace.WriteLine(
                    $"Failed to create Start Menu shortcut: {ex.Message}");
            }
        }

        public void CreateDesktopShortcut(
            string installPath,
            string appName,
            string exePath)
        {
            try
            {
                var desktopPath = Environment.GetFolderPath(
                    Environment.SpecialFolder.CommonDesktopDirectory);
                var shortcutPath = Path.Combine(desktopPath, $"{appName}.lnk");
                CreateShortcut(shortcutPath, exePath, installPath, appName);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Trace.WriteLine(
                    $"Failed to create Desktop shortcut: {ex.Message}");
            }
        }

        public void RemoveShortcuts(string startMenuFolder, string appName)
        {
            try
            {
                var programsPath = Environment.GetFolderPath(
                    Environment.SpecialFolder.CommonPrograms);
                var shortcutDir = Path.Combine(programsPath, startMenuFolder);
                if (Directory.Exists(shortcutDir))
                    Directory.Delete(shortcutDir, true);

                var desktopPath = Environment.GetFolderPath(
                    Environment.SpecialFolder.CommonDesktopDirectory);
                var desktopShortcut = Path.Combine(desktopPath, $"{appName}.lnk");
                if (File.Exists(desktopShortcut))
                    File.Delete(desktopShortcut);
            }
            catch { /* best-effort cleanup */ }
        }

        private void CreateShortcut(
            string shortcutPath,
            string targetPath,
            string workingDirectory,
            string description)
        {
            var shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType == null) return;

            dynamic shell = Activator.CreateInstance(shellType);
            dynamic shortcut = shell.CreateShortcut(shortcutPath);

            shortcut.TargetPath = targetPath;
            shortcut.WorkingDirectory = workingDirectory;
            shortcut.Description = description;
            shortcut.Save();
        }
    }
}
