using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Microsoft.Win32;
using OxiumInstaller.Models;

namespace OxiumInstaller.Services
{
    public class PrerequisiteService
    {
        public List<Prerequisite> GetChecks()
        {
            return new List<Prerequisite>
            {
                new Prerequisite
                {
                    Name = "Operating System",
                    Status = PrerequisiteStatus.Checking,
                    StatusMessage = "Checking Windows version..."
                },
                new Prerequisite
                {
                    Name = ".NET Runtime",
                    Status = PrerequisiteStatus.Checking,
                    StatusMessage = "Checking for .NET 8 runtime..."
                },
                new Prerequisite
                {
                    Name = "Disk Space",
                    Status = PrerequisiteStatus.Checking,
                    StatusMessage = "Checking available disk space..."
                },
                new Prerequisite
                {
                    Name = "Administrator Privileges",
                    Status = PrerequisiteStatus.Checking,
                    StatusMessage = "Verifying permissions..."
                },
                new Prerequisite
                {
                    Name = "Visual C++ Redistributable",
                    Status = PrerequisiteStatus.Checking,
                    StatusMessage = "Checking for VC++ runtime..."
                }
            };
        }

        public async Task RunCheckAsync(Prerequisite prerequisite)
        {
            await Task.Delay(300);

            switch (prerequisite.Name)
            {
                case "Operating System":
                    CheckOperatingSystem(prerequisite);
                    break;
                case ".NET Runtime":
                    CheckDotNetRuntime(prerequisite);
                    break;
                case "Disk Space":
                    CheckDiskSpace(prerequisite);
                    break;
                case "Administrator Privileges":
                    CheckAdminPrivileges(prerequisite);
                    break;
                case "Visual C++ Redistributable":
                    CheckVCRedist(prerequisite);
                    break;
                default:
                    prerequisite.Status = PrerequisiteStatus.Passed;
                    prerequisite.StatusMessage = "OK";
                    break;
            }
        }

        private void CheckOperatingSystem(Prerequisite p)
        {
            var os = Environment.OSVersion;
            var isModern = os.Version.Major >= 10;

            if (isModern)
            {
                p.Status = PrerequisiteStatus.Passed;
                p.StatusMessage = $"Windows {os.Version.Major}.{os.Version.Minor} — Compatible";
            }
            else
            {
                p.Status = PrerequisiteStatus.Failed;
                p.StatusMessage = "Windows 10 or later is required.";
            }
        }

        private void CheckDotNetRuntime(Prerequisite p)
        {
            try
            {
                var dotnetDirs = new[]
                {
                    Path.Combine(Environment.GetFolderPath(
                        Environment.SpecialFolder.ProgramFiles), "dotnet", "shared",
                        "Microsoft.NETCore.App"),
                    Path.Combine(Environment.GetFolderPath(
                        Environment.SpecialFolder.ProgramFilesX86), "dotnet", "shared",
                        "Microsoft.NETCore.App")
                };

                foreach (var dir in dotnetDirs)
                {
                    if (Directory.Exists(dir))
                    {
                        var versions = Directory.GetDirectories(dir)
                            .Select(d => new DirectoryInfo(d).Name)
                            .Where(v => v.StartsWith("8."))
                            .ToList();

                        if (versions.Any())
                        {
                            p.Status = PrerequisiteStatus.Passed;
                            p.StatusMessage = $".NET 8.x runtime found ({versions.First()})";
                            return;
                        }
                    }
                }

                p.Status = PrerequisiteStatus.Warning;
                p.StatusMessage = ".NET 8 runtime not detected. The application may fail to start.";
            }
            catch
            {
                p.Status = PrerequisiteStatus.Warning;
                p.StatusMessage = "Unable to verify .NET runtime installation.";
            }
        }

        private void CheckDiskSpace(Prerequisite p)
        {
            try
            {
                var systemDrive = Path.GetPathRoot(
                    Environment.GetFolderPath(Environment.SpecialFolder.System));
                var drive = new DriveInfo(systemDrive!);
                var freeGB = drive.AvailableFreeSpace / (1024.0 * 1024 * 1024);

                if (freeGB >= 1.0)
                {
                    p.Status = PrerequisiteStatus.Passed;
                    p.StatusMessage = $"{freeGB:F1} GB available — Sufficient";
                }
                else
                {
                    p.Status = PrerequisiteStatus.Failed;
                    p.StatusMessage = $"Only {freeGB:F1} GB available. At least 1 GB is required.";
                }
            }
            catch
            {
                p.Status = PrerequisiteStatus.Warning;
                p.StatusMessage = "Unable to check available disk space.";
            }
        }

        private void CheckAdminPrivileges(Prerequisite p)
        {
            try
            {
                var isAdmin = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                    ? IsUserAdministrator()
                    : false;

                if (isAdmin)
                {
                    p.Status = PrerequisiteStatus.Passed;
                    p.StatusMessage = "Running with administrator privileges";
                }
                else
                {
                    p.Status = PrerequisiteStatus.Failed;
                    p.StatusMessage = "Administrator privileges required for installation.";
                }
            }
            catch
            {
                p.Status = PrerequisiteStatus.Failed;
                p.StatusMessage = "Unable to verify administrator privileges.";
            }
        }

        private void CheckVCRedist(Prerequisite p)
        {
            try
            {
                var keyPath = @"SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64";
                using var key = Registry.LocalMachine.OpenSubKey(keyPath);

                if (key?.GetValue("Installed")?.ToString() == "1")
                {
                    p.Status = PrerequisiteStatus.Passed;
                    p.StatusMessage = "Visual C++ 2015-2022 Redistributable found";
                }
                else
                {
                    p.Status = PrerequisiteStatus.Warning;
                    p.StatusMessage = "VC++ Redistributable not detected. May be required.";
                }
            }
            catch
            {
                p.Status = PrerequisiteStatus.Warning;
                p.StatusMessage = "Unable to verify VC++ Redistributable.";
            }
        }

        private bool IsUserAdministrator()
        {
            try
            {
                using var identity = System.Security.Principal.WindowsIdentity.GetCurrent();
                var principal = new System.Security.Principal.WindowsPrincipal(identity);
                return principal.IsInRole(
                    System.Security.Principal.WindowsBuiltInRole.Administrator);
            }
            catch
            {
                return false;
            }
        }
    }
}
