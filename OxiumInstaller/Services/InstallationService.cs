using System;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using OxiumInstaller.Models;

namespace OxiumInstaller.Services
{
    public class InstallationService
    {
        public async Task InstallAsync(
            string targetPath,
            IProgress<(double percent, string status)> progress,
            CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(targetPath))
                throw new ArgumentException("Target path is required.");

            progress.Report((0, "Preparing installation..."));

            Directory.CreateDirectory(targetPath);

            var tempDir = Path.Combine(Path.GetTempPath(), $"OxiumInstall_{Guid.NewGuid():N}");
            Directory.CreateDirectory(tempDir);

            try
            {
                progress.Report((10, "Extracting payload..."));
                await ExtractPayloadAsync(tempDir, ct);

                var files = Directory.GetFiles(tempDir, "*", SearchOption.AllDirectories);
                var totalFiles = files.Length;

                if (totalFiles == 0)
                {
                    progress.Report((100, "Payload is empty — skipping file copy."));
                    return;
                }

                for (int i = 0; i < totalFiles; i++)
                {
                    ct.ThrowIfCancellationRequested();

                    var sourceFile = files[i];
                    var relativePath = sourceFile.Substring(tempDir.Length).TrimStart('\\', '/');
                    var destFile = Path.Combine(targetPath, relativePath);

                    Directory.CreateDirectory(Path.GetDirectoryName(destFile)!);

                    var fileName = Path.GetFileName(relativePath);
                    progress.Report((
                        10 + ((double)(i + 1) / totalFiles * 80),
                        $"Installing: {fileName}"));

                    await Task.Run(() => File.Copy(sourceFile, destFile, true), ct);
                }

                progress.Report((95, "Finalizing..."));
            }
            finally
            {
                try { Directory.Delete(tempDir, true); } catch { }
            }
        }

        private async Task ExtractPayloadAsync(string destination, CancellationToken ct)
        {
            var assembly = Assembly.GetExecutingAssembly();
            var resourceName = "OxiumInstaller.Payload.AppPayload.zip";

            await using var stream = assembly.GetManifestResourceStream(resourceName);

            if (stream == null)
            {
                // No payload embedded yet — create a placeholder marker file
                var marker = Path.Combine(destination, "_PAYLOAD_PLACEHOLDER.txt");
                await File.WriteAllTextAsync(marker,
                    "This is a placeholder. Drop your application files into the Payload directory " +
                    "and run publish.ps1 to embed them into the installer.", ct);
                return;
            }

            using var archive = new ZipArchive(stream, ZipArchiveMode.Read);
            foreach (var entry in archive.Entries)
            {
                ct.ThrowIfCancellationRequested();
                var destPath = Path.Combine(destination, entry.FullName);

                if (string.IsNullOrEmpty(entry.Name))
                {
                    Directory.CreateDirectory(destPath);
                }
                else
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(destPath)!);
                    entry.ExtractToFile(destPath, true);
                }
            }
        }

        public void CreateUninstaller(string installPath, InstallerConfig config)
        {
            var uninstallBat = Path.Combine(installPath, "uninstall.bat");
            var uninstallContent =
$@"@echo off
echo Oxium Uninstaller
echo =================
echo.
echo Removing Oxium files...
timeout /t 3 /nobreak >nul
rmdir /s /q ""{installPath}"" 2>nul
echo.
echo Deleting registry entries...
reg delete ""HKLM\{config.RegistryKeyPath}"" /f 2>nul
reg delete ""HKLM\{config.UninstallRegistryPath}"" /f 2>nul
echo.
echo Removing shortcuts...
if exist ""%ProgramData%\Microsoft\Windows\Start Menu\Programs\{config.StartMenuFolder}"" rmdir /s /q ""%ProgramData%\Microsoft\Windows\Start Menu\Programs\{config.StartMenuFolder}""
if exist ""%APPDATA%\Microsoft\Windows\Start Menu\Programs\{config.StartMenuFolder}"" rmdir /s /q ""%APPDATA%\Microsoft\Windows\Start Menu\Programs\{config.StartMenuFolder}""
echo.
echo Uninstallation complete.
pause
del ""%~f0"" & exit
";

            File.WriteAllText(uninstallBat, uninstallContent);
        }
    }
}
