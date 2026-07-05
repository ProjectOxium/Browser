using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows;

namespace OxiumInstaller.Models
{
    public enum PrerequisiteStatus
    {
        Checking,
        Passed,
        Failed,
        Warning
    }

    public class Prerequisite : INotifyPropertyChanged
    {
        private string _name;
        private PrerequisiteStatus _status;
        private string _statusMessage;

        public string Name
        {
            get => _name;
            set { _name = value; OnPropertyChanged(); }
        }

        public PrerequisiteStatus Status
        {
            get => _status;
            set
            {
                _status = value;
                OnPropertyChanged();
                OnPropertyChanged(nameof(PassedVisibility));
                OnPropertyChanged(nameof(FailedVisibility));
                OnPropertyChanged(nameof(CheckingVisibility));
            }
        }

        public string StatusMessage
        {
            get => _statusMessage;
            set { _statusMessage = value; OnPropertyChanged(); }
        }

        public Visibility PassedVisibility =>
            Status == PrerequisiteStatus.Passed ? Visibility.Visible : Visibility.Collapsed;

        public Visibility FailedVisibility =>
            Status == PrerequisiteStatus.Failed ? Visibility.Visible : Visibility.Collapsed;

        public Visibility CheckingVisibility =>
            Status == PrerequisiteStatus.Checking ? Visibility.Visible : Visibility.Collapsed;

        public event PropertyChangedEventHandler PropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
