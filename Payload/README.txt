OXIUM BROWSER - APPLICATION PAYLOAD
====================================

Place your Oxium Browser build output here before running publish.ps1.

Expected structure:
  Payload/
    Oxium Browser.exe
    resources/
    locales/
    *.dll
    *.pak
    ...

The publish.ps1 script will zip this directory into an embedded payload
and produce a single OxiumBrowserInstaller.exe.
