using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using OxiumInstaller.Models;
using OxiumInstaller.Services;
using Microsoft.Win32;

namespace OxiumInstaller.ViewModels
{
    public enum InstallerPage
    {
        Welcome,
        License,
        Prerequisites,
        InstallPath,
        Progress,
        Complete
    }

    public class InstallerViewModel : INotifyPropertyChanged
    {
        private readonly InstallerConfig _config;
        private readonly InstallationService _installationService;
        private readonly ShortcutService _shortcutService;
        private readonly RegistryService _registryService;
        private readonly PrerequisiteService _prerequisiteService;

        private CancellationTokenSource _installCts;

        public InstallerViewModel()
        {
            _config = new InstallerConfig();
            _installationService = new InstallationService();
            _shortcutService = new ShortcutService();
            _registryService = new RegistryService();
            _prerequisiteService = new PrerequisiteService();

            Prerequisites = new ObservableCollection<Prerequisite>();
            _installPath = _config.DefaultInstallPath;

            NextCommand = new RelayCommand(Next, () => CanGoNext);
            BackCommand = new RelayCommand(Back, () => CurrentPage != InstallerPage.Welcome);
            BrowseCommand = new RelayCommand(Browse);
            InstallCommand = new AsyncRelayCommand(InstallAsync, () => CurrentPage == InstallerPage.InstallPath);
            CancelCommand = new RelayCommand(Cancel);
            FinishCommand = new RelayCommand(Finish);

            UpdateDiskSpace();
        }

        // ── Navigation State ────────────────────────────────────

        private InstallerPage _currentPage = InstallerPage.Welcome;
        public InstallerPage CurrentPage
        {
            get => _currentPage;
            private set
            {
                if (_currentPage == value) return;
                _currentPage = value;
                OnPropertyChanged();
                RefreshPageBindings();

                if (_currentPage == InstallerPage.Prerequisites)
                    _ = CheckPrerequisitesAsync();
            }
        }

        public Visibility WelcomeVisibility =>
            CurrentPage == InstallerPage.Welcome ? Visibility.Visible : Visibility.Collapsed;
        public Visibility LicenseVisibility =>
            CurrentPage == InstallerPage.License ? Visibility.Visible : Visibility.Collapsed;
        public Visibility PrerequisitesVisibility =>
            CurrentPage == InstallerPage.Prerequisites ? Visibility.Visible : Visibility.Collapsed;
        public Visibility InstallPathVisibility =>
            CurrentPage == InstallerPage.InstallPath ? Visibility.Visible : Visibility.Collapsed;
        public Visibility ProgressVisibility =>
            CurrentPage == InstallerPage.Progress ? Visibility.Visible : Visibility.Collapsed;
        public Visibility CompleteVisibility =>
            CurrentPage == InstallerPage.Complete ? Visibility.Visible : Visibility.Collapsed;

        public Visibility BackButtonVisibility =>
            (CurrentPage != InstallerPage.Welcome &&
             CurrentPage != InstallerPage.Complete &&
             CurrentPage != InstallerPage.Progress)
                ? Visibility.Visible : Visibility.Collapsed;

        public Visibility NextButtonVisibility =>
            (CurrentPage == InstallerPage.Welcome ||
             CurrentPage == InstallerPage.License ||
             CurrentPage == InstallerPage.Prerequisites)
                ? Visibility.Visible : Visibility.Collapsed;

        public Visibility InstallButtonVisibility =>
            CurrentPage == InstallerPage.InstallPath ? Visibility.Visible : Visibility.Collapsed;

        public Visibility CancelButtonVisibility =>
            CurrentPage == InstallerPage.Progress ? Visibility.Visible : Visibility.Collapsed;

        public Visibility FinishButtonVisibility =>
            CurrentPage == InstallerPage.Complete ? Visibility.Visible : Visibility.Collapsed;

        // ── License ─────────────────────────────────────────────

        private bool _isLicenseAccepted;
        public bool IsLicenseAccepted
        {
            get => _isLicenseAccepted;
            set
            {
                _isLicenseAccepted = value;
                OnPropertyChanged();
                OnPropertyChanged(nameof(CanGoNext));
                CommandManager.InvalidateRequerySuggested();
            }
        }

        public string LicenseText => _config.LicenseText;
        public string VersionDisplay => $"Version {_config.Version}";

