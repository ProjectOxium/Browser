using System;
using System.IO;

namespace OxiumInstaller.Models
{
    public class InstallerConfig
    {
        public string AppName { get; set; } = "Oxium Browser";
        public string Publisher { get; set; } = "Project Oxium";
        public string Version { get; set; } = "1.0.0";
        public string AppExecutable { get; set; } = "Oxium Browser.exe";
        public long RequiredDiskSpaceMB { get; set; } = 400;
        public string StartMenuFolder { get; set; } = @"Project Oxium\Oxium Browser";
        public string RegistryKeyPath { get; set; } = @"Software\Project Oxium\Oxium Browser";
        public string UninstallRegistryPath { get; set; } = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\Oxium Browser";

        public string DefaultInstallPath => Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
            "Project Oxium",
            "Oxium Browser");

        public string LicenseText =>
@"OXIUM END USER LICENSE AGREEMENT (EULA)

IMPORTANT — READ CAREFULLY BEFORE INSTALLING

This End User License Agreement (""EULA"") is a legal agreement between you
(either an individual or a single entity) and Project Oxium for the software
product identified above, which includes computer software and may include
associated media, printed materials, and ""online"" or electronic documentation
(collectively, ""SOFTWARE PRODUCT"").

By installing, copying, or otherwise using the SOFTWARE PRODUCT, you agree to
be bound by the terms of this EULA. If you do not agree to the terms of this
EULA, do not install or use the SOFTWARE PRODUCT.

1. GRANT OF LICENSE
   Project Oxium grants you a non-exclusive, non-transferable, limited license
   to install and use the SOFTWARE PRODUCT on a single computer for your
   personal or internal business purposes.

2. RESTRICTIONS
   You may not: (a) reverse engineer, decompile, or disassemble the SOFTWARE
   PRODUCT; (b) modify, adapt, translate, rent, lease, loan, or create
   derivative works based upon the SOFTWARE PRODUCT; (c) remove any proprietary
   notices or labels on the SOFTWARE PRODUCT.

3. OWNERSHIP
   The SOFTWARE PRODUCT is licensed, not sold. Project Oxium retains all right,
   title, and interest, including all copyright and intellectual property
   rights, in and to the SOFTWARE PRODUCT.

4. DISCLAIMER OF WARRANTY
   THE SOFTWARE PRODUCT IS PROVIDED ""AS IS"" WITHOUT WARRANTY OF ANY KIND,
   EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.

5. LIMITATION OF LIABILITY
   IN NO EVENT SHALL PROJECT OXIUM BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   INDIRECT, OR CONSEQUENTIAL DAMAGES WHATSOEVER ARISING OUT OF THE USE OF
   OR INABILITY TO USE THE SOFTWARE PRODUCT.

6. TERMINATION
   This EULA is effective until terminated. You may terminate it at any time
   by uninstalling and destroying all copies of the SOFTWARE PRODUCT. It will
   also terminate automatically if you fail to comply with any term.

7. GOVERNING LAW
   This EULA shall be governed by and construed in accordance with applicable
   laws without regard to conflict of laws principles.

BY CLICKING ""I ACCEPT"" AND PROCEEDING WITH THE INSTALLATION, YOU
ACKNOWLEDGE THAT YOU HAVE READ THIS EULA, UNDERSTAND IT, AND AGREE TO BE
BOUND BY ITS TERMS AND CONDITIONS.

Copyright © 2026 Project Oxium. All rights reserved.";
    }
}