        // ── Prerequisites ───────────────────────────────────────

        public ObservableCollection<Prerequisite> Prerequisites { get; }

        private async Task CheckPrerequisitesAsync()
        {
            Prerequisites.Clear();
            var checks = _prerequisiteService.GetChecks();
            foreach (var check in checks)
            {
                check.Status = PrerequisiteStatus.Checking;
                check.StatusMessage = "Checking...";
                Prerequisites.Add(check);
            }

            foreach (var check in Prerequisites)
            {
                await _prerequisiteService.RunCheckAsync(check);
            }

            OnPropertyChanged(nameof(CanGoNext));
            CommandManager.InvalidateRequerySuggested();
        }

        // ── Install Path ────────────────────────────────────────

        private string _installPath;
        public string InstallPath
        {
            get => _installPath;
            set
            {
                _installPath = value;
                OnPropertyChanged();
                UpdateDiskSpace();
            }
        }

        private string _diskSpaceInfo;
        public string DiskSpaceInfo
        {
            get => _diskSpaceInfo;
            set { _diskSpaceInfo = value; OnPropertyChanged(); }
        }

        private void UpdateDiskSpace()
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(_installPath))
                {
                    var root = Path.GetPathRoot(_installPath);
                    if (root != null)
                    {
                        var drive = new DriveInfo(root);
                        DiskSpaceInfo = $"Available space: {drive.AvailableFreeSpace / (1024.0 * 1024 * 1024):F1} GB";
                    }
                }
            }
            catch
            {
                DiskSpaceInfo = "Unable to determine available space";
            }
        }

        // ── Progress ────────────────────────────────────────────

        private double _progressValue;
        public double ProgressValue
        {
            get => _progressValue;
            set
            {
                _progressValue = value;
                OnPropertyChanged();
                OnPropertyChanged(nameof(ProgressPercentDisplay));
            }
        }

        private string _progressStatus;
        public string ProgressStatus
        {
            get => _progressStatus;
            set { _progressStatus = value; OnPropertyChanged(); }
        }

        public string ProgressPercentDisplay => $"{ProgressValue:F0}%";

        // ── Complete ────────────────────────────────────────────

        private bool _launchOnExit = true;
        public bool LaunchOnExit
        {
            get => _launchOnExit;
            set { _launchOnExit = value; OnPropertyChanged(); }
        }

        // ── Can Go Next ─────────────────────────────────────────

        public bool CanGoNext
        {
            get
            {
                switch (CurrentPage)
                {
                    case InstallerPage.License:
                        return IsLicenseAccepted;
                    case InstallerPage.Prerequisites:
                        return Prerequisites.Count > 0 &&
                               Prerequisites.All(p => p.Status != PrerequisiteStatus.Failed);
                    default:
                        return true;
                }
            }
        }

        // ── Commands ────────────────────────────────────────────

        public ICommand NextCommand { get; }
        public ICommand BackCommand { get; }
        public ICommand BrowseCommand { get; }
        public ICommand InstallCommand { get; }
        public ICommand CancelCommand { get; }
        public ICommand FinishCommand { get; }

        private void Next()
        {
            switch (CurrentPage)
            {
                case InstallerPage.Welcome:
                    CurrentPage = InstallerPage.License;
                    break;
                case InstallerPage.License:
                    CurrentPage = InstallerPage.Prerequisites;
                    break;
                case InstallerPage.Prerequisites:
                    CurrentPage = InstallerPage.InstallPath;
                    break;
            }
        }

        private void Back()
        {
            switch (CurrentPage)
            {
                case InstallerPage.License:
                    CurrentPage = InstallerPage.Welcome;
                    break;
                case InstallerPage.Prerequisites:
                    CurrentPage = InstallerPage.License;
                    break;
                case InstallerPage.InstallPath:
                    CurrentPage = InstallerPage.Prerequisites;
                    break;
            }
        }

        private void Browse()
        {
            var dialog = new OpenFolderDialog
            {
                Title = "Select Installation Folder",
                InitialDirectory = _installPath
            };

            if (dialog.ShowDialog() == true)
            {
                InstallPath = dialog.FolderName;
            }
        }

        private async Task InstallAsync()
        {
            CurrentPage = InstallerPage.Progress;
            _installCts = new CancellationTokenSource();

            var progress = new Progress<(double percent, string status)>(update =>
            {
                Application.Current?.Dispatcher.Invoke(() =>
                {
                    ProgressValue = update.percent;
                    ProgressStatus = update.status;
                });
            });

            try
            {
                await _installationService.InstallAsync(
                    _installPath,
                    new Progress<(double, string)>(p => { }),
                    _installCts.Token);

                // Create shortcuts
                var exePath = Path.Combine(_installPath, _config.AppExecutable);
                _shortcutService.CreateStartMenuShortcut(
                    _installPath, _config.StartMenuFolder, _config.AppName, exePath);

                // Register in registry
                _registryService.RegisterApplication(
                    _config, _installPath);

                // Create uninstaller entry
                _installationService.CreateUninstaller(
                    _installPath, _config);

                ProgressValue = 100;
                ProgressStatus = "Installation complete.";
                await Task.Delay(600);
                CurrentPage = InstallerPage.Complete;
            }
            catch (OperationCanceledException)
            {
                CurrentPage = InstallerPage.Welcome;
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    $"Installation failed: {ex.Message}",
                    "Oxium Installer",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error);
                CurrentPage = InstallerPage.Welcome;
            }
        }

        private void Cancel()
        {
            _installCts?.Cancel();
            CurrentPage = InstallerPage.Welcome;
        }

        private void Finish()
        {
            if (LaunchOnExit)
            {
                var exePath = Path.Combine(_installPath, _config.AppExecutable);
                if (File.Exists(exePath))
                {
                    System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                    {
                        FileName = exePath,
                        UseShellExecute = true
                    });
                }
            }

            Application.Current.Shutdown();
        }

        // ── INotifyPropertyChanged ──────────────────────────────

        public event PropertyChangedEventHandler PropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        private void RefreshPageBindings()
        {
            OnPropertyChanged(nameof(WelcomeVisibility));
            OnPropertyChanged(nameof(LicenseVisibility));
            OnPropertyChanged(nameof(PrerequisitesVisibility));
            OnPropertyChanged(nameof(InstallPathVisibility));
            OnPropertyChanged(nameof(ProgressVisibility));
            OnPropertyChanged(nameof(CompleteVisibility));
            OnPropertyChanged(nameof(BackButtonVisibility));
            OnPropertyChanged(nameof(NextButtonVisibility));
            OnPropertyChanged(nameof(InstallButtonVisibility));
            OnPropertyChanged(nameof(CancelButtonVisibility));
            OnPropertyChanged(nameof(FinishButtonVisibility));
            OnPropertyChanged(nameof(CanGoNext));
            CommandManager.InvalidateRequerySuggested();
        }
    }

    // ── RelayCommand (ICommand implementation) ────────────────────

    public class RelayCommand : ICommand
    {
        private readonly Action _execute;
        private readonly Func<bool> _canExecute;

        public RelayCommand(Action execute, Func<bool> canExecute = null)
        {
            _execute = execute ?? throw new ArgumentNullException(nameof(execute));
            _canExecute = canExecute;
        }

        public bool CanExecute(object parameter) => _canExecute?.Invoke() ?? true;

        public void Execute(object parameter) => _execute();

        public event EventHandler CanExecuteChanged
        {
            add => CommandManager.RequerySuggested += value;
            remove => CommandManager.RequerySuggested -= value;
        }
    }

    public class AsyncRelayCommand : ICommand
    {
        private readonly Func<Task> _execute;
        private readonly Func<bool> _canExecute;
        private bool _isExecuting;

        public AsyncRelayCommand(Func<Task> execute, Func<bool> canExecute = null)
        {
            _execute = execute ?? throw new ArgumentNullException(nameof(execute));
            _canExecute = canExecute;
        }

        public bool CanExecute(object parameter)
        {
            return !_isExecuting && (_canExecute?.Invoke() ?? true);
        }

        public async void Execute(object parameter)
        {
            if (_isExecuting) return;
            _isExecuting = true;
            CommandManager.InvalidateRequerySuggested();
            try
            {
                await _execute();
            }
            finally
            {
                _isExecuting = false;
                CommandManager.InvalidateRequerySuggested();
            }
        }

        public event EventHandler CanExecuteChanged
        {
            add => CommandManager.RequerySuggested += value;
            remove => CommandManager.RequerySuggested -= value;
        }
    }
}
